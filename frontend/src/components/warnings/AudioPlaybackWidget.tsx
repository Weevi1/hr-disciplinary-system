import Logger from '../../utils/logger';
// FIXED FILE: frontend/src/components/warnings/AudioPlaybackWidget.tsx
// 🎯 ENHANCED AUDIO PLAYBACK WITH PROPER ERROR HANDLING
// ✅ Fixed audio status functions and URL handling
// ✅ Handles missing audio URLs gracefully

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
  Rewind,
  Clock,
  FileAudio,
  AlertTriangle,
  Loader2,
  Info,
  Shield,
  Calendar,
  User,
  Trash2,
  XCircle,
  CheckCircle
} from 'lucide-react';
import type { AudioRecordingData } from '../../services/WarningService';

// ============================================
// INTERFACES
// ============================================

interface AudioPlaybackWidgetProps {
  audioRecording?: AudioRecordingData;
  warningId?: string;
  showDownload?: boolean;
  showMetadata?: boolean;
  showTranscript?: boolean;
  compact?: boolean;
  autoPlay?: boolean;
  className?: string;
}

interface PlaybackState {
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
  buffered: number;
}

interface AudioStatus {
  status: 'available' | 'unavailable' | 'processing' | 'failed' | 'deleted' | 'expired';
  message: string;
  canPlay: boolean;
}

// ============================================
// AUDIO STATUS UTILITY FUNCTIONS
// ============================================

const getAudioStatus = (audioRecording: AudioRecordingData | undefined): AudioStatus => {
  // Check if audioRecording exists
  if (!audioRecording) {
    return {
      status: 'not-available',
      message: 'Audio recording not available.',
      canPlay: false
    };
  }

  // Check if audio was explicitly deleted
  if (audioRecording.deleted) {
    return {
      status: 'deleted',
      message: 'This audio recording has been permanently deleted.',
      canPlay: false
    };
  }

  // Check if audio has expired
  if (audioRecording.autoDeleteDate && new Date() > new Date(audioRecording.autoDeleteDate)) {
    return {
      status: 'expired',
      message: 'This audio recording has expired and is no longer available.',
      canPlay: false
    };
  }

  // Check processing status
  if (audioRecording.processingStatus === 'processing') {
    return {
      status: 'processing',
      message: 'Audio is still being processed. Please try again in a moment.',
      canPlay: false
    };
  }

  if (audioRecording.processingStatus === 'failed') {
    return {
      status: 'failed',
      message: 'Audio processing failed. The recording may be corrupted.',
      canPlay: false
    };
  }

  // Check if URL is available
  if (!audioRecording.storageUrl && !audioRecording.url) {
    return {
      status: 'unavailable',
      message: 'Audio URL is not available. The recording may not have been uploaded properly.',
      canPlay: false
    };
  }

  // All checks passed
  return {
    status: 'available',
    message: 'Audio recording is ready to play.',
    canPlay: true
  };
};

const canPlayAudio = (audioRecording: AudioRecordingData | undefined): boolean => {
  return getAudioStatus(audioRecording).canPlay;
};

const isAudioDeleted = (audioRecording: AudioRecordingData | undefined): boolean => {
  return getAudioStatus(audioRecording).status === 'deleted';
};

const isAudioExpired = (audioRecording: AudioRecordingData | undefined): boolean => {
  return getAudioStatus(audioRecording).status === 'expired';
};

// ============================================
// COMPONENT
// ============================================

