// frontend/src/components/admin/ResellerManagement.tsx
// Provincial reseller network management

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Edit3,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Building,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import Logger from '../../utils/logger';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import { EncryptionService } from '../../services/EncryptionService';
import { PIIAccessLogger } from '../../services/PIIAccessLogger';
import type { Reseller, SouthAfricanProvince } from '../../types/billing';
import { SA_PROVINCES } from '../../types/billing';

interface ResellerWithMetrics extends Reseller {
  metrics: {
    totalClients: number;
    monthlyRecurringRevenue: number;
    totalCommissions: number;
    averageClientValue: number;
    monthlyGrowth: number;
  };
}

export const ResellerManagement: React.FC = () => {
  const [resellers, setResellers] = useState<ResellerWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<SouthAfricanProvince | 'all'>('all');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    province: 'gauteng' as SouthAfricanProvince,
    territory: [] as string[],
    commissionRate: 0.50,
    bankDetails: {
      accountHolder: '',
      bank: '',
      accountNumber: '',
      branchCode: ''
    }
  });

  useEffect(() => {
    loadResellers();
  }, []);

  const loadResellers = async () => {
    try {
      setLoading(true);
      Logger.debug('Loading resellers with metrics...');

      const allResellers = await DataService.getAllResellers();
      
      // Load metrics for each reseller
      const resellersWithMetrics = await Promise.all(
        allResellers.map(async (reseller) => {
          const metrics = await CommissionService.getResellerMetrics(reseller.id);
          return { ...reseller, metrics };
        })
      );

      setResellers(resellersWithMetrics);
      Logger.success(`Loaded ${resellersWithMetrics.length} resellers`);

    } catch (error) {
      Logger.error('Failed to load resellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      Logger.debug('Adding new reseller...', formData);

      // Log PII access for compliance
      await PIIAccessLogger.logBankingAccess('new-reseller', 'edit', 'Creating new reseller account');

      // Encrypt sensitive banking details before storing
      const encryptedBankDetails = EncryptionService.encryptBankingDetails(formData.bankDetails);

      const newReseller: Omit<Reseller, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        province: formData.province,
        territory: formData.territory,
        commissionRate: formData.commissionRate,
        isActive: true,
        bankDetails: encryptedBankDetails, // Encrypted banking details
        clientIds: [],
        totalClientsAcquired: 0,
        monthlyRecurringRevenue: 0,
        totalCommissionsEarned: 0
      };

      // Step 1: Create reseller profile
      const resellerId = await DataService.createReseller(newReseller);
      
      // Step 2: Use Cloud Function to create Firebase Auth user without disrupting session
      try {
        // Try to call cloud function to create user account (preferred method)
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../../config/firebase');
        
        const createResellerUser = httpsCallable(functions, 'createResellerUser');
        
        await createResellerUser({
          email: formData.email,
          password: 'temp123',
          displayName: `${formData.firstName} ${formData.lastName}`,
          resellerId: resellerId,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        
        Logger.success('Reseller user account created via Cloud Function');
        
      } catch (cloudFunctionError) {
        Logger.warn('Cloud Function not available, using fallback method:', cloudFunctionError);
        
        // Fallback: Show user that Cloud Function failed and provide manual instructions
        Logger.error('Cannot create user account automatically due to CORS restriction');
        
        // Show user a message about manual account creation
        alert(`
RESELLER CREATED SUCCESSFULLY!

However, the user account creation failed due to browser security restrictions.

Please create the Firebase Auth account manually:
1. Go to Firebase Console > Authentication > Users  
2. Add user: ${formData.email}
3. Password: temp123
4. Display name: ${formData.firstName} ${formData.lastName}

Or the reseller can register at the login page with their email and the password 'temp123'.

The reseller profile has been saved successfully with ID: ${resellerId}
        `.trim());
        
        Logger.warn('Manual user account creation required for:', formData.email);
      }
      
      Logger.success('Reseller and user account created successfully:', { resellerId, email: formData.email });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        province: 'gauteng',
        territory: [],
        commissionRate: 0.50,
        bankDetails: {
          accountHolder: '',
          bank: '',
          accountNumber: '',
          branchCode: ''
        }
      });
      
      setShowAddForm(false);
      
      // Refresh the reseller list after a short delay
      setTimeout(async () => {
        try {
          await loadResellers();
        } catch (error) {
          Logger.warn('Could not reload resellers automatically, refresh page manually');
        }
      }, 2000);

    } catch (error) {
      Logger.error('Failed to add reseller:', error);
    }
  };

  const handleUpdateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingReseller) return;

    try {
      Logger.debug('Updating reseller...', { id: editingReseller.id, formData });

      // Log PII access for compliance
      await PIIAccessLogger.logBankingAccess(editingReseller.id, 'edit', 'Updating reseller banking details');

      // Encrypt sensitive banking details before storing
      const encryptedBankDetails = EncryptionService.encryptBankingDetails(formData.bankDetails);

      await DataService.updateReseller(editingReseller.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        province: formData.province,
        territory: formData.territory,
        commissionRate: formData.commissionRate,
        bankDetails: encryptedBankDetails, // Encrypted banking details
        updatedAt: new Date().toISOString()
      });

      Logger.success('Reseller updated successfully');
      
      setEditingReseller(null);
      await loadResellers();

    } catch (error) {
      Logger.error('Failed to update reseller:', error);
    }
  };

  const startEditReseller = async (reseller: Reseller) => {
    try {
      // Log PII access for compliance
      await PIIAccessLogger.logBankingAccess(reseller.id, 'view', 'Editing reseller details');

      // Decrypt banking details for editing
      const decryptedBankDetails = EncryptionService.decryptBankingDetails(reseller.bankDetails);

      setEditingReseller(reseller);
      setFormData({
        firstName: reseller.firstName,
        lastName: reseller.lastName,
        email: reseller.email,
        phone: reseller.phone,
        province: reseller.province,
        territory: reseller.territory,
        commissionRate: reseller.commissionRate,
        bankDetails: decryptedBankDetails // Show decrypted data for editing
      });
      setShowAddForm(true);
    } catch (error) {
      Logger.error('Failed to decrypt banking details:', error);
      // Show error to user or provide fallback
      alert('Error loading banking details. Please contact support.');
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingReseller(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      province: 'gauteng',
      territory: [],
      commissionRate: 0.50,
      bankDetails: {
        accountHolder: '',
        bank: '',
        accountNumber: '',
        branchCode: ''
      }
    });
  };

  const toggleResellerStatus = async (reseller: Reseller) => {
    try {
      await DataService.updateReseller(reseller.id, {
        isActive: !reseller.isActive,
        updatedAt: new Date().toISOString()
      });
      
      Logger.success(`Reseller ${reseller.isActive ? 'deactivated' : 'activated'}`);
      await loadResellers();

    } catch (error) {
      Logger.error('Failed to toggle reseller status:', error);
    }
  };

  const getFilteredResellers = () => {
    if (selectedProvince === 'all') {
      return resellers;
    }
    return resellers.filter(r => r.province === selectedProvince);
  };

  const formatCurrency = (amountInCents: number): string => {
    return `R${(amountInCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const getProvinceStats = () => {
    const stats: Record<string, { resellers: number; clients: number; revenue: number }> = {};
    
    for (const reseller of resellers) {
      const province = reseller.province;
      if (!stats[province]) {
        stats[province] = { resellers: 0, clients: 0, revenue: 0 };
      }
      
      stats[province].resellers++;
      stats[province].clients += reseller.metrics.totalClients;
      stats[province].revenue += reseller.metrics.monthlyRecurringRevenue;
    }
    
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reseller network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reseller Network</h2>
          <p className="text-gray-600">Manage your provincial sales network</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Add Reseller
        </button>
      </div>

      {/* Province Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by Province:</label>
        <select
          value={selectedProvince}
          onChange={e => setSelectedProvince(e.target.value as SouthAfricanProvince | 'all')}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Provinces</option>
          {Object.entries(SA_PROVINCES).map(([key, province]) => (
            <option key={key} value={key}>{province.name}</option>
          ))}
        </select>
      </div>

      {/* Province Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(getProvinceStats())
          .sort(([,a], [,b]) => b.revenue - a.revenue)
          .slice(0, 5)
          .map(([province, stats]) => (
          <div key={province} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-sm">{SA_PROVINCES[province as SouthAfricanProvince]?.name}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Resellers:</span>
                <span className="font-semibold">{stats.resellers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clients:</span>
                <span className="font-semibold">{stats.clients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-semibold">{formatCurrency(stats.revenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resellers Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Resellers ({getFilteredResellers().length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reseller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredResellers().map((reseller) => (
                <tr key={reseller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">
                        {reseller.firstName} {reseller.lastName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {reseller.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {reseller.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {SA_PROVINCES[reseller.province]?.name}
                      </span>
                    </div>
                    {reseller.territory.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {reseller.territory.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">{reseller.metrics.totalClients}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatCurrency(reseller.metrics.averageClientValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-semibold">
                        {formatCurrency(reseller.metrics.monthlyRecurringRevenue)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{reseller.metrics.monthlyGrowth}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold">
                      {(reseller.commissionRate * 100).toFixed(0)}%
                    </span>
                    <div className="text-xs text-gray-500">
                      Earned: {formatCurrency(reseller.metrics.totalCommissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleResellerStatus(reseller)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        reseller.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {reseller.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => startEditReseller(reseller)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getFilteredResellers().length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No resellers found</p>
              <p className="text-sm text-gray-500">
                {selectedProvince !== 'all' 
                  ? `No resellers in ${SA_PROVINCES[selectedProvince as SouthAfricanProvince]?.name}`
                  : 'Add your first reseller to start building your network'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Reseller Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingReseller ? 'Edit Reseller' : 'Add New Reseller'}
                </h3>
                <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {!editingReseller && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>ℹ️ Account Creation:</strong> A user account will be created with email login and password <code className="bg-blue-100 px-1 rounded">temp123</code>. 
                    The reseller should change this on first login.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={editingReseller ? handleUpdateReseller : handleAddReseller} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                  <select
                    value={formData.province}
                    onChange={e => setFormData(prev => ({ ...prev, province: e.target.value as SouthAfricanProvince }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(SA_PROVINCES).map(([key, province]) => (
                      <option key={key} value={key}>{province.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate</label>
                  <select
                    value={formData.commissionRate}
                    onChange={e => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0.50">50% (Standard)</option>
                    <option value="0.45">45%</option>
                    <option value="0.40">40%</option>
                    <option value="0.35">35%</option>
                  </select>
                </div>
              </div>

              {/* Banking Details */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold mb-4">Banking Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountHolder}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, accountHolder: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                    <select
                      value={formData.bankDetails.bank}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, bank: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select bank</option>
                      <option value="ABSA">ABSA</option>
                      <option value="Standard Bank">Standard Bank</option>
                      <option value="FirstNational Bank">FirstNational Bank</option>
                      <option value="Nedbank">Nedbank</option>
                      <option value="Capitec">Capitec</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                    <input
                      type="text"
                      value={formData.bankDetails.branchCode}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, branchCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingReseller ? 'Update Reseller' : 'Add Reseller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};