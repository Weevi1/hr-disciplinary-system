// frontend/src/components/dashboard/UnifiedHODDashboardSection.tsx
// 🚀 UNIFIED HOD DASHBOARD - Demonstrates cohesive UX across all dashboard actions
// ✅ ALL 5 components now launch as consistent modals (no more navigation fragmentation)
// 🎨 Uses CSS variables, ThemedButton, organization branding consistently
// 📱 Mobile-first design with Samsung S8+ compatibility

import React, { useState } from 'react';
import {
  AlertTriangle,
  MessageCircle,
  UserX,
  BookOpen,
  Users,
  Mic,
  Calendar,
  RefreshCw
} from 'lucide-react';

// Import unified modal system
import { UnifiedModal } from '../common/UnifiedModal';
import { ThemedButton } from '../common/ThemedButton';
import { ThemedCard } from '../common/ThemedCard';
import { ThemedBadge } from '../common/ThemedCard';
import { ThemedAlert } from '../common/ThemedCard';

// Import existing hooks (would work with current system)
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';

interface UnifiedHODDashboardSectionProps {
  className?: string;
}

export const UnifiedHODDashboardSection: React.FC<UnifiedHODDashboardSectionProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { canCreateWarnings, canManageEmployees } = useMultiRolePermissions();

  // Data from unified dashboard hook (existing)
  const {
    categories,
    employees,
    followUps: dueFollowUps,
    loading: dashboardLoading,
    isReady,
    refreshData
  } = useDashboardData({ role: 'hod' });

  // Modal state - now ALL components are modals for consistency
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Follow-up counts (existing logic)
  const followUpCounts = {
    total: dueFollowUps?.length || 0,
    overdue: dueFollowUps?.filter((f: any) => new Date(f.dueDate) < new Date()).length || 0,
    due: dueFollowUps?.filter((f: any) => {
      const dueDate = new Date(f.dueDate);
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= threeDaysFromNow;
    }).length || 0
  };

  // Unified tool actions - now ALL launch modals consistently
  const toolActions = [
    {
      id: 'create-warning',
      title: 'Issue Warning',
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      enabled: canCreateWarnings(),
      hasAudioRecording: true,
      description: 'Document disciplinary warnings with audio evidence'
    },
    {
      id: 'book-hr-meeting',
      title: 'HR Meeting',
      icon: MessageCircle,
      color: 'var(--color-accent)',
      enabled: true,
      hasAudioRecording: false,
      description: 'Schedule intervention meeting with HR'
    },
    {
      id: 'report-absence',
      title: 'Report Absence',
      icon: UserX,
      color: 'var(--color-error)',
      enabled: true,
      hasAudioRecording: false,
      description: 'Document unscheduled employee absence'
    },
    {
      id: 'corrective-counselling',
      title: 'Counselling',
      icon: BookOpen,
      color: 'var(--color-info)',
      enabled: true,
      hasAudioRecording: false,
      description: 'Document training and coaching sessions'
    },
    {
      id: 'team-management',
      title: 'Team Members',
      icon: Users,
      color: 'var(--color-success)',
      enabled: canManageEmployees(),
      hasAudioRecording: false,
      description: 'Manage your team members'
    }
  ].filter(action => action.enabled);

  const handleToolAction = (toolId: string) => {
    if (!isReady && toolId === 'create-warning') {
      // Ensure data is ready for warning creation
      console.log('⏳ Data not ready for warning creation');
      return;
    }
    setActiveModal(toolId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Section Header with consistent branding */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              HOD Dashboard
            </h3>
            <div className="hidden sm:block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Department management tools
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemedButton
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={dashboardLoading.overall}
            >
              <RefreshCw className={`w-4 h-4 ${dashboardLoading.overall ? 'animate-spin' : ''}`} />
            </ThemedButton>
            <ThemedBadge variant="primary" size="sm" className="hidden sm:block">
              Head of Department
            </ThemedBadge>
          </div>
        </div>

        {/* Audio Recording Notice - consistent theming */}
        {canCreateWarnings() && (
          <ThemedAlert variant="info" className="mb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-medium">Warning processes include audio recording</span>
              <span className="text-xs opacity-75 hidden sm:inline">(consent required)</span>
            </div>
          </ThemedAlert>
        )}

        {/* Unified Tool Grid - consistent styling using CSS variables */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {toolActions.map((tool) => (
            <ThemedCard
              key={tool.id}
              hover
              padding="sm"
              className="cursor-pointer transition-all duration-200"
              onClick={() => handleToolAction(tool.id)}
              style={{
                backgroundColor: tool.color,
                color: 'var(--color-text-inverse)',
                minHeight: '88px',
                opacity: dashboardLoading.overall && tool.id === 'create-warning' ? 0.6 : 1
              }}
            >
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="flex items-center gap-1">
                  <tool.icon className="w-5 h-5" />
                  {tool.hasAudioRecording && <Mic className="w-3 h-3 opacity-70" />}
                </div>
                <span className="font-medium text-xs leading-tight">{tool.title}</span>
                {dashboardLoading.overall && tool.id === 'create-warning' && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                )}
              </div>
            </ThemedCard>
          ))}
        </div>

        {/* Follow-ups Section - consistent theming */}
        {followUpCounts.total > 0 && (
          <ThemedCard padding="sm">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--color-text)' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
              Follow-ups Due ({followUpCounts.due})
            </h4>
            <div className="space-y-1">
              {dueFollowUps.slice(0, 3).map((session: any) => (
                <ThemedButton
                  key={session.id}
                  variant="ghost"
                  className="w-full text-left p-2 text-sm"
                >
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {session.employeeName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {session.sessionType}
                  </div>
                </ThemedButton>
              ))}
            </div>
          </ThemedCard>
        )}

        {/* Team Overview - consistent styling */}
        <ThemedCard padding="sm">
          <ThemedButton
            variant="ghost"
            onClick={() => handleToolAction('team-management')}
            className="w-full flex items-center justify-between p-3"
            style={{
              backgroundColor: 'var(--color-success)',
              color: 'var(--color-text-inverse)',
              minHeight: '56px'
            }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">Team Members</span>
            </div>
            <span className="text-xl font-bold">
              {dashboardLoading.employees ? (
                <div className="animate-pulse h-6 w-8 rounded" style={{ backgroundColor: 'var(--color-success-light)' }}></div>
              ) : (
                employees.length
              )}
            </span>
          </ThemedButton>
        </ThemedCard>
      </div>

      {/* ==============================================
          UNIFIED MODALS - All components now consistent
          ============================================== */}

      {/* 1. Warning Wizard Modal */}
      {activeModal === 'create-warning' && (
        <UnifiedModal
          isOpen={true}
          onClose={closeModal}
          title="Issue Warning"
          subtitle="Multi-step disciplinary warning process"
          size="xl"
          currentStep={1}
          totalSteps={4}
          stepTitles={['Employee & Category', 'Evidence & Details', 'Legal Review', 'Delivery Options']}
          showStepProgress
          primaryAction={{
            label: 'Continue',
            onClick: () => {},
            disabled: !isReady
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeModal
          }}
        >
          <div className="p-4 sm:p-6">
            <ThemedAlert variant="info" className="mb-4">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span className="text-sm">Audio recording will be required for this warning process</span>
              </div>
            </ThemedAlert>

            <ThemedCard padding="md">
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Enhanced Warning Wizard Content
                <br />
                <small>Employee selection, category selection, evidence documentation, etc.</small>
              </div>
            </ThemedCard>
          </div>
        </UnifiedModal>
      )}

      {/* 2. HR Meeting Modal */}
      {activeModal === 'book-hr-meeting' && (
        <UnifiedModal
          isOpen={true}
          onClose={closeModal}
          title="Book HR Meeting"
          subtitle="Schedule intervention meeting with HR"
          size="md"
          primaryAction={{
            label: 'Book Meeting',
            onClick: closeModal
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeModal
          }}
        >
          <div className="p-4 sm:p-6 space-y-4">
            <ThemedCard padding="md">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Meeting Details
                </h3>
              </div>
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                HR Meeting Form Content
                <br />
                <small>Employee selection, meeting type, urgency, description, etc.</small>
              </div>
            </ThemedCard>
          </div>
        </UnifiedModal>
      )}

      {/* 3. Report Absence Modal */}
      {activeModal === 'report-absence' && (
        <UnifiedModal
          isOpen={true}
          onClose={closeModal}
          title="Report Employee Absence"
          subtitle="Document unscheduled absence"
          size="md"
          primaryAction={{
            label: 'Submit Report',
            onClick: closeModal
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeModal
          }}
        >
          <div className="p-4 sm:p-6">
            <ThemedCard padding="md">
              <div className="flex items-center gap-3 mb-4">
                <UserX className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Absence Details
                </h3>
              </div>
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Absence Report Form Content
                <br />
                <small>Employee selection, dates, reason, documentation, etc.</small>
              </div>
            </ThemedCard>
          </div>
        </UnifiedModal>
      )}

      {/* 4. Counselling Modal */}
      {activeModal === 'corrective-counselling' && (
        <UnifiedModal
          isOpen={true}
          onClose={closeModal}
          title="Corrective Counselling Session"
          subtitle="Document training, coaching, and discussions"
          size="lg"
          primaryAction={{
            label: 'Continue to Signatures',
            onClick: () => {}
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeModal
          }}
        >
          <div className="p-4 sm:p-6">
            <ThemedCard padding="md">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Counselling Session
                </h3>
              </div>
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Counselling Form Content
                <br />
                <small>Employee selection, counselling type, intervention details, signatures, etc.</small>
              </div>
            </ThemedCard>
          </div>
        </UnifiedModal>
      )}

      {/* 5. Team Management Modal */}
      {activeModal === 'team-management' && (
        <UnifiedModal
          isOpen={true}
          onClose={closeModal}
          title="Team Management"
          subtitle={`Manage your team members (${employees.length} total)`}
          size="xl"
          customFooter={
            <div className="flex gap-3">
              <ThemedButton variant="outline" onClick={closeModal}>
                Close
              </ThemedButton>
              <ThemedButton onClick={() => {}}>
                Add Employee
              </ThemedButton>
            </div>
          }
        >
          <div className="p-4 sm:p-6">
            <ThemedCard padding="md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    Team Overview
                  </h3>
                </div>
                <ThemedBadge variant="success">
                  {employees.length} members
                </ThemedBadge>
              </div>
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Employee Management Content
                <br />
                <small>Employee list, search, filters, add/edit forms, etc.</small>
              </div>
            </ThemedCard>
          </div>
        </UnifiedModal>
      )}
    </>
  );
};

export default UnifiedHODDashboardSection;