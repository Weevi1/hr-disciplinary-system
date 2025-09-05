// frontend/src/layouts/MainLayout.tsx
// 🚀 CLEAN MAIN LAYOUT - CSS VARIABLES ONLY, NO INLINE STYLES
// ✨ Allows components to choose their own layout needs
// 📱 Headers stay, but content area is completely flexible
// 🎨 Uses CSS variables for all styling - no conflicts with index.css

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOrganization, OrganizationProvider } from '../contexts/OrganizationContext';
import { 
  Menu, 
  X, 
  Search, 
  Settings, 
  User, 
  LogOut, 
  Building2, 
  Users, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Plus, 
  BarChart3, 
  Shield 
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { NotificationCenter } from '../components/dashboard/NotificationCenter';
import { Logo } from '../components/common/Logo';

interface MainLayoutProps {
  children: React.ReactNode;
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
const MainLayoutContent = ({ children }: MainLayoutProps) => {
  const { user, role, logout } = useAuth();
  const organization = user?.role?.id === 'super-user' ? null : useOrganization()?.organization;
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for smooth mobile header scroll
  const mobileHeaderRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const headerTransformY = useRef(0);

  // 🎨 Effect to update CSS variables when organization branding changes
  useEffect(() => {
    if (organization?.branding) {
      updateBrandColors(
        organization.branding.primaryColor,
        organization.branding.secondaryColor
      );
    }
  }, [organization?.branding]);
  
  // Effect for smooth hiding/showing mobile header on scroll
  useEffect(() => {
    const controlMobileHeader = () => {
      const headerEl = mobileHeaderRef.current;
      if (!headerEl) return;

      const currentScrollY = window.scrollY;
      const headerHeight = headerEl.offsetHeight;
      const scrollDelta = currentScrollY - lastScrollY.current;
      let newTransformY = headerTransformY.current - scrollDelta;
      
      newTransformY = Math.max(-headerHeight, Math.min(0, newTransformY));
      if (currentScrollY <= headerHeight) {
        newTransformY = 0;
      }

      // Only CSS variable update - no inline style
      headerEl.style.transform = `translateY(${newTransformY}px)`;
      headerTransformY.current = newTransformY;
      lastScrollY.current = currentScrollY;
    };

    const handleScroll = () => {
      window.requestAnimationFrame(controlMobileHeader);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Navigation Logic
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/employees', label: 'Employees', icon: Users },
      { path: '/warnings', label: 'Warnings', icon: AlertTriangle },
    ];

    // Add role-specific items
    if (role === 'admin' || role === 'super-admin') {
      baseItems.push({ path: '/users', label: 'Users', icon: User });
    }

    if (role === 'super-admin') {
      baseItems.push({ path: '/settings', label: 'Settings', icon: Settings });
    }

    return baseItems;
  };

  const isActivePage = (path: string) => location.pathname === path;

  // Desktop Header Component
  const DesktopHeader = () => (
    <header className="main-layout__desktop-header">
      <div className="main-layout__desktop-header-content">
        {/* Left Side - Logo & Navigation */}
        <div className="main-layout__desktop-header-left">
          {/* Logo */}
          <div className="main-layout__logo">
            <Logo size="medium" showText={true} />
            <div className="main-layout__logo-content">
              <span className="main-layout__logo-title">
                {organization?.name || '<File>'}
              </span>
              <span className="main-layout__logo-subtitle">by Fifo - Fully Integrated, Fully Online</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="main-layout__desktop-nav">
            {getNavigationItems().map((item) => {
              const IconComponent = item.icon;
              const isActive = isActivePage(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`main-layout__nav-item ${isActive ? 'main-layout__nav-item--active' : ''}`}
                >
                  <IconComponent className="main-layout__nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side - Actions & User Menu */}
        <div className="main-layout__desktop-header-right">
          {/* Search Button */}
          <button className="main-layout__action-button">
            <Search className="main-layout__action-icon" />
          </button>

          {/* Notifications */}
          <NotificationCenter className="main-layout__action-button" />

          {/* User Menu */}
          <div className="main-layout__user-menu">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)} 
              className="main-layout__user-menu-trigger"
            >
              <div className="main-layout__user-avatar">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="main-layout__user-dropdown">
                <div className="main-layout__user-dropdown-content">
                  <div className="main-layout__user-info">
                    <div className="main-layout__user-avatar main-layout__user-avatar--large">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="main-layout__user-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="main-layout__user-role">
                        {role?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                  </div>
                  
                  <div className="main-layout__user-dropdown-nav">
                    {getNavigationItems().map((item) => {
                      const IconComponent = item.icon;
                      const isActive = isActivePage(item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setUserMenuOpen(false);
                          }}
                          className={`main-layout__dropdown-nav-item ${isActive ? 'main-layout__dropdown-nav-item--active' : ''}`}
                        >
                          <IconComponent className="main-layout__dropdown-nav-icon" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="main-layout__user-dropdown-footer">
                    <button 
                      onClick={logout} 
                      className="main-layout__logout-button"
                    >
                      <LogOut className="main-layout__logout-icon" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // Mobile Header Component
  const MobileHeader = React.forwardRef<HTMLElement>((props, ref) => (
    <header ref={ref} className="main-layout__mobile-header">
      <div className="main-layout__mobile-header-content">
        {/* Left Side - Menu & Logo */}
        <div className="main-layout__mobile-header-left">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="main-layout__mobile-menu-button"
          >
            <Menu className="main-layout__mobile-menu-icon" />
          </button>
          
          <div className="main-layout__mobile-logo">
            <Logo size="small" showText={false} />
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="main-layout__mobile-header-right">
          <NotificationCenter className="main-layout__mobile-action-button" />
          
          <div className="main-layout__mobile-user-avatar">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  ));

  // Mobile Menu Sheet Component
  const MobileMenuSheet = () => (
    <Transition.Root show={mobileMenuOpen} as={Fragment}>
      <Dialog as="div" className="main-layout__mobile-menu-dialog" onClose={setMobileMenuOpen}>
        <div className="main-layout__mobile-menu-backdrop">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="main-layout__mobile-menu-panel">
              {/* Header */}
              <div className="main-layout__mobile-menu-header">
                <div className="main-layout__mobile-menu-logo">
                  <Logo size="medium" showText={true} />
                </div>
                
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="main-layout__mobile-menu-close"
                >
                  <X className="main-layout__mobile-menu-close-icon" />
                </button>
              </div>

              {/* User Info */}
              <div className="main-layout__mobile-menu-user">
                <div className="main-layout__mobile-menu-user-avatar">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="main-layout__mobile-menu-user-content">
                  <div className="main-layout__mobile-menu-user-name">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="main-layout__mobile-menu-user-role">
                    {role?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="main-layout__mobile-menu-nav">
                <div className="main-layout__mobile-menu-nav-section">
                  {getNavigationItems().map((item) => {
                    const IconComponent = item.icon;
                    const isActive = isActivePage(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`main-layout__mobile-nav-item ${isActive ? 'main-layout__mobile-nav-item--active' : ''}`}
                      >
                        <IconComponent className="main-layout__mobile-nav-icon" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="main-layout__mobile-menu-nav-footer">
                  <button 
                    onClick={logout} 
                    className="main-layout__mobile-logout-button"
                  >
                    <LogOut className="main-layout__mobile-logout-icon" />
                    <span>Sign out</span>
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
    <div className="main-layout">
      <DesktopHeader />
      <MobileHeader ref={mobileHeaderRef} />
      
      <main className="main-layout__content">
        {children}
      </main>

      <MobileMenuSheet />
    </div>
  );
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  
  // Super users don't have organizations, so we need to handle this case
  if (user?.role?.id === 'super-user' || !user?.organizationId) {
    return (
      <MainLayoutContent>
        {children}
      </MainLayoutContent>
    );
  }

  // For regular users with organizations, use OrganizationProvider
  return (
    <OrganizationProvider organizationId={user.organizationId}>
      <MainLayoutContent>
        {children}
      </MainLayoutContent>
    </OrganizationProvider>
  );
};