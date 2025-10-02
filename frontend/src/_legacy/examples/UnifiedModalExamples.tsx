// frontend/src/components/common/UnifiedModalExamples.tsx
// 🎯 EXAMPLES: How to unify all 5 dashboard components using UnifiedModal
// ✅ Shows consistent patterns for Warning, HR Meeting, Absence, Counselling, Team Members
// 🎨 Demonstrates step-based workflows, forms, and data management in unified system

import React, { useState } from 'react';
import { AlertTriangle, MessageCircle, UserX, BookOpen, Users, Calendar, FileText } from 'lucide-react';
import { UnifiedModal } from './UnifiedModal';
import { ThemedButton } from './ThemedButton';
import { ThemedCard } from './ThemedCard';

// ==============================================
// 1. ISSUE WARNING - Multi-step modal workflow
// ==============================================

interface UnifiedWarningWizardProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  categories: any[];
}

const UnifiedWarningWizard: React.FC<UnifiedWarningWizardProps> = ({
  isOpen,
  onClose,
  employees,
  categories
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const stepTitles = [
    'Select Employee & Category',
    'Document Evidence',
    'Legal Review & Signatures',
    'Delivery Options'
  ];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedEmployee && selectedCategory;
      case 2: return true; // Form validation would go here
      case 3: return true; // Signature validation
      case 4: return true;
      default: return false;
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Warning"
      subtitle={`Step ${currentStep} of 4: ${stepTitles[currentStep - 1]}`}
      size="xl"
      currentStep={currentStep}
      totalSteps={4}
      stepTitles={stepTitles}
      showStepProgress
      showBackButton={currentStep > 1}
      onBack={handleBack}
      primaryAction={{
        label: currentStep === 4 ? 'Complete Warning' : 'Continue',
        onClick: currentStep === 4 ? onClose : handleNext,
        disabled: !canProceed()
      }}
      secondaryAction={
        currentStep === 1
          ? { label: 'Cancel', onClick: onClose }
          : undefined
      }
    >
      <div className="p-4 sm:p-6">
        {/* Step content would go here */}
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          Warning Wizard Step {currentStep} Content
          <br />
          <small>Enhanced mobile-optimized wizard with audio recording, etc.</small>
        </div>
      </div>
    </UnifiedModal>
  );
};

// ==============================================
// 2. BOOK HR MEETING - Single modal form
// ==============================================

interface UnifiedBookHRMeetingProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedBookHRMeeting: React.FC<UnifiedBookHRMeetingProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    meetingType: '',
    urgency: 'normal',
    description: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    onClose();
  };

  const isFormValid = formData.employeeId && formData.meetingType && formData.description.length >= 10;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Book HR Meeting"
      subtitle="Schedule intervention meeting with HR"
      size="md"
      primaryAction={{
        label: 'Book Meeting',
        onClick: handleSubmit,
        disabled: !isFormValid,
        loading
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose
      }}
    >
      <div className="p-4 sm:p-6 space-y-6">
        <ThemedCard padding="md">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Meeting Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Employee
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border)' }}
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              >
                <option value="">Select employee...</option>
                <option value="emp1">John Smith - Developer</option>
                <option value="emp2">Jane Doe - Designer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Meeting Type
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border)' }}
                value={formData.meetingType}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingType: e.target.value }))}
              >
                <option value="">Select type...</option>
                <option value="disciplinary">Disciplinary Hearing</option>
                <option value="support">Employee Support</option>
                <option value="grievance">Grievance Resolution</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border)' }}
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the situation and reason for HR intervention..."
              />
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {formData.description.length}/500 characters (minimum 10)
              </div>
            </div>
          </div>
        </ThemedCard>
      </div>
    </UnifiedModal>
  );
};

// ==============================================
// 3. REPORT ABSENCE - Single modal form
// ==============================================

interface UnifiedReportAbsenceProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedReportAbsence: React.FC<UnifiedReportAbsenceProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Employee Absence"
      subtitle="Document unscheduled absence"
      size="md"
      primaryAction={{
        label: 'Submit Report',
        onClick: onClose,
        disabled: !formData.employeeId || !formData.startDate || !formData.reason
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose
      }}
    >
      <div className="p-4 sm:p-6">
        <ThemedCard padding="md">
          <div className="flex items-center gap-3 mb-4">
            <UserX className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Absence Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Employee
              </label>
              <select className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                <option value="">Select employee...</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  End Date (if known)
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Reason for Absence
              </label>
              <select className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                <option value="">Select reason...</option>
                <option value="unauthorized">Unauthorized Absence</option>
                <option value="late">Excessive Tardiness</option>
                <option value="no-call">No Call/No Show</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </ThemedCard>
      </div>
    </UnifiedModal>
  );
};

