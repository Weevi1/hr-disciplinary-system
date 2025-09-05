// frontend/src/types/absences.ts  
export interface AbsenceReport {
  id: string;
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  absenceDate: Date;
  absenceType: 'full-day' | 'half-day' | 'late-arrival' | 'early-departure' | 'sick-leave' | 'personal-leave';
  reason?: string; // optional brief reason
  reportedDate: Date;
  payrollImpact: boolean; // calculated based on absence type
  hrReviewed: boolean;
  hrNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}