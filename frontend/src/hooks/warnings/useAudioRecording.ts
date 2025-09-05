// frontend/src/hooks/warnings/useAudioRecording.ts
// 🎯 AUDIO RECORDING HOOK FOR WARNING PROCESS
// ✅ Ultra-efficient 16kbps Opus compression
// ✅ Firebase Storage integration
// ✅ Auto-stop safety mechanisms

import { useState, useRef, useCallback, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

// ============================================
// CONFIGURATION
// ============================================

const AUDIO_CONFIG = {
  // Optimal compression settings
  CODEC: 'audio/webm;codecs=opus',
  BITRATE: 16000, // 16kbps - perfect for speech
  SAMPLE_RATE: 8000, // 8kHz - phone quality
  CHANNELS: 1, // Mono
  
  // Safety limits
  MAX_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE_BYTES: 800 * 1024, // 800KB safety margin
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
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  uploadToFirebase: (organizationId: string, warningId: string) => Promise<string | null>;
  uploadToFirebaseFromUrl: (audioUrl: string, recordingId: string, organizationId: string, warningId: string) => Promise<string | null>;
}

export interface UseAudioRecordingReturn extends AudioRecordingState, AudioRecordingActions {
  formatDuration: (seconds: number) => string;
  formatSize: (bytes: number) => string;
  isNearLimit: boolean;
  canRecord: boolean;
}

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
    
    // Update state with new duration
    setState(prev => {
      if (!prev.isRecording) return prev;
      return { ...prev, duration: elapsed };
    });
    
    // Auto-stop at max duration
    if (elapsedMs >= AUDIO_CONFIG.MAX_DURATION_MS) {
      console.log('🔴 Auto-stopping recording: Max duration reached');
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
      console.log('⚠️ Recording will auto-stop in 1 minute');
      warningShownRef.current = true;
    }
  }, []); // Remove all dependencies to avoid circular reference

  // ============================================
  // RECORDING FUNCTIONS
  // ============================================
  
  const startRecording = useCallback(async (): Promise<void> => {
    try {
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Update size estimate
          const totalSize = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
          setState(prev => ({ ...prev, size: totalSize }));
          
          // Safety check for size
          if (totalSize >= AUDIO_CONFIG.MAX_SIZE_BYTES) {
            console.log('🔴 Auto-stopping recording: Max size reached');
            stopRecording();
          }
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('🎤 Recording stopped');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      warningShownRef.current = false;
      
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
      
      console.log('🎤 Recording started:', recordingId);
      
    } catch (error: any) {
      console.error('❌ Error starting recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: error.message || 'Failed to start recording'
      }));
    }
  }, [updateDuration, generateRecordingId]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!mediaRecorderRef.current || !state.isRecording) {
        return null;
      }
      
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Stop duration tracking
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      return new Promise<string | null>((resolve) => {
        const mediaRecorder = mediaRecorderRef.current!;
        
        mediaRecorder.onstop = () => {
          try {
            // Create final audio blob
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: AUDIO_CONFIG.CODEC 
            });
            
            // Create audio URL
            const audioUrl = URL.createObjectURL(audioBlob);
            
            setState(prev => ({
              ...prev,
              isRecording: false,
              isProcessing: false,
              audioUrl,
              size: audioBlob.size
            }));
            
            console.log('✅ Recording completed:', {
              duration: prev => prev.duration,
              size: formatSize(audioBlob.size),
              id: prev => prev.recordingId
            });
            
            resolve(audioUrl);
            
          } catch (error) {
            console.error('❌ Error processing recording:', error);
            setState(prev => ({
              ...prev,
              isRecording: false,
              isProcessing: false,
              error: 'Failed to process recording'
            }));
            resolve(null);
          }
        };
        
        mediaRecorder.stop();
        setState(prev => ({ ...prev, isRecording: false }));
      });
      
    } catch (error: any) {
      console.error('❌ Error stopping recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: error.message || 'Failed to stop recording'
      }));
      return null;
    }
  }, [state.isRecording, formatSize]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.pause();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      console.log('⏸️ Recording paused');
    }
  }, [state.isRecording]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - (state.duration * 1000);
      durationIntervalRef.current = setInterval(updateDuration, 100);
      console.log('▶️ Recording resumed');
    }
  }, [state.isRecording, state.duration, updateDuration]);

  const cancelRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
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
      
      audioChunksRef.current = [];
      warningShownRef.current = false;
      
      setState({
        isRecording: false,
        isProcessing: false,
        duration: 0,
        size: 0,
        error: null,
        audioUrl: null,
        recordingId: null
      });
      
      console.log('🗑️ Recording cancelled');
      
    } catch (error) {
      console.error('❌ Error cancelling recording:', error);
    }
  }, [state.audioUrl]);

  // ============================================
  // FIREBASE UPLOAD
  // ============================================
  
  const uploadToFirebase = useCallback(async (
    organizationId: string, 
    warningId: string
  ): Promise<string | null> => {
    try {
      if (!state.audioUrl || !state.recordingId) {
        throw new Error('No recording available to upload');
      }
      
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Convert audio URL back to blob
      const response = await fetch(state.audioUrl);
      const audioBlob = await response.blob();
      
      // Create Firebase storage reference
      const fileName = `${state.recordingId}.webm`;
      const storagePath = `warnings/${organizationId}/${warningId}/audio/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Upload with metadata
      const metadata = {
        contentType: AUDIO_CONFIG.CODEC,
        customMetadata: {
          warningId,
          organizationId,
          duration: state.duration.toString(),
          size: state.size.toString(),
          recordingId: state.recordingId,
          createdAt: new Date().toISOString()
        }
      };
      
      console.log('☁️ Uploading audio to Firebase:', storagePath);
      
      await uploadBytes(storageRef, audioBlob, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setState(prev => ({ ...prev, isProcessing: false }));
      
      console.log('✅ Audio uploaded successfully:', downloadUrl);
      return downloadUrl;
      
    } catch (error: any) {
      console.error('❌ Error uploading audio:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to upload audio'
      }));
      return null;
    }
  }, [state.audioUrl, state.recordingId, state.duration, state.size]);

  // 🔥 NEW: Upload function that accepts audioUrl directly (for immediate upload after stopRecording)
  const uploadToFirebaseFromUrl = useCallback(async (
    audioUrl: string,
    recordingId: string,
    organizationId: string, 
    warningId: string
  ): Promise<string | null> => {
    try {
      if (!audioUrl || !recordingId) {
        throw new Error('No recording data provided for upload');
      }
      
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Convert audio URL back to blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      
      // Create Firebase storage reference
      const fileName = `${recordingId}.webm`;
      const storagePath = `warnings/${organizationId}/${warningId}/audio/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Upload with metadata
      const metadata = {
        contentType: AUDIO_CONFIG.CODEC,
        customMetadata: {
          warningId,
          organizationId,
          duration: state.duration.toString(),
          size: audioBlob.size.toString(),
          recordingId: recordingId,
          createdAt: new Date().toISOString()
        }
      };
      
      console.log('☁️ Uploading audio to Firebase from URL:', storagePath);
      
      await uploadBytes(storageRef, audioBlob, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setState(prev => ({ ...prev, isProcessing: false }));
      
      console.log('✅ Audio uploaded successfully from URL:', downloadUrl);
      return downloadUrl;
      
    } catch (error: any) {
      console.error('❌ Error uploading audio from URL:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to upload audio'
      }));
      return null;
    }
  }, [state.duration]);

  // ============================================
  // CLEANUP
  // ============================================
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

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
    pauseRecording,
    resumeRecording,
    cancelRecording,
    uploadToFirebase,
    uploadToFirebaseFromUrl,
    
    // Utilities
    formatDuration,
    formatSize,
    
    // Derived state
    isNearLimit,
    canRecord
  };
};