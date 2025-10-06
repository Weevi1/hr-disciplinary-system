import Logger from '../../utils/logger';
// frontend/src/components/hr/AbsenceReportReview.tsx - HR MANAGER INTERFACE
// ✅ LEARNS FROM: ReportAbsence patterns, FirebaseService usage, HRMeetingReview structure
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserX, Calendar, Clock, Eye, Edit, CheckCircle, X, 
  AlertCircle, FileText, User, Send, ArrowLeft, Filter,
  DollarSign, MessageSquare, Search, RefreshCw, TrendingUp
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { FirebaseService } from '../../services/FirebaseService';
import { TimeService } from '../../services/TimeService';

// 🏢 COLLECTIONS - Same as ReportAbsence
const COLLECTIONS = {
  ABSENCE_REPORTS: 'absence_reports'
};

// 🌟 TYPES - Based on ReportAbsence structure
interface AbsenceReport {
  id?: string;
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  absenceDate: string;
  absenceType: 'full-day' | 'half-day' | 'late-arrival' | 'early-departure' | 'sick-leave' | 'personal-leave';
  reason?: string;
  reportedDate: string;
  payrollImpact: boolean;
  hrReviewed: boolean;
  hrNotes?: string;
  hrReviewedBy?: string;
  hrReviewedAt?: string;
  payrollProcessed?: boolean;
  payrollProcessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 📋 ABSENCE TYPES WITH STYLING - Same as ReportAbsence
const ABSENCE_TYPES = [
  { 
    id: 'full-day', 
    label: 'Full Day Absence', 
    icon: '🏠', 
    payrollImpact: true,
    color: 'red'
  },
  { 
    id: 'half-day', 
    label: 'Half Day Absence', 
    icon: '⏰', 
    payrollImpact: true,
    color: 'orange'
  },
  { 
    id: 'late-arrival', 
    label: 'Late Arrival', 
    icon: '🕐', 
    payrollImpact: false,
    color: 'yellow'
  },
  { 
    id: 'early-departure', 
    label: 'Early Departure', 
    icon: '🚪', 
    payrollImpact: false,
    color: 'yellow'
  },
  { 
    id: 'sick-leave', 
    label: 'Sick Leave', 
    icon: '🤒', 
    payrollImpact: true,
    color: 'red'
  },
  { 
    id: 'personal-leave', 
    label: 'Personal Leave', 
    icon: '👤', 
    payrollImpact: true,
    color: 'purple'
  }
] as const;

export const AbsenceReportReview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🔄 DATA STATE
  const [absenceReports, setAbsenceReports] = useState<AbsenceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<AbsenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 UI STATE
  const [selectedReport, setSelectedReport] = useState<AbsenceReport | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [payrollFilter, setPayrollFilter] = useState<string>('all');

  // 📝 REVIEW FORM STATE
  const [reviewData, setReviewData] = useState({
    hrReviewed: false,
    hrNotes: '',
    payrollProcessed: false
  });
  const [reviewing, setReviewing] = useState(false);

  // 🔄 LOAD ABSENCE REPORTS
  useEffect(() => {
    const loadAbsenceReports = async () => {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        Logger.debug('📋 Loading absence reports for organization:', user.organizationId)

        // ✅ PATTERN: Use FirebaseService.queryDocuments like HRMeetingReview
        const reports = await FirebaseService.queryDocuments<AbsenceReport>(
          COLLECTIONS.ABSENCE_REPORTS,
          [
            { field: 'organizationId', operator: '==', value: user.organizationId }
          ],
          'absenceDate', // Order by absence date (most recent first)
          100 // Limit results
        );

        Logger.success(4088)
        setAbsenceReports(reports.reverse()); // Reverse to show newest first
        setFilteredReports(reports.reverse());

      } catch (err) {
        Logger.error('❌ Error loading absence reports:', err)
        setError('Failed to load absence reports. Please try again.');
        setAbsenceReports([]);
        setFilteredReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadAbsenceReports();
  }, [user?.organizationId]);

  // 🔍 FILTER REPORTS
  useEffect(() => {
    let filtered = absenceReports;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.employeeName.toLowerCase().includes(search) ||
        report.managerName.toLowerCase().includes(search) ||
        (report.reason && report.reason.toLowerCase().includes(search)) ||
        (report.employeeNumber && report.employeeNumber.toLowerCase().includes(search))
      );
    }

    // Filter by absence type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.absenceType === typeFilter);
    }

