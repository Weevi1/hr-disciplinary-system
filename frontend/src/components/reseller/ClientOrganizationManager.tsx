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
  Crown,
  Palette,
  Upload,
  Trash2,
  Eye,
  Globe,
  Hash,
  Monitor,
  RotateCcw,
  Type,
  Smartphone,
  AlertTriangle,
  MessageCircle,
  UserX,
  Award,
  ChevronRight,
  Quote
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { OrganizationCategoriesViewer } from '../organization/OrganizationCategoriesViewer';
import {
  ManagerMiniPreview, HRMiniPreview, ExecutiveMiniPreview,
  ManagerPhonePreview, HRPhonePreview, ExecutivePhonePreview
} from './DashboardPreviewPanels';
import { PDFTemplatePreview } from '../admin/PDFTemplatePreview';
import { DataService } from '../../services/DataService';
import { ShardedDataService } from '../../services/ShardedDataService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { PDFTemplateService } from '../../services/PDFTemplateService';
import Logger from '../../utils/logger';
import type { Organization, PDFTemplateSettings, DashboardThemeSettings } from '../../types/core';

interface ClientOrganizationManagerProps {
  client: Organization;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (clientId: string, updates: Partial<Organization>) => Promise<void>;
}

type TabType = 'general' | 'branding' | 'categories' | 'analytics';

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
    email: (client as any).email || '',       // Business email (PDF letterhead)
    phone: (client as any).phone || '',       // Business phone (PDF letterhead)
    address: client.address || '',
    industry: client.industry || '',
    description: client.description || '',
    registrationNumber: client.branding?.registrationNumber || '',
    vatNumber: client.branding?.vatNumber || '',
    website: client.branding?.website || '',
  });

  // Branding form data
  const [brandingData, setBrandingData] = useState({
    primaryColor: client.branding?.primaryColor || '#3b82f6',
    secondaryColor: client.branding?.secondaryColor || '#6366f1',
    accentColor: client.branding?.accentColor || '#10b981',
    tagline: client.branding?.tagline || '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(client.branding?.logo || '');
  const [savingBranding, setSavingBranding] = useState(false);

  // PDF settings state (lazy-loaded)
  const [pdfSettings, setPdfSettings] = useState<PDFTemplateSettings | null>(null);
  const [pdfSettingsLoaded, setPdfSettingsLoaded] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Dashboard theme state
  const [dashTheme, setDashTheme] = useState<DashboardThemeSettings>(client.dashboardTheme || {});
  const [dashPreviewView, setDashPreviewView] = useState<'manager' | 'hr' | 'executive'>('manager');
  const [showDashPreview, setShowDashPreview] = useState<'manager' | 'hr' | 'executive' | null>(null);

  // Update form data when client changes
  useEffect(() => {
    console.log('📊 Client data received:', client);
    console.log('📊 Client.industry:', client.industry);
    console.log('📊 Client.sector:', (client as any).sector);
    setFormData({
      name: client.name || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      email: (client as any).email || '',
      phone: (client as any).phone || '',
      address: client.address || '',
      industry: client.industry || (client as any).sector || '',
      description: client.description || '',
      registrationNumber: client.branding?.registrationNumber || '',
      vatNumber: client.branding?.vatNumber || '',
      website: client.branding?.website || '',
    });
    setBrandingData({
      primaryColor: client.branding?.primaryColor || '#3b82f6',
      secondaryColor: client.branding?.secondaryColor || '#6366f1',
      accentColor: client.branding?.accentColor || '#10b981',
      tagline: client.branding?.tagline || '',
    });
    setLogoPreview(client.branding?.logo || '');
    setLogoFile(null);
    // Reset PDF settings so they reload on next tab open
    setPdfSettings(client.pdfSettings || null);
    setPdfSettingsLoaded(!!client.pdfSettings);
    // Reset dashboard theme
    setDashTheme(client.dashboardTheme || {});
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

      // Save general fields + company identifiers (stored under branding.*)
      const { registrationNumber, vatNumber, website, ...generalFields } = formData;
      await onUpdate(client.id, {
        ...generalFields,
        branding: {
          ...client.branding,
          registrationNumber,
          vatNumber,
          website,
        }
      });

      Logger.success('Client information updated successfully');
    } catch (error) {
      Logger.error('Failed to update client information:', error);
    } finally {
      setSaving(false);
    }
  };

  // --- Branding handlers ---

  /**
   * Optimize image client-side: resize to max 800px, convert to WebP, compress.
   * 800px is enough for 150 DPI print across full A4 content width (~170mm).
   * Falls back to PNG if WebP isn't supported. Returns a Blob ready for upload.
   */
  const optimizeLogo = (file: File): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 400;
        let { width, height } = img;

        // Scale down if larger than max dimensions
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);

        // Store as WebP for small file size. jsPDF can't read WebP, but
        // prepareLogoForPDF() converts to PNG via canvas at PDF render time.
        // Fall back to PNG if browser doesn't support WebP encoding.
        const tryFormat = (format: string, quality?: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size > 0) {
                const dataUrl = canvas.toDataURL(format, quality);
                resolve({ blob, dataUrl });
              } else if (format === 'image/webp') {
                tryFormat('image/png');
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            format,
            quality
          );
        };
        tryFormat('image/webp', 0.9);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
      img.src = objectUrl;
    });
  };

  const [logoStatus, setLogoStatus] = useState<{ state: 'idle' | 'optimizing' | 'done' | 'error'; message?: string }>({ state: 'idle' });

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('Please upload a PNG, JPG, WebP, or SVG image.');
      return;
    }
    // Validate size (10MB raw — will be optimized before upload)
    if (file.size > 10 * 1024 * 1024) {
      alert('Logo must be under 10MB.');
      return;
    }

    const originalSize = file.size;
    const originalFormat = file.type.split('/')[1].toUpperCase();
    setLogoStatus({ state: 'optimizing', message: `Optimizing ${originalFormat} (${formatBytes(originalSize)})...` });

    try {
      const { blob, dataUrl } = await optimizeLogo(file);
      const ext = blob.type === 'image/webp' ? 'webp' : 'png';
      const optimizedFile = new File([blob], `logo.${ext}`, { type: blob.type });
      setLogoFile(optimizedFile);
      setLogoPreview(dataUrl);

      const outputFormat = ext.toUpperCase();
      const saved = originalSize > blob.size ? Math.round((1 - blob.size / originalSize) * 100) : 0;
      setLogoStatus({
        state: 'done',
        message: `Converted to ${outputFormat} (${formatBytes(blob.size)})${saved > 0 ? ` — ${saved}% smaller` : ''}`
      });
      // Clear the success message after 6 seconds
      setTimeout(() => setLogoStatus({ state: 'idle' }), 6000);
    } catch (error) {
      console.error('Logo optimization failed, using original:', error);
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      setLogoStatus({ state: 'error', message: 'Optimization failed — using original file' });
      setTimeout(() => setLogoStatus({ state: 'idle' }), 4000);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const loadPdfSettingsIfNeeded = () => {
    if (!pdfSettingsLoaded) {
      const defaults = PDFTemplateService.getDefaultSettings('reseller');
      setPdfSettings(client.pdfSettings || defaults);
      setPdfSettingsLoaded(true);
    }
  };

  const updatePdfSetting = (path: string, value: any) => {
    if (!pdfSettings) return;
    const keys = path.split('.');
    const newSettings = { ...pdfSettings };
    let current: any = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setPdfSettings(newSettings as PDFTemplateSettings);
  };

  const handleBrandingSave = async () => {
    try {
      setSavingBranding(true);

      let logoUrl = logoPreview;

      // Upload optimized logo if new file selected
      if (logoFile) {
        const timestamp = Date.now();
        const ext = logoFile.name.split('.').pop() || 'png';
        const storageRef = ref(storage, `organizations/${client.id}/logos/logo-${timestamp}.${ext}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
        setLogoFile(null);
      }

      // Clean dashboard theme — remove empty strings so Firestore doesn't store blanks
      const cleanedTheme = JSON.parse(JSON.stringify(dashTheme, (_, v) => v === '' ? undefined : v));
      const hasDashTheme = Object.keys(cleanedTheme).length > 0;

      // Update organization branding (company identifiers saved via General Info tab)
      await onUpdate(client.id, {
        branding: {
          ...client.branding,
          logo: logoUrl || null,
          primaryColor: brandingData.primaryColor,
          secondaryColor: brandingData.secondaryColor,
          accentColor: brandingData.accentColor,
          tagline: brandingData.tagline,
        },
        dashboardTheme: hasDashTheme ? cleanedTheme : undefined,
      } as Partial<Organization>);

      // Save PDF settings if modified
      if (pdfSettings && pdfSettingsLoaded) {
        await PDFTemplateService.saveTemplate(client.id, pdfSettings, 'reseller');
      }

      Logger.success('Branding & CI saved successfully');
    } catch (error) {
      Logger.error('Failed to save branding:', error);
      alert('Failed to save branding changes. Please try again.');
    } finally {
      setSavingBranding(false);
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
      id: 'branding' as TabType,
      label: 'Branding & CI',
      icon: Palette,
      description: 'Logo, brand colors, and PDF document settings'
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

              {/* Business Details — appear on PDF letterhead */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-4">These details appear on the company PDF letterhead and generated warnings.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="info@company.co.za"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
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

              {/* Company Identifiers */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-4">Company registration details shown on the PDF header.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2026/071559/07"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VAT Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 4020123456"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.co.za"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding & CI Tab */}
          {activeTab === 'branding' && (() => {
            loadPdfSettingsIfNeeded();
            return (
            <div className="p-6 space-y-8">

              {/* Section A: Logo & Brand Colors */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Logo & Brand Colors</h3>
                  </div>
                  <button
                    onClick={handleBrandingSave}
                    disabled={savingBranding}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {savingBranding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingBranding ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Logo + Company Name Row */}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-xs">No logo</span>
                          </div>
                        )}
                        {logoStatus.state === 'optimizing' && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <label className={`flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-100 ${logoStatus.state === 'optimizing' ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="w-3 h-3" />
                          Upload
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoSelect} className="hidden" disabled={logoStatus.state === 'optimizing'} />
                        </label>
                        {logoPreview && (
                          <button onClick={handleRemoveLogo} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                      {logoStatus.state !== 'idle' && (
                        <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                          logoStatus.state === 'optimizing' ? 'text-blue-600' :
                          logoStatus.state === 'done' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {logoStatus.state === 'optimizing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {logoStatus.state === 'done' && <CheckCircle className="w-3 h-3" />}
                          {logoStatus.message}
                        </div>
                      )}
                      {logoStatus.state === 'idle' && (
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP or SVG. Max 10MB.</p>
                      )}
                    </div>

                    {/* Company Name & Tagline */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={client.branding?.companyName || client.name || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">Edit on General Info tab</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline / Slogan</label>
                        <input
                          type="text"
                          value={brandingData.tagline}
                          onChange={(e) => setBrandingData({ ...brandingData, tagline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., Building excellence since 2010"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Brand Colors</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Primary */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={brandingData.primaryColor}
                            onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={brandingData.primaryColor}
                            onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            placeholder="#3b82f6"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Buttons, headers</p>
                      </div>
                      {/* Secondary */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Secondary Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={brandingData.secondaryColor}
                            onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={brandingData.secondaryColor}
                            onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            placeholder="#6366f1"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Secondary UI elements</p>
                      </div>
                      {/* Accent */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={brandingData.accentColor}
                            onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={brandingData.accentColor}
                            onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            placeholder="#10b981"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Badges, highlights</p>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Preview
                    </label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header bar */}
                      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: brandingData.primaryColor }}>
                        {logoPreview && <img src={logoPreview} alt="Logo" className="h-8 w-auto" />}
                        <span className="text-white font-semibold text-sm">{client.branding?.companyName || client.name}</span>
                        {brandingData.tagline && <span className="text-white/70 text-xs hidden md:block">— {brandingData.tagline}</span>}
                      </div>
                      {/* Sample buttons */}
                      <div className="px-4 py-3 bg-white flex items-center gap-3 flex-wrap">
                        <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: brandingData.primaryColor }}>
                          Primary Button
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: brandingData.secondaryColor }}>
                          Secondary Button
                        </button>
                        <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: brandingData.accentColor }}>
                          Badge
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section C: Dashboard Appearance */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard Appearance</h3>
                  </div>
                  <button
                    onClick={() => setDashTheme({})}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to Defaults
                  </button>
                </div>

                <div className="p-6 space-y-6">

                  {/* ── Shared Settings (always visible) ── */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Shared Settings</h4>

                    {/* Greeting Banner */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Greeting Banner Gradient</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={dashTheme.greetingBanner?.gradientStart || '#3b82f6'}
                              onChange={(e) => setDashTheme({ ...dashTheme, greetingBanner: { ...dashTheme.greetingBanner, gradientStart: e.target.value } })}
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                            <input type="text" value={dashTheme.greetingBanner?.gradientStart || ''}
                              onChange={(e) => setDashTheme({ ...dashTheme, greetingBanner: { ...dashTheme.greetingBanner, gradientStart: e.target.value } })}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#3b82f6" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={dashTheme.greetingBanner?.gradientEnd || '#6366f1'}
                              onChange={(e) => setDashTheme({ ...dashTheme, greetingBanner: { ...dashTheme.greetingBanner, gradientEnd: e.target.value } })}
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                            <input type="text" value={dashTheme.greetingBanner?.gradientEnd || ''}
                              onChange={(e) => setDashTheme({ ...dashTheme, greetingBanner: { ...dashTheme.greetingBanner, gradientEnd: e.target.value } })}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#6366f1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Bar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Top Navigation Bar</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Background</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={dashTheme.topBar?.background || '#ffffff'}
                              onChange={(e) => setDashTheme({ ...dashTheme, topBar: { ...dashTheme.topBar, background: e.target.value } })}
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                            <input type="text" value={dashTheme.topBar?.background || ''}
                              onChange={(e) => setDashTheme({ ...dashTheme, topBar: { ...dashTheme.topBar, background: e.target.value } })}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#ffffff" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={dashTheme.topBar?.textColor || '#111827'}
                              onChange={(e) => setDashTheme({ ...dashTheme, topBar: { ...dashTheme.topBar, textColor: e.target.value } })}
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                            <input type="text" value={dashTheme.topBar?.textColor || ''}
                              onChange={(e) => setDashTheme({ ...dashTheme, topBar: { ...dashTheme.topBar, textColor: e.target.value } })}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#111827" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Page Background + Font Family */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Page Background</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={dashTheme.pageBackground || '#ffffff'}
                            onChange={(e) => setDashTheme({ ...dashTheme, pageBackground: e.target.value })}
                            className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                          <input type="text" value={dashTheme.pageBackground || ''}
                            onChange={(e) => setDashTheme({ ...dashTheme, pageBackground: e.target.value })}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#ffffff" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Type className="w-4 h-4 inline mr-1" />
                          Font Family
                        </label>
                        <select
                          value={dashTheme.fontFamily || ''}
                          onChange={(e) => setDashTheme({ ...dashTheme, fontFamily: (e.target.value || undefined) as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        >
                          <optgroup label="Sans-Serif">
                            <option value="">Default (Inter)</option>
                            <option value="Inter">Inter</option>
                            <option value="Poppins">Poppins</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Raleway">Raleway</option>
                            <option value="Lato">Lato</option>
                            <option value="Quicksand">Quicksand</option>
                            <option value="Space Grotesk">Space Grotesk</option>
                          </optgroup>
                          <optgroup label="Condensed">
                            <option value="Oswald">Oswald</option>
                          </optgroup>
                          <optgroup label="Serif">
                            <option value="Merriweather">Merriweather</option>
                            <option value="Playfair Display">Playfair Display</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* Button Shape */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Button Shape</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { value: 'flat' as const, label: 'Flat', radius: '0px' },
                          { value: 'rounded' as const, label: 'Rounded', radius: '12px' },
                          { value: 'pill' as const, label: 'Pill', radius: '9999px' },
                        ]).map((shape) => (
                          <button
                            key={shape.value}
                            type="button"
                            onClick={() => setDashTheme({ ...dashTheme, buttonShape: shape.value })}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              (dashTheme.buttonShape || 'rounded') === shape.value
                                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex justify-center mb-2">
                              <div className="w-20 h-8 bg-emerald-500" style={{ borderRadius: shape.radius }} />
                            </div>
                            <div className="text-xs font-medium text-gray-800">{shape.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="border-t border-gray-200" />

                  {/* ── View Switcher Pills ── */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Dashboard-Specific Settings</h4>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      {([
                        { key: 'manager' as const, label: 'Manager / HOD' },
                        { key: 'hr' as const, label: 'HR' },
                        { key: 'executive' as const, label: 'Executive' },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDashPreviewView(tab.key)}
                          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                            dashPreviewView === tab.key
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Manager View ── */}
                  {dashPreviewView === 'manager' && (
                    <div className="space-y-6">
                      {/* Action Button Colors */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Action Button Colors</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {([
                            { key: 'issueWarning' as const, label: 'Issue Warning', fallback: '#f59e0b' },
                            { key: 'hrMeeting' as const, label: 'HR Meeting', fallback: '#6366f1' },
                            { key: 'reportAbsence' as const, label: 'Report Absence', fallback: '#ef4444' },
                            { key: 'recognition' as const, label: 'Recognition', fallback: '#10b981' },
                          ]).map((btn) => (
                            <div key={btn.key}>
                              <label className="block text-xs text-gray-500 mb-1">{btn.label}</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={dashTheme.actionButtons?.[btn.key] || btn.fallback}
                                  onChange={(e) => setDashTheme({ ...dashTheme, actionButtons: { ...dashTheme.actionButtons, [btn.key]: e.target.value } })}
                                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                                <input type="text" value={dashTheme.actionButtons?.[btn.key] || ''}
                                  onChange={(e) => setDashTheme({ ...dashTheme, actionButtons: { ...dashTheme.actionButtons, [btn.key]: e.target.value } })}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder={btn.fallback} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Navigation Card Colors */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Navigation Card Colors</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Team Members Card</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={dashTheme.navCards?.teamMembers || '#ffffff'}
                                onChange={(e) => setDashTheme({ ...dashTheme, navCards: { ...dashTheme.navCards, teamMembers: e.target.value } })}
                                className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                              <input type="text" value={dashTheme.navCards?.teamMembers || ''}
                                onChange={(e) => setDashTheme({ ...dashTheme, navCards: { ...dashTheme.navCards, teamMembers: e.target.value } })}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#ffffff (default)" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">General Nav Cards</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={dashTheme.navCards?.general || '#ffffff'}
                                onChange={(e) => setDashTheme({ ...dashTheme, navCards: { ...dashTheme.navCards, general: e.target.value } })}
                                className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                              <input type="text" value={dashTheme.navCards?.general || ''}
                                onChange={(e) => setDashTheme({ ...dashTheme, navCards: { ...dashTheme.navCards, general: e.target.value } })}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="#ffffff (default)" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manager Mini Preview */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Live Preview
                        </label>
                        <ManagerMiniPreview dashTheme={dashTheme} clientName={client.branding?.companyName || client.name} logoPreview={logoPreview} brandingData={brandingData} />
                      </div>

                      <button type="button" onClick={() => setShowDashPreview('manager')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors text-sm font-medium">
                        <Smartphone className="w-5 h-5" />
                        Preview Manager Dashboard (Mobile View)
                      </button>
                    </div>
                  )}

                  {/* ── HR View ── */}
                  {dashPreviewView === 'hr' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Metric Card Colors</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {([
                            { key: 'absenceReports' as const, label: 'Absence Reports', fallback: '#ef4444' },
                            { key: 'meetingRequests' as const, label: 'Meeting Requests', fallback: '#14b8a6' },
                            { key: 'activeWarnings' as const, label: 'Active Warnings', fallback: '#f59e0b' },
                            { key: 'reviewFollowups' as const, label: 'Review Follow-ups', fallback: '#14b8a6' },
                            { key: 'totalEmployees' as const, label: 'Total Employees', fallback: '#22c55e' },
                          ]).map((mc) => (
                            <div key={mc.key}>
                              <label className="block text-xs text-gray-500 mb-1">{mc.label}</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={dashTheme.hrDashboard?.metricColors?.[mc.key] || mc.fallback}
                                  onChange={(e) => setDashTheme({
                                    ...dashTheme,
                                    hrDashboard: { ...dashTheme.hrDashboard, metricColors: { ...dashTheme.hrDashboard?.metricColors, [mc.key]: e.target.value } }
                                  })}
                                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                                <input type="text" value={dashTheme.hrDashboard?.metricColors?.[mc.key] || ''}
                                  onChange={(e) => setDashTheme({
                                    ...dashTheme,
                                    hrDashboard: { ...dashTheme.hrDashboard, metricColors: { ...dashTheme.hrDashboard?.metricColors, [mc.key]: e.target.value } }
                                  })}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder={mc.fallback} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* HR Mini Preview */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Live Preview
                        </label>
                        <HRMiniPreview dashTheme={dashTheme} clientName={client.branding?.companyName || client.name} />
                      </div>

                      <button type="button" onClick={() => setShowDashPreview('hr')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors text-sm font-medium">
                        <Smartphone className="w-5 h-5" />
                        Preview HR Dashboard (Mobile View)
                      </button>
                    </div>
                  )}

                  {/* ── Executive View ── */}
                  {dashPreviewView === 'executive' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Metric Card Colors</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {([
                            { key: 'totalEmployees' as const, label: 'Total Employees', fallback: '#22c55e' },
                            { key: 'activeWarnings' as const, label: 'Active Warnings', fallback: '#f59e0b' },
                            { key: 'highPriority' as const, label: 'High Priority', fallback: '#ef4444' },
                            { key: 'departments' as const, label: 'Departments', fallback: '#3b82f6' },
                          ]).map((mc) => (
                            <div key={mc.key}>
                              <label className="block text-xs text-gray-500 mb-1">{mc.label}</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={dashTheme.executiveDashboard?.metricColors?.[mc.key] || mc.fallback}
                                  onChange={(e) => setDashTheme({
                                    ...dashTheme,
                                    executiveDashboard: { ...dashTheme.executiveDashboard, metricColors: { ...dashTheme.executiveDashboard?.metricColors, [mc.key]: e.target.value } }
                                  })}
                                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
                                <input type="text" value={dashTheme.executiveDashboard?.metricColors?.[mc.key] || ''}
                                  onChange={(e) => setDashTheme({
                                    ...dashTheme,
                                    executiveDashboard: { ...dashTheme.executiveDashboard, metricColors: { ...dashTheme.executiveDashboard?.metricColors, [mc.key]: e.target.value } }
                                  })}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder={mc.fallback} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Executive Mini Preview */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Live Preview
                        </label>
                        <ExecutiveMiniPreview dashTheme={dashTheme} clientName={client.branding?.companyName || client.name} />
                      </div>

                      <button type="button" onClick={() => setShowDashPreview('executive')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors text-sm font-medium">
                        <Smartphone className="w-5 h-5" />
                        Preview Executive Dashboard (Mobile View)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section B: PDF Document Settings */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">PDF Document Branding</h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* PDF Header Settings */}
                  {pdfSettings && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">PDF Header</label>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={pdfSettings.content.showLogo}
                              onChange={(e) => updatePdfSetting('content.showLogo', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Show logo on PDF documents</span>
                          </label>

                          {/* Header Layout Picker */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Header Layout</label>
                            <div className="grid grid-cols-3 gap-3">
                              {([
                                { value: 'stacked' as const, label: 'Stacked', desc: 'Logo centered above name' },
                                { value: 'classic' as const, label: 'Classic', desc: 'Logo left, text right' },
                                { value: 'banner' as const, label: 'Banner', desc: 'Colored band with logo' },
                              ]).map((layout) => (
                                <button
                                  key={layout.value}
                                  type="button"
                                  onClick={() => updatePdfSetting('content.headerLayout', layout.value)}
                                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    (pdfSettings.content.headerLayout || 'stacked') === layout.value
                                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                                >
                                  {/* Mini thumbnail */}
                                  <div className="w-full h-16 mb-2 rounded border border-gray-200 overflow-hidden bg-gray-50 flex flex-col">
                                    {layout.value === 'stacked' && (
                                      <>
                                        <div className="flex justify-center pt-1.5">
                                          <div className="w-6 h-3 bg-gray-300 rounded-sm" />
                                        </div>
                                        <div className="flex justify-center mt-1">
                                          <div className="w-12 h-1.5 bg-blue-400 rounded-sm" />
                                        </div>
                                        <div className="flex justify-center mt-0.5">
                                          <div className="w-10 h-1 bg-gray-300 rounded-sm" />
                                        </div>
                                        <div className="mx-3 mt-1.5 h-0.5 bg-blue-400" />
                                      </>
                                    )}
                                    {layout.value === 'classic' && (
                                      <div className="flex pt-2 px-2 gap-2">
                                        <div className="w-5 h-5 bg-gray-300 rounded-sm flex-shrink-0" />
                                        <div className="flex flex-col gap-0.5 pt-0.5">
                                          <div className="w-10 h-1.5 bg-blue-400 rounded-sm" />
                                          <div className="w-8 h-1 bg-gray-300 rounded-sm" />
                                          <div className="w-6 h-1 bg-gray-300 rounded-sm" />
                                        </div>
                                      </div>
                                    )}
                                    {layout.value === 'banner' && (
                                      <div className="bg-blue-500 h-8 flex items-center px-2 gap-1.5">
                                        <div className="w-4 h-4 bg-white/40 rounded-sm flex-shrink-0" />
                                        <div className="flex flex-col gap-0.5">
                                          <div className="w-10 h-1.5 bg-white/90 rounded-sm" />
                                          <div className="w-7 h-1 bg-white/60 rounded-sm" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs font-medium text-gray-800">{layout.label}</div>
                                  <div className="text-[10px] text-gray-500 leading-tight">{layout.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Logo Height Slider */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Logo Height: {pdfSettings.content.logoMaxHeight}mm</label>
                            <input
                              type="range"
                              min={10}
                              max={30}
                              value={pdfSettings.content.logoMaxHeight}
                              onChange={(e) => updatePdfSetting('content.logoMaxHeight', Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Generate Sample PDF Preview */}
                      <div>
                        {!showPdfPreview ? (
                          <button
                            onClick={() => setShowPdfPreview(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-medium"
                          >
                            <FileText className="w-5 h-5" />
                            Generate Sample PDF Preview
                            <span className="text-xs text-blue-400 font-normal ml-1">— see how your branding looks on a real document</span>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-700">
                                <Eye className="w-4 h-4 inline mr-1" />
                                Live PDF Preview
                              </label>
                              <button
                                onClick={() => setShowPdfPreview(false)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Hide preview
                              </button>
                            </div>
                            <PDFTemplatePreview
                              settings={pdfSettings}
                              organization={{
                                ...client,
                                // Business details from General Info (live preview uses current form values)
                                email: formData.email,
                                phone: formData.phone,
                                address: formData.address,
                                branding: {
                                  ...client.branding,
                                  logo: logoPreview || null,
                                  primaryColor: brandingData.primaryColor,
                                  secondaryColor: brandingData.secondaryColor,
                                  accentColor: brandingData.accentColor,
                                  tagline: brandingData.tagline,
                                  registrationNumber: formData.registrationNumber,
                                  vatNumber: formData.vatNumber,
                                  website: formData.website,
                                  // PDF generator reads branding.colors.primary for header
                                  colors: {
                                    primary: brandingData.primaryColor,
                                    secondary: brandingData.secondaryColor,
                                    accent: brandingData.accentColor,
                                  },
                                } as any,
                                // PDF generator reads organization.registrationNumber at top level
                                registrationNumber: formData.registrationNumber,
                                pdfSettings: pdfSettings,
                              } as Organization}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            );
          })()}

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

      {/* Dashboard Phone-Frame Preview Modals */}
      {showDashPreview === 'manager' && (
        <ManagerPhonePreview
          dashTheme={dashTheme} brandingData={brandingData} logoPreview={logoPreview}
          clientName={client.branding?.companyName || client.name || 'Company'}
          onClose={() => setShowDashPreview(null)}
        />
      )}
      {showDashPreview === 'hr' && (
        <HRPhonePreview
          dashTheme={dashTheme} brandingData={brandingData} logoPreview={logoPreview}
          clientName={client.branding?.companyName || client.name || 'Company'}
          onClose={() => setShowDashPreview(null)}
        />
      )}
      {showDashPreview === 'executive' && (
        <ExecutivePhonePreview
          dashTheme={dashTheme} brandingData={brandingData} logoPreview={logoPreview}
          clientName={client.branding?.companyName || client.name || 'Company'}
          onClose={() => setShowDashPreview(null)}
        />
      )}
    </div>
  );
};