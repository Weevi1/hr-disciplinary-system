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
            background: 'linear-gradient(to right, var(--color-background-secondary), var(--color-card-background))',
            border: '1px solid var(--color-border)'
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

        // --- 📱 MOBILE "INSPIRATION CARD" VIEW (Ultra-Compact) ---
        <ThemedCard
          padding="sm"
          shadow="md"
          style={{
            background: 'linear-gradient(135deg, var(--color-card-background), var(--color-background-secondary))',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Compact Header with Title and Essential Controls */}
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
              <Newspaper className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              Daily Inspiration
            </h3>
            <div className="flex items-center gap-1">
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(currentQuote.id)}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  color: isFavorite ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                  backgroundColor: isFavorite ? 'var(--color-alert-error-bg)' : 'transparent',
                  padding: '4px'
                }}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </ThemedButton>
              <div className="scale-75">
                <ThemeSelector />
              </div>
            </div>
          </div>

          {/* Compact Quote Content */}
          <blockquote className="mb-1.5 italic text-sm leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
            "{currentQuote.text}"
          </blockquote>

          {/* Compact Footer with Author and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={previousQuote}
                aria-label="Previous quote"
                style={{ padding: '4px' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </ThemedButton>
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={nextQuote}
                aria-label="Next quote"
                style={{ padding: '4px' }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </ThemedButton>
            </div>
            <div className="flex items-center gap-2">
              <cite className="text-xs font-medium not-italic" style={{ color: 'var(--color-primary)' }}>
                — {currentQuote.author}
              </cite>
              <ThemedBadge variant="primary" size="sm" className="capitalize text-xs">
                {currentQuote.category}
              </ThemedBadge>
            </div>
          </div>
        </ThemedCard>
      )}
    </div>
  );
});

QuotesSection.displayName = 'QuotesSection';