// frontend/src/components/common/FeatureProtectedRoute.tsx
// Blocks direct URL access to routes whose per-organization feature is disabled.
// Super-users/resellers have no org context and are always allowed through.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganizationSafe } from '../../contexts/OrganizationContext';
import { isOrgFeatureEnabled, type OrgFeatureKey } from '../../constants/orgFeatures';

interface FeatureProtectedRouteProps {
  feature: OrgFeatureKey;
  children: React.ReactNode;
}

export const FeatureProtectedRoute: React.FC<FeatureProtectedRouteProps> = ({ feature, children }) => {
  const ctx = useOrganizationSafe();
  if (!ctx) return <>{children}</>;
  if (ctx.loading || !ctx.organization) return null;
  if (!isOrgFeatureEnabled(ctx.organization, feature)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
