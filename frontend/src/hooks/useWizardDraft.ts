// useWizardDraft.ts - Auto-save and recovery for wizard forms
// Priority 4: Data Safety - Auto-save drafts, unsaved changes warning, resume capability

import { useState, useEffect, useCallback, useRef } from 'react';
import Logger from '../utils/logger';

interface WizardDraftOptions<T> {
  /**
   * Unique key for this wizard instance (e.g., 'warning-wizard-{orgId}')
   */
  storageKey: string;

  /**
   * Initial/default data when no draft exists
   */
  initialData: T;

  /**
   * How often to auto-save (ms). Default: 2000ms
   */
  autoSaveInterval?: number;

  /**
   * Whether auto-save is enabled. Default: true
   */
  enabled?: boolean;

  /**
   * Callback when draft is restored
   */
  onRestore?: (draft: T) => void;
}

interface WizardDraftState<T> {
  data: T;
  currentPhase: number;
  lastSaved: string | null;
  version: number;
}

interface UseWizardDraftReturn<T> {
  /**
   * Whether a saved draft exists
   */
  hasDraft: boolean;

  /**
   * The draft data (or initial data if no draft)
   */
  draftData: T;

  /**
   * Current phase from draft
   */
  draftPhase: number;

  /**
   * Last saved timestamp
   */
  lastSaved: string | null;

  /**
   * Save current state to draft
   */
  saveDraft: (data: T, phase: number) => void;

  /**
   * Clear the saved draft
   */
  clearDraft: () => void;

  /**
   * Restore the saved draft (returns true if draft existed)
   */
  restoreDraft: () => boolean;

  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean;

  /**
   * Mark current state as saved (resets unsaved flag)
   */
  markAsSaved: () => void;
}

const DRAFT_VERSION = 1;

export function useWizardDraft<T>(options: WizardDraftOptions<T>): UseWizardDraftReturn<T> {
  const {
    storageKey,
    initialData,
    autoSaveInterval = 2000,
    enabled = true,
    onRestore
  } = options;

  const [draftState, setDraftState] = useState<WizardDraftState<T> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedDataRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as WizardDraftState<T>;
        if (parsed.version === DRAFT_VERSION) {
          setDraftState(parsed);
          lastSavedDataRef.current = JSON.stringify(parsed.data);
          Logger.info('Wizard draft found:', { key: storageKey, phase: parsed.currentPhase });
        }
      }
    } catch (error) {
      Logger.error('Failed to load wizard draft:', error);
    }
  }, [storageKey, enabled]);

  // Warn before unload if unsaved changes
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, hasUnsavedChanges]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const saveDraft = useCallback((data: T, phase: number) => {
    if (!enabled) return;

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounce the save
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const newState: WizardDraftState<T> = {
          data,
          currentPhase: phase,
          lastSaved: new Date().toISOString(),
          version: DRAFT_VERSION
        };

        const serialized = JSON.stringify(newState);
        localStorage.setItem(storageKey, serialized);
        setDraftState(newState);
        lastSavedDataRef.current = JSON.stringify(data);
        setHasUnsavedChanges(false);

        Logger.info('Wizard draft saved:', { key: storageKey, phase });
      } catch (error) {
        Logger.error('Failed to save wizard draft:', error);
      }
    }, autoSaveInterval);

    // Mark as having unsaved changes immediately
    const currentDataStr = JSON.stringify(data);
    if (currentDataStr !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [enabled, storageKey, autoSaveInterval]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setDraftState(null);
      setHasUnsavedChanges(false);
      lastSavedDataRef.current = '';
      Logger.info('Wizard draft cleared:', storageKey);
    } catch (error) {
      Logger.error('Failed to clear wizard draft:', error);
    }
  }, [storageKey]);

  const restoreDraft = useCallback((): boolean => {
    if (!draftState) return false;

    if (onRestore) {
      onRestore(draftState.data);
    }

    Logger.info('Wizard draft restored:', { key: storageKey, phase: draftState.currentPhase });
    return true;
  }, [draftState, onRestore, storageKey]);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  return {
    hasDraft: draftState !== null,
    draftData: draftState?.data ?? initialData,
    draftPhase: draftState?.currentPhase ?? 0,
    lastSaved: draftState?.lastSaved ?? null,
    saveDraft,
    clearDraft,
    restoreDraft,
    hasUnsavedChanges,
    markAsSaved
  };
}

export default useWizardDraft;
