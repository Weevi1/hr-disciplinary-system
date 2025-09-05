// frontend/src/components/warnings/enhanced/components/AudioRecordingIndicator.tsx
// 🎯 AUDIO RECORDING INDICATOR FOR WARNING WIZARD
// ✅ Clean, minimal UI that shows recording status
// ✅ Integrates seamlessly with wizard header

import React from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Pause, 
  Play,
  AlertCircle,
  Upload,
  Check
} from 'lucide-react';
import type { UseAudioRecordingReturn } from '@/hooks/warnings/useAudioRecording';

// ============================================
// TYPES
// ============================================

interface AudioRecordingIndicatorProps {
  recording: UseAudioRecordingReturn;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancelRecording?: () => void;
  showControls?: boolean;
  compact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const AudioRecordingIndicator: React.FC<AudioRecordingIndicatorProps> = ({
  recording,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  showControls = true,
  compact = false
}) => {

  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderRecordingStatus = () => {
    if (recording.isProcessing) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm text-yellow-700 font-medium">
            Processing...
          </span>
        </div>
      );
    }

    if (recording.isRecording) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <Mic className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700 font-medium">
            Recording {recording.formatDuration(recording.duration)}
          </span>
          {recording.isNearLimit && (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      );
    }

    if (recording.audioUrl) {
      return (
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Recorded {recording.formatDuration(recording.duration)}
          </span>
          <span className="text-xs text-gray-500">
            ({recording.formatSize(recording.size)})
          </span>
        </div>
      );
    }

    if (recording.canRecord) {
      return (
        <div className="flex items-center gap-2">
          <MicOff className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            Ready to record
          </span>
        </div>
      );
    }

    return null;
  };

  const renderControls = () => {
    if (!showControls) return null;

    if (recording.isRecording) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={onStopRecording}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            title="Stop recording"
          >
            <Square className="w-3 h-3" />
            {!compact && "Stop"}
          </button>
          
          <button
            onClick={onCancelRecording}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title="Cancel recording"
          >
            ✕
          </button>
        </div>
      );
    }

    if (recording.canRecord && !recording.audioUrl) {
      return (
        <button
          onClick={onStartRecording}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          title="Start recording"
        >
          <Mic className="w-3 h-3" />
          {!compact && "Record"}
        </button>
      );
    }

    return null;
  };

  const renderError = () => {
    if (!recording.error) return null;

    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{recording.error}</span>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderRecordingStatus()}
        {renderControls()}
        {recording.error && (
          <span title={recording.error}>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          {renderRecordingStatus()}
          {renderError()}
        </div>
        
        {renderControls()}
      </div>
      
      {/* Progress bar for recording */}
      {recording.isRecording && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all ${
                recording.isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${Math.min((recording.duration / (5 * 60)) * 100, 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{recording.formatDuration(recording.duration)}</span>
            <span>5:00 max</span>
          </div>
        </div>
      )}
      
      {/* Audio preview */}
      {recording.audioUrl && (
        <div className="mt-2">
          <audio 
            controls 
            className="w-full h-8"
            style={{ maxHeight: '32px' }}
          >
            <source src={recording.audioUrl} type="audio/webm" />
            Your browser does not support audio playback.
          </audio>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPACT VERSION FOR WIZARD HEADER
// ============================================

export const AudioRecordingBadge: React.FC<{
  recording: UseAudioRecordingReturn;
  onToggleRecording: () => void;
}> = ({ recording, onToggleRecording }) => {
  
  if (recording.isRecording) {
    return (
      <button
        onClick={onToggleRecording}
        className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <Mic className="w-4 h-4 text-red-600" />
        <span className="text-sm text-red-700 font-medium">
          {recording.formatDuration(recording.duration)}
        </span>
        {recording.isNearLimit && (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
      </button>
    );
  }

  if (recording.audioUrl) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
        <Check className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700">
          {recording.formatDuration(recording.duration)}
        </span>
      </div>
    );
  }

  if (recording.canRecord) {
    return (
      <button
        onClick={onToggleRecording}
        className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
        title="Start recording audio"
      >
        <MicOff className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Record</span>
      </button>
    );
  }

  return null;
};