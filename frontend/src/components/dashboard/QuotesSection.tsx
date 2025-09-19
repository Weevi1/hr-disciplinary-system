// frontend/src/components/dashboard/QuotesSection.tsx
// 💬 AWARD-WINNING HYBRID QUOTES COMPONENT (FINAL V2)
// ✅ Renders a compact, premium, pastel-themed "Inspiration Card" on mobile.
// ✅ Renders the full-featured, classic view on desktop.

import React, { memo, useState, useEffect, useCallback } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, Play, Pause, Heart } from 'lucide-react';
import { useQuotesRotation } from '../../hooks/dashboard/useQuotesRotation';

// --- A Simple Breakpoint Hook (consistent with other components) ---
const useBreakpoint = (breakpoint: number) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);

  const handleResize = useCallback(() => {
    setIsDesktop(window.innerWidth > breakpoint);
  }, [breakpoint]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isDesktop;
};


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
        <div className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200 shadow-sm ${className}`}>
          <div className="flex items-center justify-between">
            {/* Left: Quote Content */}
            <div className="flex-1 mr-6">
              <div className="flex items-start gap-3">
                <Newspaper className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <blockquote className="text-gray-700 italic text-sm leading-tight">
                    "{currentQuote.text}"
                  </blockquote>
                  <div className="flex items-center justify-between mt-2">
                    <cite className="text-xs font-medium text-amber-700 not-italic">
                      — {currentQuote.author}
                    </cite>
                    <div className="flex items-center gap-2">
                      {currentQuote.isPopular && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                          ⭐
                        </span>
                      )}
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                        {currentQuote.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={previousQuote}
                className="p-1 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-100 transition-colors"
                title="Previous quote"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextQuote}
                className="p-1 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-100 transition-colors"
                title="Next quote"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-amber-200 mx-1"></div>
              
              <button
                onClick={() => toggleFavorite(currentQuote.id)}
                className={`p-1 rounded transition-colors ${
                  isFavorite 
                    ? 'text-red-500 bg-red-100' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-100'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={toggleRotation}
                className={`p-1 rounded transition-colors ${
                  isRotating 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-100'
                }`}
                title={isRotating ? 'Pause rotation' : 'Start rotation'}
              >
                {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

      ) : (

        // --- 📱 MOBILE "INSPIRATION CARD" VIEW (Compact, Pastel Mint Theme) ---
        <div className={`bg-emerald-50/80 dark:bg-emerald-950/60 backdrop-blur-xl border border-emerald-900/10 dark:border-white/10 rounded-2xl p-3 shadow-lg text-gray-800 dark:text-gray-200`}>
          {/* Header with Title and Primary Controls */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Daily Inspiration
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleFavorite(currentQuote.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-500' 
                    : 'bg-gray-200/70 dark:bg-white/10 text-gray-400 hover:text-red-500'
                }`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={toggleRotation}
                className={`p-1.5 rounded-lg transition-colors ${
                  isRotating 
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-600' 
                    : 'bg-gray-200/70 dark:bg-white/10 text-gray-400 hover:text-green-600'
                }`}
                aria-label={isRotating ? 'Pause rotation' : 'Start rotation'}
              >
                {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quote Content */}
          <blockquote className="my-2 text-gray-700 dark:text-gray-300 italic text-sm leading-snug">
            "{currentQuote.text}"
          </blockquote>

          {/* Author and Metadata */}
          <div className="flex items-center justify-between text-xs mt-3">
            <cite className="font-medium text-emerald-800 dark:text-emerald-300 not-italic">
              — {currentQuote.author}
            </cite>
            <span className="bg-emerald-200/40 dark:bg-white/10 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full capitalize">
              {currentQuote.category}
            </span>
          </div>

          <hr className="my-2.5 border-t border-emerald-200/80 dark:border-white/10" />

          {/* Footer with Navigation and Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={previousQuote} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-white/10 transition-colors" aria-label="Previous quote">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextQuote} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-white/10 transition-colors" aria-label="Next quote">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>Quote {currentQuote.id}</span>
              {preferences.favoriteQuotes.length > 0 && (
                <span className='ml-2'>• {preferences.favoriteQuotes.length} faved</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

QuotesSection.displayName = 'QuotesSection';