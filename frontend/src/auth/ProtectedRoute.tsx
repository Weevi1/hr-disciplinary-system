// frontend/src/auth/ProtectedRoute.tsx
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
  requiredResource?: string;
  requiredAction?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole = [],
  requiredResource,
  requiredAction,
  fallback
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { canAccess, hasRole } = usePermissions();

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
      }}>
        <div className="hr-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <h2 style={{ margin: '0 0 1rem', color: '#1e40af' }}>
            HR Dignity System V2
          </h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Loading revolutionary features...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Check role requirements
  if (requiredRole.length > 0 && !requiredRole.some(role => hasRole(role))) {
    return fallback || (
      <div className="hr-container" style={{ paddingTop: '2rem' }}>
        <div className="hr-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>
            Access Denied
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Your role ({user.role.name}) doesn't have permission to access this area.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            Required roles: {requiredRole.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Check resource and action permissions
  if (requiredResource && requiredAction) {
    if (!canAccess(requiredResource, requiredAction)) {
      return fallback || (
        <div className="hr-container" style={{ paddingTop: '2rem' }}>
          <div className="hr-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#f59e0b', marginBottom: '1rem' }}>
              Insufficient Permissions
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              You don't have permission to {requiredAction} {requiredResource}.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      );
    }
  }

  // Render protected content
  return <>{children}</>;
};
