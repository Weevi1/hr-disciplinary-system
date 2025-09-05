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
  const { organization } = useOrganization();
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
  const getFormattedTime = () => time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ');
  const getFormattedDate = (compact = false) => {
    return compact 
      ? time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : time.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const [currentTime, timePeriod] = getFormattedTime();

  return (
    <div className={className}>
      {isDesktop ? (
        // --- 🖥️ DESKTOP LAYOUT (Classic, immersive banner) ---
        <div className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl bg-gradient-to-r ${getRoleGradient()}`}>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>

            <div className="relative z-10">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                  Good {getTimePeriod()}, {user?.firstName}! 👋
                </h1>
                <p className="text-xl opacity-90">
                  {organization?.name || 'Your Organization'} • {getFormattedDate(false)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300 flex flex-col justify-center items-center">
                  <Clock className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-4xl font-bold tracking-wider">{currentTime} {timePeriod}</div>
                  <div className="text-sm text-white/80 mt-1">Current Time</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300 flex flex-col justify-center items-center">
                  <UserCircle className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-3xl font-bold leading-tight">{getRoleDisplayName()}</div>
                  <div className="text-sm text-white/80 mt-1">Your Role</div>
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