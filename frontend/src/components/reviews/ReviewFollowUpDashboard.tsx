// frontend/src/components/reviews/ReviewFollowUpDashboard.tsx
// Dashboard for HR managers to manage corrective action reviews

import React, { useState, useMemo, Suspense } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  Filter,
  TrendingUp,
  Building2
} from 'lucide-react';
import { useReviewFollowUps, type WarningWithReview } from '../../hooks/useReviewFollowUps';
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import ThemedTabNavigation from '../common/ThemedTabNavigation';
import { ReviewFollowUpModal } from './ReviewFollowUpModal';

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-3">
      <div className="h-24 bg-gray-200 rounded"></div>
      <div className="h-24 bg-gray-200 rounded"></div>
      <div className="h-24 bg-gray-200 rounded"></div>
    </div>
  </div>
);

type TabId = 'due-soon' | 'overdue' | 'completed';

export const ReviewFollowUpDashboard: React.FC = () => {
  const {
    warnings,
    dueSoon,
    overdue,
    completed,
    loading,
    error,
    refresh,
    updateReview
  } = useReviewFollowUps();

  const [activeTab, setActiveTab] = useState<TabId>('due-soon');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [warningLevelFilter, setWarningLevelFilter] = useState('');
  const [selectedWarning, setSelectedWarning] = useState<WarningWithReview | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      dueThisWeek: dueSoon.filter(w => {
        if (!w.reviewDate) return false;
        const reviewDate = w.reviewDate.toDate ? w.reviewDate.toDate() : new Date(w.reviewDate);
        return reviewDate >= startOfWeek;
      }).length,
      overdue: overdue.length,
      autoSatisfiedThisMonth: completed.filter(w => {
        if (!w.reviewedAt && w.reviewStatus === 'auto-satisfied') {
          // Estimate auto-satisfaction date based on review date + 7 days
          if (!w.reviewDate) return false;
          const reviewDate = w.reviewDate.toDate ? w.reviewDate.toDate() : new Date(w.reviewDate);
          const autoSatisfiedDate = new Date(reviewDate);
          autoSatisfiedDate.setDate(autoSatisfiedDate.getDate() + 7);
          return autoSatisfiedDate >= startOfMonth;
        }
        return false;
      }).length,
      completedThisMonth: completed.filter(w => {
        if (!w.reviewedAt) return false;
        const reviewedDate = w.reviewedAt instanceof Date ? w.reviewedAt : new Date(w.reviewedAt);
        return reviewedDate >= startOfMonth;
      }).length
    };
  }, [dueSoon, overdue, completed]);

  // Extract unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    warnings.forEach(w => {
      if (w.employee?.department) {
        depts.add(w.employee.department);
      }
    });
    return Array.from(depts).sort();
  }, [warnings]);

  // Filter warnings based on search and filters
  const filteredWarnings = useMemo(() => {
    let filtered: WarningWithReview[];

    switch (activeTab) {
      case 'due-soon':
        filtered = dueSoon;
        break;
      case 'overdue':
        filtered = overdue;
        break;
      case 'completed':
        filtered = completed;
        break;
      default:
        filtered = [];
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w =>
        w.employee?.firstName?.toLowerCase().includes(query) ||
        w.employee?.lastName?.toLowerCase().includes(query) ||
        w.employee?.employeeNumber?.toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(w => w.employee?.department === departmentFilter);
    }

    // Apply warning level filter
    if (warningLevelFilter) {
      filtered = filtered.filter(w => w.level === warningLevelFilter);
    }

    // Sort by review date (closest first)
    return filtered.sort((a, b) => {
      if (!a.reviewDate || !b.reviewDate) return 0;
      const dateA = a.reviewDate.toDate ? a.reviewDate.toDate() : new Date(a.reviewDate);
      const dateB = b.reviewDate.toDate ? b.reviewDate.toDate() : new Date(b.reviewDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [activeTab, dueSoon, overdue, completed, searchQuery, departmentFilter, warningLevelFilter]);

  const handleReviewClick = (warning: WarningWithReview) => {
    setSelectedWarning(warning);
    setShowReviewModal(true);
  };

  const handleReviewComplete = async (warningId: string, reviewData: any) => {
    await updateReview(warningId, reviewData);
    setShowReviewModal(false);
    setSelectedWarning(null);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      counselling: 'Counselling',
      verbal: 'Verbal Warning',
      first_written: 'Written Warning',
      second_written: 'Second Written Warning',
      final_written: 'Final Warning',
      suspension: 'Suspension',
      dismissal: 'Ending of Service'
    };
    return labels[level] || level;
  };

  const getStatusBadge = (warning: WarningWithReview) => {
    switch (warning.reviewStatus) {
      case 'overdue':
        return <ThemedBadge variant="error">Overdue</ThemedBadge>;
      case 'auto-satisfied':
        return <ThemedBadge variant="success">Auto-Satisfied</ThemedBadge>;
      case 'completed':
        return <ThemedBadge variant="success">Completed</ThemedBadge>;
      default:
        if (warning.daysUntilReview !== undefined && warning.daysUntilReview <= 3) {
          return <ThemedBadge variant="warning">Due Soon</ThemedBadge>;
        }
        return <ThemedBadge variant="default">Pending</ThemedBadge>;
    }
  };

  const tabs = [
    {
      id: 'due-soon',
      label: 'Due Soon',
      icon: <Clock className="w-4 h-4" />,
      count: dueSoon.length
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: <AlertTriangle className="w-4 h-4" />,
      count: overdue.length
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="w-4 h-4" />,
      count: completed.length
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Corrective Action Reviews
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage follow-up reviews for employees with improvement commitments
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ThemedCard padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Due This Week
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {metrics.dueThisWeek}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Overdue
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-error)' }}>
                {metrics.overdue}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-alert-error-bg)' }}>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Auto-Satisfied (Month)
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {metrics.autoSatisfiedThisMonth}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Completed (Month)
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {metrics.completedThisMonth}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Error Alert */}
      {error && (
        <ThemedAlert variant="error" onClose={() => {}}>
          {error}
        </ThemedAlert>
      )}

      {/* Filters */}
      <ThemedCard padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)'
              }}
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm appearance-none"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Warning Level Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <select
              value={warningLevelFilter}
              onChange={(e) => setWarningLevelFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm appearance-none"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">All Levels</option>
              <option value="verbal">Verbal Warning</option>
              <option value="first_written">Written Warning</option>
              <option value="second_written">Second Written Warning</option>
              <option value="final_written">Final Warning</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || departmentFilter || warningLevelFilter) && (
            <ThemedButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('');
                setWarningLevelFilter('');
              }}
            >
              Clear Filters
            </ThemedButton>
          )}
        </div>
      </ThemedCard>

      {/* Tabs */}
      <ThemedTabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Warning Cards */}
      <div className="space-y-3">
        {filteredWarnings.length === 0 ? (
          <ThemedCard padding="lg">
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                No reviews {activeTab === 'due-soon' ? 'due soon' : activeTab === 'overdue' ? 'overdue' : 'completed'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {activeTab === 'completed' ? 'Completed reviews will appear here' : 'All caught up!'}
              </p>
            </div>
          </ThemedCard>
        ) : (
          filteredWarnings.map(warning => (
            <ThemedCard key={warning.id} padding="md" hover onClick={() => handleReviewClick(warning)}>
              <div className="flex items-start gap-4">
                {/* Employee Photo */}
                {warning.employee?.photoUrl ? (
                  <img
                    src={warning.employee.photoUrl}
                    alt={`${warning.employee.firstName} ${warning.employee.lastName}`}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-background-secondary)' }}
                  >
                    <User className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                )}

                {/* Warning Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {warning.employee?.firstName} {warning.employee?.lastName}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {warning.employee?.position} • {warning.employee?.department}
                      </p>
                    </div>
                    {getStatusBadge(warning)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Warning Level:</span>
                      <p className="font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>
                        {getLevelLabel(warning.level)}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Category:</span>
                      <p className="font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>
                        {warning.category || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Issue Date:</span>
                      <p className="font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>
                        {formatDate(warning.issueDate)}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Review Date:</span>
                      <p className="font-medium mt-0.5" style={{ color: warning.reviewStatus === 'overdue' ? 'var(--color-error)' : 'var(--color-text)' }}>
                        {formatDate(warning.reviewDate)}
                        {warning.daysUntilReview !== undefined && warning.daysUntilReview >= 0 && (
                          <span className="ml-1">({warning.daysUntilReview}d)</span>
                        )}
                        {warning.daysSinceReview !== undefined && (
                          <span className="ml-1">({warning.daysSinceReview}d ago)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Improvement Commitments Preview */}
                  {warning.improvementCommitments && warning.improvementCommitments.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Improvement Commitments:
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text)' }}>
                        {warning.improvementCommitments[0].commitment}
                        {warning.improvementCommitments.length > 1 && (
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {' '}+{warning.improvementCommitments.length - 1} more
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Auto-Satisfied Indicator */}
                  {warning.reviewStatus === 'auto-satisfied' && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          Auto-satisfied on {formatDate(warning.reviewDate && new Date(warning.reviewDate.toDate ? warning.reviewDate.toDate() : warning.reviewDate).setDate(new Date(warning.reviewDate.toDate ? warning.reviewDate.toDate() : warning.reviewDate).getDate() + 7))}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        No action required within 7 days of review date
                      </p>
                    </div>
                  )}
                </div>

                {/* Review Button */}
                {warning.reviewStatus !== 'completed' && warning.reviewStatus !== 'auto-satisfied' && (
                  <ThemedButton
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewClick(warning);
                    }}
                  >
                    Review Now
                  </ThemedButton>
                )}
              </div>
            </ThemedCard>
          ))
        )}
      </div>

      {/* Review Modal */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ReviewFollowUpModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedWarning(null);
          }}
          warning={selectedWarning}
          onReviewComplete={handleReviewComplete}
        />
      </Suspense>
    </div>
  );
};

export default ReviewFollowUpDashboard;
