// frontend/src/hooks/useOrgFeature.ts
// Read a per-organization feature toggle from the org context.
// Safe outside OrganizationProvider (super-user/reseller shells): returns true there.

import { useOrganizationSafe } from '../contexts/OrganizationContext';
import { isOrgFeatureEnabled, type OrgFeatureKey } from '../constants/orgFeatures';

export function useOrgFeature(key: OrgFeatureKey): boolean {
  const ctx = useOrganizationSafe();
  return isOrgFeatureEnabled(ctx?.organization, key);
}
