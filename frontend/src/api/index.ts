import Logger from '../utils/logger';
/**
 * API Layer - Single point of access for all data operations
 * 
 * Benefits:
 * - Decouples components from direct service calls
 * - Consistent error handling across the app
 * - Easy to mock for testing
 * - Clear API surface for the entire application
 * - Future-proof for potential backend changes
 */

import { DataServiceV2 } from '../services/DataServiceV2';
import { ShardedDataService } from '../services/ShardedDataService';
import { DatabaseShardingService } from '../services/DatabaseShardingService';
import { WarningService } from '../services/WarningService';
import CacheService from '../services/CacheService';
import { where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as UniversalCategories from '../services/UniversalCategories';
import { NestedDataService } from '../services/NestedDataService';
import { isDualWriteEnabled, useNestedStructure } from '../config/features';
import type { 
  Warning,
  WarningLevel,
  EnhancedWarningFormData,
  EscalationRecommendation 
} from '../types/warning';
import type { Employee } from '../types';

// ============================================
// ERROR HANDLING
// ============================================

class APIError extends Error {
  constructor(message: string, public code: string, public originalError?: unknown) {
    super(message);
    this.name = 'APIError';
  }
}

const handleError = (operation: string, error: unknown): never => {
  Logger.error(`API Error in ${operation}:`, error)

  if (error instanceof Error) {
    throw new APIError(`${operation} failed: ${error.message}`, 'OPERATION_FAILED', error);
  }

  throw new APIError(`${operation} failed with unknown error`, 'UNKNOWN_ERROR', error);
};

/**
 * Remove undefined values from an object (recursively)
 * Firestore does not allow undefined values
 */
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(item => item !== undefined);
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    });
    return cleaned;
  }

  return obj;
};

// ============================================
// WARNINGS API
// ============================================

