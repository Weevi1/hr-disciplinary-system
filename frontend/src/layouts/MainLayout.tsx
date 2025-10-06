// frontend/src/layouts/MainLayout.tsx
// 🚀 CLEAN MAIN LAYOUT - CSS VARIABLES ONLY, NO INLINE STYLES
// ✨ Allows components to choose their own layout needs
// 📱 Headers stay, but content area is completely flexible
// 🎨 Uses CSS variables for all styling - no conflicts with index.css

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { globalDeviceCapabilities } from '../utils/deviceDetection';
import { useOrganization, OrganizationProvider } from '../contexts/OrganizationContext';
import {
  LogOut,
  Users,
  Settings,
  Key
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { BrandedLogo } from '../components/common/BrandedLogo';
import { BrandingProvider } from '../contexts/BrandingContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { UnifiedModal } from '../components/common/UnifiedModal';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import Logger from '../utils/logger';

interface MainLayoutProps {
  children: React.ReactNode;
  onNavigate?: (view: string) => void; // Optional navigation callback
  currentView?: string; // Current active view
}

// 🎨 BRAND COLORS UTILITY - Updates CSS Variables
const updateBrandColors = (primaryColor?: string, secondaryColor?: string) => {
  if (primaryColor) {
    document.documentElement.style.setProperty('--brand-primary', primaryColor);
    document.documentElement.style.setProperty('--brand-primary-light', lightenColor(primaryColor, 20));
    document.documentElement.style.setProperty('--brand-primary-dark', darkenColor(primaryColor, 20));
  }
  if (secondaryColor) {
    document.documentElement.style.setProperty('--brand-secondary', secondaryColor);
    document.documentElement.style.setProperty('--brand-secondary-light', lightenColor(secondaryColor, 20));
    document.documentElement.style.setProperty('--brand-secondary-dark', darkenColor(secondaryColor, 20));
  }
};

// Utility functions for color manipulation
const lightenColor = (color: string, percent: number): string => {
  if (!color.startsWith('#')) return color;
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const B = (num >> 8 & 0x00FF) + amt;
  const G = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + 
    (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
};

const darkenColor = (color: string, percent: number): string => {
  if (!color.startsWith('#')) return color;
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const B = (num >> 8 & 0x00FF) - amt;
  const G = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + 
    (B > 255 ? 255 : B < 0 ? 0 : B) * 0x100 + 
    (G > 255 ? 255 : G < 0 ? 0 : G)).toString(16).slice(1);
};

// Main component that orchestrates the layout  
const MainLayoutContent = ({ children, onNavigate, currentView = 'dashboard' }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const organization = user?.role?.id === 'super-user' || user?.role?.id === 'reseller' ? null : useOrganization()?.organization;
  const navigate = useNavigate();

  // State Management
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Password Reset Handler
  const handlePasswordReset = async () => {
    if (!user?.email) {
      setResetPasswordError('No email address found');
      return;
    }

    setResetPasswordLoading(true);
    setResetPasswordError(null);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetPasswordSuccess(true);
    } catch (error: any) {
      Logger.error('Password reset error:', error);
      setResetPasswordError(error.message || 'Failed to send password reset email');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Close modal and reset states
  const closeResetPasswordModal = () => {
    setResetPasswordModalOpen(false);
    setResetPasswordSuccess(false);
    setResetPasswordError(null);
  };

  // 🎨 Effect to update CSS variables when organization branding changes
  useEffect(() => {
    if (organization?.branding) {
      updateBrandColors(
        organization.branding.primaryColor,
        organization.branding.secondaryColor
      );
    }
  }, [organization?.branding]);
  
  // No scroll handling needed with sticky headers

  // No navigation items needed - dashboard-centric approach

  // Navigation items based on user role
  const getNavigationItems = () => {
    // Add role-specific navigation (no dashboard button)
    if (user?.role?.id === 'super-user') {
      return [
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings }
      ];
    } else if (user?.role?.id === 'reseller') {
      return [
        { id: 'client-management', label: 'My Clients', icon: Users }
      ];
    } else {
      return [];
    }
  };

  // Compact Top Navigation Component
  const TopNavigation = () => (
    <header
      className="border-b sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--color-nav-bg)',
        borderColor: 'var(--color-border)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between">

          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Clickable Logo - more compact on mobile */}
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <BrandedLogo size="small" showText={false} className="sm:hidden" />
              <BrandedLogo size="small" showText={true} className="hidden sm:flex" />
            </button>

            {/* Compact Navigation Pills */}
            <nav className="hidden md:flex items-center space-x-1">
              {getNavigationItems().map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(to right, var(--color-primary), var(--color-primary-hover))`,
                            color: 'var(--color-text-inverse)',
                            boxShadow: 'var(--shadow-sm)'
                          }
                        : {
                            color: 'var(--color-nav-text)',
                            backgroundColor: 'transparent'
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--color-nav-hover)';
                        e.currentTarget.style.color = 'var(--color-emphasis)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-nav-text)';
                      }
                    }}
                  >
                    <item.icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Center - Organization Name */}
          {organization?.name && (
            <div className="flex flex-1 justify-center">
              <div className="text-center">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {organization.name}
                </div>
              </div>
            </div>
          )}

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Compact User Menu - mobile optimized */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-lg transition-colors"
                style={{ minHeight: '40px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-nav-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {user?.role?.name || user?.role?.id?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              </button>

              {/* User Dropdown - Mobile optimized */}
              {userMenuOpen && (
                <div
                  className={`absolute right-0 top-12 w-56 sm:w-64 py-1.5 sm:py-2 z-50 ${
                    globalDeviceCapabilities?.browserInfo?.isAndroid4x
                      ? 'bg-white border border-gray-200 rounded legacy-simple-layout'
                      : 'rounded-xl'
                  }`}
                  style={
                    globalDeviceCapabilities?.browserInfo?.isAndroid4x
                      ? {} // Use static styles for Android 4.x
                      : {
                          backgroundColor: 'var(--color-card-background)',
                          boxShadow: 'var(--shadow-lg)',
                          border: '1px solid var(--color-card-border)'
                        }
                  }
                >
                  <div className="px-3 py-2 sm:px-4 sm:py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                        style={{ background: `linear-gradient(to right, var(--color-primary), var(--color-primary-hover))` }}
                      >
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--color-text)' }}>
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-xs sm:text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1 sm:py-2">
                    {/* Navigation items for mobile (shown on all screen sizes now) */}
                    {getNavigationItems().map((item) => {
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate?.(item.id);
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-2 text-sm transition-colors"
                          style={{
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            backgroundColor: isActive ? 'var(--color-primary-bg)' : 'transparent',
                            minHeight: '44px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'var(--color-nav-hover)';
                              e.currentTarget.style.color = 'var(--color-text)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--color-text-secondary)';
                            }
                          }}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    {/* Divider if navigation items exist */}
                    {getNavigationItems().length > 0 && (
                      <div className="border-t mx-2 my-1" style={{ borderColor: 'var(--color-border)' }}></div>
                    )}

                    <button
                      onClick={() => {
                        setResetPasswordModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-2 text-sm transition-colors"
                      style={{
                        color: 'var(--color-text-secondary)',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-nav-hover)';
                        e.currentTarget.style.color = 'var(--color-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                    >
                      <Key className="w-4 h-4" />
                      <span>Reset Password</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-2 text-sm transition-colors"
                      style={{
                        color: 'var(--color-text-secondary)',
                        minHeight: '44px' // Mobile touch target
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-alert-error-bg)';
                        e.currentTarget.style.color = 'var(--color-alert-error-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );



  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Modern Top Navigation */}
      <TopNavigation />

      {/* Password Reset Modal */}
      <UnifiedModal
        isOpen={resetPasswordModalOpen}
        onClose={closeResetPasswordModal}
        title="Reset Password"
        size="sm"
      >
        <div className="p-6">
          {!resetPasswordSuccess ? (
            <>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                A password reset link will be sent to:
              </p>
              <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {user?.email}
                </p>
              </div>

              {resetPasswordError && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alert-error-bg)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-alert-error-text)' }}>
                    {resetPasswordError}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeResetPasswordModal}
                  disabled={resetPasswordLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-card-background)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={resetPasswordLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-hover))',
                    color: 'var(--color-text-inverse)'
                  }}
                >
                  {resetPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-alert-success-text)' }}>
                  Password reset email sent!
                </p>
                <p className="text-sm" style={{ color: 'var(--color-alert-success-text)' }}>
                  Check your inbox for instructions to reset your password.
                </p>
              </div>
              <button
                onClick={closeResetPasswordModal}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-hover))',
                  color: 'var(--color-text-inverse)'
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </UnifiedModal>

      {/* Main Content Area - Full width */}
      <main
        id="main-content"
        className="min-h-screen"
        role="main"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {children}
      </main>
    </div>
  );
};

export const MainLayout = ({ children, onNavigate, currentView }: MainLayoutProps) => {
  const { user } = useAuth();
  
  // Super users and resellers don't have organizations, so we need to handle this case
  if (user?.role?.id === 'super-user' || user?.role?.id === 'reseller' || !user?.organizationId) {
    return (
      <ThemeProvider>
        <MainLayoutContent onNavigate={onNavigate} currentView={currentView}>
          {children}
        </MainLayoutContent>
      </ThemeProvider>
    );
  }

  // For regular users with organizations, use OrganizationProvider + ThemeProvider + BrandingProvider
  return (
    <OrganizationProvider organizationId={user.organizationId}>
      <ThemeProvider>
        <BrandingProvider>
          <MainLayoutContent onNavigate={onNavigate} currentView={currentView}>
            {children}
          </MainLayoutContent>
        </BrandingProvider>
      </ThemeProvider>
    </OrganizationProvider>
  );
};