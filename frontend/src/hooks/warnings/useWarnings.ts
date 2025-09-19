import Logger from '../../utils/logger';
/**
 * Modern warnings hook using the API layer
 * 
 * Benefits over useSimpleWarnings:
 * - Uses centralized API layer
 * - Better error handling
 * - Consistent patterns across the app
 * - Easier to test and maintain
 */

import { useState, useEffect, useCallback } from 'react';
import { API, APIError } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import type { Warning, WarningLevel } from '@/services/WarningService';

interface UseWarningsOptions {
  autoFetch?: boolean;
  filters?: {
    status?: string;
    employeeId?: string;
    level?: WarningLevel;
  };
}

export const useWarnings = (options: UseWarningsOptions = {}) => {
  const { autoFetch = true, filters } = options;
  const { organization } = useAuth();
  
  // State
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load warnings using API layer
  const loadWarnings = useCallback(async () => {
    if (!organization?.id) {
      Logger.warn('No organization ID available for loading warnings')
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      Logger.debug('🔄 Loading warnings via API layer')
      const data = await API.warnings.getAll(organization.id, filters);
      
      setWarnings(data);
      Logger.success(1409)
      
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Failed to load warnings';
      
      Logger.error('❌ Error loading warnings:', err)
      setError(errorMessage);
      setWarnings([]); // Clear stale data
    } finally {
      setLoading(false);
    }
  }, [organization?.id, filters]);

  // Update warning status
  const updateWarningStatus = useCallback(async (
    warningId: string, 
    newStatus: 'issued' | 'delivered' | 'acknowledged'
  ) => {
    try {
      // Optimistic update
      setWarnings(prev => 
        prev.map(w => 
          w.id === warningId 
            ? { ...w, status: newStatus } 
            : w
        )
      );

      // Update via API
      await API.warnings.update(warningId, { status: newStatus });
      
      Logger.success(2312)
      
    } catch (err) {
      Logger.error('❌ Error updating warning status:', err)
      
      // Revert optimistic update on error
      setWarnings(prev => 
        prev.map(w => 
          w.id === warningId 
            ? { ...w, status: w.status } // Revert to original
            : w
        )
      );
      
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Failed to update warning status';
      setError(errorMessage);
    }
  }, []);

  // Delete warning
  const deleteWarning = useCallback(async (warningId: string) => {
    try {
      // Optimistic removal
      const originalWarnings = warnings;
      setWarnings(prev => prev.filter(w => w.id !== warningId));

      // Delete via API
      await API.warnings.delete(warningId);
      
      Logger.success(3211)
      
    } catch (err) {
      Logger.error('❌ Error deleting warning:', err)
      
      // Revert optimistic removal on error
      setWarnings(warnings);
      
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Failed to delete warning';
      setError(errorMessage);
    }
  }, [warnings]);

  // Refresh data
  const refresh = useCallback(() => {
    loadWarnings();
  }, [loadWarnings]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch && organization?.id) {
      loadWarnings();
    }
  }, [autoFetch, loadWarnings]);

  // Computed statistics
  const stats = {
    total: warnings.length,
    issued: warnings.filter(w => w.status === 'issued').length,
    delivered: warnings.filter(w => w.status === 'delivered').length,
    acknowledged: warnings.filter(w => w.status === 'acknowledged').length,
    highRisk: warnings.filter(w => w.priority === 'high' || w.severity === 'high').length
  };

  return {
    // Data
    warnings,
    stats,
    
    // State
    loading,
    error,
    
    // Actions
    loadWarnings,
    updateWarningStatus,
    deleteWarning,
    refresh,
    clearError
  };
};

// Backward compatibility export
export { useWarnings as useSimpleWarnings };