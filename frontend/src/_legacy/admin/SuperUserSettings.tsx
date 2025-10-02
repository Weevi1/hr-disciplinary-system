// frontend/src/components/admin/SuperUserSettings.tsx
// Secure Super-User Account Management Interface

import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { sendEmailVerification, reload } from 'firebase/auth';
import { functions, auth } from '../../config/firebase';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';
import { User, Settings, Shield, Clock, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';

interface SuperUserInfo {
  totalSuperUsers: number;
  superUsers: Array<{
    uid: string;
    email: string;
    emailVerified: boolean;
    lastSignInTime: string;
    creationTime: string;
    customClaims: any;
  }>;
  securityInfo: {
    maxAllowed: number;
    currentCount: number;
    available: number;
  };
}

interface ManagementAction {
  targetUserId: string;
  newEmail?: string;
  newPassword?: string;
  action: 'UPDATE_EMAIL' | 'UPDATE_PASSWORD' | 'GRANT_SUPER_USER' | 'REVOKE_SUPER_USER';
}

export const SuperUserSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [superUserInfo, setSuperUserInfo] = useState<SuperUserInfo | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load super-user info on component mount
  useEffect(() => {
    if (user) {
      loadSuperUserInfo();
    }
  }, [user]);

  const loadSuperUserInfo = async () => {
    try {
      setLoading(true);
      const getSuperUserInfo = httpsCallable(functions, 'getSuperUserInfo');
      const result = await getSuperUserInfo();
      setSuperUserInfo(result.data as SuperUserInfo);
    } catch (error) {
      Logger.error('Failed to load super-user info:', error);
      setErrorMessage('Failed to load super-user information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEmail.trim()) return;

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const manageSuperUser = httpsCallable(functions, 'manageSuperUser');
      const action: ManagementAction = {
        targetUserId: user.uid,
        newEmail: newEmail.trim(),
        action: 'UPDATE_EMAIL'
      };

      const result = await manageSuperUser(action);
      const data = result.data as any;

      if (data.success) {
        setSuccessMessage(`Email updated successfully to ${newEmail}. Please check your email to verify the new address.`);
        setNewEmail('');
        await loadSuperUserInfo(); // Refresh info
      } else {
        setErrorMessage(data.message || 'Failed to update email');
      }
    } catch (error: any) {
      Logger.error('Email update failed:', error);
      setErrorMessage(error.message || 'Failed to update email address');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      setErrorMessage('Password must be at least 12 characters long');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const manageSuperUser = httpsCallable(functions, 'manageSuperUser');
      const action: ManagementAction = {
        targetUserId: user.uid,
        newPassword,
        action: 'UPDATE_PASSWORD'
      };

      const result = await manageSuperUser(action);
      const data = result.data as any;

      if (data.success) {
        setSuccessMessage('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(data.message || 'Failed to update password');
      }
    } catch (error: any) {
      Logger.error('Password update failed:', error);
      setErrorMessage(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Use the Firebase Auth currentUser instead of AuthContext user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      await sendEmailVerification(currentUser);
      setSuccessMessage('Verification email sent! Please check your email inbox.');
      Logger.info('Verification email sent successfully', { email: currentUser.email });
    } catch (error: any) {
      Logger.error('Failed to send verification email:', error);
      setErrorMessage(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVerificationStatus = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Reload the user to get fresh verification status
      await reload(currentUser);
      
      // Trigger a re-render by clearing and setting success message
      if (currentUser.emailVerified) {
        setSuccessMessage('✅ Email verification status updated! Your email is now verified.');
      } else {
        setErrorMessage('Email is still not verified. Please check your email and click the verification link.');
      }

      Logger.info('Verification status refreshed', { 
        email: currentUser.email,
        verified: currentUser.emailVerified 
      });
    } catch (error: any) {
      Logger.error('Failed to refresh verification status:', error);
      setErrorMessage(error.message || 'Failed to refresh verification status');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Denied</h3>
          <p className="text-red-700">You must be logged in to access super-user settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Super-User Security Settings</h1>
            <p className="text-purple-100">Secure account management for system administrators</p>
          </div>
        </div>
        
        {superUserInfo && (
          <div className="bg-white/10 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{superUserInfo.securityInfo.currentCount}</div>
                <div className="text-purple-100 text-sm">Active Super-Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{superUserInfo.securityInfo.available}</div>
                <div className="text-purple-100 text-sm">Available Slots</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{superUserInfo.securityInfo.maxAllowed}</div>
                <div className="text-purple-100 text-sm">Maximum Allowed</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-semibold">Success</div>
          <div className="text-green-700">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-700">{errorMessage}</div>
        </div>
      )}

      {/* Account Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
            <div className="text-lg font-medium text-gray-900">{auth.currentUser?.email || user.email}</div>
            <div className="mt-2">
              {!auth.currentUser?.emailVerified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  ⚠️ Email not verified
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Email verified
                </span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <div className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-2 rounded border">{user.uid}</div>
          </div>
        </div>

        {/* Email Verification Actions */}
        {!auth.currentUser?.emailVerified && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Email Verification Required</h4>
                <p className="text-sm text-amber-700 mb-3">
                  Your email address needs to be verified for security purposes.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleResendVerificationEmail}
                    disabled={loading}
                    className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{loading ? 'Sending...' : 'Send Verification Email'}</span>
                  </button>
                  
                  <button
                    onClick={handleRefreshVerificationStatus}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{loading ? 'Refreshing...' : 'Check Status'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Security Actions</h2>
        </div>

        <div className="space-y-6">
          {/* Update Email Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Email Address</h3>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  New Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="riaan.potas@gmail.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-600">
                  You will need to verify the new email address before it becomes active
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || !newEmail.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Update Password Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    minLength={12}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Must be at least 12 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  minLength={12}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Super-User List */}
      {superUserInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Active Super-Users</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {superUserInfo.superUsers.map((superUser) => (
                  <tr key={superUser.uid} className={superUser.uid === user.uid ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{superUser.email}</div>
                      <div className="text-sm text-gray-500 font-mono">{superUser.uid.substring(0, 8)}...</div>
                      {superUser.uid === user.uid && (
                        <div className="text-xs text-blue-600 font-semibold">YOU</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {superUser.emailVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {superUser.lastSignInTime ? new Date(superUser.lastSignInTime).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(superUser.creationTime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};