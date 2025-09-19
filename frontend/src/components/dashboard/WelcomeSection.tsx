// frontend/src/components/dashboard/WelcomeSection.tsx
// ✨ AWARD-WINNING HYBRID WELCOME COMPONENT (FINAL)
// ✅ Renders a vibrant, compact, and premium "Greeting Card" on mobile.
// ✅ Renders the classic, immersive banner on desktop.

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { UserCircle, Clock } from 'lucide-react';

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

  // 🎨 Returns a vibrant, role-based gradient string. Used by both views.
  const getRoleGradient = () => {
    const primaryRole = getPrimaryRole();
    const gradients = {
      'business-owner': 'from-purple-500 to-indigo-600',
      'hr-manager':     'from-emerald-500 to-teal-600',
      'hod-manager':    'from-blue-500 to-cyan-600',
      'supervisor':     'from-orange-500 to-amber-600',
      'employee':       'from-gray-500 to-slate-600',
      'admin':          'from-red-500 to-rose-600',
      'super-user':     'from-violet-500 to-purple-600'
    };
    return gradients[primaryRole] || 'from-gray-500 to-gray-600';
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
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg bg-gradient-to-r ${getRoleGradient()}`}>
            {/* Subtle background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

            <div className="relative z-10 flex items-center justify-between">
              {/* Left: Greeting */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    Good {getTimePeriod()}, {user?.firstName}! 👋
                  </h1>
                </div>
                <div className="hidden lg:block text-sm opacity-90 border-l border-white/20 pl-4 ml-2">
                  {organization?.name || 'SuperUser Dashboard'} • {getFormattedDate(true)}
                </div>
              </div>
              
              {/* Right: Time & Role */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                  <Clock className="w-4 h-4 opacity-80" />
                  <div className="text-lg font-bold">{currentTime} {timePeriod}</div>
                </div>
                
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                  <UserCircle className="w-4 h-4 opacity-80" />
                  <div className="text-sm font-medium">{getRoleDisplayName()}</div>
                </div>
              </div>
            </div>
        </div>

      ) : (

        // --- 📱 MOBILE "GREETING CARD" WIDGET (Vibrant, compact, and premium) ---
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-xl bg-gradient-to-br ${getRoleGradient()}`}>
          {/* Subtle background decorative elements, scaled for mobile */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative z-10 flex justify-between items-center">
            
            {/* Left Column: Greeting & Role */}
            <div className="flex flex-col justify-center">
              <p className="text-base text-white/80">Good {getTimePeriod()},</p>
              <h1 className="text-2xl font-bold -mt-1">{user?.firstName}! 👋</h1>
              
              {/* The "Glassmorphic" Role Pill */}
              <div className="inline-block bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mt-2">
                <span className="text-xs font-bold tracking-wider uppercase">{getRoleDisplayName()}</span>
              </div>
            </div>

            {/* Right Column: Time & Date */}
            <div className="text-right flex flex-col items-end">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold tracking-tighter">{currentTime}</span>
                <span className="text-lg font-medium ml-1.5 opacity-90">{timePeriod}</span>
              </div>
              <p className="text-xs text-white/80 -mt-1">{getFormattedDate(true)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

WelcomeSection.displayName = 'WelcomeSection';