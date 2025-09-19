import Logger from '../utils/logger';
// frontend/src/services/WizardLoggingService.ts
// 🔍 REAL-TIME WIZARD LOGGING SERVICE
// Tracks data flow through wizard steps and catches issues as they happen

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  step: string;
  action: string;
  data?: any;
  validation?: ValidationResult;
  metadata?: Record<string, any>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  undefinedFields: string[];
}

interface StepConfig {
  name: string;
  requiredFields: string[];
  validations: Array<(data: any) => ValidationResult>;
}

interface WizardFlow {
  sessionId: string;
  startTime: Date;
  currentStep: string;
  completedSteps: string[];
  logs: LogEntry[];
  dataSnapshots: Record<string, any>;
  issues: Array<{
    step: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
  }>;
}

class WizardLoggingService {
  private static instance: WizardLoggingService;
  private flows: Map<string, WizardFlow> = new Map();
  private listeners: Array<(entry: LogEntry) => void> = [];
  private stepConfigs: Map<string, StepConfig> = new Map();
  
  // Console styling for better readability
  private styles = {
    info: 'color: #2563eb; font-weight: bold;',
    warn: 'color: #d97706; font-weight: bold;',
    error: 'color: #dc2626; font-weight: bold;',
    debug: 'color: #6b7280; font-weight: normal;',
    step: 'color: #7c3aed; font-weight: bold; font-size: 14px;',
    data: 'color: #059669; font-weight: normal;',
    validation: 'color: #dc2626; font-weight: bold;'
  };

  private constructor() {
    this.initializeStepConfigs();
  }

  static getInstance(): WizardLoggingService {
    if (!WizardLoggingService.instance) {
      WizardLoggingService.instance = new WizardLoggingService();
    }
    return WizardLoggingService.instance;
  }

