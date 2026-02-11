import Logger from '../../utils/logger';
// frontend/src/hooks/warnings/useAudioRecording.ts
// 🎯 AUDIO RECORDING HOOK FOR WARNING PROCESS
// ✅ Speech-optimized 24kbps/16kHz Opus compression
// ✅ Firebase Storage integration
// ✅ Auto-stop safety mechanisms

import { useState, useRef, useCallback, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

// ============================================
// CONFIGURATION
// ============================================

const AUDIO_CONFIG = {
  // Optimal compression settings for speech clarity
  CODEC: 'audio/webm;codecs=opus',
  BITRATE: 24000, // 24kbps - clearer speech, industry standard for voice calls
  SAMPLE_RATE: 16000, // 16kHz - covers full speech spectrum for better consonant clarity
  CHANNELS: 1, // Mono

  // Safety limits
  MAX_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE_BYTES: 1024 * 1024, // 1MB - accommodates improved quality (~900KB for 5 min)
  WARNING_THRESHOLD_MS: 4 * 60 * 1000, // Warn at 4 minutes

  // Quality settings
  ECHO_CANCELLATION: true,
  NOISE_SUPPRESSION: true,
  AUTO_GAIN_CONTROL: true
} as const;

// ============================================
// TYPES
// ============================================

export interface AudioRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  size: number;
  error: string | null;
  audioUrl: string | null;
  recordingId: string | null;
}

export interface AudioRecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
  forceCleanup: () => void;
  uploadToFirebaseFromUrl: (audioUrl: string, recordingId: string, organizationId: string, warningId: string, duration?: number) => Promise<string | null>;
}

export interface UseAudioRecordingReturn extends AudioRecordingState, AudioRecordingActions {
  formatDuration: (seconds: number) => string;
  formatSize: (bytes: number) => string;
  isNearLimit: boolean;
  canRecord: boolean;
}

// ============================================
// SINGLETON PATTERN TO PREVENT MULTIPLE RECORDINGS
// ============================================

class AudioRecordingSingleton {
  private static instance: AudioRecordingSingleton | null = null;
  public mediaStream: MediaStream | null = null;
  public isRecording: boolean = false;
  public isStarting: boolean = false;
  private startedAt: number = 0;
  // Track ALL active streams globally to prevent orphaned streams
  private allActiveStreams: Set<MediaStream> = new Set();
  private allActiveTracks: Set<MediaStreamTrack> = new Set();

  static getInstance(): AudioRecordingSingleton {
    if (!AudioRecordingSingleton.instance) {
      AudioRecordingSingleton.instance = new AudioRecordingSingleton();
    }
    return AudioRecordingSingleton.instance;
  }

  canStart(): boolean {
    // 🔧 ATOMIC: Check and reserve in one operation to prevent race conditions
    const now = Date.now();

    // Block if already recording or starting
    if (this.isRecording || this.isStarting) {
      Logger.debug('🔄 Blocking recording - singleton already active');
      return false;
    }

    // Block if started very recently (prevents double-click issues)
    if (this.startedAt > 0 && (now - this.startedAt) < 1000) {
      Logger.debug('🔄 Blocking duplicate recording attempt - too recent');
      return false;
    }

    // Block if any streams are active
    if (this.allActiveStreams.size > 0 || this.allActiveTracks.size > 0) {
      Logger.debug(`🔄 Blocking recording - ${this.allActiveStreams.size} active streams, ${this.allActiveTracks.size} active tracks exist`);
      return false;
    }

    return true;
  }

  // 🔧 NEW: Atomic check and reserve operation
  tryReserve(): boolean {
    if (this.canStart()) {
      this.isStarting = true;
      this.startedAt = Date.now();
      Logger.debug('🎤 Singleton: Recording slot reserved atomically');
      return true;
    }
    return false;
  }

  startRecording(): void {
    // Note: isStarting and startedAt already set by tryReserve()
    this.isRecording = true;
    Logger.debug('🎤 Singleton: Recording started');
  }

