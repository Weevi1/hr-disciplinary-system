// PhaseProgress.tsx - Compact progress bar for unified phased wizard
import React from 'react';

interface PhaseProgressProps {
  currentPhase: number;
  totalPhases: number;
  completedPhases: Set<number>;
  onPhaseClick?: (phase: number) => void;
}

export const PhaseProgress: React.FC<PhaseProgressProps> = ({
  currentPhase,
  totalPhases,
  completedPhases,
  onPhaseClick
}) => {
  const progressPercent = ((currentPhase + 1) / totalPhases) * 100;

  return (
    <div className="mb-3">
      {/* Thin progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border-light)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: 'var(--color-primary)'
          }}
        />
      </div>
    </div>
  );
};

export default PhaseProgress;
