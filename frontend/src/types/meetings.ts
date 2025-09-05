// frontend/src/types/meetings.ts
export interface HRMeetingRequest {
  id: string;
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  context: string; // max 80 characters
  managerSignature?: string;
  employeeSignature?: string;
  employeeConsent: boolean; // true if employee signed, false if declined/not signed
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  requestDate: Date;
  scheduledDate?: Date;
  scheduledTime?: string;
  hrNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}