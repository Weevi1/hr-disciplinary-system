// frontend/src/components/reseller/ClientOrganizationManager.tsx
// Enhanced client organization management modal for resellers

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Settings,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Calendar,
  TrendingUp,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit3,
  Target,
  Tags,
  Crown
} from 'lucide-react';
import { OrganizationCategoriesViewer } from '../organization/OrganizationCategoriesViewer';
import { DataService } from '../../services/DataService';
import { ShardedDataService } from '../../services/ShardedDataService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import Logger from '../../utils/logger';
import type { Organization } from '../../types/core';

interface ClientOrganizationManagerProps {
  client: Organization;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (clientId: string, updates: Partial<Organization>) => Promise<void>;
}

type TabType = 'general' | 'categories' | 'analytics';

export const ClientOrganizationManager: React.FC<ClientOrganizationManagerProps> = ({
  client,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalWarnings: 0,
    totalCategories: 0,
    totalUsers: 0
  });

  // Form data for general tab
  const [formData, setFormData] = useState({
    name: client.name || '',
    contactEmail: client.contactEmail || '',
    contactPhone: client.contactPhone || '',
    address: client.address || '',
    industry: client.industry || '',
    description: client.description || ''
  });

  // Update form data when client changes
  useEffect(() => {
    console.log('📊 Client data received:', client);
    console.log('📊 Client.industry:', client.industry);
    console.log('📊 Client.sector:', (client as any).sector);
    setFormData({
      name: client.name || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      address: client.address || '',
      industry: client.industry || (client as any).sector || '',
      description: client.description || ''
    });
  }, [client]);

  // Load organization statistics
  useEffect(() => {
    if (isOpen && client.id) {
      loadClientStats();
    }
  }, [isOpen, client.id]);

  const loadClientStats = async () => {
    try {
      setLoading(true);
      Logger.debug('Loading client organization statistics...', { clientId: client.id });

      // Load employees
      const employeesResult = await ShardedDataService.loadEmployees(client.id);

      // Load warnings
      const warningsResult = await ShardedDataService.loadWarnings(client.id);

      // Load categories
      const categoriesResult = await DatabaseShardingService.queryDocuments(client.id, 'categories', []);

      // Calculate stats
      setStats({
        totalEmployees: employeesResult.documents.length,
        totalWarnings: warningsResult.documents.length,
        totalCategories: categoriesResult.documents.length,
        totalUsers: 0 // TODO: Load from sharded users collection
      });

      Logger.success('Client statistics loaded successfully');
    } catch (error: any) {
      // Permission errors are expected for resellers accessing client data
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        Logger.debug('Client statistics unavailable (expected for resellers - using defaults)');
        // Set default stats when permission denied
        setStats({
          totalEmployees: 0,
          totalWarnings: 0,
          totalCategories: 0,
          totalUsers: 0
        });
      } else {
        Logger.error('Failed to load client statistics:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralInfoUpdate = async () => {
    try {
      setSaving(true);
      Logger.debug('Updating client general information...', formData);

      await onUpdate(client.id, formData);

      Logger.success('Client information updated successfully');
    } catch (error) {
      Logger.error('Failed to update client information:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: 'general' as TabType,
      label: 'General Info',
      icon: Building2,
      description: 'Basic organization details'
    },
    {
      id: 'categories' as TabType,
      label: 'Warning Categories',
      icon: Tags,
      description: 'Manage warning categories and escalation paths'
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Performance metrics and insights'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                Client Organization Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</div>
              <div className="text-xs text-gray-600">Employees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalCategories}</div>
              <div className="text-xs text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalWarnings}</div>
              <div className="text-xs text-gray-600">Total Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-xs text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>

          {/* General Info Tab */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
                  <p className="text-sm text-gray-600">Update basic organization information</p>
                </div>
                <button
                  onClick={handleGeneralInfoUpdate}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>

                    {/* Primary Industries */}
                    <optgroup label="Primary Industries">
                      <option value="agriculture">Agriculture & Farming</option>
                      <option value="mining">Mining & Quarrying</option>
                      <option value="forestry">Forestry & Logging</option>
                      <option value="fishing">Fishing & Aquaculture</option>
                    </optgroup>

                    {/* Manufacturing & Production */}
                    <optgroup label="Manufacturing & Production">
                      <option value="manufacturing">Manufacturing (General)</option>
                      <option value="food-processing">Food & Beverage Processing</option>
                      <option value="textiles">Textiles & Clothing</option>
                      <option value="automotive">Automotive Manufacturing</option>
                      <option value="pharmaceuticals">Pharmaceuticals & Medical Devices</option>
                      <option value="chemicals">Chemicals & Plastics</option>
                      <option value="electronics">Electronics & Technology Manufacturing</option>
                      <option value="construction-materials">Construction Materials</option>
                    </optgroup>

                    {/* Construction & Engineering */}
                    <optgroup label="Construction & Engineering">
                      <option value="construction">Construction & Building</option>
                      <option value="civil-engineering">Civil Engineering</option>
                      <option value="electrical-engineering">Electrical Engineering</option>
                      <option value="mechanical-engineering">Mechanical Engineering</option>
                      <option value="architecture">Architecture & Design</option>
                    </optgroup>

                    {/* Retail & Wholesale */}
                    <optgroup label="Retail & Wholesale">
                      <option value="retail">Retail & Commerce (General)</option>
                      <option value="wholesale">Wholesale & Distribution</option>
                      <option value="supermarkets">Supermarkets & Grocery</option>
                      <option value="fashion-retail">Fashion & Apparel Retail</option>
                      <option value="automotive-retail">Automotive Sales & Service</option>
                      <option value="furniture-retail">Furniture & Home Goods</option>
                      <option value="electronics-retail">Electronics & Appliances Retail</option>
                    </optgroup>

                    {/* Hospitality & Tourism */}
                    <optgroup label="Hospitality & Tourism">
                      <option value="hospitality">Hospitality & Tourism</option>
                      <option value="hotels">Hotels & Accommodation</option>
                      <option value="restaurants">Restaurants & Food Service</option>
                      <option value="travel-agencies">Travel Agencies & Tour Operators</option>
                      <option value="entertainment">Entertainment & Recreation</option>
                    </optgroup>

                    {/* Healthcare & Social Services */}
                    <optgroup label="Healthcare & Social Services">
                      <option value="healthcare">Healthcare (General)</option>
                      <option value="hospitals">Hospitals & Clinics</option>
                      <option value="nursing-homes">Nursing Homes & Elderly Care</option>
                      <option value="medical-practices">Medical Practices & Specialists</option>
                      <option value="veterinary">Veterinary Services</option>
                      <option value="social-services">Social Services & NGOs</option>
                    </optgroup>

                    {/* Education & Training */}
                    <optgroup label="Education & Training">
                      <option value="education">Education & Training</option>
                      <option value="schools">Schools & Colleges</option>
                      <option value="universities">Universities & Higher Education</option>
                      <option value="vocational-training">Vocational & Skills Training</option>
                      <option value="childcare">Childcare & Early Learning</option>
                    </optgroup>

                    {/* Financial Services */}
                    <optgroup label="Financial Services">
                      <option value="banking">Banking & Financial Services</option>
                      <option value="insurance">Insurance</option>
                      <option value="investment">Investment & Asset Management</option>
                      <option value="accounting">Accounting & Auditing</option>
                      <option value="real-estate">Real Estate & Property Management</option>
                    </optgroup>

                    {/* Professional Services */}
                    <optgroup label="Professional Services">
                      <option value="legal">Legal Services</option>
                      <option value="consulting">Consulting & Advisory</option>
                      <option value="marketing">Marketing & Advertising</option>
                      <option value="hr-recruitment">HR & Recruitment</option>
                      <option value="business-services">Business Support Services</option>
                    </optgroup>

                    {/* Technology & Communications */}
                    <optgroup label="Technology & Communications">
                      <option value="it-services">IT Services & Software</option>
                      <option value="telecommunications">Telecommunications</option>
                      <option value="media">Media & Broadcasting</option>
                      <option value="publishing">Publishing & Printing</option>
                      <option value="data-centers">Data Centers & Cloud Services</option>
                    </optgroup>

                    {/* Transportation & Logistics */}
                    <optgroup label="Transportation & Logistics">
                      <option value="logistics">Logistics & Supply Chain</option>
                      <option value="transportation">Transportation & Freight</option>
                      <option value="warehousing">Warehousing & Storage</option>
                      <option value="courier">Courier & Postal Services</option>
                      <option value="aviation">Aviation & Airports</option>
                      <option value="maritime">Maritime & Shipping</option>
                    </optgroup>

                    {/* Energy & Utilities */}
                    <optgroup label="Energy & Utilities">
                      <option value="energy">Energy & Power Generation</option>
                      <option value="renewable-energy">Renewable Energy</option>
                      <option value="water-utilities">Water & Sanitation</option>
                      <option value="waste-management">Waste Management & Recycling</option>
                    </optgroup>

                    {/* Security & Emergency Services */}
                    <optgroup label="Security & Emergency Services">
                      <option value="security">Security Services</option>
                      <option value="private-security">Private Security & Guarding</option>
                      <option value="emergency-services">Emergency Services</option>
                      <option value="fire-safety">Fire Safety & Protection</option>
                    </optgroup>

                    {/* Government & Public Sector */}
                    <optgroup label="Government & Public Sector">
                      <option value="government">Government & Public Administration</option>
                      <option value="municipal">Municipal Services</option>
                      <option value="public-utilities">Public Utilities</option>
                    </optgroup>

                    {/* Other */}
                    <optgroup label="Other">
                      <option value="sports">Sports & Fitness</option>
                      <option value="beauty-wellness">Beauty & Wellness</option>
                      <option value="cleaning">Cleaning & Facilities Management</option>
                      <option value="maintenance">Maintenance & Repair Services</option>
                      <option value="other">Other Industry</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@organization.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full business address"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Warning Categories Tab */}
          {activeTab === 'categories' && (
            <OrganizationCategoriesViewer
              onClose={() => {}}
              inline={true}
              organizationId={client.id}
              organizationName={client.name}
              allowEdit={true}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
                <p className="text-sm text-gray-600">Insights and metrics for this client organization</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Warnings Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Active Warnings</h4>
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600">{stats.activeWarnings}</div>
                  <p className="text-sm text-gray-600 mt-2">
                    Out of {stats.totalWarnings} total warnings
                  </p>
                </div>

                {/* Employee Count Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Total Employees</h4>
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</div>
                  <p className="text-sm text-gray-600 mt-2">
                    Managed workforce
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Recommendations</h4>
                <div className="space-y-3">
                  {stats.activeWarnings > 5 && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-orange-900">High Active Warnings</h5>
                        <p className="text-sm text-orange-700">Consider reviewing and resolving active warnings to improve workforce management.</p>
                      </div>
                    </div>
                  )}

                  {stats.totalCategories < 5 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Target className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-blue-900">Limited Warning Categories</h5>
                        <p className="text-sm text-blue-700">Consider adding more specific warning categories to improve HR management granularity.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};