  stopRecording(): void {
    this.isRecording = false;
    this.isStarting = false;
    this.startedAt = 0;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        try {
          track.stop();
          Logger.debug('🔴 Singleton: Stopped microphone track');
        } catch (error) {
          Logger.debug('Track already stopped');
        }
      });
      this.allActiveStreams.delete(this.mediaStream);
      this.mediaStream = null;
    }
    Logger.debug('🧹 Singleton: Recording stopped and cleaned up');
  }

  setStream(stream: MediaStream): boolean {
    // 🔧 CRITICAL: Check if we already have a stream - reject if so
    if (this.mediaStream || this.allActiveStreams.size > 0) {
      Logger.debug(`🚫 Singleton: Rejecting stream - already have ${this.allActiveStreams.size} active streams`);
      // Stop the rejected stream immediately
      stream.getTracks().forEach(track => track.stop());
      return false;
    }

    // Track this stream globally
    this.allActiveStreams.add(stream);
    stream.getTracks().forEach(track => {
      this.allActiveTracks.add(track);
      // Add listener to remove track when it ends
      track.addEventListener('ended', () => {
        this.allActiveTracks.delete(track);
      });
    });

    this.mediaStream = stream;
    this.isStarting = false; // Recording setup complete
    Logger.debug(`🎤 Singleton: Stream set, recording active. Total streams: ${this.allActiveStreams.size}`);
    return true;
  }

  // New method to forcefully stop ALL streams
  stopAllStreams(): void {
    Logger.debug(`🛑 Stopping ALL streams: ${this.allActiveStreams.size} streams, ${this.allActiveTracks.size} tracks`);

    // Stop all tracked streams
    this.allActiveStreams.forEach(stream => {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
          Logger.debug('🔴 Stopped tracked stream track');
        } catch (error) {
          // Track already stopped
        }
      });
    });

    // Stop all tracked individual tracks
    this.allActiveTracks.forEach(track => {
      try {
        if (track.readyState === 'live') {
          track.stop();
          Logger.debug('🔴 Stopped orphaned track');
        }
      } catch (error) {
        // Track already stopped
      }
    });

    // Clear all tracking
    this.allActiveStreams.clear();
    this.allActiveTracks.clear();
    this.mediaStream = null;
    this.isRecording = false;
    this.isStarting = false;
    this.startedAt = 0;

    Logger.debug('✅ All streams and tracks stopped and cleared');
  }
}

