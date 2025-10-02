// frontend/src/components/common/UnifiedModal.tsx
// 🎯 UNIFIED MODAL SYSTEM - Creates consistent UX across all dashboard-launched components
// ✅ Replaces fragmented modal/navigation patterns with single cohesive system
// 🎨 Integrates with design system: CSS variables, ThemedButton, organization branding
// 📱 Mobile-optimized with Samsung S8+ compatibility

import React, { useEffect, useContext } from 'react';
import { X, ChevronLeft, ArrowLeft } from 'lucide-react';
import { ThemedButton } from './ThemedButton';
import { OrganizationContext } from '../../contexts/OrganizationContext';

interface UnifiedModalProps {
  // Core modal properties
  isOpen: boolean;
  onClose: () => void;

  // Header configuration
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;

  // Step-based navigation (optional)
  currentStep?: number;
  totalSteps?: number;
  stepTitles?: string[];
  showStepProgress?: boolean;

  // Layout options
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;

  // Footer actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  customFooter?: React.ReactNode;

  // Content
  children: React.ReactNode;
}

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  currentStep,
  totalSteps,
  stepTitles,
  showStepProgress = false,
  size = 'lg',
  className = '',
  primaryAction,
  secondaryAction,
  customFooter,
  children
}) => {
  // Optional organization context - not all users have organizations (e.g., super users)
  const orgContext = useContext(OrganizationContext);
  const organization = orgContext?.organization || null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'w-full h-full max-w-none'
  };

  // Step progress component - Using Modal System CSS classes for branded consistency
  const StepProgress = () => {
    if (!showStepProgress || !totalSteps || !currentStep) return null;

    return (
      <div className="modal-header__center">
        <div className="modal-header__progress-mobile modal-responsive-hide-mobile">
          <div className="mobile-step-indicator">
            <div className="mobile-step-dots">
              {Array.from({ length: totalSteps }, (_, i) => {
                const stepNumber = i + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                  <div
                    key={i}
                    className={`mobile-step-dot ${
                      isActive
                        ? 'mobile-step-dot--active'
                        : isCompleted
                        ? 'mobile-step-dot--completed'
                        : 'mobile-step-dot--inactive'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNumber}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-header__progress-desktop hidden md:flex">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={i} className="step-container">
                <div
                  className={`modal-header__step ${
                    isActive
                      ? 'modal-header__step--active'
                      : isCompleted
                      ? 'modal-header__step--completed'
                      : 'modal-header__step--inactive'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-system">
      <div className="modal-container">
          {/* Header - Using Modal System Classes */}
          <div className="modal-header">
            <div className="modal-header__left">
              {/* Back button */}
              {showBackButton && onBack && (
                <button onClick={onBack} className="modal-header__close-button">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Title section */}
              <div>
                <h2 className="modal-header__title">
                  {title}
                </h2>
                {subtitle && (
                  <p className="modal-header__subtitle">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Close button */}
            <button onClick={onClose} className="modal-header__close-button">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step progress */}
          <StepProgress />

          {/* Current step title (mobile) */}
          {showStepProgress && stepTitles && currentStep && stepTitles[currentStep - 1] && (
            <div className="sm:hidden text-center">
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {stepTitles[currentStep - 1]}
              </div>
            </div>
          )}

          {/* Content area - Using Modal System Classes */}
          <div className="modal-content">
            <div className="modal-content__scrollable">
              {children}
            </div>
          </div>

          {/* Footer - Using Modal System Classes */}
          {(primaryAction || secondaryAction || customFooter) && (
            <div className="modal-footer">
              <div className="modal-footer__nav">
                {customFooter || (
                  <>
                    {/* Secondary action */}
                    {secondaryAction && (
                      <button
                        onClick={secondaryAction.onClick}
                        className="modal-footer__button modal-footer__button--secondary"
                      >
                        {secondaryAction.label}
                      </button>
                    )}

                    {/* Primary action */}
                    {primaryAction && (
                      <button
                        onClick={primaryAction.onClick}
                        disabled={primaryAction.disabled}
                        className={`modal-footer__button modal-footer__button--primary ${primaryAction.loading ? 'modal-footer__button--loading' : ''}`}
                      >
                        {primaryAction.label}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};