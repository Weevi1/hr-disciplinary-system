// frontend/src/components/recognition/RecognitionDashboard.tsx
// Recognition Dashboard - View and manage employee recognitions
// Pattern: Follows ReviewDashboard architecture with tab-based navigation

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Filter, Calendar, Download, Eye, Award, TrendingUp,
  Users, Building, ChevronDown, ChevronUp, X, Printer,
  Star, Trophy, Sparkles, Target, Heart, Lightbulb,
  Shield, Zap, Gift, FileText, BarChart3, PieChart
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useRecognitionData } from '../../hooks/useRecognitionData';
import { ThemedCard } from '../common/ThemedCard';
import { ThemedTabNavigation, TabItem } from '../common/ThemedTabNavigation';
import RecognitionDetailsModal from './RecognitionDetailsModal';
import type { Recognition, RecognitionType } from '../../types/core';
import Logger from '../../utils/logger';

interface RecognitionDashboardProps {
  onRecognizeEmployee?: () => void; // Callback to open RecognitionEntry modal
  initialEmployeeFilter?: { id: string; name: string };
}

// Recognition type metadata for icons and colors
const RECOGNITION_TYPE_CONFIG: Record<RecognitionType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  exceptional_performance: {
    label: 'Exceptional Performance',
    icon: <Trophy className="w-4 h-4" />,
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  going_above_beyond: {
    label: 'Going Above & Beyond',
    icon: <Star className="w-4 h-4" />,
    color: '#3b82f6',
    bgColor: '#dbeafe'
  },
  innovation: {
    label: 'Innovation',
    icon: <Lightbulb className="w-4 h-4" />,
    color: '#8b5cf6',
    bgColor: '#ede9fe'
  },
  teamwork: {
    label: 'Teamwork',
    icon: <Users className="w-4 h-4" />,
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  leadership: {
    label: 'Leadership',
    icon: <Target className="w-4 h-4" />,
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  customer_service: {
    label: 'Customer Service',
    icon: <Heart className="w-4 h-4" />,
    color: '#ec4899',
    bgColor: '#fce7f3'
  },
  safety_excellence: {
    label: 'Safety Excellence',
    icon: <Shield className="w-4 h-4" />,
    color: '#06b6d4',
    bgColor: '#cffafe'
  },
  continuous_improvement: {
    label: 'Continuous Improvement',
    icon: <TrendingUp className="w-4 h-4" />,
    color: '#14b8a6',
    bgColor: '#ccfbf1'
  },
  mentorship: {
    label: 'Mentorship',
    icon: <Sparkles className="w-4 h-4" />,
    color: '#f97316',
    bgColor: '#ffedd5'
  },
  problem_solving: {
    label: 'Problem Solving',
    icon: <Zap className="w-4 h-4" />,
    color: '#eab308',
    bgColor: '#fef9c3'
  }
};

export const RecognitionDashboard: React.FC<RecognitionDashboardProps> = ({
  onRecognizeEmployee,
  initialEmployeeFilter
}) => {
  const { user } = useAuth();
  const { recognitions, loading, error, stats, refresh } = useRecognitionData();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'by-employee' | 'by-type' | 'by-department'>('all');
  const [searchTerm, setSearchTerm] = useState(initialEmployeeFilter?.name || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [sortBy, setSortBy] = useState<'date' | 'employee' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRecognition, setSelectedRecognition] = useState<Recognition | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter and sort recognitions
  const filteredRecognitions = useMemo(() => {
    let filtered = [...recognitions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rec =>
        rec.employeeName.toLowerCase().includes(term) ||
        rec.achievementTitle.toLowerCase().includes(term) ||
        rec.achievementDescription.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(rec => rec.recognitionType === filterType);
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(rec => rec.departmentName === filterDepartment);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(rec => {
        const recDate = new Date(rec.recognitionDate);
        return recDate >= dateRange.start!;
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(rec => {
        const recDate = new Date(rec.recognitionDate);
        return recDate <= dateRange.end!;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.recognitionDate).getTime() - new Date(b.recognitionDate).getTime();
          break;
        case 'employee':
          comparison = a.employeeName.localeCompare(b.employeeName);
          break;
        case 'type':
          comparison = a.recognitionType.localeCompare(b.recognitionType);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [recognitions, searchTerm, filterType, filterDepartment, dateRange, sortBy, sortOrder]);

  // Group recognitions by employee
  const recognitionsByEmployee = useMemo(() => {
    const grouped = new Map<string, Recognition[]>();

    filteredRecognitions.forEach(rec => {
      const existing = grouped.get(rec.employeeId) || [];
      grouped.set(rec.employeeId, [...existing, rec]);
    });

    // Sort by count (descending)
    return Array.from(grouped.entries())
      .map(([employeeId, recs]) => ({
        employeeId,
        employeeName: recs[0].employeeName,
        employeePhotoUrl: recs[0].employeePhotoUrl,
        count: recs.length,
        recognitions: recs.sort((a, b) =>
          new Date(b.recognitionDate).getTime() - new Date(a.recognitionDate).getTime()
        )
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecognitions]);

  // Group recognitions by type
  const recognitionsByType = useMemo(() => {
    const grouped = new Map<RecognitionType, Recognition[]>();

    filteredRecognitions.forEach(rec => {
      const existing = grouped.get(rec.recognitionType) || [];
      grouped.set(rec.recognitionType, [...existing, rec]);
    });

    // Sort by count (descending)
    return Array.from(grouped.entries())
      .map(([type, recs]) => ({
        type,
        count: recs.length,
        recognitions: recs.sort((a, b) =>
          new Date(b.recognitionDate).getTime() - new Date(a.recognitionDate).getTime()
        )
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecognitions]);

  // Group recognitions by department
  const recognitionsByDepartment = useMemo(() => {
    const grouped = new Map<string, Recognition[]>();

    filteredRecognitions.forEach(rec => {
      if (!rec.departmentName) return;
      const existing = grouped.get(rec.departmentName) || [];
      grouped.set(rec.departmentName, [...existing, rec]);
    });

    // Sort by count (descending)
    return Array.from(grouped.entries())
      .map(([deptName, recs]) => ({
        departmentName: deptName,
        count: recs.length,
        recognitions: recs.sort((a, b) =>
          new Date(b.recognitionDate).getTime() - new Date(a.recognitionDate).getTime()
        )
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecognitions]);

  // Pagination
  const paginatedRecognitions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecognitions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecognitions, currentPage]);

  const totalPages = Math.ceil(filteredRecognitions.length / itemsPerPage);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    recognitions.forEach(rec => {
      if (rec.departmentName) depts.add(rec.departmentName);
    });
    return Array.from(depts).sort();
  }, [recognitions]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Employee Name',
      'Recognition Type',
      'Achievement Title',
      'Recognition Date',
      'Recognized By',
      'Department'
    ];

    const rows = filteredRecognitions.map(rec => [
      rec.employeeName,
      RECOGNITION_TYPE_CONFIG[rec.recognitionType].label,
      rec.achievementTitle,
      formatDate(rec.recognitionDate),
      rec.recognizedByName,
      rec.departmentName || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recognitions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Tab configuration
  const tabs: TabItem[] = [
    {
      id: 'all',
      label: 'All Recognition',
      icon: <Award className="w-4 h-4" />,
      count: filteredRecognitions.length
    },
    {
      id: 'by-employee',
      label: 'By Employee',
      icon: <Users className="w-4 h-4" />,
      count: recognitionsByEmployee.length
    },
    {
      id: 'by-type',
      label: 'By Type',
      icon: <Star className="w-4 h-4" />,
      count: recognitionsByType.length
    },
    {
      id: 'by-department',
      label: 'By Department',
      icon: <Building className="w-4 h-4" />,
      count: recognitionsByDepartment.length
    }
  ];

  return (
    <>
      {/* Recognition Details Modal */}
      <RecognitionDetailsModal
        recognition={selectedRecognition}
        isOpen={selectedRecognition !== null}
        onClose={() => setSelectedRecognition(null)}
      />

      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Recognition Dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Celebrate achievements and track employee recognition
          </p>
        </div>
        <button
          onClick={onRecognizeEmployee}
          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          style={{
            backgroundColor: 'var(--color-button-primary-bg)',
            color: 'var(--color-button-primary-text)'
          }}
        >
          <Award className="w-4 h-4" />
          Recognize Employee
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ThemedCard padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                This Month
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {stats.thisMonth}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#dbeafe' }}>
              <Award className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                This Year
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {stats.thisYear}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#d1fae5' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                Total
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {stats.totalCount}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#fef3c7' }}>
              <Trophy className="w-6 h-6" style={{ color: '#f59e0b' }} />
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                Top Performer
              </p>
              <p className="text-sm font-bold mt-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                {stats.topRecognizedEmployees[0]?.employeeName || 'N/A'}
              </p>
              {stats.topRecognizedEmployees[0] && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {stats.topRecognizedEmployees[0].count} recognition{stats.topRecognizedEmployees[0].count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#fce7f3' }}>
              <Star className="w-6 h-6" style={{ color: '#ec4899' }} />
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Search and Filters */}
      <ThemedCard padding="md">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by employee name or achievement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: showFilters ? 'var(--color-background-secondary)' : 'transparent',
                color: 'var(--color-text-primary)'
              }}
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {/* Recognition Type Filter */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Recognition Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="all">All Types</option>
                  {Object.entries(RECOGNITION_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="date">Date</option>
                    <option value="employee">Employee</option>
                    <option value="type">Type</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ThemedCard>

      {/* Tab Navigation */}
      <ThemedTabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Tab Content */}
      {loading ? (
        <ThemedCard padding="lg">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
          </div>
        </ThemedCard>
      ) : error ? (
        <ThemedCard padding="lg">
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        </ThemedCard>
      ) : (
        <>
          {/* All Recognition Tab */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {paginatedRecognitions.length === 0 ? (
                <ThemedCard padding="lg">
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      No recognitions found
                    </p>
                  </div>
                </ThemedCard>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedRecognitions.map(recognition => (
                      <RecognitionCard
                        key={recognition.id}
                        recognition={recognition}
                        onClick={() => setSelectedRecognition(recognition)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* By Employee Tab */}
          {activeTab === 'by-employee' && (
            <div className="space-y-3">
              {recognitionsByEmployee.length === 0 ? (
                <ThemedCard padding="lg">
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      No employee recognitions found
                    </p>
                  </div>
                </ThemedCard>
              ) : (
                recognitionsByEmployee.map(employee => (
                  <ThemedCard key={employee.employeeId} padding="md" hover>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleGroup(`employee-${employee.employeeId}`)}
                    >
                      <div className="flex items-center gap-3">
                        {employee.employeePhotoUrl ? (
                          <img
                            src={employee.employeePhotoUrl}
                            alt={employee.employeeName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                            <Users className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {employee.employeeName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {employee.count} recognition{employee.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {expandedGroups.has(`employee-${employee.employeeId}`) ? (
                        <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                      )}
                    </div>

                    {expandedGroups.has(`employee-${employee.employeeId}`) && (
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        {employee.recognitions.map(recognition => (
                          <RecognitionCard
                            key={recognition.id}
                            recognition={recognition}
                            onClick={() => setSelectedRecognition(recognition)}
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </ThemedCard>
                ))
              )}
            </div>
          )}

          {/* By Type Tab */}
          {activeTab === 'by-type' && (
            <div className="space-y-6">
              {/* Type Distribution Chart */}
              <ThemedCard padding="md">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Recognition Type Distribution
                </h3>
                <div className="space-y-3">
                  {recognitionsByType.map(({ type, count }) => {
                    const config = RECOGNITION_TYPE_CONFIG[type];
                    const percentage = (count / filteredRecognitions.length) * 100;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded" style={{ backgroundColor: config.bgColor }}>
                              <span style={{ color: config.color }}>{config.icon}</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {config.label}
                            </span>
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                            {count}
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: config.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ThemedCard>

              {/* Grouped by Type */}
              <div className="space-y-3">
                {recognitionsByType.map(({ type, count, recognitions: typeRecognitions }) => {
                  const config = RECOGNITION_TYPE_CONFIG[type];
                  return (
                    <ThemedCard key={type} padding="md" hover>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleGroup(`type-${type}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: config.bgColor }}>
                            <span style={{ color: config.color }}>{config.icon}</span>
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {config.label}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {count} recognition{count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {expandedGroups.has(`type-${type}`) ? (
                          <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                        ) : (
                          <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                        )}
                      </div>

                      {expandedGroups.has(`type-${type}`) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {typeRecognitions.map(recognition => (
                            <RecognitionCard
                              key={recognition.id}
                              recognition={recognition}
                              onClick={() => setSelectedRecognition(recognition)}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </ThemedCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Department Tab */}
          {activeTab === 'by-department' && (
            <div className="space-y-6">
              {/* Department Comparison Chart */}
              <ThemedCard padding="md">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Department Comparison
                </h3>
                <div className="space-y-3">
                  {recognitionsByDepartment.map(({ departmentName, count }) => {
                    const percentage = (count / filteredRecognitions.length) * 100;
                    return (
                      <div key={departmentName}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {departmentName}
                            </span>
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                            {count}
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ThemedCard>

              {/* Grouped by Department */}
              <div className="space-y-3">
                {recognitionsByDepartment.length === 0 ? (
                  <ThemedCard padding="lg">
                    <div className="text-center py-12">
                      <Building className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        No department recognitions found
                      </p>
                    </div>
                  </ThemedCard>
                ) : (
                  recognitionsByDepartment.map(({ departmentName, count, recognitions: deptRecognitions }) => (
                    <ThemedCard key={departmentName} padding="md" hover>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleGroup(`dept-${departmentName}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: '#d1fae5' }}>
                            <Building className="w-5 h-5" style={{ color: '#10b981' }} />
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {departmentName}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {count} recognition{count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {expandedGroups.has(`dept-${departmentName}`) ? (
                          <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                        ) : (
                          <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                        )}
                      </div>

                      {expandedGroups.has(`dept-${departmentName}`) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {deptRecognitions.map(recognition => (
                            <RecognitionCard
                              key={recognition.id}
                              recognition={recognition}
                              onClick={() => setSelectedRecognition(recognition)}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </ThemedCard>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
};

// Recognition Card Component
interface RecognitionCardProps {
  recognition: Recognition;
  onClick: () => void;
  compact?: boolean;
}

const RecognitionCard: React.FC<RecognitionCardProps> = ({ recognition, onClick, compact = false }) => {
  const config = RECOGNITION_TYPE_CONFIG[recognition.recognitionType];

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ThemedCard
      padding={compact ? 'sm' : 'md'}
      hover
      onClick={onClick}
      className="cursor-pointer transition-all duration-200"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {recognition.employeePhotoUrl && !compact && (
              <img
                src={recognition.employeePhotoUrl}
                alt={recognition.employeeName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {recognition.employeeName}
              </p>
              {recognition.employeeRole && (
                <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                  {recognition.employeeRole}
                </p>
              )}
            </div>
          </div>
          <div
            className="px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
            style={{ backgroundColor: config.bgColor }}
          >
            <span style={{ color: config.color }}>{config.icon}</span>
            {!compact && (
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: config.color }}>
                {config.label}
              </span>
            )}
          </div>
        </div>

        {/* Achievement Title */}
        <div>
          <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--color-text-primary)' }}>
            {recognition.achievementTitle}
          </p>
          {!compact && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {recognition.achievementDescription}
            </p>
          )}
        </div>

        {/* Business Impact */}
        {recognition.businessImpact && !compact && (
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Business Impact:
            </p>
            <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
              {recognition.businessImpact}
            </p>
          </div>
        )}

        {/* Skills */}
        {recognition.skillsDemonstrated && recognition.skillsDemonstrated.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1">
            {recognition.skillsDemonstrated.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                {skill}
              </span>
            ))}
            {recognition.skillsDemonstrated.length > 3 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  color: 'var(--color-text-tertiary)'
                }}
              >
                +{recognition.skillsDemonstrated.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <p>By {recognition.recognizedByName}</p>
            <p>{formatDate(recognition.recognitionDate)}</p>
          </div>
          {recognition.rewardsGiven && recognition.rewardsGiven.length > 0 && (
            <div className="flex items-center gap-1">
              <Gift className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {recognition.rewardsGiven.length} reward{recognition.rewardsGiven.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </ThemedCard>
  );
};

export default RecognitionDashboard;
