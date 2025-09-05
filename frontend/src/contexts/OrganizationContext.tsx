// frontend/src/contexts/OrganizationContext.tsx
// 🎯 WHITE LABEL ORGANIZATION CONTEXT - FIXED FOR UNIVERSAL CATEGORIES
// ✅ Uses actual DataService.getOrganization() method from project
// ✅ Removes category loading - components load universal categories directly
// ✅ Preserves organization and sector info for white label functionality

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DataService } from '../services/DataService';
import type { Organization } from '../types';

// 🎯 UPDATED: Removed category-related properties
interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string;
  sectorInfo: any | null;
  loading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  initializeSector: (sectorId: string, userId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

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
  // 🎯 SIMPLIFIED STATE - No category-related state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sectorInfo, setSectorInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 STREAMLINED: Only load organization and sector data
  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[OrganizationProvider] Loading data for organization ID: ${organizationId}`);

      // 🔥 FIXED: Use actual DataService method with organizationId parameter
      const orgData = await DataService.getOrganization(organizationId);
      if (orgData) {
        setOrganization(orgData);
        console.log(`[OrganizationProvider] ✅ Organization loaded: ${orgData.name}`);
      } else {
        console.error(`[OrganizationProvider] 🚨 Failed to load organization: ${organizationId}`);
        setError('Failed to load organization');
      }
      
      // No sector info needed - using UniversalCategories
      setSectorInfo(null);
      console.log(`[OrganizationProvider] ✅ Using UniversalCategories system`);
      
      // 🔥 REMOVED: Category loading
      // Categories are now loaded directly by components using:
      // const categories = await DataService.getWarningCategories(organizationId);
      // This ensures universal categories are used everywhere
      
    } catch (error) {
      console.error('[OrganizationProvider] 🚨 Failed to load organization data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Function to allow manual refreshing from other components
  const refreshOrganization = async () => {
    await loadOrganizationData();
  };

  // 🎯 Function to initialize a sector
  const initializeSector = async (sectorId: string, userId: string) => {
    try {
      setLoading(true);
      await SectorService.initializeSectorCategories(organizationId, sectorId, userId);
      await loadOrganizationData(); // Reload all data after initialization
    } catch (error) {
      console.error('Failed to initialize sector:', error);
      throw error;
    }
  };

  // 🎯 useEffect hook to trigger the initial data load when the component mounts or orgId changes
  useEffect(() => {
    if (organizationId) {
      loadOrganizationData();
    } else {
      console.warn("[OrganizationProvider] No organizationId provided, skipping data load");
    }
  }, [organizationId]);

  // 🎯 UPDATED: Context value without category-related properties
  const value: OrganizationContextType = {
    organization,
    organizationId,
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