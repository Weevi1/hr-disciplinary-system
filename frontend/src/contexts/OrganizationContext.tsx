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
  prefetchedOrg?: Organization | null; // 🚀 OPTIMIZATION: Accept pre-fetched organization data
  prefetchedCategories?: any[] | null; // 🚀 OPTIMIZATION: Accept pre-fetched categories
}

// 🎯 The Provider component that fetches and holds the state
export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({
  children,
  organizationId,
  prefetchedOrg,
  prefetchedCategories
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
  const mountRef = useRef(false);

  // 🔧 GLOBAL: Singleton pattern to prevent duplicate org loading across StrictMode instances
  const globalLoadingKey = `org-loading-${organizationId}`;
  const isGloballyLoading = () => {
    return typeof window !== 'undefined' && (window as any)[globalLoadingKey];
  };
  const setGlobalLoading = (loading: boolean) => {
    if (typeof window !== 'undefined') {
      if (loading) {
        (window as any)[globalLoadingKey] = true;
      } else {
        delete (window as any)[globalLoadingKey];
      }
    }
  };

  // 🚀 PARALLEL LOADING: Load organization and categories simultaneously
  const loadOrganizationData = async () => {
    // 🚀 OPTIMIZATION: Skip loading if prefetched data provided
    if (prefetchedOrg && prefetchedCategories !== undefined) {
      Logger.debug(`[OrganizationProvider] ✅ Using prefetched data for: ${organizationId}`);
      setOrganization(prefetchedOrg);
      setCategories(prefetchedCategories);
      setSectorInfo(null);
      setLoading(false);
      loadedOrgRef.current = organizationId;
      return;
    }

    // 🔧 GLOBAL SINGLETON: Prevent duplicate loading across StrictMode instances
    if (loadingRef.current || isGloballyLoading()) {
      Logger.debug(`[OrganizationProvider] Already loading, skipping duplicate for: ${organizationId}`);
      return;
    }

    if (loadedOrgRef.current === organizationId && organization && categories !== null) {
      Logger.debug(`[OrganizationProvider] Already loaded, skipping reload for: ${organizationId}`);
      setLoading(false);
      return;
    }

    // 🔧 STRICTER: If we're already loaded for this org, don't reload
    if (loadedOrgRef.current === organizationId && categories && categories.length > 0) {
      Logger.debug(`[OrganizationProvider] Organization ${organizationId} already loaded with ${categories.length} categories, skipping`);
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setGlobalLoading(true);

    try {
      setLoading(true);
      setError(null);
      Logger.debug(`[OrganizationProvider] 🚀 Loading data in parallel for organization ID: ${organizationId}`)

      // 🚀 PARALLEL: Load organization and categories simultaneously
      const [orgData, categoriesData] = await Promise.all([
        // Organization data with caching
        CacheService.getOrFetch(
          CacheService.generateOrgKey(organizationId, 'organization'),
          () => DataServiceV2.getOrganization(organizationId)
        ),
        // Categories data with caching
        CacheService.getOrFetch(
          CacheService.generateOrgKey(organizationId, 'categories'),
          () => ShardedDataService.getWarningCategories(organizationId)
        )
      ]);

      // Process organization data
      if (orgData) {
        setOrganization(orgData);
        Logger.debug(`[OrganizationProvider] ✅ Organization loaded: ${orgData.name}`)
      } else {
        Logger.error(`[OrganizationProvider] 🚨 Failed to load organization: ${organizationId}`)
        setError('Failed to load organization');
      }

      // Process categories data
      if (categoriesData && Array.isArray(categoriesData)) {
        Logger.debug(`[OrganizationProvider] ✅ Setting ${categoriesData.length} categories in state`, categoriesData.map(c => c.name));
        setCategories(categoriesData);
        Logger.debug(`[OrganizationProvider] ✅ Categories state updated`);
      } else {
        Logger.warn(`[OrganizationProvider] ⚠️ No categories found, setting empty array for organization: ${organizationId}`)
        setCategories([]);
      }

      // No sector info needed - using UniversalCategories
      setSectorInfo(null);
      Logger.debug(`[OrganizationProvider] ✅ Using UniversalCategories system`)

      // Mark as successfully loaded
      loadedOrgRef.current = organizationId;

      // 🎯 CRITICAL: Set loading to false AFTER all state is set
      setLoading(false);

    } catch (error) {
      Logger.error('[OrganizationProvider] 🚨 Failed to load organization data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load organization data');
      setLoading(false);
    } finally {
      loadingRef.current = false;
      setGlobalLoading(false);
    }
  };

  // 🎯 Function to allow manual refreshing from other components
  const refreshOrganization = async () => {
    // 🔥 CRITICAL: Clear cache first to ensure fresh data is fetched
    // This is important when pdfSettings or other org data changes externally
    if (organizationId) {
      CacheService.clearByPrefix(`org:${organizationId}:`);
      Logger.debug(`[OrganizationProvider] 🗑️ Cleared cache for organization: ${organizationId}`);
    }

    // Reset loading state for manual refresh
    loadingRef.current = false;
    loadedOrgRef.current = null;
    await loadOrganizationData();
  };

  // 🎯 Function to initialize a sector
  const initializeSector = async (sectorId: string, userId: string) => {
    try {
      setLoading(true);
      // TODO: Add SectorService import if needed for sector functionality
      Logger.warn('SectorService not imported - sector initialization disabled');
      await loadOrganizationData(); // Reload all data after initialization
    } catch (error) {
      Logger.error('Failed to initialize sector:', error)
      throw error;
    }
  };

  // 🎯 useEffect hook to trigger the initial data load when the component mounts or orgId changes
  useEffect(() => {
    // 🔧 STRICTER StrictMode fix: Only load once per mount
    if (!mountRef.current) {
      mountRef.current = true;

      if (organizationId) {
        // Reset loading state when organization ID changes
        if (loadedOrgRef.current !== organizationId) {
          loadingRef.current = false;
          loadedOrgRef.current = null;
          // Clear cache for previous org if switching organizations
          if (loadedOrgRef.current) {
            CacheService.clearByPrefix(`org:${loadedOrgRef.current}:`);
          }
        }
        loadOrganizationData();
      } else {
        Logger.warn("[OrganizationProvider] No organizationId provided, skipping data load")
      }
    }

    // Cleanup function to reset mount ref
    return () => {
      mountRef.current = false;
    };
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

  // 🎯 DEBUG: Only log critical context updates (production-ready)
  useEffect(() => {
    if (!loading && categories && categories.length > 0) {
      Logger.debug(`[OrganizationProvider] ✅ Context ready: ${organization?.name} with ${categories.length} categories`);
    }
  }, [loading, categories, organization]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};