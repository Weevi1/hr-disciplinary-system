// frontend/src/components/dashboard/FinalWarningsWatchList.tsx
// 🚨 REUSABLE FINAL WARNINGS WATCH LIST COMPONENT
// ✅ Shows employees with final written warnings requiring close monitoring
// ✅ Supports filtering by employee list (for HOD) or all employees (for HR/Business Owner)
// ✅ Mobile-optimized collapsible design

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { API } from '../../api';
import { NestedDataService } from '../../services/NestedDataService';
import { useNestedStructure, useCollectionGroup, useIndexes } from '../../config/features';
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import Logger from '../../utils/logger';

interface FinalWarningsWatchListProps {
  employees?: any[]; // Optional: If provided, filters to only these employees (for HOD). If not provided, shows all (for HR/Business Owner)
  className?: string;
}

export const FinalWarningsWatchList: React.FC<FinalWarningsWatchListProps> = ({
  employees,
  className = ''
}) => {
  const { organization } = useOrganization();
  const [finalWarningEmployees, setFinalWarningEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchFinalWarningEmployees = useCallback(async () => {
    if (!organization?.id || loading) return;

    setLoading(true);
    try {
      let warnings;

      if (useNestedStructure() && useIndexes()) {
        // Use index collection for fast final warnings lookup
        const indexEntries = await NestedDataService.getActiveWarningsIndex(organization.id, 100);
        warnings = indexEntries
          .filter(entry => entry.priority === 'high') // Final warnings are high priority
          .map(entry => ({
            ...entry.metadata,
            id: entry.id,
            employeeId: entry.employeeId,
            level: entry.metadata.level,
            employeeName: entry.metadata.employeeName
          }));
      } else if (useNestedStructure() && useCollectionGroup()) {
        // Use collection group query for organization-wide warnings
        const result = await NestedDataService.getOrganizationWarnings(
          organization.id,
          { level: 'final_written' },
          { pageSize: 100, orderField: 'issueDate', orderDirection: 'desc' }
        );
        warnings = result.warnings;
      } else {
        // Use original flat structure
        warnings = await API.warnings.getAll(organization.id);
      }

      // Filter for final written warnings
      let finalWarnings = warnings.filter((warning: any) => warning.level === 'final_written');

      // 🎯 FILTER BY EMPLOYEE LIST (if provided - for HOD managers)
      if (employees && employees.length > 0) {
        const managedEmployeeIds = new Set(employees.map(emp => emp.id));
        finalWarnings = finalWarnings.filter((warning: any) => managedEmployeeIds.has(warning.employeeId));
      }

      // Get employee details
      const allEmployees = await API.employees.getAll(organization.id);

      // Map each warning to include employee info
      const warningsWithEmployeeInfo = finalWarnings.map((warning: any) => {
        const employee = allEmployees.find(emp => emp.id === warning.employeeId);
        return {
          ...warning,
          employeeName: employee?.name || `${employee?.profile?.firstName || ''} ${employee?.profile?.lastName || ''}`.trim() || 'Unknown',
          employee: employee
        };
      });

      // Sort by most recent issue date
      warningsWithEmployeeInfo.sort((a, b) =>
        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      );

      setFinalWarningEmployees(warningsWithEmployeeInfo);
    } catch (error) {
      Logger.error('Failed to fetch final warning employees:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, employees]);

  // Fetch final warning employees when component mounts or dependencies change
  useEffect(() => {
    if (organization?.id) {
      fetchFinalWarningEmployees();
    }
  }, [organization?.id, fetchFinalWarningEmployees]);

  // Don't render if no final warnings
  if (!loading && finalWarningEmployees.length === 0) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <ThemedCard padding="md" className={className}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading final warnings watch list...</span>
        </div>
      </ThemedCard>
    );
  }

  return (
    <ThemedAlert variant="error" className={`border-2 ${className}`}>
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Final Warnings Watch List ({finalWarningEmployees.length})
          <ThemedBadge variant="error" size="sm" className="animate-pulse hidden sm:inline-block">
            MONITOR CLOSELY
          </ThemedBadge>
        </h4>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-alert-error-text)' }}
        />
      </div>

      {/* Expandable Content */}
      {expanded && (
        <>
          <div className="space-y-1.5 mt-3">
            {finalWarningEmployees.map((warning) => {
              // Handle Firestore Timestamp or Date object conversion for issue date
              let issueDate;
              if (warning.issueDate?.toDate) {
                issueDate = warning.issueDate.toDate();
              } else if (warning.issueDate?.seconds) {
                issueDate = new Date(warning.issueDate.seconds * 1000);
              } else {
                issueDate = new Date(warning.issueDate);
              }

              // Handle Firestore Timestamp or Date object conversion for expiry date
              let expiryDate;
              if (warning.expiryDate?.toDate) {
                expiryDate = warning.expiryDate.toDate();
              } else if (warning.expiryDate?.seconds) {
                expiryDate = new Date(warning.expiryDate.seconds * 1000);
              } else {
                expiryDate = new Date(warning.expiryDate);
              }

              const daysSince = Math.floor(
                (Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              const daysUntilExpiry = Math.floor(
                (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <ThemedCard
                  key={warning.id || `${warning.employeeId}-${warning.categoryId || warning.category}-${issueDate.getTime()}`}
                  padding="md"
                  className="border-2"
                  style={{ borderColor: 'var(--color-alert-error-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--color-alert-error-text)' }}>
                        {warning.employeeName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-alert-error-text)', opacity: 0.8 }}>
                        {warning.category} • {daysSince} days ago
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-alert-error-text)' }}>
                        ⚠️ Next offense requires HR intervention • Expires in {daysUntilExpiry} days
                      </div>
                    </div>
                  </div>
                </ThemedCard>
              );
            })}
          </div>
          <ThemedCard padding="sm" className="mt-3" style={{ backgroundColor: 'var(--color-alert-error-bg)', opacity: 0.7 }}>
            <div className="text-xs" style={{ color: 'var(--color-alert-error-text)' }}>
              💡 <strong>Tip:</strong> Monitor these employees closely. Any new offenses will trigger urgent HR intervention alerts.
            </div>
          </ThemedCard>
        </>
      )}
    </ThemedAlert>
  );
};
