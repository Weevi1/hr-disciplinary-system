/**
 * 🚨 AUDIO RECORDING FALLBACK FOR 2012-ERA DEVICES
 * Alternative recording methods when MediaRecorder API is not available
 */

import React, { useState, useCallback } from 'react';
import { Mic, MicOff, AlertTriangle, FileText, Phone, MessageSquare } from 'lucide-react';

interface LegacyAudioFallbackProps {
  onTextSubmit: (text: string) => void;
  onClose: () => void;
  employeeName?: string;
}

export const LegacyAudioFallback: React.FC<LegacyAudioFallbackProps> = ({
  onTextSubmit,
  onClose,
  employeeName = 'the employee'
}) => {
  const [method, setMethod] = useState<'text' | 'phone' | 'instructions'>('text');
  const [textNotes, setTextNotes] = useState('');
  const [phoneNotes, setPhoneNotes] = useState('');

  const handleTextSubmit = useCallback(() => {
    if (textNotes.trim().length < 10) {
      alert('Please provide at least 10 characters of notes.');
      return;
    }
    onTextSubmit(textNotes.trim());
  }, [textNotes, onTextSubmit]);

  const handlePhoneSubmit = useCallback(() => {
    if (phoneNotes.trim().length < 10) {
      alert('Please provide at least 10 characters summarizing the phone discussion.');
      return;
    }
    onTextSubmit(`Phone discussion with ${employeeName}: ${phoneNotes.trim()}`);
  }, [phoneNotes, onTextSubmit, employeeName]);

  const generateInstructions = useCallback(() => {
    const instructions = `Voice Recording Instructions for ${employeeName}:

1. Use your phone's voice recorder app
2. Record the discussion about this disciplinary matter
3. Save the recording with filename: "${employeeName}_warning_${new Date().toISOString().split('T')[0]}"
4. Email the recording to HR or your manager
5. Complete this form with a summary of the recording

This ensures proper documentation while accommodating device limitations.`;

    onTextSubmit(instructions);
  }, [employeeName, onTextSubmit]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-lg legacy-simple-layout">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MicOff className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 legacy-text-size">
              Audio Recording Not Available
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 legacy-touch-target"
          >
            <FileText size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Explanation */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 legacy-text-size">
                  Your device doesn't support audio recording. Choose an alternative method to document this discussion.
                </p>
              </div>
            </div>
          </div>

          {/* Method Selection */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2 legacy-text-size">
              Choose documentation method:
            </p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="text"
                  checked={method === 'text'}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="mr-2"
                />
                <FileText size={16} className="mr-1" />
                <span className="legacy-text-size">Write detailed notes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="phone"
                  checked={method === 'phone'}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="mr-2"
                />
                <Phone size={16} className="mr-1" />
                <span className="legacy-text-size">Use phone to record separately</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="instructions"
                  checked={method === 'instructions'}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="mr-2"
                />
                <MessageSquare size={16} className="mr-1" />
                <span className="legacy-text-size">Generate recording instructions</span>
              </label>
            </div>
          </div>

          {/* Method Content */}
          {method === 'text' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 legacy-text-size">
                Document the discussion in writing:
              </label>
              <textarea
                value={textNotes}
                onChange={(e) => setTextNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md legacy-text-size"
                rows={6}
                placeholder={`Write detailed notes about your discussion with ${employeeName}. Include:
- What was discussed
- Employee's response
- Any commitments made
- Next steps or follow-up required

Minimum 10 characters required.`}
              />
              <div className="text-xs text-gray-500">
                {textNotes.length}/10 minimum characters
              </div>
            </div>
          )}

          {method === 'phone' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 legacy-text-size">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-sm text-blue-700 mt-1 pl-4 list-decimal legacy-text-size">
                  <li>Use your phone's built-in voice recorder</li>
                  <li>Record your discussion with {employeeName}</li>
                  <li>Save with a clear filename</li>
                  <li>Email the recording to HR</li>
                  <li>Summarize the recording below</li>
                </ol>
              </div>
              <label className="block text-sm font-medium text-gray-700 legacy-text-size">
                Summarize your recorded phone discussion:
              </label>
              <textarea
                value={phoneNotes}
                onChange={(e) => setPhoneNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md legacy-text-size"
                rows={4}
                placeholder="Briefly summarize what was discussed in your phone recording..."
              />
              <div className="text-xs text-gray-500">
                {phoneNotes.length}/10 minimum characters
              </div>
            </div>
          )}

          {method === 'instructions' && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 legacy-text-size">
                  This will generate step-by-step recording instructions that you can follow to properly document this disciplinary discussion.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 legacy-touch-target legacy-text-size"
          >
            Cancel
          </button>

          {method === 'text' && (
            <button
              onClick={handleTextSubmit}
              disabled={textNotes.trim().length < 10}
              className={`px-4 py-2 rounded-md legacy-touch-target legacy-text-size ${
                textNotes.trim().length >= 10
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Notes
            </button>
          )}

          {method === 'phone' && (
            <button
              onClick={handlePhoneSubmit}
              disabled={phoneNotes.trim().length < 10}
              className={`px-4 py-2 rounded-md legacy-touch-target legacy-text-size ${
                phoneNotes.trim().length >= 10
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Summary
            </button>
          )}

          {method === 'instructions' && (
            <button
              onClick={generateInstructions}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 legacy-touch-target legacy-text-size"
            >
              Generate Instructions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};