export const AudioPlaybackWidget: React.FC<AudioPlaybackWidgetProps> = ({
  audioRecording,
  warningId,
  showDownload = true,
  showMetadata = true,
  showTranscript = false,
  compact = false,
  autoPlay = false,
  className = ''
}) => {

  // Early return if no audio recording provided
  if (!audioRecording) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <FileAudio className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600">No audio recording available</p>
            <p className="text-xs text-gray-500">Audio recording not found or not provided</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // REFS & STATE
  // ============================================
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<PlaybackState>({
    isLoading: true,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    error: null,
    buffered: 0
  });

  // Get audio status
  const audioStatus = getAudioStatus(audioRecording);
  const canPlay = canPlayAudio(audioRecording);
  const isDeleted = isAudioDeleted(audioRecording);
  const isExpired = isAudioExpired(audioRecording);

  // Get the best available audio URL
  const audioUrl = audioRecording?.storageUrl || audioRecording?.url;

  // ============================================
  // AUDIO SETUP & CLEANUP
  // ============================================

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canPlay || !audioUrl) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: !canPlay ? audioStatus.message : 'No audio URL available'
      }));
      return;
    }

    // Set the audio source
    audio.src = audioUrl;

    // Audio event handlers
    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: audio.duration || 0,
        isLoading: false 
      }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ 
        ...prev, 
        currentTime: audio.currentTime || 0
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0 
      }));
      if (audio) {
        audio.currentTime = 0;
      }
    };

    const handleError = (e: Event) => {
      Logger.error('Audio loading error:', e)
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isPlaying: false,
        error: 'Failed to load audio recording. The file may be corrupted or unavailable.'
      }));
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const duration = audio.duration || 0;
        setState(prev => ({ 
          ...prev, 
          buffered: duration ? (bufferedEnd / duration) * 100 : 0 
        }));
      }
    };

    // Attach event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('progress', handleProgress);

    // Try to load the audio
    audio.load();

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [canPlay, audioUrl, audioStatus.message]);

  // Auto-play if requested and audio is available
  useEffect(() => {
    if (autoPlay && audioRef.current && !state.isLoading && !state.error && canPlay) {
      audioRef.current.play().catch(console.warn);
    }
  }, [autoPlay, state.isLoading, state.error, canPlay]);

  // ============================================
  // PLAYBACK CONTROLS
  // ============================================

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    try {
      if (state.isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      Logger.error('Playback error:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Playback failed. Please try again.'
      }));
    }
  }, [state.isPlaying, canPlay]);

  const setCurrentTime = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && canPlay) {
      audio.currentTime = time;
    }
  }, [canPlay]);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      setState(prev => ({ 
        ...prev, 
        volume, 
        isMuted: volume === 0 
      }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      const newMuted = !state.isMuted;
      audio.muted = newMuted;
      setState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [state.isMuted]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityLabel = (bitrate?: number): string => {
    if (!bitrate) return 'Unknown';
    if (bitrate >= 32000) return 'High';
    if (bitrate >= 16000) return 'Standard';
    return 'Basic';
  };

  // ============================================
  // RENDER STATUS MESSAGES
  // ============================================

  const renderStatusMessage = () => {
    if (isDeleted) {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Trash2 className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Audio Recording Deleted</p>
            <p className="text-red-600 text-sm">{audioStatus.message}</p>
          </div>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">Audio Recording Expired</p>
            <p className="text-yellow-600 text-sm">{audioStatus.message}</p>
          </div>
        </div>
      );
    }

    if (audioStatus.status === 'processing') {
      return (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="text-blue-800 font-medium">Processing Audio</p>
            <p className="text-blue-600 text-sm">{audioStatus.message}</p>
          </div>
        </div>
      );
    }

    if (audioStatus.status === 'failed' || audioStatus.status === 'unavailable') {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Audio Unavailable</p>
            <p className="text-red-600 text-sm">{audioStatus.message}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  // ============================================
  // RENDER COMPONENT
  // ============================================

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Audio Element */}
      {canPlay && audioUrl && (
        <audio
          ref={audioRef}
          preload="metadata"
        />
      )}

      {/* Status Messages */}
      {renderStatusMessage()}

      {/* Playback Controls - Only show if audio is available */}
      {canPlay && !state.error && (
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              disabled={state.isLoading}
              className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              title={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : state.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-1" />
              )}
            </button>

            {/* Progress Bar */}
            <div className="flex-1">
              <div
                ref={progressRef}
                className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
                onClick={(e) => {
                  if (progressRef.current && state.duration) {
                    const rect = progressRef.current.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    setCurrentTime(percent * state.duration);
                  }
                }}
              >
                {/* Buffered Progress */}
                <div
                  className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
                  style={{ width: `${state.buffered}%` }}
                />
                {/* Current Progress */}
                <div
                  className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                  style={{
                    width: state.duration ? `${(state.currentTime / state.duration) * 100}%` : '0%'
                  }}
                />
              </div>
              
              {/* Time Display */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(state.duration)}</span>
              </div>
            </div>

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title={state.isMuted ? 'Unmute' : 'Mute'}
              >
                {state.isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={state.isMuted ? 0 : state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                title="Volume"
              />
            </div>

            {/* Download Button */}
            {showDownload && audioUrl && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = audioUrl;
                  link.download = `warning-audio-${audioRecording.recordingId || 'recording'}.webm`;
                  link.click();
                }}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Download Audio"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Metadata Section */}
      {showMetadata && !compact && canPlay && !state.error && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration
              </p>
              <p className="font-medium">{formatTime(audioRecording.duration || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <FileAudio className="w-3 h-3" />
                Quality
              </p>
              <p className="font-medium">{getQualityLabel(audioRecording.bitrate)}</p>
            </div>
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <User className="w-3 h-3" />
                Recorded By
              </p>
              <p className="font-medium">{audioRecording.recordedByName || 'Manager'}</p>
            </div>
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Recorded
              </p>
              <p className="font-medium">
                {audioRecording.startTime ? new Date(audioRecording.startTime).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Consent Notice */}
          {audioRecording.consentGiven && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <Shield className="w-3 h-3" />
              <span>Recording consent was obtained from all participants</span>
            </div>
          )}

          {/* Auto-delete notice - Only show if audio is still available */}
          {audioRecording.autoDeleteDate && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              <Info className="w-3 h-3" />
              <span>
                This recording will be automatically deleted on{' '}
                {new Date(audioRecording.autoDeleteDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{state.error}</span>
          </div>
        </div>
      )}
    </div>
  );
};