export const warnings = {
  /**
   * Get all warnings with optional filters (SHARDED - excludes draft/incomplete warnings)
   */
  async getAll(organizationId: string, filters?: {
    status?: string;
    employeeId?: string;
    level?: WarningLevel;
  }): Promise<Warning[]> {
    try {
      // Load warnings and all employees in parallel for better performance
      const [warningsResult, allEmployees] = await Promise.all([
        ShardedDataService.loadWarnings(organizationId),
        ShardedDataService.loadEmployees(organizationId)
      ]);

      const allWarnings = warningsResult.documents;
      const employees = allEmployees.documents;

      // Enhance warnings with up-to-date employee information
      const enhancedWarnings = allWarnings.map(warning => {
        // Find the employee for this warning
        const employee = employees.find(emp => emp.id === warning.employeeId);

        if (employee) {
          // Update warning with current employee data
          const firstName = employee.profile?.firstName || '';
          const lastName = employee.profile?.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || warning.employeeName || 'Unknown';

          return {
            ...warning,
            employeeName: fullName, // Full name (first + last)
            employeeLastName: lastName || warning.employeeLastName || '',
            employeeNumber: employee.profile?.employeeNumber || warning.employeeNumber || 'Unknown',
            employeeDepartment: employee.employment?.department || warning.employeeDepartment || 'Unknown',
            employeePosition: employee.employment?.position || warning.employeePosition || 'Unknown',
            department: employee.employment?.department || warning.department || 'Unknown', // Legacy field
            position: employee.employment?.position || warning.position || 'Unknown', // Legacy field
          };
        }

        return warning;
      });

      // Filter out incomplete warnings
      const completedWarnings = enhancedWarnings.filter(warning => {
        // Must have required core fields for a complete warning
        if (!warning.level || !warning.description) {
          return false;
        }

        // Filter out obvious placeholders for employee data
        if (warning.employeeName === 'Unknown Employee' ||
            warning.employeeName === 'Employee Not Selected') {
          return false;
        }

        // Allow warnings even if some fields show as "Unknown" - might be legacy data
        return true;
      });

      Logger.debug(`Enhanced ${enhancedWarnings.length} warnings with employee data, filtered ${allWarnings.length - completedWarnings.length} incomplete warnings`)

      return completedWarnings;
    } catch (error) {
      handleError('warnings.getAll', error);
    }
  },

  /**
   * Get warning by ID (SHARDED)
   */
  async getById(warningId: string, organizationId: string): Promise<Warning | null> {
    try {
      return await ShardedDataService.getWarning(organizationId, warningId);
    } catch (error) {
      handleError('warnings.getById', error);
    }
  },

  /**
   * Create new warning
   */
  async create(warningData: EnhancedWarningFormData): Promise<string> {
    try {
      // Use DataService to save the warning directly
      Logger.debug('💾 Creating warning via DataService:', warningData)

      // Transform the enhanced form data to warning format
      const warning: Warning = {
        id: '', // Will be generated by Firestore
        organizationId: warningData.organizationId,
        employeeId: warningData.employeeId,
        categoryId: warningData.categoryId,
        category: warningData.categoryName || 'Unknown',
        categoryName: warningData.categoryName || 'Unknown', // Keep separate field for clarity
        level: warningData.level || 'verbal',
        
        // Employee snapshot data (denormalized for dashboard) - Keep individual fields
        employeeName: warningData.employeeName || 'Unknown',
        employeeLastName: warningData.employeeLastName || 'Employee',
        employeeNumber: warningData.employeeNumber || 'Unknown',
        employeeDepartment: warningData.employeeDepartment || 'Unknown',
        employeePosition: warningData.employeePosition || 'Unknown',
        department: warningData.employeeDepartment || 'Unknown', // Legacy field for compatibility
        position: warningData.employeePosition || 'Unknown', // Legacy field for compatibility
        
        // Incident details
        incidentDate: new Date(warningData.incidentDate),
        incidentTime: warningData.incidentTime,
        incidentLocation: warningData.incidentLocation,
        description: warningData.incidentDescription,
        
        // Administrative
        issueDate: new Date(warningData.issueDate),
        expiryDate: new Date(warningData.expiryDate || Date.now() + (warningData.validityPeriod || 6) * 30 * 24 * 60 * 60 * 1000),
        validityPeriod: warningData.validityPeriod || 6,
        issuedBy: warningData.issuedBy || '',
        issuedByName: warningData.issuedByName || '',
        
        // Status and flags
        isActive: true,
        status: 'issued',
        
        // Optional fields - handle undefined values for Firestore
        ...(warningData.additionalNotes && { additionalNotes: warningData.additionalNotes }),
        ...(warningData.signatures && { signatures: warningData.signatures }),
        ...(warningData.disciplineRecommendation && { disciplineRecommendation: removeUndefinedValues(warningData.disciplineRecommendation) }),
        ...(warningData.pdfGeneratorVersion && { pdfGeneratorVersion: warningData.pdfGeneratorVersion }),

        // MANDATORY: Audio recording is required for every warning
        audioRecording: warningData.audioRecording || {
          status: 'required',
          processingStatus: 'pending',
          error: 'Audio recording not provided'
        },
        deliveryMethod: warningData.deliveryMethod || 'email',

        // Audit fields
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Determine which data structure to use based on feature flags
      let warningId: string;

      if (useNestedStructure()) {
        // Use nested structure
        warningId = await NestedDataService.createWarning(
          warningData.organizationId,
          warningData.employeeId,
          warning
        );
        Logger.success(`📁 [NESTED] Warning created: ${warningId}`);

        // Dual-write to sharded structure if enabled
        if (isDualWriteEnabled()) {
          try {
            await WarningService.saveWarning(warning, warningData.organizationId);
            Logger.debug(`📋 [DUAL-WRITE] Warning also saved to sharded structure`);
          } catch (error) {
            Logger.warn(`⚠️ [DUAL-WRITE] Failed to save to sharded structure:`, error);
          }
        }
      } else {
        // Use sharded organization structure (organizations/{orgId}/warnings/{id})
        warningId = await WarningService.saveWarning(warning, warningData.organizationId);
        Logger.success(`📋 [SHARD] Warning created: ${warningId}`);

        // Dual-write to nested structure if enabled
        if (isDualWriteEnabled()) {
          try {
            await NestedDataService.createWarning(
              warningData.organizationId,
              warningData.employeeId,
              { ...warning, id: warningId }
            );
            Logger.debug(`📁 [DUAL-WRITE] Warning also saved to nested structure`);
          } catch (error) {
            Logger.warn(`⚠️ [DUAL-WRITE] Failed to save to nested structure:`, error);
          }
        }
      }

      return warningId;
    } catch (error) {
      handleError('warnings.create', error);
    }
  },

  /**
   * Update warning
   */
  async update(warningId: string, updates: Partial<Warning>, organizationId?: string, employeeId?: string): Promise<void> {
    try {
      // Require organizationId either from updates or as parameter
      const orgId = organizationId || updates.organizationId;

      if (!orgId) {
        throw new Error('Organization ID required for warning update');
      }

      // Determine which data structure to use based on feature flags
      if (useNestedStructure()) {
        // Use nested structure
        if (!employeeId) {
          // If employeeId not provided, we need to get it from the warning
          // For now, log a warning and fallback to sharded structure
          Logger.warn(`⚠️ [NESTED] Employee ID required for nested update, falling back to sharded structure`);
          await this.updateFlatStructure(warningId, updates, orgId);
        } else {
          await NestedDataService.updateWarning(orgId, employeeId, warningId, updates);
          Logger.success(`📁 [NESTED] Warning ${warningId} updated successfully`);

          // Dual-write to sharded structure if enabled
          if (isDualWriteEnabled()) {
            try {
              await this.updateFlatStructure(warningId, updates, orgId);
              Logger.debug(`📋 [DUAL-WRITE] Warning also updated in sharded structure`);
            } catch (error) {
              Logger.warn(`⚠️ [DUAL-WRITE] Failed to update sharded structure:`, error);
            }
          }
        }
      } else {
        // Use sharded organization structure (organizations/{orgId}/warnings/{id})
        await this.updateFlatStructure(warningId, updates, orgId);
        Logger.success(`📋 [SHARD] Warning ${warningId} updated successfully`);

        // Dual-write to nested structure if enabled
        if (isDualWriteEnabled() && employeeId) {
          try {
            await NestedDataService.updateWarning(orgId, employeeId, warningId, updates);
            Logger.debug(`📁 [DUAL-WRITE] Warning also updated in nested structure`);
          } catch (error) {
            Logger.warn(`⚠️ [DUAL-WRITE] Failed to update nested structure:`, error);
          }
        }
      }
    } catch (error) {
      handleError('warnings.update', error);
    }
  },

  /**
   * Update warning in flat structure (helper method)
   * @private
   */
  async updateFlatStructure(warningId: string, updates: Partial<Warning>, orgId: string): Promise<void> {
    // Use ShardedDataService to update the warning with all fields
    const warningRef = doc(db, `organizations/${orgId}/warnings/${warningId}`);

    // Prepare update data with timestamp
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      // Remove organizationId from updates as it shouldn't be changed
      organizationId: undefined
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(warningRef, updateData);

    Logger.debug(`📋 [SHARD] Warning ${warningId} updated in sharded structure`);
  },

  /**
   * Delete warning (mark as inactive)
   */
  async delete(warningId: string): Promise<void> {
    try {
      // TODO: Implement when WarningService is integrated
      Logger.warn('warnings.delete not implemented - needs WarningService integration')
    } catch (error) {
      handleError('warnings.delete', error);
    }
  },

  /**
   * Get escalation recommendation for employee
   */
  async getEscalationRecommendation(
    employeeId: string,
    categoryId: string,
    organizationId?: string
  ): Promise<EscalationRecommendation> {
    try {
      // Use WarningService for escalation recommendations with organizationId
      return await WarningService.getEscalationRecommendation(employeeId, categoryId, organizationId);
    } catch (error) {
      handleError('warnings.getEscalationRecommendation', error);
    }
  },

  /**
   * Get active warnings for employee (SERVER-SIDE time validation)
   * 🔒 FRAUD-PROOF: Uses server time to prevent device clock manipulation
   */
  async getActiveWarnings(employeeId: string, organizationId: string): Promise<Warning[]> {
    try {
      // Use WarningService for server-side active warning validation
      return await WarningService.getActiveWarnings(employeeId, organizationId);
    } catch (error) {
      handleError('warnings.getActiveWarnings', error);
    }
  },

  /**
   * Get warning statistics
   */
  async getStats(organizationId: string): Promise<{
    total: number;
    pendingReview: number;
    approved: number;
    byLevel: Record<WarningLevel, number>;
  }> {
    try {
      // Get all warnings and calculate stats
      const allWarnings = await DataServiceV2.getWarningsByOrganization(organizationId);
      
      const stats = {
        total: allWarnings.length,
        issued: allWarnings.filter(w => w.status === 'issued').length,
        delivered: allWarnings.filter(w => w.status === 'delivered').length,
        byLevel: {
          counselling: allWarnings.filter(w => w.warningLevel === 'counselling').length,
          written_warning_1: allWarnings.filter(w => w.warningLevel === 'written_warning_1').length,
          written_warning_2: allWarnings.filter(w => w.warningLevel === 'written_warning_2').length,
          final_written_warning: allWarnings.filter(w => w.warningLevel === 'final_written_warning').length,
          dismissal: allWarnings.filter(w => w.warningLevel === 'dismissal').length
        } as Record<WarningLevel, number>
      };
      
      return stats;
    } catch (error) {
      handleError('warnings.getStats', error);
    }
  },

  /**
   * Archive a warning (for appealed/overturned warnings)
   */
  async archive(warningId: string, organizationId: string, reason: 'appealed' | 'overturned' | 'expired' | 'manual'): Promise<void> {
    try {
      const warningRef = doc(db, `organizations/${organizationId}/warnings/${warningId}`);

      await updateDoc(warningRef, {
        isArchived: true,
        archivedAt: serverTimestamp(),
        archiveReason: reason,
        updatedAt: serverTimestamp()
      });

      Logger.success(`Warning ${warningId} archived (reason: ${reason})`)
    } catch (error) {
      handleError('warnings.archive', error);
    }
  },

  /**
   * Get archived warnings (for archived employees and expired warnings)
   */
  async getArchived(organizationId: string): Promise<Warning[]> {
    try {
      // Load all warnings including archived ones
      const result = await ShardedDataService.loadWarnings(organizationId);

      // Filter to only archived warnings
      const archivedWarnings = result.documents.filter(warning =>
        warning.isArchived === true ||
        warning.status === 'expired' ||
        warning.status === 'overturned'
      );

      return archivedWarnings;
    } catch (error) {
      handleError('warnings.getArchived', error);
      return [];
    }
  }
};

// ============================================
// EMPLOYEES API
// ============================================

export const employees = {
  /**
   * Get all employees for organization (OPTIMIZED SHARDED with pagination)
   * ✅ ENHANCED: Includes active warning counts for each employee
   */
  async getAll(organizationId: string, pageSize: number = 100): Promise<Employee[]> {
    try {
      // Load employees and warnings in parallel for better performance
      const [employeesResult, warningsResult] = await Promise.all([
        ShardedDataService.loadEmployees(organizationId, {
          pageSize,
          orderField: 'profile.lastName',
          orderDirection: 'asc'
        }),
        ShardedDataService.loadWarnings(organizationId)
      ]);

      const employees = employeesResult.documents;
      const allWarnings = warningsResult.documents;

      // Count active warnings per employee
      const warningCounts = new Map<string, number>();

      // NOTE: Using client time for validation checks
      // Ideally we'd use server time for consistency, but Firebase serverTimestamp()
      // only works for writes, not reads. Future improvement: Add Cloud Function
      // endpoint to get server time, or do validation server-side.
      const now = new Date();

      allWarnings.forEach(warning => {
        try {
          // Only count active, non-expired warnings
          let expiryDate: Date | null = null;
          if (warning.expiryDate) {
            // Handle Firestore Timestamp objects
            if (typeof warning.expiryDate.toDate === 'function') {
              expiryDate = warning.expiryDate.toDate();
            } else if (warning.expiryDate instanceof Date) {
              expiryDate = warning.expiryDate;
            } else if (typeof warning.expiryDate === 'string' || typeof warning.expiryDate === 'number') {
              expiryDate = new Date(warning.expiryDate);
            }
          }

          const isActive = warning.isActive &&
                          (!expiryDate || !isNaN(expiryDate.getTime()) && expiryDate > now);

          if (isActive && warning.employeeId) {
            const currentCount = warningCounts.get(warning.employeeId) || 0;
            warningCounts.set(warning.employeeId, currentCount + 1);
          }
        } catch (dateError) {
          Logger.warn(`⚠️ [WARNING COUNT] Error processing warning ${warning.id}:`, dateError);
        }
      });

      // Enrich employees with warning counts
      const enrichedEmployees = employees.map(employee => {
        const activeWarnings = warningCounts.get(employee.id) || 0;

        return {
          ...employee,
          disciplinaryRecord: {
            ...employee.disciplinaryRecord,
            activeWarnings,
            totalWarnings: employee.disciplinaryRecord?.totalWarnings || activeWarnings
          }
        };
      });

      Logger.success(`👥 [OPTIMIZED] Loaded ${enrichedEmployees.length} employees with warning counts (pageSize: ${pageSize})`);
      return enrichedEmployees;
    } catch (error) {
      handleError('employees.getAll', error);
    }
  },

  /**
   * Get employee by ID (SHARDED)
   */
  async getById(employeeId: string, organizationId: string): Promise<Employee | null> {
    try {
      return await ShardedDataService.getEmployeeById(employeeId, organizationId);
    } catch (error) {
      handleError('employees.getById', error);
    }
  },

  /**
   * Create new employee (SHARDED)
   */
  async create(employeeData: Omit<Employee, 'id'>): Promise<string> {
    try {
      const employee = await ShardedDataService.saveEmployee(employeeData, employeeData.organizationId);
      return employee.id;
    } catch (error) {
      handleError('employees.create', error);
    }
  },

  /**
   * Update employee (SHARDED)
   */
  async update(employeeId: string, organizationId: string, updates: Partial<Employee>): Promise<void> {
    try {
      const employee = await ShardedDataService.getEmployeeById(employeeId, organizationId);
      if (!employee) throw new Error('Employee not found');
      const updatedEmployee = { ...employee, ...updates };
      await ShardedDataService.saveEmployee(updatedEmployee, organizationId);
    } catch (error) {
      handleError('employees.update', error);
    }
  },

  /**
   * Delete employee (archive) (SHARDED)
   */
  async delete(employeeId: string, organizationId: string): Promise<void> {
    try {
      await ShardedDataService.archiveEmployee(employeeId, organizationId);
    } catch (error) {
      handleError('employees.delete', error);
    }
  },

  /**
   * Bulk create employees (SHARDED - for CSV import)
   */
  async bulkCreate(employeesData: Partial<Employee>[], organizationId: string): Promise<string[]> {
    try {
      const result = await ShardedDataService.bulkCreateEmployees(employeesData, organizationId);
      return result.success > 0 ? ['bulk-success'] : [];
    } catch (error) {
      handleError('employees.bulkCreate', error);
    }
  },

  /**
   * Search employees (SHARDED)
   */
  async search(organizationId: string, searchTerm: string): Promise<Employee[]> {
    try {
      const result = await ShardedDataService.loadEmployees(organizationId);
      const employees = result.documents;
      const searchLower = searchTerm.toLowerCase();
      return employees.filter(employee => 
        employee.profile.firstName.toLowerCase().includes(searchLower) ||
        employee.profile.lastName.toLowerCase().includes(searchLower) ||
        employee.profile.employeeNumber.toLowerCase().includes(searchLower) ||
        employee.profile.email.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      handleError('employees.search', error);
    }
  },

  /**
   * Get employees by manager ID (OPTIMIZED + CACHED)
   */
  async getByManager(managerId: string, organizationId: string): Promise<Employee[]> {
    try {
      const cacheKey = CacheService.generateOrgKey(organizationId, 'employees', 'manager', managerId);

      const result = await CacheService.getOrFetch(
        cacheKey,
        async () => {
          // Use direct database query instead of loading all employees and filtering
          const queryResult = await DatabaseShardingService.queryDocuments<Employee>(
            organizationId,
            'employees',
            [
              where('employment.managerId', '==', managerId),
              where('isActive', '==', true)
            ],
            {
              pageSize: 50, // Reasonable limit for manager's direct reports
              orderField: 'profile.lastName',
              orderDirection: 'asc'
            }
          );

          Logger.success(`👥 [OPTIMIZED] Loaded ${queryResult.documents.length} employees for manager ${managerId}`);
          return queryResult.documents;
        }
      );

      return result;
    } catch (error) {
      handleError('employees.getByManager', error);
    }
  },

  /**
   * Generate next available employee number (SHARDED)
   */
  async generateNextEmployeeNumber(
    organizationId: string, 
    format: 'EMP001' | 'E001' | '001' | 'custom' = 'EMP001',
    customPrefix: string = '',
    startingNumber: number = 1
  ): Promise<string> {
    try {
      const result = await ShardedDataService.loadEmployees(organizationId);
      const employees = result.documents;
      
      // Get all employee numbers
      const existingNumbers = employees
        .map(emp => emp.profile?.employeeNumber)
        .filter(num => num && typeof num === 'string') as string[];
      
      // Extract numeric parts and find the highest
      let highestNumber = startingNumber - 1;
      
      existingNumbers.forEach(empNum => {
        const numMatch = empNum.match(/(\d+)$/);
        if (numMatch) {
          const num = parseInt(numMatch[1], 10);
          if (num > highestNumber) {
            highestNumber = num;
          }
        }
      });
      
      const nextNumber = highestNumber + 1;
      
      // Generate formatted number based on format
      switch (format) {
        case 'EMP001':
          return `EMP${nextNumber.toString().padStart(3, '0')}`;
        case 'E001':
          return `E${nextNumber.toString().padStart(3, '0')}`;
        case '001':
          return nextNumber.toString().padStart(3, '0');
        case 'custom':
          return `${customPrefix}${nextNumber.toString().padStart(3, '0')}`;
        default:
          return `EMP${nextNumber.toString().padStart(3, '0')}`;
      }
    } catch (error) {
      handleError('employees.generateNextEmployeeNumber', error);
    }
  },

  /**
   * Validate employee number availability (SHARDED)
   */
  async validateEmployeeNumber(
    organizationId: string,
    employeeNumber: string,
    excludeEmployeeId?: string
  ): Promise<{
    isAvailable: boolean;
    suggestions?: string[];
  }> {
    try {
      const result = await ShardedDataService.loadEmployees(organizationId);
      const employees = result.documents;
      
      // Check if employee number is already taken
      const existingEmployee = employees.find(emp => 
        emp.profile?.employeeNumber === employeeNumber && 
        emp.id !== excludeEmployeeId
      );
      
      if (!existingEmployee) {
        return { isAvailable: true };
      }
      
      // Generate suggestions if not available
      const suggestions: string[] = [];
      const baseNumber = employeeNumber.match(/(\d+)$/);
      const prefix = employeeNumber.replace(/(\d+)$/, '');
      
      if (baseNumber) {
        const num = parseInt(baseNumber[1], 10);
        for (let i = 1; i <= 3; i++) {
          const suggestion = `${prefix}${(num + i).toString().padStart(baseNumber[1].length, '0')}`;
          const suggestionExists = employees.some(emp => 
            emp.profile?.employeeNumber === suggestion
          );
          if (!suggestionExists) {
            suggestions.push(suggestion);
          }
        }
      }
      
      return {
        isAvailable: false,
        suggestions: suggestions.slice(0, 3) // Return max 3 suggestions
      };
    } catch (error) {
      handleError('employees.validateEmployeeNumber', error);
    }
  },

  /**
   * Archive employee (lifecycle management)
   */
  async archive(
    employeeId: string,
    organizationId: string,
    options: { reason: string; archivedBy: string }
  ): Promise<void> {
    try {
      const { EmployeeLifecycleService } = await import('../services/EmployeeLifecycleService');
      await EmployeeLifecycleService.archiveEmployee(employeeId, organizationId, options);
    } catch (error) {
      handleError('employees.archive', error);
    }
  },

  /**
   * Restore archived employee
   */
  async restore(employeeId: string, organizationId: string, restoredBy: string): Promise<void> {
    try {
      const { EmployeeLifecycleService } = await import('../services/EmployeeLifecycleService');
      await EmployeeLifecycleService.restoreEmployee(employeeId, organizationId, restoredBy);
    } catch (error) {
      handleError('employees.restore', error);
    }
  },

  /**
   * Get employees eligible for deletion (5+ years archived)
   */
  async getEligibleForDeletion(organizationId: string): Promise<Employee[]> {
    try {
      const { EmployeeLifecycleService } = await import('../services/EmployeeLifecycleService');
      return await EmployeeLifecycleService.getEmployeesEligibleForDeletion(organizationId);
    } catch (error) {
      handleError('employees.getEligibleForDeletion', error);
    }
  },

  /**
   * Get employee lifecycle statistics
   */
  async getLifecycleStats(organizationId: string): Promise<any> {
    try {
      const { EmployeeLifecycleService } = await import('../services/EmployeeLifecycleService');
      return await EmployeeLifecycleService.getLifecycleStats(organizationId);
    } catch (error) {
      handleError('employees.getLifecycleStats', error);
    }
  },

  /**
   * Get archived employees (separate from main list)
   */
  async getArchived(organizationId: string): Promise<Employee[]> {
    try {
      const result = await ShardedDataService.loadArchivedEmployees(organizationId);
      return result.documents;
    } catch (error) {
      handleError('employees.getArchived', error);
    }
  },

  /**
   * Get all warnings for an employee (including archived employees)
   */
  async getAllWarningsForEmployee(employeeId: string, organizationId: string): Promise<any[]> {
    try {
      return await ShardedDataService.getAllWarningsForEmployee(employeeId, organizationId);
    } catch (error) {
      handleError('employees.getAllWarningsForEmployee', error);
    }
  }
};

// ============================================
// ORGANIZATIONS API
// ============================================

export const organizations = {
  /**
   * Get organization by ID
   */
  async getById(organizationId: string) {
    try {
      return await DataServiceV2.getOrganization(organizationId);
    } catch (error) {
      handleError('organizations.getById', error);
    }
  },

  /**
   * Update organization
   */
  async update(organizationId: string, updates: any) {
    try {
      // Organization updates need to be handled differently for sharded architecture
      throw new Error('Organization updates not implemented in DataServiceV2');
    } catch (error) {
      handleError('organizations.update', error);
    }
  },

  /**
   * Get organization categories (SHARDED)
   */
  async getCategories(organizationId: string) {
    try {
      return await ShardedDataService.getWarningCategories(organizationId);
    } catch (error) {
      handleError('organizations.getCategories', error);
    }
  }
};

// ============================================
// CATEGORIES API
// ============================================

export const categories = {
  /**
   * Get all universal categories
   */
  getUniversal() {
    return UniversalCategories.UNIVERSAL_SA_CATEGORIES;
  },

  /**
   * Get category by ID
   */
  getById(categoryId: string) {
    return UniversalCategories.getCategoryById(categoryId) || null;
  },

  /**
   * Get escalation path for category
   */
  getEscalationPath(categoryId: string) {
    return UniversalCategories.getEscalationPath(categoryId);
  },

  /**
   * Get next escalation level
   */
  getNextLevel(categoryId: string, currentLevel: WarningLevel) {
    return UniversalCategories.getNextEscalationLevel(categoryId, currentLevel) || 'verbal';
  }
};

// ============================================
// BATCH LOADING API (Performance Optimization)
// ============================================

export const batch = {
  /**
   * Load all dashboard data in parallel for optimal performance
   */
  async loadDashboardData(organizationId: string, managerId: string): Promise<{
    employees: Employee[];
    followUps: any[];
    stats: any;
    loadTime: number;
  }> {
    try {
      const startTime = Date.now();
      Logger.debug('🚀 [BATCH] Loading dashboard data in parallel...');

      // Use Promise.all to load all data concurrently
      const [employeesData, followUpsData, statsData] = await Promise.all([
        employees.getByManager(managerId, organizationId),
        // Add follow-ups and stats if needed - placeholder for now
        Promise.resolve([]),
        Promise.resolve({})
      ]);

      const loadTime = Date.now() - startTime;

      Logger.success(`🚀 [BATCH] Dashboard data loaded in ${loadTime}ms (employees: ${employeesData.length})`);

      return {
        employees: employeesData,
        followUps: followUpsData,
        stats: statsData,
        loadTime
      };
    } catch (error) {
      handleError('batch.loadDashboardData', error);
      throw error;
    }
  },

  /**
   * Load organization setup data (for organization management)
   */
  async loadOrganizationSetup(organizationId: string): Promise<{
    organization: any;
    categories: any[];
    settings: any;
    loadTime: number;
  }> {
    try {
      const startTime = Date.now();
      Logger.debug('🚀 [BATCH] Loading organization setup data...');

      // Cache keys for batch loading
      const orgKey = CacheService.generateOrgKey(organizationId, 'organization');
      const categoriesKey = CacheService.generateOrgKey(organizationId, 'categories');
      const settingsKey = CacheService.generateOrgKey(organizationId, 'settings');

      // Load all data in parallel with caching
      const [orgData, categoriesData, settingsData] = await Promise.all([
        CacheService.getOrFetch(orgKey, () => DataServiceV2.getOrganization(organizationId)),
        CacheService.getOrFetch(categoriesKey, () => ShardedDataService.getWarningCategories(organizationId)),
        CacheService.getOrFetch(settingsKey, () => Promise.resolve({})) // Placeholder for settings
      ]);

      const loadTime = Date.now() - startTime;

      Logger.success(`🚀 [BATCH] Organization setup loaded in ${loadTime}ms`);

      return {
        organization: orgData,
        categories: categoriesData,
        settings: settingsData,
        loadTime
      };
    } catch (error) {
      handleError('batch.loadOrganizationSetup', error);
      throw error;
    }
  }
};

// ============================================
// UNIFIED API EXPORT
// ============================================

// ============================================
// REPORTS API
// ============================================

export const reports = {
  /**
   * Get all reports for an organization
   */
  async getAll(organizationId: string): Promise<any[]> {
    try {
      // Placeholder - implement when reports service is ready
      return [];
    } catch (error) {
      handleError('reports.getAll', error);
    }
  }
};

// ============================================
// ANALYTICS API
// ============================================

export const analytics = {
  /**
   * Get dashboard metrics for an organization
   */
  async getDashboardMetrics(organizationId: string): Promise<any> {
    try {
      // Placeholder - implement when analytics service is ready
      return {
        complianceScore: 94,
        costPerEmployee: 4250,
        riskScore: 12
      };
    } catch (error) {
      handleError('analytics.getDashboardMetrics', error);
    }
  }
};

export const API = {
  warnings,
  employees,
  organizations,
  categories,
  batch,
  reports,
  analytics
} as const;

// Default export for convenience
export default API;

// Export error class for error handling in components
export { APIError };