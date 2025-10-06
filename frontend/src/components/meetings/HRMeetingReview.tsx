import Logger from '../../utils/logger';
// frontend/src/components/hr/HRMeetingReview.tsx - HR MANAGER INTERFACE
// ✅ LEARNS FROM: BookHRMeeting patterns, FirebaseService usage, proper filtering
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Clock, Eye, Edit, CheckCircle, X, 
  AlertCircle, FileText, User, Send, ArrowLeft, Filter,
  CalendarCheck, MessageSquare, Search, RefreshCw
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { FirebaseService } from '../../services/FirebaseService';
import { TimeService } from '../../services/TimeService';

// 🏢 COLLECTIONS - Same as BookHRMeeting
const COLLECTIONS = {
  HR_MEETING_REQUESTS: 'hr_meeting_requests'
};

// 🌟 TYPES - Based on BookHRMeeting structure
interface HRMeetingRequest {
  id?: string;
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  context: string;
  managerSignature?: string;
  employeeSignature?: string;
  employeeConsent: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  requestDate: string;
  scheduledDate?: string;
  scheduledTime?: string;
  hrNotes?: string;
  hrReviewedBy?: string;
  hrReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 📋 STATUS OPTIONS FOR UPDATES
const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending Review', color: 'yellow', icon: '⏳' },
  { id: 'scheduled', label: 'Scheduled', color: 'blue', icon: '📅' },
  { id: 'completed', label: 'Completed', color: 'green', icon: '✅' },
  { id: 'cancelled', label: 'Cancelled', color: 'red', icon: '❌' }
];

