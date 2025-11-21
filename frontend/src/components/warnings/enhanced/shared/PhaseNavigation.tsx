// PhaseNavigation.tsx - Back/Continue navigation for phases
import React from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';
import { ThemedButton } from '../../../common/ThemedButton';

interface PhaseNavigationProps {
  currentPhase: number;
  totalPhases: number;
  isValid: boolean;
  isLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  // Special buttons for specific phases
  customNextText?: string;
  customNextIcon?: React.ComponentType<any>;
  showFinalize?: boolean;
  onFinalize?: () => void;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({
  currentPhase,
  totalPhases,
  isValid,
  isLoading = false,
  onPrevious,
  onNext,
  customNextText,
  customNextIcon,
  showFinalize,
  onFinalize
}) => {
  const isLastPhase = currentPhase === totalPhases - 1;
  const isFirstPhase = currentPhase === 0;

  return (
    <div
      className="flex items-center justify-between mt-6 pt-4 border-t"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <ThemedButton
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstPhase}
        icon={ChevronLeft}
      >
        Back
      </ThemedButton>

      {showFinalize && onFinalize ? (
        <ThemedButton
          onClick={onFinalize}
          disabled={!isValid || isLoading}
          loading={isLoading}
          icon={CheckCircle}
        >
          Finalize
        </ThemedButton>
      ) : (
        <ThemedButton
          onClick={onNext}
          disabled={!isValid || isLoading}
          loading={isLoading}
          icon={customNextIcon || (isLastPhase ? CheckCircle : ChevronRight)}
          iconPosition="right"
        >
          {customNextText || (isLastPhase ? 'Complete' : 'Continue')}
        </ThemedButton>
      )}
    </div>
  );
};

export default PhaseNavigation;
