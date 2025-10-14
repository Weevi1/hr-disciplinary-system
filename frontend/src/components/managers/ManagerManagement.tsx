// ManagerManagement.tsx
// 👥 MANAGER MANAGEMENT CONTAINER
// Main component for managing managers in the organization

import React, { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useManagers } from '../../hooks/managers/useManagers';
import { ManagerStats } from './ManagerStats';
import { ManagerTable } from './ManagerTable';
import { ManagerDetailsModal } from './ManagerDetailsModal';
import { PromoteToManagerModal } from './PromoteToManagerModal';
import { DemoteManagerModal } from './DemoteManagerModal';
import { UserPlus, Search, AlertTriangle } from 'lucide-react';
import ManagerService, { Manager } from '../../services/ManagerService';
import DepartmentService from '../../services/DepartmentService';
import Logger from '../../utils/logger';

export const ManagerManagement: React.FC = () => {
  const { organization } = useOrganization();
  const {
    managers,
    stats,
    loading,
    error,
    refreshManagers,
    promoteEmployee,
    demoteManager,
    updateManagerDepartments,
    archiveManager
  } = useManagers(organization?.id);

  // Modal state
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'hr-manager' | 'hod-manager'>('all');

  // Filter managers based on search and role
  const filteredManagers = managers.filter(manager => {
    const matchesSearch =
      `${manager.firstName} ${manager.lastName} ${manager.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || manager.role.id === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleViewDetails = (manager: Manager) => {
    setSelectedManager(manager);
    setShowDetailsModal(true);
  };

  const handleEdit = (manager: Manager) => {
    setSelectedManager(manager);
    setShowDetailsModal(true);
  };

  const handleDemote = (manager: Manager) => {
    setSelectedManager(manager);
    setShowDemoteModal(true);
  };

  const handleArchive = async (manager: Manager) => {
    if (!confirm(`Are you sure you want to archive ${manager.firstName} ${manager.lastName}? This will deactivate their account.`)) {
      return;
    }

    try {
      const reason = prompt('Please provide a reason for archiving this manager:');
      if (!reason) return;

      await archiveManager(manager.id, reason);
      Logger.success('Manager archived successfully');
    } catch (error) {
      Logger.error('Failed to archive manager:', error);
      alert('Failed to archive manager. Please try again.');
    }
  };

  const handlePromoteEmployee = async (
    employeeId: string,
    role: 'hr-manager' | 'hod-manager',
    departmentIds?: string[]
  ) => {
    try {
      await promoteEmployee(employeeId, role, departmentIds);
      Logger.success('Employee promoted to manager successfully');
    } catch (error) {
      Logger.error('Failed to promote employee:', error);
      throw error;
    }
  };

  const handleDemoteManager = async (managerId: string, replacementManagerId?: string) => {
    try {
      await demoteManager(managerId, replacementManagerId);
      Logger.success('Manager demoted successfully');
    } catch (error) {
      Logger.error('Failed to demote manager:', error);
      throw error;
    }
  };

  const handleUpdateDepartments = async (managerId: string, departmentIds: string[]) => {
    try {
      await updateManagerDepartments(managerId, departmentIds);

      // Directly fetch the updated manager data from Firestore to avoid React state timing issues
      if (organization?.id) {
        const updatedManager = await ManagerService.getManagerById(organization.id, managerId);
        if (updatedManager) {
          // Load departments to get department names
          const departments = await DepartmentService.getDepartments(organization.id);
          const deptMap = new Map(departments.map(d => [d.id, d.name]));

          // Enhance with department names
          const enhancedManager = {
            ...updatedManager,
            departmentNames: updatedManager.departmentIds
              ?.map(id => deptMap.get(id))
              .filter(Boolean) as string[] || []
          };

          setSelectedManager(enhancedManager);
        }
      }

      Logger.success('Manager departments updated successfully');
    } catch (error) {
      Logger.error('Failed to update departments:', error);
      throw error;
    }
  };

  if (loading && managers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading managers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Action Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manager Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage manager roles, departments, and employee assignments
          </p>
        </div>
        <button
          onClick={() => setShowPromoteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Promote Employee
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <ManagerStats stats={stats} loading={loading} />

      {/* Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search managers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="hr-manager">HR Managers</option>
            <option value="hod-manager">HOD Managers</option>
          </select>
        </div>

        {/* Results Count */}
        {searchTerm || roleFilter !== 'all' ? (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredManagers.length} of {managers.length} managers
          </div>
        ) : null}
      </div>

      {/* Manager Table */}
      <ManagerTable
        managers={filteredManagers}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDemote={handleDemote}
        onArchive={handleArchive}
      />

      {/* Promote Employee Modal */}
      {showPromoteModal && (
        <PromoteToManagerModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          onPromote={handlePromoteEmployee}
        />
      )}

      {/* Manager Details Modal */}
      {showDetailsModal && selectedManager && (
        <ManagerDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedManager(null);
          }}
          manager={selectedManager}
          onUpdate={handleUpdateDepartments}
        />
      )}

      {/* Demote Manager Modal */}
      {showDemoteModal && selectedManager && (
        <DemoteManagerModal
          isOpen={showDemoteModal}
          onClose={() => {
            setShowDemoteModal(false);
            setSelectedManager(null);
          }}
          manager={selectedManager}
          onDemote={handleDemoteManager}
          availableManagers={managers.filter(m => m.id !== selectedManager.id)}
        />
      )}
    </div>
  );
};
