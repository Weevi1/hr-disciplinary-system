import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  actions?: Array<{ label: string; action: () => void }>;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-400" aria-hidden="true" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-400" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-400" aria-hidden="true" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-400" aria-hidden="true" />;
      default:
        return <Info className="h-6 w-6 text-blue-400" aria-hidden="true" />;
    }
  };

  const getTypeClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div
      data-testid="toast"
      className={`
        transform transition-all duration-300 ease-in-out mb-4
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${getTypeClasses()}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {toast.message}
            </p>
            {toast.actions && toast.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {toast.actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      action.action();
                      handleClose();
                    }}
                    className={`
                      text-sm font-medium rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${toast.type === 'error' 
                        ? 'text-red-800 bg-red-100 hover:bg-red-200 focus:ring-red-500' 
                        : toast.type === 'warning'
                        ? 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                        : toast.type === 'success'
                        ? 'text-green-800 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                        : 'text-blue-800 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};