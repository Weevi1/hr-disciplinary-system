// frontend/src/components/employees/EmployeeFilters.tsx
import React from 'react';
import type { EmployeeFilters as Filters } from '../../types';

interface EmployeeFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  departments: string[];
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  setFilters,
  departments,
  viewMode,
  setViewMode
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search employees by name, number, or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <select
            value={filters.contractType}
            onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Contract Types</option>
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-2 border-gray-200">
            <input
              type="checkbox"
              checked={filters.hasWarnings}
              onChange={(e) => setFilters({ ...filters, hasWarnings: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="font-medium text-gray-700">Has Warnings</span>
          </label>

          <label className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-2 border-gray-200">
            <input
              type="checkbox"
              checked={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="font-medium text-gray-700">Active Only</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                viewMode === 'cards' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📱 Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
