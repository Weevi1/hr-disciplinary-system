import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { Toast, ToastData } from './Toast';
import Logger from '../../utils/logger';

interface ToastContextValue {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string, actions?: Array<{ label: string; action: () => void }>) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = {
      ...toastData,
      id
    };

    setToasts(prev => [...prev, newToast]);
    Logger.debug('🔔 Showing toast:', newToast);

    return id;
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    return showToast({
      title,
      message,
      type: 'success',
      duration: 4000
    });
  }, [showToast]);

  const showError = useCallback((title: string, message: string, actions?: Array<{ label: string; action: () => void }>) => {
    return showToast({
      title,
      message,
      type: 'error',
      actions,
      duration: 7000 // Longer duration for errors
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    return showToast({
      title,
      message,
      type: 'warning',
      duration: 5000
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    return showToast({
      title,
      message,
      type: 'info',
      duration: 5000
    });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    Logger.debug('🗑️ Removed toast:', id);
  }, []);

  const contextValue: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={onRemoveToast} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};