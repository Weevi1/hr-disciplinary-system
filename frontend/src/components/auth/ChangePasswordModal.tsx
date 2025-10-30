// frontend/src/components/auth/ChangePasswordModal.tsx
// Modal for first-time users to change their temporary password

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { getAuth, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Logger from '../../utils/logger';
import { Z_INDEX } from '../../constants/zIndex';

interface ChangePasswordModalProps {
  isOpen: boolean;
  userEmail: string;
  userId: string;
  onPasswordChanged: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  userEmail,
  userId,
  onPasswordChanged
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  };

  const handleChangePassword = async () => {
    setError('');

    // Validation
    if (currentPassword !== 'temp123') {
      setError('Current password is incorrect. Your temporary password is "temp123"');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message || 'Invalid password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword === 'temp123') {
      setError('New password cannot be the same as your temporary password');
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Update user document to clear mustChangePassword flag
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Logger.success('Password changed successfully');
      onPasswordChanged();

    } catch (error: any) {
      Logger.error('Failed to change password:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('For security, please sign out and sign in again before changing your password');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Your Password</h2>
            <p className="text-sm text-gray-600">Required for security</p>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-900">
                <strong>Welcome!</strong> You're using a temporary password (<span className="font-mono">temp123</span>).
                Please create a secure password to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="temp123"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">Password must contain:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Check className={`w-3 h-3 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={newPassword.length >= 8 ? 'text-green-700' : 'text-gray-600'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check className={`w-3 h-3 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={/[A-Z]/.test(newPassword) ? 'text-green-700' : 'text-gray-600'}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check className={`w-3 h-3 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={/[a-z]/.test(newPassword) ? 'text-green-700' : 'text-gray-600'}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check className={`w-3 h-3 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={/[0-9]/.test(newPassword) ? 'text-green-700' : 'text-gray-600'}>
                  One number
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Logged in as <span className="font-semibold">{userEmail}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
