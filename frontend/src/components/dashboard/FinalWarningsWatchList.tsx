// frontend/src/components/dashboard/FinalWarningsWatchList.tsx
// 🚨 REUSABLE FINAL WARNINGS WATCH LIST COMPONENT
// ✅ Shows employees with final written warnings requiring close monitoring
// ✅ Supports filtering by employee list (for HOD) or all employees (for HR/Executive Management)
// ✅ Mobile-optimized collapsible design

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ChevronDown, Shield } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { API } from '../../api';
import { NestedDataService } from '../../services/NestedDataService';
import { useNestedStructure, useCollectionGroup, useIndexes } from '../../config/features';
import Logger from '../../utils/logger';

interface FinalWarningsWatchListProps {
  employees?: any[]; // Optional: If provided, filters to only these employees (for HOD). If not provided, shows all (for HR/Executive Management)
  warnings?: any[]; // Optional: Preloaded warnings from useDashboardData. Skips independent fetch when provided.
  className?: string;
}

export const FinalWarningsWatchList: React.FC<FinalWarningsWatchListProps> = ({
  employees,
  warnings: preloadedWarnings,
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

      // 🚀 OPTIMIZATION: Use preloaded warnings from useDashboardData when available
      if (preloadedWarnings && preloadedWarnings.length > 0) {
        warnings = preloadedWarnings;
      } else if (useNestedStructure() && useIndexes()) {
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
      } else if (!preloadedWarnings) {
        // Fallback: Use original flat structure fetch only if no preloaded data
        warnings = await API.warnings.getAll(organization.id);
      } else {
        // preloadedWarnings was provided but empty — no warnings exist
        warnings = [];
      }

      // Filter for final written warnings
      let finalWarnings = warnings.filter((warning: any) => warning.level === 'final_written');

      // 🎯 FILTER BY EMPLOYEE LIST (if provided - for HOD managers)
      if (employees && employees.length > 0) {
        const managedEmployeeIds = new Set(employees.map(emp => emp.id));
        finalWarnings = finalWarnings.filter((warning: any) => managedEmployeeIds.has(warning.employeeId));
      }

      // 🚀 OPTIMIZATION: Use employees prop for employee details when available, skip independent fetch
      const allEmployees = employees && employees.length > 0
        ? employees
        : await API.employees.getAll(organization.id);

      // Map each warning to include employee info
      const warningsWithEmployeeInfo = finalWarnings.map((warning: any) => {
        const employee = allEmployees.find((emp: any) => emp.id === warning.employeeId);
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
  }, [organization?.id, employees, preloadedWarnings]);

  // Fetch/process final warning employees when component mounts or data changes
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
      <div
        className={className}
        style={{
          backgroundColor: 'var(--color-card-background)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '16px'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--color-error)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading watch list...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--dash-card-general, var(--color-card-background))',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left transition-colors"
        style={{
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--color-border)' : 'none'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239,68,68,0.1)'
              }}
            >
              <Shield className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Final Warnings Watch List
                </span>
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    lineHeight: '1.4'
                  }}
                >
                  {finalWarningEmployees.length}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Employees requiring close monitoring
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </div>
      </button>

      {/* Expandable Content */}
      {expanded && (
        <div style={{ padding: '12px 16px 16px' }}>
          <div className="space-y-2">
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

              const isUrgent = daysUntilExpiry <= 30;

              return (
                <div
                  key={warning.id || `${warning.employeeId}-${warning.categoryId || warning.category}-${issueDate.getTime()}`}
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.04)',
                    borderRadius: '10px',
                    padding: '12px',
                    borderLeft: '3px solid #ef4444'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                          {warning.employeeName}
                        </span>
                        {isUrgent && (
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                        )}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {warning.category} · Issued {daysSince} days ago
                      </div>
                    </div>
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        backgroundColor: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(0,0,0,0.05)',
                        color: isUrgent ? '#ef4444' : 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {daysUntilExpiry > 0 ? `${daysUntilExpiry}d left` : 'Expired'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div
            className="flex items-start gap-2 mt-3"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239,68,68,0.04)'
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Any new offenses by these employees will require formal HR intervention.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