  // Initialize validation configs for each wizard step
  private initializeStepConfigs(): void {
    this.stepConfigs.set('INCIDENT_DETAILS', {
      name: 'Incident Details',
      requiredFields: [
        'employeeId', 'categoryId', 'incidentDate', 'incidentTime', 
        'incidentLocation', 'incidentDescription', 'issueDate', 'validityPeriod'
      ],
      validations: [
        this.validateIncidentDetails.bind(this),
        this.validateDescriptionLength.bind(this),
        this.validateDates.bind(this)
      ]
    });

    this.stepConfigs.set('LEGAL_REVIEW_SIGNATURES', {
      name: 'Legal Review & Signatures',
      requiredFields: [
        'lraRecommendation', 'signatures.manager', 'signatures.employee'
      ],
      validations: [
        this.validateLegalReview.bind(this),
        this.validateSignatures.bind(this)
      ]
    });

    this.stepConfigs.set('DELIVERY_COMPLETION', {
      name: 'Delivery & Completion',
      requiredFields: [
        'id', 'status', 'deliveryMethod'
      ],
      validations: [
        this.validateDeliveryData.bind(this),
        this.validateFirestoreReadiness.bind(this)
      ]
    });
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  startWizardSession(sessionId?: string): string {
    const id = sessionId || `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const flow: WizardFlow = {
      sessionId: id,
      startTime: new Date(),
      currentStep: '',
      completedSteps: [],
      logs: [],
      dataSnapshots: {},
      issues: []
    };

    this.flows.set(id, flow);
    
    this.log(id, 'info', 'SESSION', 'STARTED', null, {
      sessionId: id,
      timestamp: flow.startTime
    });

    return id;
  }

  endWizardSession(sessionId: string, outcome: 'completed' | 'cancelled' | 'error'): void {
    const flow = this.flows.get(sessionId);
    if (!flow) return;

    const duration = Date.now() - flow.startTime.getTime();
    
    this.log(sessionId, 'info', 'SESSION', 'ENDED', null, {
      outcome,
      duration: `${Math.round(duration / 1000)}s`,
      totalSteps: flow.completedSteps.length,
      totalIssues: flow.issues.length,
      finalStep: flow.currentStep
    });

    // Keep session for 5 minutes for debugging
    setTimeout(() => {
      this.flows.delete(sessionId);
    }, 5 * 60 * 1000);
  }

  // ============================================
  // STEP TRACKING
  // ============================================

  enterStep(sessionId: string, stepName: string, initialData?: any): void {
    const flow = this.flows.get(sessionId);
    if (!flow) return;

    flow.currentStep = stepName;
    
    this.log(sessionId, 'info', stepName, 'STEP_ENTERED', initialData, {
      previousStep: flow.completedSteps[flow.completedSteps.length - 1] || 'none',
      stepIndex: flow.completedSteps.length + 1
    });

    // Validate initial data if provided
    if (initialData) {
      this.validateStepData(sessionId, stepName, initialData, 'STEP_ENTRY');
    }
  }

  exitStep(sessionId: string, stepName: string, finalData?: any, completed: boolean = true): void {
    const flow = this.flows.get(sessionId);
    if (!flow) return;

    if (completed && !flow.completedSteps.includes(stepName)) {
      flow.completedSteps.push(stepName);
    }

    this.log(sessionId, completed ? 'info' : 'warn', stepName, 'STEP_EXITED', finalData, {
      completed,
      timeInStep: this.getTimeInStep(sessionId, stepName),
      totalCompletedSteps: flow.completedSteps.length
    });

    // Final validation before leaving step
    if (finalData && completed) {
      this.validateStepData(sessionId, stepName, finalData, 'STEP_EXIT');
    }
  }

  // ============================================
  // DATA TRACKING
  // ============================================

  trackDataChange(sessionId: string, step: string, field: string, oldValue: any, newValue: any): void {
    this.log(sessionId, 'debug', step, 'DATA_CHANGED', {
      field,
      oldValue,
      newValue,
      valueType: typeof newValue
    }, {
      hasValue: newValue !== undefined && newValue !== null && newValue !== '',
      isValidChange: newValue !== oldValue
    });

    // Check for potential issues
    if (newValue === undefined && oldValue !== undefined) {
      this.trackIssue(sessionId, step, `Field ${field} became undefined`, 'medium');
    }

    if (typeof newValue !== typeof oldValue && oldValue !== undefined) {
      this.trackIssue(sessionId, step, `Field ${field} type changed from ${typeof oldValue} to ${typeof newValue}`, 'low');
    }
  }

  trackFormSubmission(sessionId: string, step: string, formData: any): void {
    const flow = this.flows.get(sessionId);
    if (!flow) return;

    // Create data snapshot
    flow.dataSnapshots[`${step}_${Date.now()}`] = { ...formData };

    this.log(sessionId, 'info', step, 'FORM_SUBMITTED', formData, {
      fieldCount: Object.keys(formData || {}).length,
      hasRequiredFields: this.checkRequiredFields(step, formData)
    });

    // Validate form data
    this.validateStepData(sessionId, step, formData, 'FORM_SUBMISSION');
  }

  trackAPICall(sessionId: string, step: string, apiName: string, params?: any, result?: any, error?: any): void {
    const level = error ? 'error' : 'info';
    
    this.log(sessionId, level, step, 'API_CALL', {
      api: apiName,
      params,
      result: error ? undefined : result,
      error: error?.message || error
    }, {
      success: !error,
      responseTime: Date.now() // Could be enhanced with actual timing
    });

    if (error) {
      this.trackIssue(sessionId, step, `API call failed: ${apiName} - ${error.message}`, 'high');
    }
  }

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  private validateStepData(sessionId: string, step: string, data: any, context: string): ValidationResult {
    const config = this.stepConfigs.get(step);
    if (!config) {
      return { isValid: true, errors: [], warnings: [], missingFields: [], undefinedFields: [] };
    }

    let combinedResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    // Run all validations for this step
    config.validations.forEach(validator => {
      const result = validator(data);
      combinedResult.errors.push(...result.errors);
      combinedResult.warnings.push(...result.warnings);
      combinedResult.missingFields.push(...result.missingFields);
      combinedResult.undefinedFields.push(...result.undefinedFields);
      combinedResult.isValid = combinedResult.isValid && result.isValid;
    });

    this.log(sessionId, combinedResult.isValid ? 'info' : 'error', step, 'VALIDATION', data, {
      context,
      validation: combinedResult
    });

    // Track validation issues
    combinedResult.errors.forEach(error => {
      this.trackIssue(sessionId, step, `Validation Error: ${error}`, 'high');
    });

    combinedResult.warnings.forEach(warning => {
      this.trackIssue(sessionId, step, `Validation Warning: ${warning}`, 'medium');
    });

    return combinedResult;
  }

  private validateIncidentDetails(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    // Check required fields
    const required = ['employeeId', 'categoryId', 'incidentDate', 'incidentLocation', 'incidentDescription'];
    required.forEach(field => {
      if (!data[field] || data[field] === '') {
        result.errors.push(`Missing required field: ${field}`);
        result.missingFields.push(field);
        result.isValid = false;
      }
    });

    // Check for undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        result.undefinedFields.push(key);
        result.errors.push(`Field ${key} is undefined`);
        result.isValid = false;
      }
    });

    return result;
  }

  private validateDescriptionLength(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    if (data.incidentDescription) {
      const wordCount = data.incidentDescription.trim().split(/\s+/).length;
      if (wordCount < 15) {
        result.warnings.push(`Incident description should be at least 15 words (currently ${wordCount})`);
      }
    }

    return result;
  }

  private validateDates(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    // Validate incident date
    if (data.incidentDate) {
      const incidentDate = new Date(data.incidentDate);
      if (incidentDate > new Date()) {
        result.errors.push('Incident date cannot be in the future');
        result.isValid = false;
      }
    }

    // Validate issue date
    if (data.issueDate) {
      const issueDate = new Date(data.issueDate);
      if (issueDate > new Date()) {
        result.warnings.push('Issue date is in the future');
      }
    }

    return result;
  }

  private validateLegalReview(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    if (!data.lraRecommendation) {
      result.errors.push('LRA recommendation is required');
      result.missingFields.push('lraRecommendation');
      result.isValid = false;
    }

    return result;
  }

  private validateSignatures(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    if (!data.signatures?.manager) {
      result.warnings.push('Manager signature missing');
      result.missingFields.push('signatures.manager');
    }

    if (!data.signatures?.employee) {
      result.warnings.push('Employee signature missing');
      result.missingFields.push('signatures.employee');
    }

    return result;
  }

  private validateDeliveryData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    if (!data.id) {
      result.errors.push('Warning ID is required for delivery');
      result.missingFields.push('id');
      result.isValid = false;
    }

    if (!data.deliveryMethod) {
      result.warnings.push('Delivery method not specified');
      result.missingFields.push('deliveryMethod');
    }

    return result;
  }

  private validateFirestoreReadiness(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      undefinedFields: []
    };

    // Check for Firestore-incompatible undefined values
    const undefinedFields = this.findUndefinedFields(data);
    if (undefinedFields.length > 0) {
      result.errors.push(`Undefined fields will cause Firestore errors: ${undefinedFields.join(', ')}`);
      result.undefinedFields.push(...undefinedFields);
      result.isValid = false;
    }

    // Check required Firestore fields
    const firestoreRequired = ['id', 'organizationId', 'employeeId', 'categoryId'];
    firestoreRequired.forEach(field => {
      if (!data[field]) {
        result.errors.push(`Firestore requires field: ${field}`);
        result.missingFields.push(field);
        result.isValid = false;
      }
    });

    return result;
  }

  private findUndefinedFields(obj: any, prefix: string = ''): string[] {
    const undefinedFields: string[] = [];
    
    if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (value === undefined) {
          undefinedFields.push(fullKey);
        } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          undefinedFields.push(...this.findUndefinedFields(value, fullKey));
        }
      });
    }
    
    return undefinedFields;
  }

  // ============================================
  // ISSUE TRACKING
  // ============================================

  private trackIssue(sessionId: string, step: string, issue: string, severity: 'low' | 'medium' | 'high'): void {
    const flow = this.flows.get(sessionId);
    if (!flow) return;

    const issueRecord = {
      step,
      issue,
      severity,
      timestamp: new Date()
    };

    flow.issues.push(issueRecord);

    this.log(sessionId, severity === 'high' ? 'error' : 'warn', step, 'ISSUE_DETECTED', null, {
      issue,
      severity,
      totalIssues: flow.issues.length
    });
  }

  // ============================================
  // LOGGING CORE
  // ============================================

  private log(sessionId: string, level: LogEntry['level'], step: string, action: string, data?: any, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      level,
      step,
      action,
      data,
      metadata
    };

    const flow = this.flows.get(sessionId);
    if (flow) {
      flow.logs.push(entry);
    }

    // Console logging with styling
    this.logToConsole(entry, sessionId);

    // Notify listeners
    this.listeners.forEach(listener => listener(entry));
  }

  private logToConsole(entry: LogEntry, sessionId: string): void {
    const emoji = {
      info: '💙',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };

    const prefix = `%c${emoji[entry.level]} [${entry.step}] ${entry.action}`;
    const style = this.styles[entry.level];

    if (entry.data) {
      console.groupCollapsed(`${prefix} (${sessionId.slice(-6)})`, style);
      Logger.debug('%cData:', this.styles.data, entry.data)
      if (entry.validation) {
        Logger.debug('%cValidation:', this.styles.validation, entry.validation)
      }
      if (entry.metadata) {
        Logger.debug('%cMetadata:', this.styles.debug, entry.metadata)
      }
      console.groupEnd();
    } else {
      Logger.debug(`${prefix} (${sessionId.slice(-6)})`, style);
      if (entry.metadata) {
        Logger.debug('%cMetadata:', this.styles.debug, entry.metadata)
      }
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private checkRequiredFields(step: string, data: any): boolean {
    const config = this.stepConfigs.get(step);
    if (!config) return true;

    return config.requiredFields.every(field => {
      const keys = field.split('.');
      let value = data;
      for (const key of keys) {
        value = value?.[key];
      }
      return value !== undefined && value !== null && value !== '';
    });
  }

  private getTimeInStep(sessionId: string, stepName: string): string {
    const flow = this.flows.get(sessionId);
    if (!flow) return '0s';

    const stepEntryLog = flow.logs
      .reverse()
      .find(log => log.step === stepName && log.action === 'STEP_ENTERED');

    if (!stepEntryLog) return '0s';

    const duration = Date.now() - stepEntryLog.timestamp.getTime();
    return `${Math.round(duration / 1000)}s`;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getSessionLogs(sessionId: string): LogEntry[] {
    return this.flows.get(sessionId)?.logs || [];
  }

  getSessionIssues(sessionId: string): WizardFlow['issues'] {
    return this.flows.get(sessionId)?.issues || [];
  }

  getSessionSummary(sessionId: string): any {
    const flow = this.flows.get(sessionId);
    if (!flow) return null;

    return {
      sessionId: flow.sessionId,
      startTime: flow.startTime,
      currentStep: flow.currentStep,
      completedSteps: flow.completedSteps,
      totalLogs: flow.logs.length,
      totalIssues: flow.issues.length,
      issuesByLevel: {
        high: flow.issues.filter(i => i.severity === 'high').length,
        medium: flow.issues.filter(i => i.severity === 'medium').length,
        low: flow.issues.filter(i => i.severity === 'low').length
      },
      dataSnapshots: Object.keys(flow.dataSnapshots).length
    };
  }

  exportSessionData(sessionId: string): string {
    const flow = this.flows.get(sessionId);
    if (!flow) return '';

    return JSON.stringify({
      summary: this.getSessionSummary(sessionId),
      logs: flow.logs,
      issues: flow.issues,
      dataSnapshots: flow.dataSnapshots
    }, null, 2);
  }

  // Convenience methods for common logging patterns
  trackError(sessionId: string, step: string, error: Error, context?: any): void {
    this.log(sessionId, 'error', step, 'ERROR', {
      message: error.message,
      stack: error.stack,
      context
    });
    this.trackIssue(sessionId, step, error.message, 'high');
  }

  trackSuccess(sessionId: string, step: string, action: string, data?: any): void {
    this.log(sessionId, 'info', step, `SUCCESS_${action}`, data);
  }

  trackWarning(sessionId: string, step: string, warning: string, data?: any): void {
    this.log(sessionId, 'warn', step, 'WARNING', data, { warning });
    this.trackIssue(sessionId, step, warning, 'medium');
  }
}

// Export singleton instance
export const wizardLogger = WizardLoggingService.getInstance();

// Export types for use in components
export type { LogEntry, ValidationResult, WizardFlow };

// Default export for easier importing
export default WizardLoggingService;