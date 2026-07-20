// PhaseGuidance.tsx - Contextual guidance box for each phase
// Thin wrapper around the shared InfoBanner; children pass through untouched
// (the wizard relies on a child span carrying id="wizard-v2-guidance" for aria-describedby).
import React from 'react';
import { InfoBanner } from '../../../common/InfoBanner';

interface PhaseGuidanceProps {
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
}

export const PhaseGuidance: React.FC<PhaseGuidanceProps> = ({
  children,
  variant = 'info'
}) => (
  <InfoBanner variant={variant}>{children}</InfoBanner>
);

export default PhaseGuidance;
