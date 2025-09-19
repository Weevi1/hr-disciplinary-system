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
  Filter
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import { ClientOrganizationManager } from './ClientOrganizationManager';
import type { Organization } from '../../types/core';

interface ClientWithMetrics extends Organization {
  metrics: {
    monthlyRevenue: number;
    employeeCount: number;
    lastActivity: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
    warningsThisMonth: number;
    complianceScore: number;
  };
}

export const MyClients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'trial'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [showClientManager, setShowClientManager] = useState(false);

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
      
      // Load metrics for each client
      const clientsWithMetrics = await Promise.all(
        clientOrgs.map(async (client) => {
          const metrics = await CommissionService.getClientMetrics(client.id);
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Clients</h2>
          <p className="text-gray-600">Manage your client organizations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {filteredClients.length} of {clients.length} clients
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Client Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Active Clients</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {clients.filter(c => c.metrics.subscriptionStatus === 'active').length}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="font-medium">Monthly Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(clients.reduce((sum, c) => sum + c.metrics.monthlyRevenue, 0))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="font-medium">Total Employees</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {clients.reduce((sum, c) => sum + c.metrics.employeeCount, 0)}
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Client Organizations</h3>
        </div>

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
              {filteredClients.map((client) => (
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
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="font-medium">{client.metrics.complianceScore}%</span>
                        <span className="text-gray-500"> compliance</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {client.metrics.warningsThisMonth} warnings this month
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
                        onClick={() => window.open(`/organizations/${client.id}`, '_blank')}
                        className="text-green-600 hover:text-green-800"
                        title="View organization"
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
    </div>
  );
};