    // Filter by review status
    if (reviewFilter !== 'all') {
      if (reviewFilter === 'reviewed') {
        filtered = filtered.filter(report => report.hrReviewed);
      } else if (reviewFilter === 'pending') {
        filtered = filtered.filter(report => !report.hrReviewed);
      }
    }

    // Filter by payroll impact
    if (payrollFilter !== 'all') {
      if (payrollFilter === 'impact') {
        filtered = filtered.filter(report => report.payrollImpact);
      } else if (payrollFilter === 'no-impact') {
        filtered = filtered.filter(report => !report.payrollImpact);
      }
    }

    setFilteredReports(filtered);
  }, [absenceReports, searchTerm, typeFilter, reviewFilter, payrollFilter]);

  // ✍️ OPEN REVIEW MODAL
  const openReviewModal = (report: AbsenceReport) => {
    setSelectedReport(report);
    setReviewData({
      hrReviewed: report.hrReviewed,
      hrNotes: report.hrNotes || '',
      payrollProcessed: report.payrollProcessed || false
    });
    setShowReviewModal(true);
  };

  // 🚀 UPDATE ABSENCE REPORT
  const updateAbsenceReport = async () => {
    if (!selectedReport || !user) return;

    try {
      setReviewing(true);
      setError(null);

      const updates = {
        hrReviewed: reviewData.hrReviewed,
        hrNotes: reviewData.hrNotes.trim() || undefined,
        payrollProcessed: reviewData.payrollProcessed,
        hrReviewedBy: reviewData.hrReviewed ? user.id : undefined,
        hrReviewedAt: reviewData.hrReviewed ? TimeService.getServerTimestamp() : undefined,
        payrollProcessedAt: reviewData.payrollProcessed ? TimeService.getServerTimestamp() : undefined,
        updatedAt: TimeService.getServerTimestamp()
      };

      // ✅ PATTERN: Use FirebaseService.updateDocument like HRMeetingReview
      await FirebaseService.updateDocument(
        COLLECTIONS.ABSENCE_REPORTS,
        selectedReport.id!,
        updates
      );

      // Update local state
      setAbsenceReports(prev =>
        prev.map(report =>
          report.id === selectedReport.id
            ? { ...report, ...updates }
            : report
        )
      );

      setShowReviewModal(false);
      setSelectedReport(null);

      Logger.success(7561)

    } catch (err) {
      Logger.error('❌ Error updating absence report:', err)
      setError('Failed to update absence report. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  // 🎨 GET TYPE STYLING
  const getTypeStyle = (type: string) => {
    const typeConfig = ABSENCE_TYPES.find(t => t.id === type);
    if (!typeConfig) return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

    const colorMap = {
      red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' }
    };

    return colorMap[typeConfig.color] || colorMap.yellow;
  };

  // 📊 GET SUMMARY STATS
  const getStats = () => {
    const total = absenceReports.length;
    const unreviewed = absenceReports.filter(r => !r.hrReviewed).length;
    const payrollImpact = absenceReports.filter(r => r.payrollImpact).length;
    const thisWeek = absenceReports.filter(r => {
      const reportDate = new Date(r.absenceDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length;

    return { total, unreviewed, payrollImpact, thisWeek };
  };

  const stats = getStats();

  // 🔄 LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Absence Reports...</h2>
          <p className="text-gray-600">Preparing HR review interface...</p>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (!user?.organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-6">You don't seem to be associated with an organization.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* 📱 HEADER */}
        <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserX className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Absence Report Review</h1>
                <p className="text-orange-100">Review and process employee absences</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* 📊 STATS OVERVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-red-600">{stats.unreviewed}</p>
              </div>
              <Clock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payroll Impact</p>
                <p className="text-2xl font-bold text-purple-600">{stats.payrollImpact}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* 🔍 FILTERS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee, manager, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Types</option>
                {ABSENCE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Review Status Filter */}
            <div>
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="reviewed">✅ Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* 📋 ABSENCE REPORTS LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Absence Reports ({filteredReports.length})
            </h2>
          </div>
          
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {absenceReports.length === 0 ? 'No Absence Reports' : 'No Matching Reports'}
              </h3>
              <p className="text-gray-600">
                {absenceReports.length === 0 
                  ? 'No managers have submitted absence reports yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => {
                const typeConfig = ABSENCE_TYPES.find(t => t.id === report.absenceType);
                const typeStyle = getTypeStyle(report.absenceType);
                
                return (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-gray-900">{report.employeeName}</span>
                            {report.employeeNumber && (
                              <span className="text-sm text-gray-500">#{report.employeeNumber}</span>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                            {typeConfig?.icon} {typeConfig?.label}
                          </div>
                          {report.payrollImpact && (
                            <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Payroll Impact
                            </div>
                          )}
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.hrReviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.hrReviewed ? '✅ Reviewed' : '⏳ Pending'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Absence Date:</span> {new Date(report.absenceDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Reported by:</span> {report.managerName}
                          </div>
                          <div>
                            <span className="font-medium">Reported on:</span> {new Date(report.reportedDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Payroll:</span> 
                            <span className={report.payrollProcessed ? 'text-green-600' : 'text-orange-600'}>
                              {report.payrollProcessed ? ' ✅ Processed' : ' ⏳ Pending'}
                            </span>
                          </div>
                        </div>
                        
                        {report.reason && (
                          <div className="mb-4">
                            <span className="font-medium text-gray-700">Reason:</span>
                            <p className="text-gray-600 mt-1">"{report.reason}"</p>
                          </div>
                        )}
                        
                        {report.hrNotes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">HR Notes:</span>
                            <p className="text-gray-600 mt-1">{report.hrNotes}</p>
                            {report.hrReviewedAt && (
                              <p className="text-xs text-gray-500 mt-2">
                                Reviewed on {new Date(report.hrReviewedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openReviewModal(report)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          {report.hrReviewed ? 'Update' : 'Review'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 📝 REVIEW MODAL */}
        {showReviewModal && selectedReport && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowReviewModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Review Absence Report</h3>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Report Details */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">Absence Report Details</h4>
                    <div className="text-sm text-orange-700 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p><strong>Employee:</strong> {selectedReport.employeeName}</p>
                          <p><strong>Manager:</strong> {selectedReport.managerName}</p>
                        </div>
                        <div>
                          <p><strong>Date:</strong> {new Date(selectedReport.absenceDate).toLocaleDateString()}</p>
                          <p><strong>Type:</strong> {ABSENCE_TYPES.find(t => t.id === selectedReport.absenceType)?.label}</p>
                        </div>
                      </div>
                      {selectedReport.reason && (
                        <p><strong>Reason:</strong> "{selectedReport.reason}"</p>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <DollarSign className="w-4 h-4" />
                        <span className={selectedReport.payrollImpact ? 'text-red-700' : 'text-green-700'}>
                          {selectedReport.payrollImpact ? 'Affects payroll calculation' : 'No payroll impact'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hrReviewed"
                      checked={reviewData.hrReviewed}
                      onChange={(e) => setReviewData(prev => ({ ...prev, hrReviewed: e.target.checked }))}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="hrReviewed" className="text-sm font-medium text-gray-700">
                      Mark as HR Reviewed
                    </label>
                  </div>
                  
                  {/* Payroll Processing */}
                  {selectedReport.payrollImpact && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="payrollProcessed"
                        checked={reviewData.payrollProcessed}
                        onChange={(e) => setReviewData(prev => ({ ...prev, payrollProcessed: e.target.checked }))}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="payrollProcessed" className="text-sm font-medium text-gray-700">
                        Mark as Payroll Processed
                      </label>
                    </div>
                  )}
                  
                  {/* HR Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR Notes
                    </label>
                    <textarea
                      value={reviewData.hrNotes}
                      onChange={(e) => setReviewData(prev => ({ ...prev, hrNotes: e.target.value }))}
                      placeholder="Add any HR notes or payroll instructions..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateAbsenceReport}
                    disabled={reviewing}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      !reviewing
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {reviewing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Update Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};