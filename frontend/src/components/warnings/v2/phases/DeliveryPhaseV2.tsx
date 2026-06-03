// frontend/src/components/warnings/v2/phases/DeliveryPhaseV2.tsx
//
// Thin wrapper around V1's DeliveryPhase. Behaviour is identical — this
// runs AFTER the warning has been written to Firestore (handleSaveWarning
// fires in the orchestrator at the end of Sign & Save). Delivery is purely
// a post-save action.

import React from 'react';
import { DeliveryPhase } from '../../enhanced/phases/DeliveryPhase';
import type { Employee } from '../wizardTypesV2';

type EmailDeliveryStatus =
  | 'idle'
  | 'generating_pdf'
  | 'uploading_pdf'
  | 'sending_email'
  | 'success'
  | 'failed';

interface DeliveryPhaseV2Props {
  selectedEmployee: Employee | undefined;
  selectedDeliveryMethod: string;
  setSelectedDeliveryMethod: (method: string) => void;
  finalWarningId: string;
  audioUploadWarning: boolean;
  evidenceUploadWarning: boolean;
  isEmailDelivering: boolean;
  emailDeliveryStatus: EmailDeliveryStatus;
  setEmailDeliveryStatus: (status: EmailDeliveryStatus) => void;
  emailDeliveryError: string | null;
  setEmailDeliveryError: (error: string | null) => void;
  useAlternativeEmail: boolean;
  setUseAlternativeEmail: (value: boolean) => void;
  alternativeEmail: string;
  setAlternativeEmail: (value: string) => void;
  isGeneratingQRPdf: boolean;
  handleQRCodeDelivery: () => void;
  handleEmailDelivery: () => void;
}

export const DeliveryPhaseV2: React.FC<DeliveryPhaseV2Props> = (props) => (
  <DeliveryPhase {...props} />
);
