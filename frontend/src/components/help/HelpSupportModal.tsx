// components/help/HelpSupportModal.tsx - Global Help & Support modal.
// Opened from the profile dropdown on every authenticated screen.
// Content is role-aware (config/roleContent), and the "How do I…" list is
// filtered by role, org feature toggles, and HOD permissions so users are
// never pointed at actions they can't see.

import React from 'react';
import { Mail, RotateCcw } from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
import { ExplainerPanel } from '../common/ExplainerPanel';
import { useAuth } from '../../auth/AuthContext';
import { useOrganizationSafe } from '../../contexts/OrganizationContext';
import { getRoleContent, type HelpRoleId } from '../../config/roleContent';
import { HELP_TASKS, SUPPORT_EMAIL } from '../../config/helpTasks';
import { isOrgFeatureEnabled } from '../../constants/orgFeatures';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowWelcome: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  onShowWelcome
}) => {
  const { user } = useAuth();
  const orgContext = useOrganizationSafe();
  const organization = orgContext?.organization || null;

  const roleId = (typeof user?.role === 'string' ? user.role : user?.role?.id) as HelpRoleId | undefined;
  if (!roleId) return null;

  const roleContent = getRoleContent(roleId, user?.hodPermissions);

  const visibleTasks = HELP_TASKS.filter(task => {
    if (!task.roles.includes(roleId)) return false;
    // Org feature toggles only apply to users inside an org context;
    // super-users/resellers browse without one.
    if (task.featureKey && organization && !isOrgFeatureEnabled(organization, task.featureKey)) {
      return false;
    }
    // HOD permission gates only apply to the manager roles
    if (
      task.hodPermission &&
      (roleId === 'hod-manager' || roleId === 'department-manager') &&
      user?.hodPermissions &&
      user.hodPermissions[task.hodPermission] === false
    ) {
      return false;
    }
    return true;
  });

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Help & Support"
      size="md"
    >
      <div className="p-6 space-y-6">
        {/* Quick start — role capabilities */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
            Your role: {roleContent.title}
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary, #4b5563)' }}>
            {roleContent.description}
          </p>
          <div className="space-y-2">
            {roleContent.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-text, #374151)' }}>
                <feature.icon
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: roleContent.primaryColor }}
                />
                <span>
                  <span className="font-medium">{feature.title}</span>
                  {' — '}
                  {feature.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How do I… */}
        {visibleTasks.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
              How do I…
            </h3>
            <div className="divide-y" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
              {visibleTasks.map(task => (
                <ExplainerPanel key={task.id} label={task.question}>
                  <ol className="list-decimal pl-4 space-y-1">
                    {task.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </ExplainerPanel>
              ))}
            </div>
          </div>
        )}

        {/* Support */}
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--color-surface-secondary, #f9fafb)' }}
        >
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text, #111827)' }}>
            Still stuck?
          </h3>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary, #4b5563)' }}>
            Email us and we'll help — include your organization name and what you were trying to do.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--color-primary, #2563eb)' }}
          >
            <Mail className="w-4 h-4" />
            {SUPPORT_EMAIL}
          </a>
        </div>

        {/* Re-show welcome */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
          <button
            type="button"
            onClick={onShowWelcome}
            className="inline-flex items-center gap-2 text-sm font-medium min-h-[44px]"
            style={{ color: 'var(--color-text-secondary, #6b7280)' }}
          >
            <RotateCcw className="w-4 h-4" />
            Show the welcome introduction again
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};

export default HelpSupportModal;
