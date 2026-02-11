// frontend/src/components/dashboard/QuotesSection.tsx
// 💬 AWARD-WINNING HYBRID QUOTES COMPONENT (FINAL V2)
// ✅ Renders a compact, premium, pastel-themed "Inspiration Card" on mobile.
// ✅ Renders the full-featured, classic view on desktop.

import React, { memo } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, Play, Pause, Heart } from 'lucide-react';
import { useQuotesRotation } from '../../hooks/dashboard/useQuotesRotation';

// Import themed components
import { ThemedCard, ThemedBadge } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import { ThemeSelector } from '../common/ThemeSelector';

// 🚀 CENTRALIZED HOOK: Replaced local duplicate with shared implementation
import { useBreakpoint } from '../../hooks/useBreakpoint';


interface QuotesSectionProps {
  className?: string;
}

export const QuotesSection = memo<QuotesSectionProps>(({ className = '' }) => {
  const isDesktop = useBreakpoint(768);
  const {
    currentQuote,
    isRotating,
    preferences,
    nextQuote,
    previousQuote,
    toggleRotation,
    toggleFavorite
  } = useQuotesRotation();

  const isFavorite = preferences.favoriteQuotes.includes(currentQuote.id);

  return (
    <div className={className}>
      {isDesktop ? (
        // --- 🖥️ DESKTOP VIEW (Compact, horizontal layout) ---
        <ThemedCard
          padding="md"
          shadow="sm"
          className={className}
          style={{
            backgroundColor: 'transparent',
            background: 'linear-gradient(to right, var(--color-background-secondary), var(--color-card-background))',
            border: 'none'
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left: Quote Content */}
            <div className="flex-1 mr-6">
              <div className="flex items-start gap-3">
                <Newspaper className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div className="flex-1">
                  <blockquote className="italic text-sm leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                    "{currentQuote.text}"
                  </blockquote>
                  <div className="flex items-center justify-between mt-2">
                    <cite className="text-xs font-medium not-italic" style={{ color: 'var(--color-primary)' }}>
                      — {currentQuote.author}
                    </cite>
                    <div className="flex items-center gap-2">
                      {currentQuote.isPopular && (
                        <ThemedBadge variant="warning" size="sm">
                          ⭐
                        </ThemedBadge>
                      )}
                      <ThemedBadge variant="default" size="sm" className="capitalize">
                        {currentQuote.category}
                      </ThemedBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={previousQuote}
                title="Previous quote"
              >
                <ChevronLeft className="w-4 h-4" />
              </ThemedButton>
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={nextQuote}
                title="Next quote"
              >
                <ChevronRight className="w-4 h-4" />
              </ThemedButton>

              <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border)' }}></div>

              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(currentQuote.id)}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  color: isFavorite ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                  backgroundColor: isFavorite ? 'var(--color-alert-error-bg)' : 'transparent'
                }}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </ThemedButton>

              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={toggleRotation}
                title={isRotating ? 'Pause rotation' : 'Start rotation'}
                style={{
                  color: isRotating ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                  backgroundColor: isRotating ? 'var(--color-alert-success-bg)' : 'transparent'
                }}
              >
                {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </ThemedButton>

              <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border)' }}></div>

              <div className="ml-1">
                <ThemeSelector />
              </div>
            </div>
          </div>
        </ThemedCard>

      ) : (

        // --- 📱 MOBILE "INSPIRATION CARD" VIEW ---
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: 'var(--dash-card-general, var(--color-card-background))',
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: '16px'
          }}
        >
          {/* Decorative large quote mark */}
          <div
            className="absolute select-none pointer-events-none"
            style={{
              top: '-4px',
              right: '12px',
              fontSize: '72px',
              fontFamily: 'Georgia, serif',
              color: 'var(--color-primary)',
              opacity: 0.06,
              lineHeight: 1
            }}
          >
            "
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.88)), var(--color-primary)'
                }}
              >
                <Newspaper className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                Daily Inspiration
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite(currentQuote.id)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="transition-colors"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: isFavorite ? '#ef4444' : 'var(--color-text-tertiary)'
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quote Text */}
          <blockquote
            className="relative"
            style={{
              color: 'var(--color-text)',
              fontSize: '14px',
              lineHeight: '1.5',
              fontStyle: 'italic',
              marginBottom: '12px'
            }}
          >
            "{currentQuote.text}"
          </blockquote>

          {/* Footer: Author + Controls */}
          <div className="flex items-center justify-between">
            <cite
              className="not-italic"
              style={{
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              — {currentQuote.author}
            </cite>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={previousQuote}
                aria-label="Previous quote"
                className="transition-colors"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  color: 'var(--color-text-tertiary)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextQuote}
                aria-label="Next quote"
                className="transition-colors"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  color: 'var(--color-text-tertiary)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

QuotesSection.displayName = 'QuotesSection';