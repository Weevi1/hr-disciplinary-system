// frontend/src/components/warnings/WarningManagement.tsx
// 🔧 ENHANCED VERSION - Integrated with WarningDetailsModal
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useWarnings } from '@/hooks/warnings/useWarnings';
import { WarningDetailsModal } from '@/components/warnings/modals/WarningDetailsModal';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  UserCheck, 
  Calendar,
  User,
  FileText,
  Filter,
  Search
} from 'lucide-react';

export const WarningManagement: React.FC = () => {
  const { user, organization } = useAuth();
  const { warnings, loading, error, stats, updateWarningStatus } = useWarnings();
  // ✅ FIXED: Use 'pending_review' to match what CreateWarning sets
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🎯 NEW: Modal state management
  const [selectedWarning, setSelectedWarning] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug logging with more detail
  console.log('🎯 WarningManagement Debug:', {
    organizationId: organization?.id,
    warningCount: warnings.length,
    stats,
    loading,
    error,
    warningsData: warnings.map(w => ({ id: w.id, status: w.status, employeeName: w.employeeName }))
  });

  // ✅ FIXED: Filter warnings with correct status matching
  const filteredWarnings = warnings.filter(warning => {
    // Handle 'all' filter
    if (filter === 'all') {
      // Show all warnings
    } else {
      // Check exact status match
      if (warning.status !== filter) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (warning.employeeName || '').toLowerCase().includes(searchLower) ||
        (warning.employeeId || '').toLowerCase().includes(searchLower) ||
        (warning.category || '').toLowerCase().includes(searchLower) ||
        (warning.submittedBy || '').toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  // 🎯 NEW: Modal handlers
  const handleViewDetails = (warning: any) => {
    console.log('👁️ Opening modal for warning:', warning.id);
    setSelectedWarning(warning);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('❌ Closing modal');
    setIsModalOpen(false);
    setSelectedWarning(null);
  };

  // 🎯 ENHANCED: Modal-aware approval with automatic close
  const handleApproveWarning = (warningId: string) => {
    console.log('📋 Approving warning:', warningId);
    updateWarningStatus(warningId, 'approved');
    
    // If approving from modal, close it
    if (selectedWarning?.id === warningId) {
      handleCloseModal();
    }
  };

  // 🎯 ENHANCED: Modal-aware rejection with automatic close
  const handleRejectWarning = (warningId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      console.log('❌ Rejecting warning:', warningId, 'Reason:', reason);
      updateWarningStatus(warningId, 'rejected');
      
      // If rejecting from modal, close it
      if (selectedWarning?.id === warningId) {
        handleCloseModal();
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'verbal': return '#f59e0b';
      case 'first_written': return '#ef4444';
      case 'final_written': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'verbal': return 'Verbal Warning';
      case 'first_written': return 'First Written Warning';
      case 'final_written': return 'Final Written Warning';
      default: return severity;
    }
  };

  // ✅ NEW: Helper function to get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_review':
        return { label: 'Pending Review', color: '#f59e0b', icon: '⏳' };
      case 'approved':
        return { label: 'Approved', color: '#10b981', icon: '✅' };
      case 'rejected':
        return { label: 'Rejected', color: '#ef4444', icon: '❌' };
      default:
        return { label: status, color: '#6b7280', icon: '❓' };
    }
  };

  if (loading) {
    return (
      <div className="hr-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading warnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontSize: '1.5rem', fontWeight: '600' }}>
          ⚠️ Warning Review Queue
        </h1>
        <p style={{ margin: 0, color: '#6b7280' }}>
          {user?.role?.id === 'hr-manager' 
            ? 'Review and approve warnings submitted by department managers'
            : 'Manage disciplinary warnings'}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <div className="hr-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending Review</div>
        </div>
        
        <div className="hr-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
            {stats.approved}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Approved Today</div>
        </div>
        
        <div className="hr-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
            {stats.rejected}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rejected</div>
        </div>
      </div>

      {/* Filters - ✅ FIXED: Use correct status values */}
      <div className="hr-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { key: 'pending_review', label: 'Pending Review', count: stats.pending },
              { key: 'approved', label: 'Approved', count: stats.approved },
              { key: 'rejected', label: 'Rejected', count: stats.rejected },
              { key: 'all', label: 'All', count: stats.total }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key as any)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: filter === option.key ? '#3b82f6' : 'white',
                  color: filter === option.key ? 'white' : '#374151',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {option.label}
                <span style={{
                  backgroundColor: filter === option.key ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type="text"
                placeholder="Search warnings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warning List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredWarnings.length === 0 ? (
          <div className="hr-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              {filter === 'pending_review' ? 'No Pending Warnings' : 'No Warnings Found'}
            </h3>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              {filter === 'pending_review' 
                ? 'All caught up! No warnings are waiting for your review.' 
                : 'Try adjusting your search or filter settings.'}
            </p>
          </div>
        ) : (
          filteredWarnings.map((warning) => {
            const statusInfo = getStatusInfo(warning.status);
            
            return (
              <div key={warning.id} className="hr-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Warning Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        backgroundColor: getSeverityColor(warning.severity),
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {getSeverityLabel(warning.severity)}
                      </div>
                      
                      {/* ✅ NEW: Status indicator */}
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        backgroundColor: statusInfo.color,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {statusInfo.icon} {statusInfo.label}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        <User size={16} />
                        <span>{warning.employeeName || warning.employeeId}</span>
                        <Calendar size={16} />
                        <span>
                          {warning.submittedDate ? 
                            (warning.submittedDate.toDate ? 
                              warning.submittedDate.toDate().toLocaleDateString() :
                              new Date(warning.submittedDate).toLocaleDateString()
                            ) : 
                            'Unknown date'
                          }
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        {warning.category || 'Uncategorized'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.4' }}>
                        {warning.description || 'No description provided'}
                      </p>
                    </div>

                    {/* ✅ ENHANCED: Action Buttons with View Details */}
                    {warning.status === 'pending_review' && user?.role?.id === 'hr-manager' && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleApproveWarning(warning.id)}
                          className="hr-button-success"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <CheckCircle size={16} />
                          Approve Warning
                        </button>
                        <button
                          onClick={() => handleRejectWarning(warning.id)}
                          className="hr-button-danger"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <AlertTriangle size={16} />
                          Reject Warning
                        </button>
                        {/* 🎯 NEW: View Details button that opens modal */}
                        <button
                          onClick={() => handleViewDetails(warning)}
                          className="hr-button-secondary"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    )}

                    {/* 🎯 ENHANCED: View Details for all warnings (not just pending) */}
                    {warning.status !== 'pending_review' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ 
                          padding: '0.5rem 0.75rem', 
                          borderRadius: '6px',
                          backgroundColor: warning.status === 'approved' ? '#dcfce7' : '#fee2e2',
                          fontSize: '0.875rem',
                          color: warning.status === 'approved' ? '#166534' : '#991b1b'
                        }}>
                          {warning.status === 'approved' ? '✅ Approved and processed' : '❌ Rejected'}
                        </div>
                        
                        {/* View Details button for completed warnings */}
                        <button
                          onClick={() => handleViewDetails(warning)}
                          className="hr-button-secondary"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🎯 NEW: Warning Details Modal */}
      <WarningDetailsModal
        warning={selectedWarning}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApprove={handleApproveWarning}
        onReject={handleRejectWarning}
        canTakeAction={user?.role?.id === 'hr-manager'}
      />

      {/* ✅ ENHANCED: Debug Info with detailed status information */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#0369a1'
      }}>
        📊 Showing {filteredWarnings.length} of {warnings.length} warnings • 
        Organization: {organization?.name || 'Unknown'} • 
        User Role: {user?.role?.id || 'Unknown'} • 
        Filter: {filter} • 
        Pending Count: {stats.pending}
        
        {/* Show raw warning statuses for debugging */}
        {warnings.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            Warning Statuses: {warnings.map(w => `${w.employeeName}(${w.status})`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};