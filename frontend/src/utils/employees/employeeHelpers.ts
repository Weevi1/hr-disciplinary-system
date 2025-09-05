// frontend/src/utils/employees/employeeHelpers.ts
import type { DeliveryMethod } from '../../types';

export const getDeliveryMethodIcon = (method: DeliveryMethod | undefined): string => {
  switch (method) {
    case 'email': return '📧';
    case 'whatsapp': return '📱';
    case 'printed': return '🖨️';
    default: return '📧';
  }
};

export const getDeliveryMethodText = (method: DeliveryMethod | undefined): string => {
  switch (method) {
    case 'email': return 'Email';
    case 'whatsapp': return 'WhatsApp';
    case 'printed': return 'Print';
    default: return 'Email';
  }
};