export const HRMeetingReview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🔄 DATA STATE
  const [meetingRequests, setMeetingRequests] = useState<HRMeetingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<HRMeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 UI STATE
  const [selectedRequest, setSelectedRequest] = useState<HRMeetingRequest | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 📝 UPDATE FORM STATE
  const [updateData, setUpdateData] = useState({
    status: '',
    scheduledDate: '',
    scheduledTime: '',
    hrNotes: ''
  });
  const [updating, setUpdating] = useState(false);

  // 🔄 LOAD MEETING REQUESTS
  useEffect(() => {
    const loadMeetingRequests = async () => {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        Logger.debug('📋 Loading HR meeting requests for organization:', user.organizationId)

        // ✅ PATTERN: Use FirebaseService.queryDocuments like other components
        const requests = await FirebaseService.queryDocuments<HRMeetingRequest>(
          COLLECTIONS.HR_MEETING_REQUESTS,
          [
            { field: 'organizationId', operator: '==', value: user.organizationId }
          ],
          'createdAt', // Order by creation date
          50 // Limit results
        );

        Logger.success(3346)
        setMeetingRequests(requests);
        setFilteredRequests(requests);

      } catch (err) {
        Logger.error('❌ Error loading meeting requests:', err)
        setError('Failed to load meeting requests. Please try again.');
        setMeetingRequests([]);
        setFilteredRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadMeetingRequests();
  }, [user?.organizationId]);

  // 🔍 FILTER REQUESTS
  useEffect(() => {
    let filtered = meetingRequests;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.employeeName.toLowerCase().includes(search) ||
        request.managerName.toLowerCase().includes(search) ||
        request.context.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [meetingRequests, searchTerm, statusFilter]);

  // ✍️ OPEN UPDATE MODAL
  const openUpdateModal = (request: HRMeetingRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      scheduledDate: request.scheduledDate || '',
      scheduledTime: request.scheduledTime || '',
      hrNotes: request.hrNotes || ''
    });
    setShowUpdateModal(true);
  };

  // 🚀 UPDATE MEETING REQUEST
  const updateMeetingRequest = async () => {
    if (!selectedRequest || !user) return;

    try {
      setUpdating(true);
      setError(null);

      const updates = {
        status: updateData.status,
        scheduledDate: updateData.scheduledDate || undefined,
        scheduledTime: updateData.scheduledTime || undefined,
        hrNotes: updateData.hrNotes.trim() || undefined,
        hrReviewedBy: user.id,
        hrReviewedAt: TimeService.getServerTimestamp(),
        updatedAt: TimeService.getServerTimestamp()
      };

      // ✅ PATTERN: Use FirebaseService.updateDocument like other components
      await FirebaseService.updateDocument(
        COLLECTIONS.HR_MEETING_REQUESTS,
        selectedRequest.id!,
        updates
      );

      // Update local state
      setMeetingRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id
            ? { ...req, ...updates }
            : req
        )
      );

      setShowUpdateModal(false);
      setSelectedRequest(null);

      Logger.success(5953)

    } catch (err) {
      Logger.error('❌ Error updating meeting request:', err)
      setError('Failed to update meeting request. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // 🎨 GET STATUS STYLING
  const getStatusStyle = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(opt => opt.id === status);
    if (!statusConfig) return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

    const colorMap = {
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };

    return colorMap[statusConfig.color] || colorMap.yellow;
  };

  // 📊 GET SUMMARY STATS
  const getStats = () => {
    const total = meetingRequests.length;
    const pending = meetingRequests.filter(r => r.status === 'pending').length;
    const scheduled = meetingRequests.filter(r => r.status === 'scheduled').length;
    const completed = meetingRequests.filter(r => r.status === 'completed').length;

    return { total, pending, scheduled, completed };
  };

  const stats = getStats();

  // 🔄 LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Meeting Requests...</h2>
          <p className="text-gray-600">Preparing HR review interface...</p>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (!user?.organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-6">You don't seem to be associated with an organization.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* 📱 HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">HR Meeting Review</h1>
                <p className="text-blue-100">Manage and schedule employee meetings</p>
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
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <CalendarCheck className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* 🔍 FILTERS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee, manager, or context..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 📋 MEETING REQUESTS LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Meeting Requests ({filteredRequests.length})
            </h2>
          </div>
          
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {meetingRequests.length === 0 ? 'No Meeting Requests' : 'No Matching Requests'}
              </h3>
              <p className="text-gray-600">
                {meetingRequests.length === 0 
                  ? 'No managers have submitted meeting requests yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const statusStyle = getStatusStyle(request.status);
                const statusConfig = STATUS_OPTIONS.find(opt => opt.id === request.status);
                
                return (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-gray-900">{request.employeeName}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {statusConfig?.icon} {statusConfig?.label}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Requested by:</span> {request.managerName}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(request.requestDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Employee Consent:</span> 
                            <span className={request.employeeConsent ? 'text-green-600' : 'text-red-600'}>
                              {request.employeeConsent ? ' ✅ Yes' : ' ❌ No'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <span className="font-medium text-gray-700">Context:</span>
                          <p className="text-gray-600 mt-1">"{request.context}"</p>
                        </div>
                        
                        {request.scheduledDate && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-blue-700">Scheduled:</span>
                            <p className="text-blue-600">
                              {new Date(request.scheduledDate).toLocaleDateString()}
                              {request.scheduledTime && ` at ${request.scheduledTime}`}
                            </p>
                          </div>
                        )}
                        
                        {request.hrNotes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">HR Notes:</span>
                            <p className="text-gray-600 mt-1">{request.hrNotes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openUpdateModal(request)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 📝 UPDATE MODAL */}
        {showUpdateModal && selectedRequest && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowUpdateModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Update Meeting Request</h3>
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Employee Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Meeting Request Details</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Employee:</strong> {selectedRequest.employeeName}</p>
                      <p><strong>Manager:</strong> {selectedRequest.managerName}</p>
                      <p><strong>Context:</strong> "{selectedRequest.context}"</p>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Scheduling Fields */}
                  {(updateData.status === 'scheduled' || updateData.status === 'completed') && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meeting Date
                          </label>
                          <input
                            type="date"
                            value={updateData.scheduledDate}
                            onChange={(e) => setUpdateData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meeting Time
                          </label>
                          <input
                            type="time"
                            value={updateData.scheduledTime}
                            onChange={(e) => setUpdateData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* HR Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR Notes
                    </label>
                    <textarea
                      value={updateData.hrNotes}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, hrNotes: e.target.value }))}
                      placeholder="Add any HR notes or meeting details..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateMeetingRequest}
                    disabled={!updateData.status || updating}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      updateData.status && !updating
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Update Request
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