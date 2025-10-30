// frontend/src/components/reseller/ClientSummaryModal.tsx
// Modal to display detailed client organization summary

import React from 'react';
import {
  Building,
  Users,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
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

interface ClientSummaryModalProps {
  client: ClientWithMetrics;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientSummaryModal: React.FC<ClientSummaryModalProps> = ({
  client,
  isOpen,
  onClose
}) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      case 'trial': return <Calendar className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Organization Summary"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
            <p className="text-gray-600">{client.sector}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.metrics.subscriptionStatus)}`}>
                {getStatusIcon(client.metrics.subscriptionStatus)}
                {client.metrics.subscriptionStatus.charAt(0).toUpperCase() + client.metrics.subscriptionStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Employees</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{client.metrics.employeeCount}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(client.metrics.monthlyRevenue)}
            </div>
            <div className="text-xs text-green-700 mt-1">per month</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Warnings</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {client.metrics.warningsThisMonth}
            </div>
            <div className="text-xs text-purple-700 mt-1">this month</div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Contact Information</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-medium text-gray-900">
                  {client.contactEmail || 'Not provided'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm font-medium text-gray-900">
                  {client.contactPhone || 'Not provided'}
                </div>
              </div>
            </div>

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500">Address</div>
                  <div className="text-sm font-medium text-gray-900">
                    {client.address}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Activity</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Last Activity</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(client.metrics.lastActivity).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Details */}
        {client.registrationNumber && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Organization Details</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Registration Number</div>
              <div className="text-sm font-medium text-gray-900 mt-1">
                {client.registrationNumber}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
