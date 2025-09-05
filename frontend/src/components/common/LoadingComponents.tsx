// frontend/src/components/common/LoadingComponents.tsx
import React from 'react';

// Spinner Loading Component
export const LoadingSpinner = ({ size = 'medium', color = '#3b82f6' }: {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}) => {
  const sizes = {
    small: '1.5rem',
    medium: '3rem',
    large: '5rem'
  };

  return (
    <div style={{
      width: sizes[size],
      height: sizes[size],
      border: `4px solid #e2e8f0`,
      borderTop: `4px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );
};

// Full Page Loading
export const PageLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div style={{
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{ textAlign: 'center' }}>
      <LoadingSpinner size="large" />
      <p style={{ 
        marginTop: '1rem', 
        color: '#64748b',
        fontSize: '1.125rem'
      }}>
        {message}
      </p>
    </div>
  </div>
);

// Card Loading Skeleton
export const CardSkeleton = () => (
  <div className="hr-card skeleton-card">
    <div className="skeleton-header" />
    <div className="skeleton-content">
      <div className="skeleton-line" style={{ width: '100%' }} />
      <div className="skeleton-line" style={{ width: '80%' }} />
      <div className="skeleton-line" style={{ width: '60%' }} />
    </div>
  </div>
);

// Table Loading Skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="hr-card">
    <table className="hr-table" style={{ width: '100%' }}>
      <thead>
        <tr style={{ backgroundColor: '#f8fafc' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <th key={i} style={{ padding: '0.75rem' }}>
              <div className="skeleton-line" style={{ width: '80%' }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            {[1, 2, 3, 4, 5].map(j => (
              <td key={j} style={{ padding: '0.75rem' }}>
                <div className="skeleton-line" style={{ width: '90%' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Dashboard Stats Skeleton
export const StatsSkeleton = () => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem'
  }}>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="hr-card skeleton-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton-line" style={{ width: '60%', marginBottom: '0.5rem' }} />
            <div className="skeleton-line" style={{ width: '40%', height: '2rem' }} />
          </div>
          <div className="skeleton-circle" style={{ width: '3rem', height: '3rem' }} />
        </div>
        <div className="skeleton-line" style={{ width: '50%' }} />
      </div>
    ))}
  </div>
);

// Loading Button
export const LoadingButton = ({ 
  loading, 
  children, 
  ...props 
}: {
  loading: boolean;
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <button 
    {...props}
    disabled={loading || props.disabled}
    style={{
      ...props.style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      opacity: loading ? 0.7 : 1,
      cursor: loading ? 'not-allowed' : 'pointer'
    }}
  >
    {loading && <LoadingSpinner size="small" color="currentColor" />}
    {children}
  </button>
);

// Loading Overlay
export const LoadingOverlay = ({ 
  show, 
  message = 'Processing...' 
}: {
  show: boolean;
  message?: string;
}) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="hr-card" style={{
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '300px'
      }}>
        <LoadingSpinner size="medium" />
        <p style={{ 
          marginTop: '1rem', 
          marginBottom: 0,
          color: '#64748b'
        }}>
          {message}
        </p>
      </div>
    </div>
  );
};

// Add CSS for skeleton animations
const skeletonStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  .skeleton-card {
    position: relative;
    overflow: hidden;
  }

  .skeleton-line {
    height: 1rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(
      90deg,
      #f1f5f9 0px,
      #e2e8f0 40px,
      #f1f5f9 80px
    );
    background-size: 1000px;
    animation: shimmer 2s infinite linear;
    border-radius: 0.25rem;
  }

  .skeleton-header {
    height: 1.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(
      90deg,
      #f1f5f9 0px,
      #e2e8f0 40px,
      #f1f5f9 80px
    );
    background-size: 1000px;
    animation: shimmer 2s infinite linear;
    border-radius: 0.25rem;
    width: 40%;
  }

  .skeleton-circle {
    background: linear-gradient(
      90deg,
      #f1f5f9 0px,
      #e2e8f0 40px,
      #f1f5f9 80px
    );
    background-size: 1000px;
    animation: shimmer 2s infinite linear;
    border-radius: 50%;
  }

  .skeleton-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = skeletonStyles;
  document.head.appendChild(styleTag);
}

// Hook for loading states
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = React.useCallback(async (promise: Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await promise;
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute, setLoading, setError };
};
