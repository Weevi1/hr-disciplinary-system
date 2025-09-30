// frontend/src/components/dashboard/WelcomeSection.tsx
// ✨ AWARD-WINNING HYBRID WELCOME COMPONENT (FINAL)
// ✅ Renders a vibrant, compact, and premium "Greeting Card" on mobile.
// ✅ Renders the classic, immersive banner on desktop.

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { UserCircle, Clock } from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge } from '../common/ThemedCard';

// --- A Simple Breakpoint Hook (consistent with other components) ---
const useBreakpoint = (breakpoint: number) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);

  const handleResize = useCallback(() => {
    setIsDesktop(window.innerWidth > breakpoint);
  }, [breakpoint]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isDesktop;
};


interface WelcomeSectionProps {
  className?: string;
}

export const WelcomeSection = memo<WelcomeSectionProps>(({ className = '' }) => {
  const isDesktop = useBreakpoint(768);
  const { user } = useAuth();
  
  // Handle organization context safely - it may not be available for superusers
  let organization = null;
  try {
    organization = useOrganization()?.organization;
  } catch (error) {
    // Superuser case - no organization context available
    organization = null;
  }
  
  const { getPrimaryRole } = useMultiRolePermissions();
  
  // --- STATE FOR REAL-TIME CLOCK ---
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // --- HELPER FUNCTIONS ---

  // 🎨 Returns themed background style for role-based gradients
  const getRoleGradientStyle = () => {
    const primaryRole = getPrimaryRole();

    // Use CSS variables for theme-aware gradients
    switch (primaryRole) {
      case 'business-owner':
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
    const hour = time.getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  // Formatters for different views
  const getFormattedTime = () => time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ');
  const getFormattedDate = (compact = false) => {
    return compact 
      ? time.toLocaleDateString('en-ZA', { weekday: 'long', month: 'short', day: 'numeric' })
      : time.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const [currentTime, timePeriod] = getFormattedTime();

  return (
    <div className={className}>
      {isDesktop ? (
        // --- 🖥️ DESKTOP LAYOUT (Compact horizontal bar) ---
        <ThemedCard
          padding="md"
          shadow="lg"
          className="relative overflow-hidden"
          style={{
            ...getRoleGradientStyle(),
            color: 'var(--color-text-inverse)'
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
                  {organization?.name || 'SuperUser Dashboard'} • {getFormattedDate(true)}
                </div>
              </div>

              {/* Right: Time & Role */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                  <Clock className="w-4 h-4 opacity-80" />
                  <div className="text-lg font-bold">{currentTime} {timePeriod}</div>
                </div>

                <ThemedBadge
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text-inverse)', backdropFilter: 'blur(4px)' }}
                >
                  <UserCircle className="w-4 h-4 opacity-80" />
                  <div className="text-sm font-medium">{getRoleDisplayName()}</div>
                </ThemedBadge>
              </div>
            </div>
        </ThemedCard>

      ) : (

        // --- 📱 MOBILE "GREETING CARD" WIDGET (Compact mobile-optimized) ---
        <ThemedCard
          padding="sm"
          shadow="lg"
          className="relative overflow-hidden"
          style={{
            ...getRoleGradientStyle(),
            color: 'var(--color-text-inverse)'
          }}
        >
          {/* Minimal background decorative elements for mobile */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

          <div className="relative z-10 flex justify-between items-center">

            {/* Left Column: Compact greeting & role */}
            <div className="flex flex-col justify-center">
              <p className="text-sm" style={{ opacity: 0.8 }}>Good {getTimePeriod()},</p>
              <h1 className="text-xl font-bold -mt-0.5">{user?.firstName}! 👋</h1>

              {/* Compact role pill */}
              <ThemedBadge
                variant="primary"
                size="sm"
                className="inline-block mt-1.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'var(--color-text-inverse)',
                  backdropFilter: 'blur(4px)',
                  fontSize: '10px',
                  padding: '2px 6px'
                }}
              >
                <span className="font-bold tracking-wider uppercase">{getRoleDisplayName()}</span>
              </ThemedBadge>
            </div>

            {/* Right Column: Compact time & date */}
            <div className="text-right flex flex-col items-end">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold tracking-tight">{currentTime}</span>
                <span className="text-sm font-medium ml-1 opacity-90">{timePeriod}</span>
              </div>
              <p className="text-xs -mt-0.5" style={{ opacity: 0.8 }}>{getFormattedDate(true)}</p>
            </div>
          </div>
        </ThemedCard>
      )}
    </div>
  );
});

WelcomeSection.displayName = 'WelcomeSection';