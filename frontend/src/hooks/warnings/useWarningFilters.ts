// frontend/src/hooks/warnings/useWarningFilters.ts
// 🏆 WARNING FILTERS HOOK - MATCHES useEmployeeFilters PATTERN EXACTLY

import { useState, useMemo } from 'react';
import type { Warning, WarningFilters } from '../../types';
import type { User } from '../../types';

export const useWarningFilters = (warnings: Warning[], user: User | null) => {
  const [filters, setFilters] = useState<WarningFilters>({
    search: '',
    category: '',
    severity: '',
    status: '',
    dateRange: {
      start: '',
      end: ''
    },
    issuedBy: ''
  });

  // Filter warnings based on current filters and user permissions
  const filteredWarnings = useMemo(() => {
    let filtered = warnings;

    // First, apply role-based filtering (matches employee management pattern)
    if (user) {
      switch (user.role.id) {
        case 'hod-manager':
          // HOD managers can only see warnings they issued
          filtered = filtered.filter(warning => warning.issuedBy === user.id);
          break;
        case 'hr-manager':
        case 'business-owner':
        case 'super-user':
          // These roles can see all warnings
          break;
        default:
          // Unknown roles see nothing
          filtered = [];
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(warning => {
        // Search in category, description, employee info (if available)
        return (
          warning.category.toLowerCase().includes(searchLower) ||
          warning.description.toLowerCase().includes(searchLower) ||
          warning.incident.location.toLowerCase().includes(searchLower) ||
          warning.incident.description.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(warning => warning.category === filters.category);
    }

    // Apply severity filter
    if (filters.severity) {
      filtered = filtered.filter(warning => warning.level === filters.severity);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(warning => warning.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(warning => warning.createdAt >= startDate);
    }

    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter(warning => warning.createdAt <= endDate);
    }

    // Apply issued by filter
    if (filters.issuedBy) {
      filtered = filtered.filter(warning => warning.issuedBy === filters.issuedBy);
    }

    return filtered;
  }, [warnings, filters, user]);

  // Get unique values for filter dropdowns (matches employee pattern)
  const filterOptions = useMemo(() => {
    const categories = [...new Set(warnings.map(w => w.category))].sort();
    const severities = [...new Set(warnings.map(w => w.level))].sort();
    const statuses = [...new Set(warnings.map(w => w.status))].sort();
    const issuers = [...new Set(warnings.map(w => w.issuedBy))];

    return {
      categories,
      severities,
      statuses,
      issuers
    };
  }, [warnings]);

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      severity: '',
      status: '',
      dateRange: {
        start: '',
        end: ''
      },
      issuedBy: ''
    });
  };

  // Update individual filter
  const updateFilter = <K extends keyof WarningFilters>(
    key: K,
    value: WarningFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filteredWarnings,
    filterOptions
  };
};