// ==============================================
// 4. COUNSELLING - Single modal form
// ==============================================

interface UnifiedCounsellingProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedCounselling: React.FC<UnifiedCounsellingProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Corrective Counselling Session"
      subtitle="Document training, coaching, and discussions"
      size="lg"
      primaryAction={{
        label: 'Continue to Signatures',
        onClick: () => {}
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose
      }}
    >
      <div className="p-4 sm:p-6">
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          Counselling form content would go here
          <br />
          <small>Employee selection, counselling type, intervention details, etc.</small>
        </div>
      </div>
    </UnifiedModal>
  );
};

// ==============================================
// 5. TEAM MEMBERS - Data management modal
// ==============================================

interface UnifiedTeamMembersProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedTeamMembers: React.FC<UnifiedTeamMembersProps> = ({
  isOpen,
  onClose
}) => {
  const [view, setView] = useState<'list' | 'add'>('list');

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Management"
      subtitle={view === 'list' ? 'Manage your team members' : 'Add new team member'}
      size="xl"
      showBackButton={view === 'add'}
      onBack={() => setView('list')}
      primaryAction={
        view === 'add'
          ? {
              label: 'Add Employee',
              onClick: () => setView('list')
            }
          : undefined
      }
      secondaryAction={
        view === 'add'
          ? {
              label: 'Cancel',
              onClick: () => setView('list')
            }
          : {
              label: 'Close',
              onClick: onClose
            }
      }
    >
      <div className="p-4 sm:p-6">
        {view === 'list' ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                Team Members (12)
              </h3>
              <ThemedButton onClick={() => setView('add')}>
                Add Member
              </ThemedButton>
            </div>
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              Employee list/table would go here
            </div>
          </div>
        ) : (
          <div>
            <ThemedCard padding="md">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                New Employee Information
              </h3>
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Employee form fields would go here
              </div>
            </ThemedCard>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};

// ==============================================
// DASHBOARD INTEGRATION EXAMPLE
// ==============================================

export const UnifiedDashboardModals: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const tools = [
    {
      id: 'warning',
      title: 'Issue Warning',
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      component: UnifiedWarningWizard
    },
    {
      id: 'hr-meeting',
      title: 'HR Meeting',
      icon: MessageCircle,
      color: 'var(--color-accent)',
      component: UnifiedBookHRMeeting
    },
    {
      id: 'absence',
      title: 'Report Absence',
      icon: UserX,
      color: 'var(--color-error)',
      component: UnifiedReportAbsence
    },
    {
      id: 'counselling',
      title: 'Counselling',
      icon: BookOpen,
      color: 'var(--color-info)',
      component: UnifiedCounselling
    },
    {
      id: 'team',
      title: 'Team Members',
      icon: Users,
      color: 'var(--color-success)',
      component: UnifiedTeamMembers
    }
  ];

  return (
    <div>
      {/* Dashboard tool grid - now ALL launch modals consistently */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tools.map((tool) => (
          <ThemedButton
            key={tool.id}
            onClick={() => setActiveModal(tool.id)}
            className="h-20 flex-col gap-2"
            style={{ backgroundColor: tool.color }}
          >
            <tool.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tool.title}</span>
          </ThemedButton>
        ))}
      </div>

      {/* Unified modals - consistent UX for all */}
      {activeModal === 'warning' && (
        <UnifiedWarningWizard
          isOpen={true}
          onClose={() => setActiveModal(null)}
          employees={[]}
          categories={[]}
        />
      )}

      {activeModal === 'hr-meeting' && (
        <UnifiedBookHRMeeting
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'absence' && (
        <UnifiedReportAbsence
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'counselling' && (
        <UnifiedCounselling
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'team' && (
        <UnifiedTeamMembers
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export {
  UnifiedWarningWizard,
  UnifiedBookHRMeeting,
  UnifiedReportAbsence,
  UnifiedCounselling,
  UnifiedTeamMembers
};