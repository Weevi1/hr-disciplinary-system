// frontend/src/components/warnings/v2/phases/IncidentPhaseV2.tsx
//
// Thin wrapper around V1's IncidentDetailsForm. Behaviour is identical —
// V2 just renames the phase to "What Happened" to match the new 5-step
// framing.

import React from 'react';
import { Paperclip } from 'lucide-react';
import { IncidentDetailsForm } from '../../enhanced/steps/components/IncidentDetailsForm';
import type { FormData } from '../wizardTypesV2';
import type { EvidenceItem } from '@/types/warning';

interface IncidentPhaseV2Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  pendingEvidenceItems: EvidenceItem[];
  setPendingEvidenceItems: React.Dispatch<React.SetStateAction<EvidenceItem[]>>;
}

export const IncidentPhaseV2: React.FC<IncidentPhaseV2Props> = ({
  formData,
  setFormData,
  pendingEvidenceItems,
  setPendingEvidenceItems,
}) => (
  <div className="space-y-4">
    {/* Upfront: evidence is optional. The EvidenceUploader at the bottom of
        IncidentDetailsForm also carries an "Optional" badge — this hint sets
        the expectation before the manager scrolls down to it. */}
    <div
      className="flex items-start gap-2 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-alert-info-bg)' }}
    >
      <Paperclip
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        style={{ color: 'var(--color-alert-info-text)' }}
      />
      <p className="text-xs" style={{ color: 'var(--color-alert-info-text)' }}>
        <strong>Evidence is optional.</strong> Date, time, location, and a clear description are
        required. Photos or documents help support the warning but aren't needed to proceed.
      </p>
    </div>

    <IncidentDetailsForm
      formData={formData}
      onFormDataChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
      evidenceItems={pendingEvidenceItems}
      onEvidenceAdd={(item) => setPendingEvidenceItems((prev) => [...prev, item])}
      onEvidenceRemove={(id) => setPendingEvidenceItems((prev) => prev.filter((i) => i.id !== id))}
    />
  </div>
);
