import { useState, useEffect, useCallback } from 'react';import Logger from '../utils/logger';

import { DataServiceV2 } from '../services/DataServiceV2';
import type { WarningCategory } from '../types';

interface UseCategoriesState {
  categories: WarningCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWarningCategories = (organizationId: string): UseCategoriesState => {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchCategories = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const categories = await DataServiceV2.getWarningCategories(organizationId);
      
      setState(prev => ({ 
        ...prev, 
        categories, 
        loading: false 
      }));
    } catch (error) {
      Logger.error('Failed to load warning categories:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load categories'
      }));
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchCategories();
    }
  }, [organizationId, fetchCategories]);

  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  return {
    ...state,
    refetch
  };
};
