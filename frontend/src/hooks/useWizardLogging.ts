// frontend/src/hooks/useWizardLogging.ts
// 🔍 REACT HOOK FOR WIZARD LOGGING
// Easy integration with wizard components

import { useEffect, useRef, useCallback, useState } from 'react';
import { wizardLogger } from '../services/WizardLoggingService';
import type { LogEntry, ValidationResult } from '../services/WizardLoggingService';

interface UseWizardLoggingProps {
  sessionId?: string;
  stepName: string;
  autoStart?: boolean;
  enableRealTimeValidation?: boolean;
}

interface WizardLoggingHook {
  // Session management
  sessionId: string;
  startSession: () => string;
  endSession: (outcome: 'completed' | 'cancelled' | 'error') => void;
  
  // Step tracking
  enterStep: (initialData?: any) => void;
  exitStep: (finalData?: any, completed?: boolean) => void;
  
  // Data tracking
  trackChange: (field: string, oldValue: any, newValue: any) => void;
  trackFormSubmit: (formData: any) => void;
  trackAPI: (apiName: string, params?: any, result?: any, error?: any) => void;
  
  // Convenience methods
  trackError: (error: Error, context?: any) => void;
  trackSuccess: (action: string, data?: any) => void;
  trackWarning: (warning: string, data?: any) => void;
  
  // Real-time validation
  validateData: (data: any) => ValidationResult;
  
  // Session info
  logs: LogEntry[];
  issues: any[];
  summary: any;
  
  // Export functionality
  exportSession: () => string;
}

export const useWizardLogging = ({
  sessionId: providedSessionId,
  stepName,
  autoStart = true,
  enableRealTimeValidation = true
}: UseWizardLoggingProps): WizardLoggingHook => {
  
  const [sessionId, setSessionId] = useState<string>(providedSessionId || '');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  const sessionStarted = useRef(false);
  const stepEntered = useRef(false);
  
  // Start session automatically if needed
  useEffect(() => {
    if (autoStart && !sessionStarted.current && !providedSessionId) {
      const newSessionId = wizardLogger.startWizardSession();
      setSessionId(newSessionId);
      sessionStarted.current = true;
    } else if (providedSessionId) {
      setSessionId(providedSessionId);
      sessionStarted.current = true;
    }
  }, [autoStart, providedSessionId]);

  // Set up real-time log listening
  useEffect(() => {
    if (!sessionId) return;

    const updateLogs = () => {
      const sessionLogs = wizardLogger.getSessionLogs(sessionId);
      const sessionIssues = wizardLogger.getSessionIssues(sessionId);
      const sessionSummary = wizardLogger.getSessionSummary(sessionId);
      
      setLogs(sessionLogs);
      setIssues(sessionIssues);
      setSummary(sessionSummary);
    };

    // Initial load
    updateLogs();

    // Listen for new logs
    const logListener = (entry: LogEntry) => {
      if (entry.metadata?.sessionId === sessionId || logs.some(log => log.id === entry.id)) {
        updateLogs();
      }
    };

    wizardLogger.addListener(logListener);

    // Update every 2 seconds for real-time feel
    const interval = setInterval(updateLogs, 2000);

    return () => {
      wizardLogger.removeListener(logListener);
      clearInterval(interval);
    };
  }, [sessionId]);

  // Session management
  const startSession = useCallback((): string => {
    if (!sessionStarted.current) {
      const newSessionId = wizardLogger.startWizardSession();
      setSessionId(newSessionId);
      sessionStarted.current = true;
      return newSessionId;
    }
    return sessionId;
  }, [sessionId]);

  const endSession = useCallback((outcome: 'completed' | 'cancelled' | 'error') => {
    if (sessionId) {
      if (stepEntered.current) {
        wizardLogger.exitStep(sessionId, stepName, undefined, outcome === 'completed');
        stepEntered.current = false;
      }
      wizardLogger.endWizardSession(sessionId, outcome);
      sessionStarted.current = false;
    }
  }, [sessionId, stepName]);

  // Step tracking
  const enterStep = useCallback((initialData?: any) => {
    if (sessionId && !stepEntered.current) {
      wizardLogger.enterStep(sessionId, stepName, initialData);
      stepEntered.current = true;
    }
  }, [sessionId, stepName]);

  const exitStep = useCallback((finalData?: any, completed: boolean = true) => {
    if (sessionId && stepEntered.current) {
      wizardLogger.exitStep(sessionId, stepName, finalData, completed);
      stepEntered.current = false;
    }
  }, [sessionId, stepName]);

  // Data tracking
  const trackChange = useCallback((field: string, oldValue: any, newValue: any) => {
    if (sessionId) {
      wizardLogger.trackDataChange(sessionId, stepName, field, oldValue, newValue);
    }
  }, [sessionId, stepName]);

  const trackFormSubmit = useCallback((formData: any) => {
    if (sessionId) {
      wizardLogger.trackFormSubmission(sessionId, stepName, formData);
    }
  }, [sessionId, stepName]);

  const trackAPI = useCallback((apiName: string, params?: any, result?: any, error?: any) => {
    if (sessionId) {
      wizardLogger.trackAPICall(sessionId, stepName, apiName, params, result, error);
    }
  }, [sessionId, stepName]);

  // Convenience methods
  const trackError = useCallback((error: Error, context?: any) => {
    if (sessionId) {
      wizardLogger.trackError(sessionId, stepName, error, context);
    }
  }, [sessionId, stepName]);

  const trackSuccess = useCallback((action: string, data?: any) => {
    if (sessionId) {
      wizardLogger.trackSuccess(sessionId, stepName, action, data);
    }
  }, [sessionId, stepName]);

  const trackWarning = useCallback((warning: string, data?: any) => {
    if (sessionId) {
      wizardLogger.trackWarning(sessionId, stepName, warning, data);
    }
  }, [sessionId, stepName]);

  // Real-time validation
  const validateData = useCallback((data: any): ValidationResult => {
    if (sessionId && enableRealTimeValidation) {
      // This would call the internal validation method
      // Since it's private, we'll create a public wrapper
      return wizardLogger.validateStepData?.(sessionId, stepName, data, 'MANUAL_VALIDATION') || {
        isValid: true,
        errors: [],
        warnings: [],
        missingFields: [],
        undefinedFields: []
      };
    }
    return {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };
  }, [sessionId, stepName, enableRealTimeValidation]);

  // Export functionality
  const exportSession = useCallback((): string => {
    if (sessionId) {
      return wizardLogger.exportSessionData(sessionId);
    }
    return '';
  }, [sessionId]);

  // Auto enter step when hook initializes
  useEffect(() => {
    if (sessionId && autoStart && !stepEntered.current) {
      enterStep();
    }
  }, [sessionId, autoStart, enterStep]);

  // Auto exit step on unmount
  useEffect(() => {
    return () => {
      if (sessionId && stepEntered.current) {
        exitStep(undefined, false); // Not completed if unmounting
      }
    };
  }, [sessionId, exitStep]);

  return {
    sessionId,
    startSession,
    endSession,
    enterStep,
    exitStep,
    trackChange,
    trackFormSubmit,
    trackAPI,
    trackError,
    trackSuccess,
    trackWarning,
    validateData,
    logs,
    issues,
    summary,
    exportSession
  };
};

