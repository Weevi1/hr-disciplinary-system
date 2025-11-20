// frontend/src/components/reseller/MyClients.tsx
// Client management interface for resellers

import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Edit3,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Rocket
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import { ClientOrganizationManager } from './ClientOrganizationManager';
import { ClientSummaryModal } from './ClientSummaryModal';
import type { Organization } from '../../types/core';

interface ClientWithMetrics extends Organization {
  metrics: {
    monthlyRevenue: number;
    employeeCount: number;
    lastActivity: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
    warningsThisMonth: number;
  };
}

interface MyClientsProps {
  onDeployClient?: () => void;
}

export const MyClients: React.FC<MyClientsProps> = ({ onDeployClient }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [showClientManager, setShowClientManager] = useState(false);
  const [showClientSummary, setShowClientSummary] = useState(false);
  const [viewClient, setViewClient] = useState<ClientWithMetrics | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;

  useEffect(() => {
    if (user?.resellerId) {
      loadClients();
    }
  }, [user?.resellerId]);

  const loadClients = async () => {
    if (!user?.resellerId) return;
    
    try {
      setLoading(true);
      Logger.debug('Loading reseller clients...', { resellerId: user.resellerId });

      const clientOrgs = await DataService.getResellerClients(user.resellerId);

      // Load metrics for each client (pass client data to avoid refetching)
      const clientsWithMetrics = await Promise.all(
        clientOrgs.map(async (client) => {
          const metrics = await CommissionService.getClientMetrics(client.id, client);
          return { ...client, metrics };
        })
      );

      setClients(clientsWithMetrics);
      Logger.success(`Loaded ${clientsWithMetrics.length} clients`);

    } catch (error) {
      Logger.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || client.metrics.subscriptionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const startIndex = (currentPage - 1) * clientsPerPage;
  const endIndex = startIndex + clientsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleUpdateClient = async (clientId: string, updates: Partial<Organization>) => {
    try {
      Logger.debug('Updating client information...', { clientId, updates });
      
      await DataService.updateOrganization(clientId, updates);
      
      Logger.success('Client updated successfully');
      await loadClients();
      setShowClientManager(false);
      setSelectedClient(null);
      
    } catch (error) {
      Logger.error('Failed to update client:', error);
    }
  };

  const formatCurrency = (amountInCents: number): string => {
    return `R${(amountInCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'trial': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar with Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {onDeployClient && (
            <button
              onClick={onDeployClient}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
            >
              <Rocket className="w-4 h-4" />
              Deploy New Client
            </button>
          )}
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filteredClients.length} of {clients.length} clients
          </span>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{client.sector}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {client.metrics.employeeCount} employees
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{client.contactEmail || 'Not provided'}</span>
                      </div>
                      <div className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{client.contactPhone || 'Not provided'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.metrics.subscriptionStatus)}`}>
                      {client.metrics.subscriptionStatus === 'active' && <CheckCircle className="w-3 h-3" />}
                      {client.metrics.subscriptionStatus === 'inactive' && <AlertCircle className="w-3 h-3" />}
                      {client.metrics.subscriptionStatus === 'trial' && <Calendar className="w-3 h-3" />}
                      {client.metrics.subscriptionStatus.charAt(0).toUpperCase() + client.metrics.subscriptionStatus.slice(1)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Last active: {new Date(client.metrics.lastActivity).toLocaleDateString('en-ZA')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(client.metrics.monthlyRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">per month</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{client.metrics.warningsThisMonth}</span>
                      <span className="text-gray-500"> warnings</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      this month
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowClientManager(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Manage client organization"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setViewClient(client);
                          setShowClientSummary(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="View organization summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No clients found</p>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Your client organizations will appear here'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} clients
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`
                          px-3 py-1 border rounded text-sm transition-colors
                          ${page === currentPage
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Organization Manager */}
      {selectedClient && (
        <ClientOrganizationManager
          client={selectedClient}
          isOpen={showClientManager}
          onClose={() => {
            setShowClientManager(false);
            setSelectedClient(null);
          }}
          onUpdate={handleUpdateClient}
        />
      )}

      {/* Client Summary Modal */}
      {viewClient && (
        <ClientSummaryModal
          client={viewClient}
          isOpen={showClientSummary}
          onClose={() => {
            setShowClientSummary(false);
            setViewClient(null);
          }}
        />
      )}
    </div>
  );
};