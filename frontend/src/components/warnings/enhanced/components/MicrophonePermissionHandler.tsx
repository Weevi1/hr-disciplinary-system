// frontend/src/components/warnings/enhanced/components/MicrophonePermissionHandler.tsx
// 🎙️ COMPACT MICROPHONE PERMISSION HANDLER - MODAL OVERLAY VERSION
// ✅ Compact modal that overlays the dashboard instead of taking full screen

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Shield, AlertCircle, CheckCircle, Volume2, Lock } from 'lucide-react';

interface MicrophonePermissionHandlerProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  organizationName: string;
  managerName: string;
}

type PermissionState = 'requesting' | 'granted' | 'denied' | 'error' | 'not-supported';

export const MicrophonePermissionHandler: React.FC<MicrophonePermissionHandlerProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  organizationName,
  managerName
}) => {
  const [permissionState, setPermissionState] = useState<PermissionState>('requesting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Automatically request microphone permission on component mount
  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      setPermissionState('requesting');
      setErrorMessage('');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionState('not-supported');
        setErrorMessage('Audio recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 8000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Permission granted - clean up the stream
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      
      // Notify parent component
      setTimeout(() => {
        onPermissionGranted();
      }, 1000); // Brief delay to show success message

    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied');
        setErrorMessage('Microphone access was denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setPermissionState('error');
        setErrorMessage('No microphone was found on your device.');
      } else if (error.name === 'NotReadableError') {
        setPermissionState('error');
        setErrorMessage('Your microphone is being used by another application.');
      } else {
        setPermissionState('error');
        setErrorMessage('An error occurred while accessing your microphone.');
      }
      
      onPermissionDenied();
    }
  };

  const getStatusIcon = () => {
    switch (permissionState) {
      case 'requesting':
        return <Mic className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'granted':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'denied':
        return <MicOff className="w-6 h-6 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'not-supported':
        return <MicOff className="w-6 h-6 text-gray-600" />;
      default:
        return <Mic className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (permissionState) {
      case 'requesting':
        return {
          title: 'Microphone Access Required',
          message: 'Please allow microphone access to continue with the warning process.'
        };
      case 'granted':
        return {
          title: 'Access Granted',
          message: 'Starting warning wizard...'
        };
      case 'denied':
        return {
          title: 'Access Denied',
          message: errorMessage
        };
      case 'error':
        return {
          title: 'Microphone Error',
          message: errorMessage
        };
      case 'not-supported':
        return {
          title: 'Browser Not Supported',
          message: errorMessage
        };
      default:
        return {
          title: 'Setting up audio...',
          message: 'Preparing audio recording system.'
        };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-sm w-full">
        {/* Compact Main Card */}
        <div className="bg-white rounded-lg shadow-xl p-4 text-center">
          {/* Status Icon and Title */}
          <div className="mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              {getStatusIcon()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{status.title}</h3>
            <p className="text-sm text-gray-600">{status.message}</p>
          </div>

          {/* Actions */}
          {(permissionState === 'denied' || permissionState === 'error') && (
            <div className="space-y-3">
              <button
                onClick={requestMicrophonePermission}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
              
              <div className="text-xs text-gray-500">
                <p>Look for the microphone icon in your browser's address bar and click "Allow"</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {permissionState === 'granted' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Ready to proceed</span>
              </div>
            </div>
          )}
        </div>

        {/* Compact Organization Info */}
        <div className="mt-3 text-center text-xs text-gray-400">
          <p>{organizationName}</p>
        </div>
      </div>
    </div>
  );
};