// SuccessCelebration.tsx - Award-winning success animation
// Priority 3: Micro-Interactions - Success celebration with confetti

import React, { useEffect, useState, useCallback } from 'react';
import { Check } from 'lucide-react';

interface SuccessCelebrationProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
  /**
   * Duration before auto-complete (ms). Default: 3000
   */
  duration?: number;
  /**
   * Whether to show confetti. Default: true
   */
  showConfetti?: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

const CONFETTI_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  isVisible,
  message = 'Success!',
  subMessage,
  onComplete,
  duration = 3000,
  showConfetti = true
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showContent, setShowContent] = useState(false);

  // Generate confetti pieces
  const generateConfetti = useCallback(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360
      });
    }
    return pieces;
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }

      // Show confetti
      if (showConfetti) {
        setConfetti(generateConfetti());
      }

      // Delay content appearance for animation
      setTimeout(() => setShowContent(true), 100);

      // Auto-complete after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowContent(false);
      setConfetti([]);
    }
  }, [isVisible, showConfetti, duration, onComplete, generateConfetti]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9500] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="alert"
      aria-live="assertive"
    >
      {/* Confetti */}
      {showConfetti && confetti.map((piece) => (
        <div
          key={piece.id}
          className="wizard-confetti wizard-confetti-piece"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`
          }}
        />
      ))}

      {/* Success content */}
      <div
        className={`
          bg-white rounded-2xl p-8 shadow-2xl
          flex flex-col items-center text-center
          max-w-sm mx-4
          ${showContent ? 'wizard-success-bounce' : 'opacity-0'}
        `}
      >
        {/* Animated checkmark circle */}
        <div
          className="wizard-success-circle w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-success)' }}
        >
          <svg
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline
              className="wizard-success-checkmark"
              points="20 6 9 17 4 12"
            />
          </svg>
        </div>

        {/* Message */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {message}
        </h2>

        {subMessage && (
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subMessage}
          </p>
        )}

        {/* Progress indicator */}
        <div className="mt-6 w-full">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-border-light)' }}
          >
            <div
              className="h-full rounded-full transition-all ease-linear"
              style={{
                backgroundColor: 'var(--color-success)',
                width: '100%',
                animation: `shrink-progress ${duration}ms linear forwards`
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SuccessCelebration;
