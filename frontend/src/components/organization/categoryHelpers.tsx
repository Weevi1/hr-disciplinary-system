// frontend/src/components/organization/categoryHelpers.tsx
//
// Pure helpers for warning-category rendering. Extracted from
// OrganizationCategoriesViewer in Phase 2 Tier 3D step 4. `.tsx` because
// `getSeverityIcon` returns JSX.

import React from 'react';
import { Shield, AlertTriangle, X, FileText } from 'lucide-react';
import { getLevelLabel } from '../../services/UniversalCategories';

/** Map a severity tag to a hex colour (green = minor, amber = serious, red = gross_misconduct, gray = unknown). */
export const getSeverityColor = (severity?: string): string => {
  switch (severity) {
    case 'minor':
    case 'low':
      return '#10b981'; // green
    case 'serious':
    case 'medium':
      return '#f59e0b'; // amber
    case 'gross_misconduct':
    case 'high':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

/** Icon component for a severity tag — paired with {@link getSeverityColor}. */
export const getSeverityIcon = (severity?: string): React.ReactElement => {
  switch (severity) {
    case 'minor':
    case 'low':
      return <Shield className="h-4 w-4" />;
    case 'serious':
    case 'medium':
      return <AlertTriangle className="h-4 w-4" />;
    case 'gross_misconduct':
    case 'high':
      return <X className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

/** Format an escalation path array as "Verbal → First Written → Final Written". */
export const formatEscalationPath = (path?: string[]): string => {
  if (!path || path.length === 0) return 'No escalation path defined';
  return path.map((level) => getLevelLabel(level)).join(' → ');
};
