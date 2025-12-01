// PhaseProgressEnhanced.tsx - Award-winning progress indicator
// Priority 5: Visual Progress - Clickable phase dots, phase preview, completion checkmarks
// Priority 3: Micro-Interactions - Progress bar glow, phase transition animations

import React, { useState, useRef, useEffect } from 'react';
import { Check, Circle } from 'lucide-react';

interface PhaseInfo {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface PhaseProgressEnhancedProps {
  currentPhase: number;
  totalPhases: number;
  completedPhases: Set<number>;
  onPhaseClick?: (phase: number) => void;
  phaseInfo?: PhaseInfo[];
  /**
   * Animation state for phase transitions
   */
  isTransitioning?: boolean;
}

export const PhaseProgressEnhanced: React.FC<PhaseProgressEnhancedProps> = ({
  currentPhase,
  totalPhases,
  completedPhases,
  onPhaseClick,
  phaseInfo,
  isTransitioning
}) => {
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressPercent = ((currentPhase + 1) / totalPhases) * 100;

  // Cleanup tooltip timeout
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const handlePhaseHover = (phase: number) => {
    setHoveredPhase(phase);

    // Delay tooltip show for better UX
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 200);
  };

  const handlePhaseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(false);
    setHoveredPhase(null);
  };

  const canNavigateTo = (phase: number): boolean => {
    // Can always go back to completed or current phases
    return phase <= currentPhase || completedPhases.has(phase);
  };

  const getPhaseState = (phase: number): 'completed' | 'current' | 'upcoming' => {
    if (completedPhases.has(phase)) return 'completed';
    if (phase === currentPhase) return 'current';
    return 'upcoming';
  };

  return (
    <div className="wizard-progress mb-4">
      {/* Main progress bar with glow effect */}
      <div className="relative">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-border-light)' }}
        >
          <div
            className={`
              h-full rounded-full transition-all duration-500 ease-out
              ${isTransitioning ? 'wizard-progress-glow' : ''}
            `}
            style={{
              width: `${progressPercent}%`,
              backgroundColor: 'var(--color-primary)',
              boxShadow: isTransitioning
                ? '0 0 10px var(--color-primary), 0 0 20px var(--color-primary-light)'
                : 'none'
            }}
          />
        </div>

        {/* Phase dots positioned on the bar */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-0">
          {Array.from({ length: totalPhases }).map((_, index) => {
            const state = getPhaseState(index);
            const isClickable = canNavigateTo(index);
            const isHovered = hoveredPhase === index;
            const Icon = phaseInfo?.[index]?.icon;

            return (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => handlePhaseHover(index)}
                onMouseLeave={handlePhaseLeave}
                onFocus={() => handlePhaseHover(index)}
                onBlur={handlePhaseLeave}
              >
                <button
                  onClick={() => isClickable && onPhaseClick?.(index)}
                  disabled={!isClickable}
                  className={`
                    wizard-phase-dot
                    w-6 h-6 rounded-full flex items-center justify-center
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    ${state === 'current' ? 'wizard-phase-dot-current scale-125' : ''}
                    ${state === 'completed' ? 'wizard-phase-dot-completed' : ''}
                    ${state === 'upcoming' ? 'wizard-phase-dot-upcoming' : ''}
                    ${isHovered && isClickable ? 'scale-110' : ''}
                  `}
                  style={{
                    backgroundColor: state === 'completed'
                      ? 'var(--color-success)'
                      : state === 'current'
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                    border: state === 'current' ? '2px solid white' : 'none',
                    boxShadow: state === 'current'
                      ? '0 0 0 2px var(--color-primary), 0 2px 8px rgba(0,0,0,0.15)'
                      : state === 'completed'
                        ? '0 2px 4px rgba(0,0,0,0.1)'
                        : 'none',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                  aria-label={`Phase ${index + 1}: ${phaseInfo?.[index]?.title || `Step ${index + 1}`}`}
                  aria-current={state === 'current' ? 'step' : undefined}
                  tabIndex={isClickable ? 0 : -1}
                >
                  {state === 'completed' ? (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  ) : state === 'current' ? (
                    <span className="text-[10px] font-bold text-white">{index + 1}</span>
                  ) : (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* Tooltip */}
                {showTooltip && isHovered && phaseInfo?.[index] && (
                  <div
                    className={`
                      wizard-phase-tooltip
                      absolute z-50 px-2 py-1 rounded-md text-xs font-medium
                      whitespace-nowrap pointer-events-none
                      transform -translate-x-1/2 left-1/2
                      animate-fade-in
                    `}
                    style={{
                      backgroundColor: 'var(--color-text-primary)',
                      color: 'white',
                      bottom: '100%',
                      marginBottom: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {phaseInfo[index].title}
                    {/* Tooltip arrow */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                      style={{
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid var(--color-text-primary)'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current phase label */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Phase {currentPhase + 1} of {totalPhases}
        </span>
        {phaseInfo?.[currentPhase] && (
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            {phaseInfo[currentPhase].title}
          </span>
        )}
      </div>
    </div>
  );
};

export default PhaseProgressEnhanced;
