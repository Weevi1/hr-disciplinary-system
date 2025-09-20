import Logger from '../utils/logger';
// frontend/src/contexts/OrganizationContext.tsx
// 🎯 WHITE LABEL ORGANIZATION CONTEXT - FIXED FOR UNIVERSAL CATEGORIES
// ✅ Uses actual DataService.getOrganization() method from project
// ✅ Removes category loading - components load universal categories directly
// ✅ Preserves organization and sector info for white label functionality

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { DataServiceV2 } from '../services/DataServiceV2';
import { ShardedDataService } from '../services/ShardedDataService';
import CacheService from '../services/CacheService';
import type { Organization } from '../types';

// 🎯 UPDATED: Added categories back for performance optimization
interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string;
  categories: any[] | null;
  sectorInfo: any | null;
  loading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  initializeSector: (sectorId: string, userId: string) => Promise<void>;
}

export const OrganizationContext = createContext<OrganizationContextType | null>(null);

// 🎯 Custom hook to easily consume the context in other components
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

// 🎯 Props for the provider component
interface OrganizationProviderProps {
  children: ReactNode;
  organizationId: string;
}

// 🎯 The Provider component that fetches and holds the state
export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({
  children,
  organizationId
}) => {
  // 🎯 OPTIMIZED STATE - Added categories back for performance
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [categories, setCategories] = useState<any[] | null>(null);
  const [sectorInfo, setSectorInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔧 FIX: Prevent duplicate loading in React StrictMode
  const loadingRef = useRef(false);
  const loadedOrgRef = useRef<string | null>(null);

  // 🎯 STREAMLINED: Only load organization and sector data
  const loadOrganizationData = async () => {
    // 🔧 FIX: Prevent duplicate loading in React StrictMode
    if (loadingRef.current || loadedOrgRef.current === organizationId) {
      Logger.debug(`[OrganizationProvider] Skipping duplicate load for: ${organizationId}`);
      return;
    }

    loadingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      Logger.debug(`[OrganizationProvider] Loading data for organization ID: ${organizationId}`)

      // 🔥 CACHED: Use cached organization data for performance
      const orgKey = CacheService.generateOrgKey(organizationId, 'organization');
      const orgData = await CacheService.getOrFetch(
        orgKey,
        () => DataServiceV2.getOrganization(organizationId)
      );

      if (orgData) {
        setOrganization(orgData);
        Logger.debug(`[OrganizationProvider] ✅ Organization loaded: ${orgData.name}`)
      } else {
        Logger.error(`[OrganizationProvider] 🚨 Failed to load organization: ${organizationId}`)
        setError('Failed to load organization');
      }

      // 🔥 CACHED: Use cached categories for performance
      const categoriesKey = CacheService.generateOrgKey(organizationId, 'categories');
      const categoriesData = await CacheService.getOrFetch(
        categoriesKey,
        () => ShardedDataService.getWarningCategories(organizationId)
      );

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
        Logger.debug(`[OrganizationProvider] ✅ Loaded ${categoriesData.length} categories from cache/database`)
      } else {
        setCategories([]);
        Logger.debug(`[OrganizationProvider] ⚠️ No categories found for organization`)
      }

      // No sector info needed - using UniversalCategories
      setSectorInfo(null);
      Logger.debug(`[OrganizationProvider] ✅ Using UniversalCategories system`)

      // Mark as successfully loaded
      loadedOrgRef.current = organizationId;

    } catch (error) {
      Logger.error('[OrganizationProvider] 🚨 Failed to load organization data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load organization data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // 🎯 Function to allow manual refreshing from other components
  const refreshOrganization = async () => {
    // Reset loading state for manual refresh
    loadingRef.current = false;
    loadedOrgRef.current = null;
    await loadOrganizationData();
  };

  // 🎯 Function to initialize a sector
  const initializeSector = async (sectorId: string, userId: string) => {
    try {
      setLoading(true);
      await SectorService.initializeSectorCategories(organizationId, sectorId, userId);
      await loadOrganizationData(); // Reload all data after initialization
    } catch (error) {
      Logger.error('Failed to initialize sector:', error)
      throw error;
    }
  };

  // 🎯 useEffect hook to trigger the initial data load when the component mounts or orgId changes
  useEffect(() => {
    if (organizationId) {
      // Reset loading state when organization ID changes
      if (loadedOrgRef.current !== organizationId) {
        loadingRef.current = false;
        loadedOrgRef.current = null;
      }
      loadOrganizationData();
    } else {
      Logger.warn("[OrganizationProvider] No organizationId provided, skipping data load")
    }
  }, [organizationId]);

  // 🎯 UPDATED: Context value with categories for performance optimization
  const value: OrganizationContextType = {
    organization,
    organizationId,
    categories,
    sectorInfo,
    loading,
    error,
    refreshOrganization,
    initializeSector
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};