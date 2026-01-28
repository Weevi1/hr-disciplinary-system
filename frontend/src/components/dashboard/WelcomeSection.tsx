// frontend/src/components/dashboard/WelcomeSection.tsx
// ✨ AWARD-WINNING HYBRID WELCOME COMPONENT (FINAL)
// ✅ Renders a vibrant, compact, and premium "Greeting Card" on mobile.
// ✅ Renders the classic, immersive banner on desktop.

import React, { memo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganizationSafe } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { UserCircle } from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge } from '../common/ThemedCard';
import { DashboardRoleSelector } from './DashboardRoleSelector';

// 🚀 CENTRALIZED HOOK: Replaced local duplicate with shared implementation
import { useBreakpoint } from '../../hooks/useBreakpoint';


interface WelcomeSectionProps {
  className?: string;
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
}

export const WelcomeSection = memo<WelcomeSectionProps>(({
  className = '',
  selectedRole,
  onRoleChange
}) => {
  const isDesktop = useBreakpoint(768);
  const { user } = useAuth();

  // 🔧 FIX: Use safe hook that returns null for super-users/resellers instead of throwing
  const orgContext = useOrganizationSafe();
  const organization = orgContext?.organization || null;

  const { getPrimaryRole } = useMultiRolePermissions();

  // --- HELPER FUNCTIONS ---

  // 🎨 Returns themed background style for role-based gradients
  const getRoleGradientStyle = () => {
    const primaryRole = getPrimaryRole();

    // Use CSS variables for theme-aware gradients
    switch (primaryRole) {
      case 'executive-management':
        return { background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))' };
      case 'hr-manager':
        return { background: 'linear-gradient(135deg, var(--color-success), var(--color-info))' };
      case 'hod-manager':
        return { background: 'linear-gradient(135deg, var(--color-primary), var(--color-info))' };
      case 'supervisor':
        return { background: 'linear-gradient(135deg, var(--color-warning), var(--color-warning-hover))' };
      case 'super-user':
        return { background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))' };
      default:
        return { background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' };
    }
  };

  const getRoleDisplayName = () => getPrimaryRole()?.replace(/-/g, ' ').toUpperCase() || 'USER';

  const getTimePeriod = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className={className}>
      {isDesktop ? (
        // --- 🖥️ DESKTOP LAYOUT (Compact horizontal bar) ---
        <ThemedCard
          padding="md"
          shadow="lg"
          className="relative"
          style={{
            ...getRoleGradientStyle(),
            color: 'var(--color-text-inverse)',
            overflow: 'visible'
          }}
        >
            {/* Subtle background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-16 translate-x-16" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

            <div className="relative z-10 flex items-center justify-between">
              {/* Left: Greeting */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    Good {getTimePeriod()}, {user?.firstName}! 👋
                  </h1>
                </div>
                <div className="hidden lg:block text-sm opacity-90 pl-4 ml-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  {organization?.name || 'SuperUser Dashboard'}
                </div>
              </div>

              {/* Right: Role Selector or Badge */}
              <div className="flex items-center gap-6">
                {/* Multi-role selector or static badge */}
                {selectedRole && onRoleChange ? (
                  <DashboardRoleSelector
                    selectedRole={selectedRole}
                    onRoleChange={onRoleChange}
                  />
                ) : (
                  <ThemedBadge
                    variant="primary"
                    size="md"
                    className="flex items-center gap-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text-inverse)', backdropFilter: 'blur(4px)' }}
                  >
                    <UserCircle className="w-4 h-4 opacity-80" />
                    <div className="text-sm font-medium">{getRoleDisplayName()}</div>
                  </ThemedBadge>
                )}
              </div>
            </div>
        </ThemedCard>

      ) : (

        // --- 📱 MOBILE "GREETING CARD" WIDGET (Ultra-compact mobile-optimized) ---
        <ThemedCard
          padding="none"
          shadow="lg"
          className="relative"
          style={{
            ...getRoleGradientStyle(),
            color: 'var(--color-text-inverse)',
            overflow: 'visible'
          }}
        >
          {/* Minimal background decorative elements for mobile */}
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

          <div className="relative z-10 p-3 space-y-2">

            {/* Greeting & role badge */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs leading-none" style={{ opacity: 0.85 }}>Good {getTimePeriod()},</p>
                <h1 className="text-lg font-bold leading-tight mt-0.5">{user?.firstName}! 👋</h1>
              </div>

              {/* Compact role pill */}
              <ThemedBadge
                variant="primary"
                size="sm"
                className="inline-block"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'var(--color-text-inverse)',
                  backdropFilter: 'blur(4px)',
                  fontSize: '9px',
                  padding: '2px 5px',
                  lineHeight: '1'
                }}
              >
                <span className="font-bold tracking-wider uppercase">{getRoleDisplayName()}</span>
              </ThemedBadge>
            </div>

            {/* Role selector below greeting */}
            {selectedRole && onRoleChange && (
              <DashboardRoleSelector
                selectedRole={selectedRole}
                onRoleChange={onRoleChange}
              />
            )}
          </div>
        </ThemedCard>
      )}
    </div>
  );
});

WelcomeSection.displayName = 'WelcomeSection';