// frontend/src/layouts/MainLayout.tsx
// 🚀 CLEAN MAIN LAYOUT - CSS VARIABLES ONLY, NO INLINE STYLES
// ✨ Allows components to choose their own layout needs
// 📱 Headers stay, but content area is completely flexible
// 🎨 Uses CSS variables for all styling - no conflicts with index.css

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useModal } from '../hooks/useModal';
import { globalDeviceCapabilities } from '../utils/deviceDetection';
import { useOrganizationSafe, OrganizationProvider } from '../contexts/OrganizationContext';
import {
  LogOut,
  Users,
  Settings,
  Key,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { BrandedLogo } from '../components/common/BrandedLogo';
import { ThemeBrandingProvider } from '../contexts/ThemeBrandingContext';  // 🚀 WEEK 4 OPTIMIZATION: Combined provider
import { UnifiedModal } from '../components/common/UnifiedModal';
import { FirstTimeWelcomeModal } from '../components/auth/FirstTimeWelcomeModal';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { DatabaseShardingService } from '../services/DatabaseShardingService';
import { FirebaseService } from '../services/FirebaseService';
import Logger from '../utils/logger';
import { useSessionGuard } from '../hooks/useSessionGuard';

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
  // 🔒 Session guard: auto-logout on inactivity + force app update on stale builds
  useSessionGuard();
  // 🔧 FIX: Use safe hook that returns null for super-users/resellers instead of conditionally calling hook
  const orgContext = useOrganizationSafe();
  const organization = orgContext?.organization || null;
  const navigate = useNavigate();

  // State Management
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 🚀 REFACTORED: Migrated to useModal hook
  const resetPasswordModal = useModal();
  const welcomeModal = useModal();

  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [hasSeenWelcomeThisSession, setHasSeenWelcomeThisSession] = useState(false);

  // Ref for user menu dropdown to detect clicks outside
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Show welcome modal immediately on first login (no delay)
  useEffect(() => {
    if (user && user.hasSeenWelcome !== true && !hasSeenWelcomeThisSession) {
      welcomeModal.open();
    }
  }, [user, user?.hasSeenWelcome, hasSeenWelcomeThisSession]);

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

  // 🚀 REFACTORED: Using useModal hook
  const closeResetPasswordModal = () => {
    resetPasswordModal.close();
    setResetPasswordSuccess(false);
    setResetPasswordError(null);
  };

  // Handle welcome modal confirmation (only when "Don't show again" is checked)
  const handleWelcomeConfirm = async () => {
    if (!user) return;

    try {
      // 🔧 FIX: Super users and resellers use flat structure, org users use sharded
      const isSystemUser = user.organizationId === 'system' || !user.organizationId;

      if (isSystemUser) {
        // Super users and resellers - use flat structure
        await FirebaseService.updateDocument(
          'users',
          user.id,
          {
            hasSeenWelcome: true,
            updatedAt: new Date().toISOString()
          }
        );
      } else {
        // Organization users - use sharded structure
        await DatabaseShardingService.updateDocument(
          user.organizationId,
          'users',
          user.id,
          {
            hasSeenWelcome: true,
            updatedAt: new Date().toISOString()
          }
        );
      }

      Logger.info('Welcome modal dismissed permanently by user');

      // Set session flag to prevent showing again in this session
      setHasSeenWelcomeThisSession(true);
      welcomeModal.close(); // 🚀 REFACTORED: Using useModal hook
    } catch (error) {
      Logger.error('Failed to update welcome status:', error);
      // Still close the modal and set session flag
      setHasSeenWelcomeThisSession(true);
      welcomeModal.close(); // 🚀 REFACTORED: Using useModal hook
    }
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
      return [];
    } else {
      return [];
    }
  };

  // Compact Top Navigation Component
  const TopNavigation = () => (
    <header
      className="sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--dash-topbar-bg, var(--color-nav-bg))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">

          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-6 flex-shrink-0">
            {/* Clickable Logo - more compact on mobile */}
            <button
              onClick={() => {
                navigate('/dashboard');
              }}
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
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
            <div className="flex-1 min-w-0 mx-3">
              <div className="text-center truncate text-sm font-semibold" style={{ color: 'var(--dash-topbar-text, var(--color-text))' }}>
                {organization.name}
              </div>
            </div>
          )}

          {/* Right Side - User Menu */}
          <div className="flex items-center flex-shrink-0">

            {/* Compact User Menu - mobile optimized */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full sm:rounded-lg transition-colors hover:opacity-90"
                style={{ minHeight: '44px', minWidth: '44px', justifyContent: 'center' }}
              >
                <div
                  className="w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }}
                >
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium" style={{ color: 'var(--dash-topbar-text, var(--color-text))' }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--dash-topbar-text, var(--color-text-tertiary))', opacity: 0.8 }}>
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
                        resetPasswordModal.open(); // 🚀 REFACTORED: Using useModal hook
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-2 text-sm transition-colors relative group"
                      style={{
                        color: (user?.mustChangePassword || !user?.passwordChangedAt) ? 'var(--color-alert-warning-text)' : 'var(--color-text-secondary)',
                        backgroundColor: (user?.mustChangePassword || !user?.passwordChangedAt) ? 'var(--color-alert-warning-bg)' : 'transparent',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        if (!user?.mustChangePassword && user?.passwordChangedAt) {
                          e.currentTarget.style.backgroundColor = 'var(--color-nav-hover)';
                          e.currentTarget.style.color = 'var(--color-text)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!user?.mustChangePassword && user?.passwordChangedAt) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }
                      }}
                      title={(user?.mustChangePassword || !user?.passwordChangedAt) ? 'Default password hasn\'t been changed yet' : ''}
                    >
                      <Key className="w-4 h-4" />
                      <span className="flex-1">Reset Password</span>
                      {(user?.mustChangePassword || !user?.passwordChangedAt) && (
                        <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />
                      )}

                      {/* Tooltip on hover */}
                      {(user?.mustChangePassword || !user?.passwordChangedAt) && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 pointer-events-none">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Default password hasn't been changed yet
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        window.location.reload();
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
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh App</span>
                    </button>

                    <div className="border-t mx-2 my-1" style={{ borderColor: 'var(--color-border)' }}></div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-2 text-sm transition-colors"
                      style={{
                        color: 'var(--color-text-secondary)',
                        minHeight: '44px'
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--dash-page-bg, var(--color-background))', fontFamily: 'var(--dash-font-family)' }}>
      {/* Modern Top Navigation */}
      <TopNavigation />

      {/* Password Reset Modal */}
      {/* 🚀 REFACTORED: Using useModal hook */}
      <UnifiedModal
        isOpen={resetPasswordModal.isOpen}
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

      {/* First-Time Welcome Modal - Now includes password reminder */}
      {/* 🚀 REFACTORED: Using useModal hook */}
      {user && (
        <FirstTimeWelcomeModal
          isOpen={welcomeModal.isOpen}
          onClose={() => {
            setHasSeenWelcomeThisSession(true);
            welcomeModal.close();
          }}
          userName={user.firstName}
          userRole={user.role.id}
          onConfirm={handleWelcomeConfirm}
          hodPermissions={user.hodPermissions}
        />
      )}

      {/* Main Content Area - Constrained to match header */}
      <main
        id="main-content"
        className="flex-1"
        role="main"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export const MainLayout = ({ children, onNavigate, currentView }: MainLayoutProps) => {
  const { user } = useAuth();

  // Super users and resellers don't have organizations, so we need to handle this case
  // 🔧 FIX: Support both 'super-user' and 'superuser' role ID formats
  const isSuperUser = user?.role?.id === 'super-user' || user?.role?.id === 'superuser';
  if (isSuperUser || user?.role?.id === 'reseller' || !user?.organizationId) {
    // 🚀 WEEK 4 OPTIMIZATION: Using combined ThemeBrandingProvider (no organization needed)
    return (
      <ThemeBrandingProvider>
        <MainLayoutContent onNavigate={onNavigate} currentView={currentView}>
          {children}
        </MainLayoutContent>
      </ThemeBrandingProvider>
    );
  }

  // For regular users with organizations, use OrganizationProvider + ThemeBrandingProvider
  // 🚀 WEEK 4 OPTIMIZATION PHASE 1: Pass prefetched organization AND categories from AuthContext
  // 🚀 WEEK 4 OPTIMIZATION PHASE 2: Combined Theme + Branding into single provider (reduces nesting 4→3)
  const { organization: authOrganization, categories: authCategories } = useAuth();

  return (
    <OrganizationProvider
      organizationId={user.organizationId}
      prefetchedOrg={authOrganization}
      prefetchedCategories={authCategories}
    >
      <ThemeBrandingProvider>
        <MainLayoutContent onNavigate={onNavigate} currentView={currentView}>
          {children}
        </MainLayoutContent>
      </ThemeBrandingProvider>
    </OrganizationProvider>
  );
};