const audioSingleton = AudioRecordingSingleton.getInstance();

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export const useAudioRecording = (): UseAudioRecordingReturn => {
  
  // ============================================
  // STATE
  // ============================================
  
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isProcessing: false,
    duration: 0,
    size: 0,
    error: null,
    audioUrl: null,
    recordingId: null
  });

  // ============================================
  // REFS
  // ============================================
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false); // Prevent stop loop on max size
  const stopResolverRef = useRef<((url: string | null) => void) | null>(null); // For stopRecording() promise

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }, []);

  const generateRecordingId = useCallback((): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `audio_${timestamp}_${random}`;
  }, []);

  // ============================================
  // DURATION TRACKING
  // ============================================
  
  const updateDuration = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const elapsedMs = Date.now() - startTimeRef.current;

    // Update state with new duration (using functional update to avoid stale state)
    setState(prev => {
      // Check if recording is still active - if not, don't update
      if (!prev.isRecording) {
        // Clear interval if recording stopped
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        return prev;
      }
      return { ...prev, duration: elapsed };
    });

    // Auto-stop at max duration
    if (elapsedMs >= AUDIO_CONFIG.MAX_DURATION_MS) {
      Logger.debug('🔴 Auto-stopping recording: Max duration reached')

      // Clear the interval to stop spamming
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Use a timeout to avoid circular dependency
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 0);
      return;
    }

    // Warning at 4 minutes
    if (elapsedMs >= AUDIO_CONFIG.WARNING_THRESHOLD_MS && !warningShownRef.current) {
      Logger.debug('⚠️ Recording will auto-stop in 1 minute')
      warningShownRef.current = true;
    }
  }, []); // No dependencies needed - uses refs and functional setState

  // ============================================
  // CLEANUP FUNCTION - DEFINED FIRST TO AVOID CIRCULAR DEPS
  // ============================================

  const forceCleanup = useCallback(() => {
    try {
      Logger.debug('🚨 FORCE CLEANUP: Stopping all audio recording immediately');

      // Stop media recorder immediately
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            Logger.debug('🔴 Force stopped MediaRecorder');
          }
        } catch (error) {
          Logger.debug('MediaRecorder already stopped or errored');
        }
        mediaRecorderRef.current = null;
      }

      // Stop all microphone tracks immediately (both local and singleton)
      const streamsToStop = [streamRef.current, audioSingleton.mediaStream].filter(Boolean);
      streamsToStop.forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => {
            try {
              track.stop();
              Logger.debug('🔴 Force stopped microphone track');
            } catch (error) {
              Logger.debug('Track already stopped');
            }
          });
        }
      });

      // Clear both local and singleton stream refs
      streamRef.current = null;
      // Use stopAllStreams to ensure ALL streams are stopped
      audioSingleton.stopAllStreams();

      // Clear all intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Clean up all refs and state
      audioChunksRef.current = [];
      warningShownRef.current = false;
      startTimeRef.current = 0;

      // Reset state completely
      setState({
        isRecording: false,
        isProcessing: false,
        duration: 0,
        size: 0,
        error: null,
        audioUrl: null,
        recordingId: null
      });

      Logger.debug('🧹 Force cleanup completed - all audio resources released');

    } catch (error) {
      Logger.error('❌ Error during force cleanup:', error);
    }
  }, []);

  // ============================================
  // RECORDING FUNCTIONS
  // ============================================

  const startRecording = useCallback(async (): Promise<void> => {
    // 🔧 ATOMIC: Try to reserve recording slot atomically
    if (!audioSingleton.tryReserve()) {
      Logger.debug('🔄 Recording already active via singleton, skipping new recording start');
      return;
    }

    try {
      // Reset stopping flag for new recording
      isStoppingRef.current = false;

      // Force cleanup any previous recording before starting new one
      if (streamRef.current || mediaRecorderRef.current || audioSingleton.mediaStream) {
        Logger.debug('🧹 Cleaning up previous recording before starting new one');
        forceCleanup();
        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: AUDIO_CONFIG.CHANNELS,
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
          echoCancellation: AUDIO_CONFIG.ECHO_CANCELLATION,
          noiseSuppression: AUDIO_CONFIG.NOISE_SUPPRESSION,
          autoGainControl: AUDIO_CONFIG.AUTO_GAIN_CONTROL
        }
      });

      // Store stream both locally and in singleton
      const streamAccepted = audioSingleton.setStream(stream);
      if (!streamAccepted) {
        // Stream was rejected by singleton - another recording is active
        Logger.debug('🚫 Stream rejected by singleton, aborting recording');
        setState(prev => ({ ...prev, isProcessing: false, error: 'Another recording is already active' }));
        return;
      }

      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Create MediaRecorder with optimal settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: AUDIO_CONFIG.CODEC,
        audioBitsPerSecond: AUDIO_CONFIG.BITRATE
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data chunks
      mediaRecorder.ondataavailable = (event) => {
        // Check if we're stopping - if so, ignore any new data chunks
        if (isStoppingRef.current) {
          Logger.debug('⏭️ Skipping data chunk - recording is stopping')
          return;
        }

        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          // Update size estimate
          const totalSize = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
          setState(prev => ({ ...prev, size: totalSize }));

          // Safety check for size - stop immediately
          if (totalSize >= AUDIO_CONFIG.MAX_SIZE_BYTES && mediaRecorderRef.current?.state === 'recording') {
            Logger.debug('🔴 Auto-stopping recording: Max size reached (' + formatSize(totalSize) + ')')
            isStoppingRef.current = true; // Set flag to ignore future chunks

            // Stop the MediaRecorder IMMEDIATELY to prevent more ondataavailable events
            try {
              mediaRecorderRef.current.stop();
              Logger.debug('✅ MediaRecorder stopped at max size - audio preserved')
            } catch (error) {
              Logger.error('❌ Error stopping MediaRecorder:', error)
            }
          }
        }
      };
      
      // Handle recording stop - unified handler that ALWAYS assembles the blob
      // This fires whether stopped manually (via stopRecording), by auto-stop (duration/size), or by cancel
      mediaRecorder.onstop = () => {
        Logger.debug('🎤 Recording stopped - assembling audio blob');

        // Stop duration tracking
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Stop mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clean up singleton
        audioSingleton.stopRecording();

        // Assemble blob from collected chunks
        try {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: AUDIO_CONFIG.CODEC
            });
            const audioUrl = URL.createObjectURL(audioBlob);

            setState(prev => ({
              ...prev,
              isRecording: false,
              isProcessing: false,
              audioUrl,
              size: audioBlob.size
            }));

            Logger.debug('✅ Audio blob assembled:', formatSize(audioBlob.size));

            // Resolve stopRecording() promise if it's waiting
            if (stopResolverRef.current) {
              stopResolverRef.current(audioUrl);
              stopResolverRef.current = null;
            }
          } else {
            Logger.debug('⚠️ No audio chunks collected');
            setState(prev => ({
              ...prev,
              isRecording: false,
              isProcessing: false,
            }));
            if (stopResolverRef.current) {
              stopResolverRef.current(null);
              stopResolverRef.current = null;
            }
          }
        } catch (error) {
          Logger.error('❌ Error assembling audio blob:', error);
          setState(prev => ({
            ...prev,
            isRecording: false,
            isProcessing: false,
            error: 'Failed to process recording'
          }));
          if (stopResolverRef.current) {
            stopResolverRef.current(null);
            stopResolverRef.current = null;
          }
        }

        isStoppingRef.current = false;
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      warningShownRef.current = false;

      // 🔧 SINGLETON: Mark recording as fully started
      audioSingleton.startRecording();

      // Start duration tracking
      durationIntervalRef.current = setInterval(updateDuration, 100);

      const recordingId = generateRecordingId();
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        recordingId,
        duration: 0,
        size: 0
      }));
      
      Logger.debug('🎤 Recording started:', recordingId)

      // Clear the start-in-progress flag since we're done (handled by singleton)

    } catch (error: any) {
      Logger.error('❌ Error starting recording:', error)
      // Reset singleton on error
      audioSingleton.stopRecording();
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: error.message || 'Failed to start recording'
      }));
    }
  }, [updateDuration, generateRecordingId]); // Note: forceCleanup is called directly, not in dependencies

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        isStoppingRef.current = false;
        return null;
      }

      setState(prev => ({ ...prev, isProcessing: true }));

      // Return a promise that resolves when the unified onstop handler fires
      return new Promise<string | null>((resolve) => {
        stopResolverRef.current = resolve;
        mediaRecorderRef.current!.stop();
      });

    } catch (error: any) {
      Logger.error('❌ Error stopping recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: error.message || 'Failed to stop recording'
      }));
      isStoppingRef.current = false;
      return null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    try {
      // Prevent the onstop handler from assembling a blob we don't want
      audioChunksRef.current = [];

      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          Logger.debug('MediaRecorder already stopped');
        }
        mediaRecorderRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }

      warningShownRef.current = false;
      isStoppingRef.current = false;
      stopResolverRef.current = null;

      // Reset singleton state so future recordings aren't blocked
      audioSingleton.stopAllStreams();

      setState({
        isRecording: false,
        isProcessing: false,
        duration: 0,
        size: 0,
        error: null,
        audioUrl: null,
        recordingId: null
      });

      Logger.debug('🗑️ Recording cancelled');

    } catch (error) {
      Logger.error('❌ Error cancelling recording:', error);
    }
  }, [state.audioUrl]);

  // ============================================
  // FIREBASE UPLOAD
  // ============================================

  // Upload function that accepts audioUrl directly (for immediate upload after stopRecording)
  const uploadToFirebaseFromUrl = useCallback(async (
    audioUrl: string,
    recordingId: string,
    organizationId: string,
    warningId: string,
    duration?: number
  ): Promise<string | null> => {
    try {
      if (!audioUrl || !recordingId) {
        throw new Error('No recording data provided for upload');
      }

      setState(prev => ({ ...prev, isProcessing: true }));

      // Convert audio URL back to blob
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio blob: ${response.status} ${response.statusText}`);
      }
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty — recording data may have been lost');
      }

      // Create Firebase storage reference
      const fileName = `${recordingId}.webm`;
      const storagePath = `warnings/${organizationId}/${warningId}/audio/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload with metadata — use passed duration (captured at stop time) to avoid stale state
      const metadata = {
        contentType: AUDIO_CONFIG.CODEC,
        customMetadata: {
          warningId,
          organizationId,
          duration: (duration ?? 0).toString(),
          size: audioBlob.size.toString(),
          recordingId,
          createdAt: new Date().toISOString()
        }
      };

      Logger.debug('☁️ Uploading audio to Firebase from URL:', storagePath);

      await uploadBytes(storageRef, audioBlob, metadata);
      const downloadUrl = await getDownloadURL(storageRef);

      // Revoke blob URL to free memory now that it's uploaded to Firebase
      try {
        URL.revokeObjectURL(audioUrl);
      } catch (e) {
        // Blob URL may already be revoked
      }

      setState(prev => ({ ...prev, isProcessing: false }));

      Logger.debug('✅ Audio uploaded to Firebase:', storagePath);
      return downloadUrl;

    } catch (error: any) {
      Logger.error('❌ Error uploading audio from URL:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to upload audio'
      }));
      return null;
    }
  }, []); // No state dependencies — all values passed as parameters

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      // Cleanup on unmount - use refs instead of state to avoid dependency issues
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          Logger.debug('🔴 Stopped microphone track on cleanup');
        });
        streamRef.current = null;
      }

      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            Logger.debug('🔴 Stopped recording on cleanup');
          }
        } catch (error) {
          Logger.debug('Recording already stopped');
        }
        mediaRecorderRef.current = null;
      }

      // Clean up audio URLs that might exist
      audioChunksRef.current = [];
      warningShownRef.current = false;
      startTimeRef.current = 0;

      // CRITICAL: Stop ALL streams tracked by singleton
      audioSingleton.stopAllStreams();

      Logger.debug('🧹 Audio recording hook cleaned up completely');
    };
  }, []); // No dependencies - only cleanup on unmount

  // ============================================
  // DERIVED STATE
  // ============================================
  
  const isNearLimit = state.duration >= (AUDIO_CONFIG.WARNING_THRESHOLD_MS / 1000);
  const canRecord = !state.isRecording && !state.isProcessing;

  // ============================================
  // RETURN HOOK INTERFACE
  // ============================================
  
  return {
    // State
    ...state,

    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    forceCleanup,
    uploadToFirebaseFromUrl,

    // Utilities
    formatDuration,
    formatSize,

    // Derived state
    isNearLimit,
    canRecord
  };
};