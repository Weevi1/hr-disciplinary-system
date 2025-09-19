// frontend/src/layouts/MainLayout.tsx
// 🚀 CLEAN MAIN LAYOUT - CSS VARIABLES ONLY, NO INLINE STYLES
// ✨ Allows components to choose their own layout needs
// 📱 Headers stay, but content area is completely flexible
// 🎨 Uses CSS variables for all styling - no conflicts with index.css

import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOrganization, OrganizationProvider } from '../contexts/OrganizationContext';
import { 
  Menu, 
  X, 
  LogOut,
  Home,
  Users,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Logo } from '../components/common/Logo';
import { BrandedLogo } from '../components/common/BrandedLogo';
import { BrandingProvider } from '../contexts/BrandingContext';

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
  const [sidebarOpen, setSidebarOpen] = useState(false); // WordPress-style sidebar - collapsed by default
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-6">
            {/* Clickable Logo */}
            <button 
              onClick={() => onNavigate?.('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <BrandedLogo size="small" showText={true} />
            </button>
            
            {/* Compact Navigation Pills */}
            <nav className="hidden md:flex items-center space-x-1">
              {getNavigationItems().map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-3">
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
            
            {/* Compact User Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)} 
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role?.name || user?.role?.id?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <button 
                      onClick={logout} 
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <Transition.Root show={mobileMenuOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 lg:hidden" onClose={setMobileMenuOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900">
              {/* Close Button */}
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Mobile Sidebar Content */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <button 
                  onClick={() => {
                    onNavigate?.('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-shrink-0 flex items-center px-4 hover:opacity-80 transition-opacity"
                >
                  <BrandedLogo size="small" showText={false} />
                  <span className="ml-3 text-white font-semibold text-lg">&lt;File&gt;</span>
                </button>
                <nav className="mt-5 px-2 space-y-1">
                  {getNavigationItems().map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate?.(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <item.icon className="mr-4 h-6 w-6" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
              
              {/* Mobile User Section */}
              <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-slate-400 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Top Navigation */}
      <TopNavigation />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content Area - Full width */}
      <main 
        id="main-content" 
        className="min-h-screen"
        role="main"
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
      <MainLayoutContent onNavigate={onNavigate} currentView={currentView}>
        {children}
      </MainLayoutContent>
    );
  }

  // For regular users with organizations, use OrganizationProvider + BrandingProvider
  return (
    <OrganizationProvider organizationId={user.organizationId}>
      <BrandingProvider>
        <MainLayoutContent onNavigate={onNavigate} currentView={currentView}>
          {children}
        </MainLayoutContent>
      </BrandingProvider>
    </OrganizationProvider>
  );
};