// Enhanced hook with form integration
export const useWizardFormLogging = (
  hookProps: UseWizardLoggingProps,
  initialFormData: any = {}
) => {
  const logging = useWizardLogging(hookProps);
  const [formData, setFormData] = useState(initialFormData);
  const previousFormData = useRef(initialFormData);

  // Track form changes automatically
  const updateFormData = useCallback((newData: any) => {
    const oldData = previousFormData.current;
    
    // Track individual field changes
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        logging.trackChange(key, oldData[key], newData[key]);
      }
    });

    setFormData(newData);
    previousFormData.current = newData;

    // Auto-validate if enabled
    if (hookProps.enableRealTimeValidation) {
      const validation = logging.validateData(newData);
      if (!validation.isValid) {
        logging.trackWarning(`Validation failed: ${validation.errors.join(', ')}`, newData);
      }
    }
  }, [logging, hookProps.enableRealTimeValidation]);

  // Enhanced form submit with logging
  const submitForm = useCallback((additionalData?: any) => {
    const finalData = { ...formData, ...additionalData };
    logging.trackFormSubmit(finalData);
    
    // Final validation
    const validation = logging.validateData(finalData);
    if (!validation.isValid) {
      logging.trackError(new Error(`Form validation failed: ${validation.errors.join(', ')}`), finalData);
      return { success: false, validation };
    }

    logging.trackSuccess('FORM_SUBMITTED', finalData);
    return { success: true, validation, data: finalData };
  }, [formData, logging]);

  return {
    ...logging,
    formData,
    updateFormData,
    submitForm
  };
};

// Default export for easier importing
export default useWizardLogging;