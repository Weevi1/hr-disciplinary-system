import Logger from '../../utils/logger';
// frontend/src/components/counselling/CounsellingDashboard.tsx
// 📊 COUNSELLING DASHBOARD COMPONENT
// Shows all counselling sessions for a manager with filtering and follow-up management

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, CheckCircle, AlertCircle, Clock, 
  ArrowLeft, Filter, Search, User, Eye, FileText, X
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CounsellingService } from '../../services/CounsellingService';
import { CounsellingFollowUp } from './CounsellingFollowUp';
import type { CorrectiveCounselling } from '../../types/counselling';
import { COUNSELLING_TYPES } from '../../types/counselling';

interface CounsellingDashboardProps {
  onClose?: () => void;
}

export const CounsellingDashboard: React.FC<CounsellingDashboardProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // 📊 DATA STATE
  const [allCounselling, setAllCounselling] = useState<CorrectiveCounselling[]>([]);
  const [filteredCounselling, setFilteredCounselling] = useState<CorrectiveCounselling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 UI STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_followup' | 'completed'>('all');
  const [selectedSession, setSelectedSession] = useState<CorrectiveCounselling | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);

  // 📊 Load all counselling sessions for this manager
  useEffect(() => {
    const loadCounsellingSessions = async () => {
      if (!user?.id || !organization?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get all counselling sessions created by this manager
        
        const counsellingQuery = query(
          collection(db, 'corrective_counselling'),
          where('organizationId', '==', organization.id),
          where('createdBy', '==', user.id),
          orderBy('dateCreated', 'desc')
        );

        const snapshot = await getDocs(counsellingQuery);
        const sessions: CorrectiveCounselling[] = [];

        snapshot.forEach(doc => {
          const data = doc.data() as Omit<CorrectiveCounselling, 'id'>;
          sessions.push({ id: doc.id, ...data });
        });

        setAllCounselling(sessions);
        setFilteredCounselling(sessions);
        
        Logger.debug(2790)
      } catch (err) {
        Logger.error('❌ Error loading counselling sessions:', err)
        setError('Failed to load counselling sessions');
      } finally {
        setLoading(false);
      }
    };

    loadCounsellingSessions();
  }, [user?.id, organization?.id]);

  // 🔍 Filter counselling sessions
  useEffect(() => {
    let filtered = allCounselling;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.employeeName.toLowerCase().includes(search) ||
        session.category.toLowerCase().includes(search) ||
        session.issueDescription.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        switch (statusFilter) {
          case 'active':
            return !session.followUpCompleted && session.followUpDate;
          case 'pending_followup':
            if (!session.followUpDate || session.followUpCompleted) return false;
            const followUpDate = new Date(session.followUpDate);
            const daysDiff = Math.ceil((followUpDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7; // Due within 7 days
          case 'completed':
            return session.followUpCompleted;
          default:
            return true;
        }
      });
    }

    setFilteredCounselling(filtered);
  }, [allCounselling, searchTerm, statusFilter]);

  // 📅 Handle follow-up
  const handleOpenFollowUp = (session: CorrectiveCounselling) => {
    setSelectedSession(session);
    setShowFollowUp(true);
  };

  const handleFollowUpClose = () => {
    setShowFollowUp(false);
    setSelectedSession(null);
  };

  const handleFollowUpComplete = () => {
    setShowFollowUp(false);
    setSelectedSession(null);
    // Reload data to reflect changes
    window.location.reload();
  };

  // 🎨 Get counselling type info
  const getCounsellingTypeInfo = (type: string) => {
    return COUNSELLING_TYPES.find(t => t.id === type) || COUNSELLING_TYPES[0];
  };

  // 🎨 Get status badge
  const getStatusBadge = (session: CorrectiveCounselling) => {
    if (session.followUpCompleted) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completed</span>;
    }
    
    if (!session.followUpDate) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">No Follow-up</span>;
    }

    const followUpDate = new Date(session.followUpDate);
    const daysDiff = Math.ceil((followUpDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Overdue</span>;
    } else if (daysDiff <= 3) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Due Soon</span>;
    } else {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Active</span>;
    }
  };

  // 🎨 RENDER LOADING STATE
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading counselling dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                Counselling Dashboard
              </h2>
              <button
                onClick={onClose || (() => navigate('/dashboard'))}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mt-2">Manage all your counselling sessions and follow-ups</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Filters & Search */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by employee, category, or description..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sessions</option>
                  <option value="active">Active</option>
                  <option value="pending_followup">Follow-up Due</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Stats */}
              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                Showing {filteredCounselling.length} of {allCounselling.length} sessions
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="p-6">
            {filteredCounselling.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No counselling sessions found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'You haven\'t created any counselling sessions yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCounselling.map((session) => {
                  const typeInfo = getCounsellingTypeInfo(session.counsellingType);
                  const followUpDate = session.followUpDate ? new Date(session.followUpDate) : null;
                  const canFollowUp = followUpDate && !session.followUpCompleted;

                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Employee & Type */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-gray-500" />
                              <span className="font-semibold text-gray-900">{session.employeeName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeInfo.icon}</span>
                              <span className="text-sm text-gray-600">{typeInfo.label}</span>
                            </div>
                          </div>

                          {/* Category & Date */}
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-sm font-medium text-gray-700">{session.category}</span>
                            <span className="text-sm text-gray-500">
                              Created: {new Date(session.dateCreated).toLocaleDateString()}
                            </span>
                            {followUpDate && (
                              <span className="text-sm text-gray-500">
                                Follow-up: {followUpDate.toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Description Preview */}
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {session.issueDescription}
                          </p>

                          {/* Promises Summary */}
                          {session.promisesToPerform && session.promisesToPerform.length > 0 && (
                            <div className="text-xs text-gray-500 mb-2">
                              {session.promisesToPerform.length} promise{session.promisesToPerform.length !== 1 ? 's' : ''} to perform
                            </div>
                          )}
                        </div>

                        {/* Actions & Status */}
                        <div className="flex items-start gap-3 ml-4">
                          {/* Status Badge */}
                          {getStatusBadge(session)}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {/* TODO: Add view details modal */}}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canFollowUp && (
                              <button
                                onClick={() => handleOpenFollowUp(session)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                Follow-up
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={onClose || (() => navigate('/dashboard'))}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>

              <div className="text-sm text-gray-500">
                {allCounselling.filter(s => !s.followUpCompleted && s.followUpDate).length} sessions need follow-up
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      {showFollowUp && selectedSession && (
        <CounsellingFollowUp 
          counsellingSession={selectedSession}
          onClose={handleFollowUpClose}
          onComplete={handleFollowUpComplete}
        />
      )}
    </>
  );
};