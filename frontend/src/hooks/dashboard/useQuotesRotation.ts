import Logger from '../../utils/logger';
// frontend/src/hooks/dashboard/useQuotesRotation.ts
// 💬 SMART QUOTES MANAGEMENT HOOK
// ✅ Smooth transitions and user preferences

import { useState, useEffect, useCallback } from 'react';

interface InspirationalQuote {
  id: number;
  text: string;
  author: string;
  category: 'leadership' | 'perseverance' | 'unity' | 'wisdom' | 'courage';
  isPopular?: boolean;
}

const QUOTES_STORAGE_KEY = 'dashboard_quotes_preferences';
const ROTATION_INTERVAL = 15000; // 15 seconds

interface QuotesPreferences {
  favoriteQuotes: number[];
  showOnlyFavorites: boolean;
  rotationEnabled: boolean;
}

interface QuotesHookReturn {
  currentQuote: InspirationalQuote;
  allQuotes: InspirationalQuote[];
  isRotating: boolean;
  preferences: QuotesPreferences;
  nextQuote: () => void;
  previousQuote: () => void;
  toggleRotation: () => void;
  toggleFavorite: (quoteId: number) => void;
  updatePreferences: (prefs: Partial<QuotesPreferences>) => void;
}

// 🇿🇦 ENHANCED QUOTES COLLECTION
const southAfricanQuotes: InspirationalQuote[] = [
  {
    id: 1,
    text: "There is no passion to be found playing small – in settling for a life that is less than the one you are capable of living.",
    author: "Nelson Mandela",
    category: "leadership",
    isPopular: true
  },
  {
    id: 2,
    text: "I learned that courage was not the absence of fear, but the triumph over it.",
    author: "Nelson Mandela",
    category: "courage",
    isPopular: true
  },
  {
    id: 3,
    text: "Ubuntu does not mean that people should not enrich themselves. The question is: are you going to do so in order to enable the community around you to be able to improve?",
    author: "Nelson Mandela",
    category: "unity"
  },
  {
    id: 4,
    text: "Don't look where you fall, but where you slipped.",
    author: "African Proverb",
    category: "wisdom"
  },
  {
    id: 5,
    text: "However long the night, the dawn will break.",
    author: "African Proverb",
    category: "perseverance",
    isPopular: true
  },
  {
    id: 6,
    text: "If you want to go fast, go alone. If you want to go far, go together.",
    author: "African Proverb",
    category: "unity",
    isPopular: true
  },
  {
    id: 7,
    text: "The brave may not live forever, but the cautious do not live at all.",
    author: "Desmond Tutu",
    category: "courage"
  },
  {
    id: 8,
    text: "Hope is being able to see that there is light despite all of the darkness.",
    author: "Desmond Tutu",
    category: "perseverance"
  },
  {
    id: 9,
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    category: "wisdom",
    isPopular: true
  },
  {
    id: 10,
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    category: "perseverance",
    isPopular: true
  }
];

export const useQuotesRotation = (): QuotesHookReturn => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [preferences, setPreferences] = useState<QuotesPreferences>({
    favoriteQuotes: [],
    showOnlyFavorites: false,
    rotationEnabled: true
  });

  // 🎯 LOAD PREFERENCES
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUOTES_STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        setPreferences(prefs);
        setIsRotating(prefs.rotationEnabled);
      }
    } catch (error) {
      Logger.warn('⚠️ Failed to load quotes preferences:', error)
    }
  }, []);

  // 💾 SAVE PREFERENCES
  const savePreferences = useCallback((newPrefs: QuotesPreferences) => {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      Logger.warn('⚠️ Failed to save quotes preferences:', error)
    }
  }, []);

  // 🎯 GET ACTIVE QUOTES
  const getActiveQuotes = useCallback(() => {
    if (preferences.showOnlyFavorites && preferences.favoriteQuotes.length > 0) {
      return southAfricanQuotes.filter(quote => preferences.favoriteQuotes.includes(quote.id));
    }
    return southAfricanQuotes;
  }, [preferences]);

  const activeQuotes = getActiveQuotes();
  const currentQuote = activeQuotes[currentQuoteIndex] || southAfricanQuotes[0];

  // 🔄 ROTATION LOGIC
  useEffect(() => {
    if (!isRotating || activeQuotes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % activeQuotes.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isRotating, activeQuotes.length]);

  // 🎯 NAVIGATION FUNCTIONS
  const nextQuote = useCallback(() => {
    setCurrentQuoteIndex(prev => (prev + 1) % activeQuotes.length);
  }, [activeQuotes.length]);

  const previousQuote = useCallback(() => {
    setCurrentQuoteIndex(prev => (prev - 1 + activeQuotes.length) % activeQuotes.length);
  }, [activeQuotes.length]);

  const toggleRotation = useCallback(() => {
    const newRotating = !isRotating;
    setIsRotating(newRotating);
    
    const newPrefs = { ...preferences, rotationEnabled: newRotating };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  }, [isRotating, preferences, savePreferences]);

  const toggleFavorite = useCallback((quoteId: number) => {
    const newFavorites = preferences.favoriteQuotes.includes(quoteId)
      ? preferences.favoriteQuotes.filter(id => id !== quoteId)
      : [...preferences.favoriteQuotes, quoteId];
    
    const newPrefs = { ...preferences, favoriteQuotes: newFavorites };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  const updatePreferences = useCallback((prefs: Partial<QuotesPreferences>) => {
    const newPrefs = { ...preferences, ...prefs };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    
    if (prefs.rotationEnabled !== undefined) {
      setIsRotating(prefs.rotationEnabled);
    }
  }, [preferences, savePreferences]);

  return {
    currentQuote,
    allQuotes: southAfricanQuotes,
    isRotating,
    preferences,
    nextQuote,
    previousQuote,
    toggleRotation,
    toggleFavorite,
    updatePreferences
  };
};
