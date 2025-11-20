// frontend/src/components/admin/EnhancedOrganizationWizard.tsx
// Revenue-first Organization Wizard with Stripe payment integration

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Users,
  MapPin,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  X,
  Search
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';
import StripeService from '../../services/StripeService';
import { DataService } from '../../services/DataService';
import { ShardedOrganizationService } from '../../services/ShardedOrganizationService';
import DepartmentService from '../../services/DepartmentService';
import { UNIVERSAL_SA_CATEGORIES } from '../../services/UniversalCategories';
import type {
  SubscriptionTier,
  SouthAfricanProvince,
  Reseller
} from '../../types/billing';
import { SUBSCRIPTION_PLANS, SA_PROVINCES } from '../../types/billing';
import type { WarningLevel, SeverityLevel } from '../../types/core';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { Z_INDEX } from '../../constants/zIndex';

interface OrganizationCategory {
  id: string;
  name: string;
  description: string;
  level: WarningLevel;
  color: string;
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  escalationPath?: WarningLevel[];
}

// Convert universal categories to OrganizationCategory format
const getDefaultCategories = (): OrganizationCategory[] => {
  const severityColors = {
    'minor': '#10b981', // green
    'serious': '#f59e0b', // amber
    'gross_misconduct': '#ef4444' // red
  };

  return UNIVERSAL_SA_CATEGORIES.map(universalCat => ({
    id: universalCat.id,
    name: universalCat.name,
    description: universalCat.description,
    icon: universalCat.icon,
    level: universalCat.escalationPath[0] || 'verbal', // Start with first step of escalation path
    color: severityColors[universalCat.severity],
    isActive: true,
    isDefault: true, // Mark as default so they can be edited but show as defaults
    escalationPath: universalCat.escalationPath
  }));
};

// Warning level display names
const WARNING_LEVEL_NAMES: Record<WarningLevel, string> = {
  'counselling': 'Counselling',
  'verbal': 'Verbal Warning',
  'first_written': 'Written Warning',
  'second_written': 'Second Written Warning',
  'final_written': 'Final Written Warning',
  'suspension': 'Suspension',
  'dismissal': 'Ending of Service'
};

// Industry/Sector options organized by category
const INDUSTRY_OPTIONS = [
  { group: 'Primary Industries', options: [
    { value: 'agriculture', label: 'Agriculture & Farming' },
    { value: 'mining', label: 'Mining & Quarrying' },
    { value: 'forestry', label: 'Forestry & Logging' },
    { value: 'fishing', label: 'Fishing & Aquaculture' }
  ]},
  { group: 'Manufacturing & Production', options: [
    { value: 'manufacturing', label: 'Manufacturing (General)' },
    { value: 'food-processing', label: 'Food & Beverage Processing' },
    { value: 'textiles', label: 'Textiles & Clothing' },
    { value: 'automotive', label: 'Automotive Manufacturing' },
    { value: 'pharmaceuticals', label: 'Pharmaceuticals & Medical Devices' },
    { value: 'chemicals', label: 'Chemicals & Plastics' },
    { value: 'electronics', label: 'Electronics & Technology Manufacturing' },
    { value: 'construction-materials', label: 'Construction Materials' }
  ]},
  { group: 'Construction & Engineering', options: [
    { value: 'construction', label: 'Construction & Building' },
    { value: 'civil-engineering', label: 'Civil Engineering' },
    { value: 'electrical-engineering', label: 'Electrical Engineering' },
    { value: 'mechanical-engineering', label: 'Mechanical Engineering' },
    { value: 'architecture', label: 'Architecture & Design' }
  ]},
  { group: 'Retail & Wholesale', options: [
    { value: 'retail', label: 'Retail & Commerce (General)' },
    { value: 'wholesale', label: 'Wholesale & Distribution' },
    { value: 'supermarkets', label: 'Supermarkets & Grocery' },
    { value: 'fashion-retail', label: 'Fashion & Apparel Retail' },
    { value: 'automotive-retail', label: 'Automotive Sales & Service' },
    { value: 'furniture-retail', label: 'Furniture & Home Goods' },
    { value: 'electronics-retail', label: 'Electronics & Appliances Retail' }
  ]},
  { group: 'Hospitality & Tourism', options: [
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'hotels', label: 'Hotels & Accommodation' },
    { value: 'restaurants', label: 'Restaurants & Food Service' },
    { value: 'travel-agencies', label: 'Travel Agencies & Tour Operators' },
    { value: 'entertainment', label: 'Entertainment & Recreation' }
  ]},
  { group: 'Healthcare & Social Services', options: [
    { value: 'healthcare', label: 'Healthcare (General)' },
    { value: 'hospitals', label: 'Hospitals & Clinics' },
    { value: 'nursing-homes', label: 'Nursing Homes & Elderly Care' },
    { value: 'medical-practices', label: 'Medical Practices & Specialists' },
    { value: 'veterinary', label: 'Veterinary Services' },
    { value: 'social-services', label: 'Social Services & NGOs' }
  ]},
  { group: 'Education & Training', options: [
    { value: 'education', label: 'Education & Training' },
    { value: 'schools', label: 'Schools & Colleges' },
    { value: 'universities', label: 'Universities & Higher Education' },
    { value: 'vocational-training', label: 'Vocational & Skills Training' },
    { value: 'childcare', label: 'Childcare & Early Learning' }
  ]},
  { group: 'Financial Services', options: [
    { value: 'banking', label: 'Banking & Financial Services' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'investment', label: 'Investment & Asset Management' },
    { value: 'accounting', label: 'Accounting & Auditing' },
    { value: 'real-estate', label: 'Real Estate & Property Management' }
  ]},
  { group: 'Professional Services', options: [
    { value: 'legal', label: 'Legal Services' },
    { value: 'consulting', label: 'Consulting & Advisory' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'hr-recruitment', label: 'HR & Recruitment' },
    { value: 'business-services', label: 'Business Support Services' }
  ]},
  { group: 'Technology & Communications', options: [
    { value: 'it-services', label: 'IT Services & Software' },
    { value: 'telecommunications', label: 'Telecommunications' },
    { value: 'media', label: 'Media & Broadcasting' },
    { value: 'publishing', label: 'Publishing & Printing' },
    { value: 'data-centers', label: 'Data Centers & Cloud Services' }
  ]},
  { group: 'Transportation & Logistics', options: [
    { value: 'logistics', label: 'Logistics & Supply Chain' },
    { value: 'transportation', label: 'Transportation & Freight' },
    { value: 'warehousing', label: 'Warehousing & Storage' },
    { value: 'courier', label: 'Courier & Postal Services' },
    { value: 'aviation', label: 'Aviation & Airports' },
    { value: 'maritime', label: 'Maritime & Shipping' }
  ]},
  { group: 'Energy & Utilities', options: [
    { value: 'energy', label: 'Energy & Power Generation' },
    { value: 'renewable-energy', label: 'Renewable Energy' },
    { value: 'water-utilities', label: 'Water & Sanitation' },
    { value: 'waste-management', label: 'Waste Management & Recycling' }
  ]},
  { group: 'Security & Emergency Services', options: [
    { value: 'security', label: 'Security Services' },
    { value: 'private-security', label: 'Private Security & Guarding' },
    { value: 'emergency-services', label: 'Emergency Services' },
    { value: 'fire-safety', label: 'Fire Safety & Protection' }
  ]},
  { group: 'Government & Public Sector', options: [
    { value: 'government', label: 'Government & Public Administration' },
    { value: 'municipal', label: 'Municipal Services' },
    { value: 'public-utilities', label: 'Public Utilities' }
  ]},
  { group: 'Other', options: [
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'beauty-wellness', label: 'Beauty & Wellness' },
    { value: 'cleaning', label: 'Cleaning & Facilities Management' },
    { value: 'maintenance', label: 'Maintenance & Repair Services' },
    { value: 'other', label: 'Other Industry' }
  ]}
];

// Category Editor Component
interface CategoryEditorProps {
  category: OrganizationCategory;
  onUpdate: (category: OrganizationCategory) => void;
  onRemove: () => void;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({ category, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCategory, setLocalCategory] = useState(category);
  
  // Update local state when category prop changes
  useEffect(() => {
    setLocalCategory(category);
  }, [category]);

  // Update parent when local changes
  const handleLocalUpdate = (updates: Partial<OrganizationCategory>) => {
    const updated = { ...localCategory, ...updates };
    setLocalCategory(updated);
    onUpdate(updated);
  };

  const availableLevels: WarningLevel[] = ['counselling', 'verbal', 'first_written', 'second_written', 'final_written', 'suspension', 'dismissal'];

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon and color indicator */}
          <div className="flex items-center gap-2">
            {localCategory.icon && (
              <span className="text-lg">{localCategory.icon}</span>
            )}
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: localCategory.color }}
            />
          </div>

          {/* Category name and description */}
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {localCategory.name || 'Unnamed Category'}
              {localCategory.isDefault && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Default
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {localCategory.description || 'No description'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Starting level: {WARNING_LEVEL_NAMES[localCategory.level]}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            title={localCategory.isDefault ? "Remove default category" : "Remove custom category"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Expanded editor */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={localCategory.name}
                onChange={(e) => handleLocalUpdate({ name: e.target.value })}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Starting Level</label>
              <select
                value={localCategory.level}
                onChange={(e) => handleLocalUpdate({ level: e.target.value as WarningLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableLevels.map(level => (
                  <option key={level} value={level}>
                    {WARNING_LEVEL_NAMES[level]}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={localCategory.description}
                onChange={(e) => handleLocalUpdate({ description: e.target.value })}
                disabled={false}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
              <input
                type="color"
                value={localCategory.color}
                onChange={(e) => handleLocalUpdate({ color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localCategory.isActive}
                  onChange={(e) => handleLocalUpdate({ isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active Category</span>
              </label>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
            <div className="grid grid-cols-8 gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
              {['📋', '⚠️', '📊', '🔒', '👔', '💼', '🏢', '📞', '🖥️', '📝', '🗂️', '📅', '🔧', '⚡', '🎯', '📈'].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleLocalUpdate({ icon })}
                  className={`w-12 h-12 rounded-lg border-2 text-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-100 ${
                    localCategory.icon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {localCategory.icon && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: <span className="text-lg">{localCategory.icon}</span>
              </div>
            )}
          </div>

          {/* Escalation Path Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Path 
              <span className="text-xs text-gray-500 ml-2">(Add, remove, or duplicate steps)</span>
            </label>
            
            {/* Current Path */}
            <div className="space-y-2 mb-4">
              {localCategory.escalationPath?.map((level, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {WARNING_LEVEL_NAMES[level]}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => {
                        if (index > 0) {
                          const newPath = [...(localCategory.escalationPath || [])];
                          [newPath[index - 1], newPath[index]] = [newPath[index], newPath[index - 1]];
                          handleLocalUpdate({ escalationPath: newPath });
                        }
                      }}
                      disabled={index === 0}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    
                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => {
                        if (index < (localCategory.escalationPath?.length || 0) - 1) {
                          const newPath = [...(localCategory.escalationPath || [])];
                          [newPath[index], newPath[index + 1]] = [newPath[index + 1], newPath[index]];
                          handleLocalUpdate({ escalationPath: newPath });
                        }
                      }}
                      disabled={index === (localCategory.escalationPath?.length || 0) - 1}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    
                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => {
                        const newPath = [...(localCategory.escalationPath || [])];
                        newPath.splice(index + 1, 0, level);
                        handleLocalUpdate({ escalationPath: newPath });
                      }}
                      className="w-6 h-6 flex items-center justify-center text-blue-500 hover:text-blue-700"
                      title="Duplicate this step"
                    >
                      ⧨
                    </button>
                    
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => {
                        const newPath = localCategory.escalationPath?.filter((_, i) => i !== index) || [];
                        handleLocalUpdate({ escalationPath: newPath });
                      }}
                      disabled={(localCategory.escalationPath?.length || 0) <= 1}
                      className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 disabled:opacity-30"
                      title="Remove this step"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Step */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const newPath = [...(localCategory.escalationPath || []), e.target.value as WarningLevel];
                    handleLocalUpdate({ escalationPath: newPath });
                    e.target.value = '';
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                defaultValue=""
              >
                <option value="">Add step...</option>
                {availableLevels.filter(level => level !== 'suspension' && level !== 'dismissal').map(level => (
                  <option key={level} value={level}>
                    {WARNING_LEVEL_NAMES[level]}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                Note: Escalation stops at Final Written. No suspension/dismissal steps needed.
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This shows the progression path for repeated offenses in this category.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface WizardFormData {
  // Step 1: Subscription & Payment
  companyName: string;
  employeeCount: number;
  selectedPlan: SubscriptionTier;
  
  // Step 2: Company Details
  industry: string;
  province: SouthAfricanProvince;
  city: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Step 3: Reseller Assignment
  resellerId: string;
  
  // Step 4: Admin Setup
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Step 5: Customization
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customCategories: OrganizationCategory[];
}

interface EnhancedOrganizationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const EnhancedOrganizationWizard: React.FC<EnhancedOrganizationWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableResellers, setAvailableResellers] = useState<Reseller[]>([]);
  const [showCategoryTemplateSelector, setShowCategoryTemplateSelector] = useState(false);

  // Reseller-specific deployment status
  const [deploymentStatus, setDeploymentStatus] = useState<{
    canDeploy: boolean;
    reason?: string;
    deploymentsThisMonth: number;
    lastDeployment?: Date;
  } | null>(null);

  // Role-based configuration
  const isReseller = user?.role?.id === 'reseller';
  const isSuperUser = user?.role?.id === 'super-user';

  // Debug logging (commented out to reduce console noise)
  // React.useEffect(() => {
  //   if (user) {
  //     Logger.debug('User role detection:', {
  //       userRole: user.role,
  //       isReseller,
  //       isSuperUser,
  //       userId: user.id
  //     });
  //   }
  // }, [user, isReseller, isSuperUser]);

  // Helper function to get current step ID
  const getCurrentStepId = () => steps[currentStep]?.id;
  
  const [formData, setFormData] = useState<WizardFormData>({
    // Step 1: Subscription
    companyName: '',
    employeeCount: 15,
    selectedPlan: 'professional', // Default to most popular

    // Step 2: Company Details
    industry: '',
    province: 'gauteng', // Default to largest market
    city: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',

    // Step 3: Reseller Assignment
    resellerId: '',

    // Step 4: Admin Setup
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',

    // Step 5: Customization
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#6366f1',
    accentColor: '#10b981',
    customCategories: getDefaultCategories()
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [industrySearchOpen, setIndustrySearchOpen] = useState(false);
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Convert JPG to PNG using canvas
  const convertToPng = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle logo file selection
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG or PNG file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload logo to Firebase Storage
  const uploadLogo = async (organizationId: string): Promise<string> => {
    if (!logoFile) return '';

    try {
      setIsUploadingLogo(true);
      Logger.info('📤 Uploading logo...');

      let fileToUpload: Blob = logoFile;

      // Convert JPG to PNG if needed
      if (logoFile.type === 'image/jpeg' || logoFile.type === 'image/jpg') {
        Logger.info('🔄 Converting JPG to PNG...');
        fileToUpload = await convertToPng(logoFile);
      }

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `organizations/${organizationId}/logos/logo-${timestamp}.png`);
      await uploadBytes(storageRef, fileToUpload);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      Logger.success('✅ Logo uploaded successfully');

      return downloadURL;
    } catch (error) {
      Logger.error('Failed to upload logo:', error);
      throw error;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Same steps for everyone - behavior adapts based on role
  const steps = [
    { id: 'subscription', title: 'Subscription & Payment', icon: CreditCard },
    { id: 'company', title: 'Company Details', icon: Building2 },
    { id: 'reseller', title: 'Reseller Assignment', icon: Users },
    { id: 'admin', title: 'Admin Setup', icon: MapPin },
    { id: 'customize', title: 'Customization', icon: Check }
  ];

  // Debug logging for steps (commented out to reduce console noise)
  // React.useEffect(() => {
  //   Logger.debug('Steps configuration:', {
  //     isReseller,
  //     isSuperUser,
  //     stepsCount: steps.length,
  //     steps: steps.map(s => s.id)
  //   });
  // }, [isReseller, isSuperUser, steps]);

  useEffect(() => {
    if (isOpen) {
      // Load resellers for both SuperUsers and Resellers
      loadAvailableResellers();

      if (isReseller) {
        // For resellers, auto-assign themselves and check deployment limits
        setFormData(prev => ({
          ...prev,
          resellerId: user?.resellerId || '' // Use resellerId from user data
        }));
        checkResellerDeploymentStatus();
      }
    }
  }, [isOpen, isSuperUser, isReseller, user]);

  const loadAvailableResellers = async () => {
    try {
      const resellers = await DataService.getAllResellers();
      const activeResellers = resellers.filter(r => r.isActive);

      // Load real client counts for each reseller
      const resellersWithCounts = await Promise.all(
        activeResellers.map(async (reseller) => {
          try {
            const clients = await DataService.getResellerClients(reseller.id);
            // Update the reseller object with actual client count
            return {
              ...reseller,
              clientIds: clients.map(c => c.id) // Update clientIds with real data
            };
          } catch (error) {
            Logger.error(`Failed to load clients for reseller ${reseller.id}:`, error);
            return reseller; // Return original if loading fails
          }
        })
      );

      setAvailableResellers(resellersWithCounts);
      // Logger.debug('Loaded resellers:', { total: resellers.length, active: resellersWithCounts.length, resellers: resellersWithCounts });

      // Auto-select reseller if only one available in selected province
      const provinceResellers = resellersWithCounts.filter(r => r.province === formData.province);
      if (provinceResellers.length === 1) {
        setFormData(prev => ({ ...prev, resellerId: provinceResellers[0].id }));
      }

    } catch (error) {
      Logger.error('Failed to load resellers:', error);
    }
  };

  const checkResellerDeploymentStatus = async () => {
    if (!user?.id || !isReseller) return;

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get reseller's recent deployments
      const recentDeployments = await DataService.getResellerDeployments(
        user.id,
        monthStart
      );

      const deploymentsThisMonth = recentDeployments.length;
      const lastDeployment = recentDeployments.length > 0
        ? new Date(recentDeployments[0].createdAt)
        : undefined;

      // Check monthly limit (10 deployments per month)
      let canDeploy = true;
      let reason: string | undefined;

      if (deploymentsThisMonth >= 10) {
        canDeploy = false;
        reason = `Monthly deployment limit reached (10)`;
      } else if (lastDeployment) {
        // Check rate limit (5 minutes between deployments)
        const minutesSinceLastDeployment = (now.getTime() - lastDeployment.getTime()) / 60000;
        if (minutesSinceLastDeployment < 5) {
          canDeploy = false;
          reason = `Rate limit: Please wait ${Math.ceil(5 - minutesSinceLastDeployment)} minutes between deployments`;
        }
      }

      setDeploymentStatus({
        canDeploy,
        reason,
        deploymentsThisMonth,
        lastDeployment
      });

    } catch (error) {
      Logger.error('Failed to check deployment status:', error);
      setDeploymentStatus({
        canDeploy: false,
        reason: 'Unable to verify deployment status',
        deploymentsThisMonth: 0
      });
    }
  };

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const validateCurrentStep = (): { isValid: boolean; message?: string } => {
    const currentStepId = getCurrentStepId();

    switch (currentStepId) {
      case 'subscription': // Subscription & Payment (SuperUser only)
        if (!formData.companyName.trim()) return { isValid: false, message: 'Company name is required' };
        if (formData.employeeCount < 1) return { isValid: false, message: 'Employee count must be at least 1' };
        return { isValid: true };

      case 'company': // Company Details
        if (!formData.contactFirstName.trim()) return { isValid: false, message: 'Contact first name is required' };
        if (!formData.contactLastName.trim()) return { isValid: false, message: 'Contact last name is required' };
        if (!formData.contactEmail.trim()) return { isValid: false, message: 'Contact email is required' };
        if (!formData.contactPhone.trim()) return { isValid: false, message: 'Contact phone is required' };
        return { isValid: true };

      case 'reseller': // Reseller Assignment (SuperUser only)
        if (!formData.resellerId) return { isValid: false, message: 'Please select a reseller' };
        return { isValid: true };

      case 'admin': // Admin Setup
        if (!formData.adminFirstName.trim()) return { isValid: false, message: 'Admin first name is required' };
        if (!formData.adminLastName.trim()) return { isValid: false, message: 'Admin last name is required' };
        if (!formData.adminEmail.trim()) return { isValid: false, message: 'Admin email is required' };
        // Password validation removed - temp123 is set automatically
        return { isValid: true };

      case 'customize': // Customization
        if (formData.customCategories.length < 3) {
          return { isValid: false, message: 'Please configure at least 3 warning categories before deploying' };
        }
        return { isValid: true };

      default:
        return { isValid: true };
    }
  };

  const handleNext = () => {
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      setError(validation.message || 'Please complete all required fields');
      return;
    }

    // Pre-fill admin fields when leaving step 2 (company details)
    if (getCurrentStepId() === 'company') {
      // Only pre-fill if admin fields are empty
      if (!formData.adminFirstName && !formData.adminLastName && !formData.adminEmail) {
        setFormData(prev => ({
          ...prev,
          adminFirstName: prev.contactFirstName,
          adminLastName: prev.contactLastName,
          adminEmail: prev.contactEmail
        }));
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);

      // Load province-specific resellers when moving to reseller step
      if (getCurrentStepId() === 'reseller') {
        loadAvailableResellers();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleDeploy = async () => {
    try {
      // Check reseller deployment limits
      if (isReseller && deploymentStatus && !deploymentStatus.canDeploy) {
        setError(deploymentStatus.reason || 'Cannot deploy at this time');
        return;
      }

      setIsProcessing(true);
      setError(null);

      Logger.debug('🚀 [DEV MODE] Starting organization deployment with auto-approval...');

      // Step 1: Skip Stripe - Auto-approve organization
      const organizationId = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Upload logo if provided
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        try {
          logoUrl = await uploadLogo(organizationId);
          Logger.success('✅ Logo uploaded and converted to PNG');
        } catch (error) {
          Logger.error('Failed to upload logo:', error);
          // Continue with deployment even if logo upload fails
        }
      }

      // Use predefined password 'temp123' for development
      const devPassword = 'temp123';

      // Step 2: Create organization with sharded structure - ACTIVE from start
      const orgResult = await ShardedOrganizationService.createOrganization({
        id: organizationId,
        name: formData.companyName,
        industry: formData.industry,
        province: formData.province,
        city: formData.city,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        employeeCount: formData.employeeCount,

        subscriptionTier: formData.selectedPlan,
        subscriptionStatus: 'active', // Auto-approve instead of 'pending_payment'
        resellerId: formData.resellerId,

        branding: {
          logoUrl: logoUrl,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor
        },
        
        // Admin user data with predefined password
        adminUser: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.adminEmail,
          password: devPassword, // Use predefined password
          role: 'executive-management'
        },
        
        customCategories: formData.customCategories
      });

      if (!orgResult.success) {
        throw new Error(orgResult.error || 'Failed to create organization');
      }

      Logger.success(`✅ Organization '${formData.companyName}' deployed successfully!`);
      Logger.success(`📧 Admin email: ${formData.adminEmail}`);
      Logger.success(`🔑 Admin password: ${devPassword}`);

      // ⚠️ NOTE: createUserWithEmailAndPassword() auto-signs in the new admin user
      // This means the super-user is no longer authenticated, which may cause
      // permission errors for subsequent operations. The organization IS created successfully.
      //
      // TODO: Move department creation to a cloud function trigger (onCreate organization)
      // to avoid this auth state issue entirely.

      // Create default departments for the new organization
      // Expected to fail due to auth state change (new admin user is now signed in)
      try {
        await DepartmentService.createDefaultDepartments(organizationId);
        Logger.success('✅ Default departments created successfully');
      } catch (deptError) {
        Logger.warn('⚠️ Could not create default departments (expected due to auth state)');
        Logger.info('💡 Business owner will be prompted to create departments on first login');
        // Don't fail the whole deployment - organization was created successfully
      }

      // For resellers, log the deployment for audit trail and rate limiting
      if (isReseller && user?.id) {
        try {
          const serverTimestamp = await import('../../services/TimeService').then(m => m.TimeService.getServerTimestamp());
          await DataService.logResellerDeployment({
            resellerId: user.id,
            organizationId,
            organizationName: formData.companyName,
            adminEmail: formData.adminEmail,
            deployedAt: serverTimestamp,
            notes: `Deployed via unified wizard`
          });
          Logger.success('✅ Reseller deployment logged successfully');
        } catch (logError) {
          Logger.error('Failed to log reseller deployment:', logError);
          // Don't fail the whole deployment for logging issues
        }
      }

      // Show success message
      alert(`🎉 Organization '${formData.companyName}' created successfully!\n\n` +
            `📧 Admin Login: ${formData.adminEmail}\n` +
            `🔑 Password: ${devPassword}`);

      // Close wizard and refresh (reseller/super-user stays signed in)
      onClose();
      onComplete();

    } catch (error) {
      Logger.error('❌ Deployment failed:', error);
      setError(error instanceof Error ? error.message : 'Deployment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getResellersByProvince = () => {
    return availableResellers.filter(r => r.province === formData.province);
  };

  const formatCurrency = (amountInCents: number): string => {
    return `R${(amountInCents / 100).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Deploy New Client</h2>
              <p className="text-gray-600">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center mt-4 space-x-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-2 rounded ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-6">

          {/* Reseller Deployment Status Check */}
          {isReseller && deploymentStatus && !deploymentStatus.canDeploy && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Deployment Temporarily Unavailable</h4>
                  <p className="text-red-700 text-sm mt-1">{deploymentStatus.reason}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-red-600">Deployments this month:</span>
                      <div className="font-semibold">{deploymentStatus.deploymentsThisMonth} / 10</div>
                    </div>
                    <div>
                      <span className="text-red-600">Last deployment:</span>
                      <div className="font-semibold">
                        {deploymentStatus.lastDeployment
                          ? deploymentStatus.lastDeployment.toLocaleDateString('en-ZA')
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Subscription & Payment */}
          {getCurrentStepId() === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Company & Subscription Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={e => updateFormData({ companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.employeeCount}
                      onChange={e => {
                        const value = e.target.value;

                        if (value === '') {
                          // Allow empty string for better UX when deleting
                          updateFormData({ employeeCount: '' as any });
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num) && num > 0) {
                            // Auto-select appropriate plan based on employee count
                            const recommendedPlan = StripeService.getRecommendedTier(num);
                            Logger.debug(`Employee count changed: ${num} → Recommended plan: ${recommendedPlan}`);
                            updateFormData({
                              employeeCount: num,
                              selectedPlan: recommendedPlan
                            });
                          }
                        }
                      }}
                      onBlur={e => {
                        // Ensure valid value when user leaves the field
                        const value = e.target.value;
                        if (value === '' || isNaN(parseInt(value))) {
                          const recommendedPlan = StripeService.getRecommendedTier(1);
                          updateFormData({
                            employeeCount: 1,
                            selectedPlan: recommendedPlan
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plans - Auto-selected based on employee count */}
              <div>
                <h4 className="text-md font-semibold mb-2">Subscription Plan</h4>
                <p className="text-sm text-gray-600 mb-4">Plan automatically selected based on employee count</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                    const isSelected = formData.selectedPlan === key;
                    return (
                      <div
                        key={key}
                        className={`relative border rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="text-center">
                          <h5 className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                            {plan.name}
                          </h5>
                          <div className={`text-2xl font-bold my-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                            R###
                          </div>
                          <div className={`text-sm mb-3 ${isSelected ? 'text-gray-600' : 'text-gray-400'}`}>
                            per month
                          </div>
                          <div className={`text-sm ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>
                            Up to {plan.employeeLimit === 999999 ? 'unlimited' : plan.employeeLimit} employees
                          </div>

                          {isSelected && (
                            <Check className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Details */}
          {getCurrentStepId() === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Company Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Searchable Industry Selector */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>

                  {/* Selected value display / trigger button */}
                  <button
                    type="button"
                    onClick={() => setIndustrySearchOpen(!industrySearchOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between bg-white"
                  >
                    <span className={formData.industry ? 'text-gray-900' : 'text-gray-400'}>
                      {formData.industry
                        ? INDUSTRY_OPTIONS.flatMap(g => g.options).find(o => o.value === formData.industry)?.label || 'Select industry'
                        : 'Select industry'
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${industrySearchOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown with search */}
                  {industrySearchOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIndustrySearchOpen(false)}
                      />

                      {/* Dropdown panel */}
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
                        {/* Search input */}
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search industries..."
                              value={industrySearchTerm}
                              onChange={(e) => setIndustrySearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Options list */}
                        <div className="overflow-y-auto">
                          {INDUSTRY_OPTIONS.map(group => {
                            // Filter options based on search term
                            const filteredOptions = group.options.filter(option =>
                              option.label.toLowerCase().includes(industrySearchTerm.toLowerCase()) ||
                              group.group.toLowerCase().includes(industrySearchTerm.toLowerCase())
                            );

                            if (filteredOptions.length === 0) return null;

                            return (
                              <div key={group.group}>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                                  {group.group}
                                </div>
                                {filteredOptions.map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      updateFormData({ industry: option.value });
                                      setIndustrySearchOpen(false);
                                      setIndustrySearchTerm('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                      formData.industry === option.value ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            );
                          })}

                          {/* No results message */}
                          {INDUSTRY_OPTIONS.every(group =>
                            group.options.filter(option =>
                              option.label.toLowerCase().includes(industrySearchTerm.toLowerCase()) ||
                              group.group.toLowerCase().includes(industrySearchTerm.toLowerCase())
                            ).length === 0
                          ) && (
                            <div className="px-3 py-8 text-center text-sm text-gray-500">
                              No industries found matching "{industrySearchTerm}"
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                  <select
                    value={formData.province}
                    onChange={e => updateFormData({ province: e.target.value as SouthAfricanProvince })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(SA_PROVINCES).map(([key, province]) => (
                      <option key={key} value={key}>{province.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City / Town</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => updateFormData({ city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city or town"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact First Name *</label>
                  <input
                    type="text"
                    value={formData.contactFirstName}
                    onChange={e => updateFormData({ contactFirstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Last Name *</label>
                  <input
                    type="text"
                    value={formData.contactLastName}
                    onChange={e => updateFormData({ contactLastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={e => updateFormData({ contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone *</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={e => updateFormData({ contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+27 (0)11 123 4567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Reseller Assignment */}
          {getCurrentStepId() === 'reseller' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Assign Reseller</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">
                    Available resellers in {SA_PROVINCES[formData.province]?.name}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This reseller will receive 50% commission on monthly payments
                </p>
              </div>

              <div className="space-y-3">
                {getResellersByProvince().map(reseller => (
                  <div
                    key={reseller.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.resellerId === reseller.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => updateFormData({ resellerId: reseller.id })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{reseller.firstName} {reseller.lastName}</h4>
                        <p className="text-sm text-gray-600">{reseller.email}</p>
                        <p className="text-sm text-gray-500">
                          {reseller.clientIds?.length || 0} active clients • Territory: {reseller.territory?.join(', ') || 'Not specified'}
                        </p>
                      </div>
                      {formData.resellerId === reseller.id && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}

                {getResellersByProvince().length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No resellers available in {SA_PROVINCES[formData.province]?.name}</p>
                    <p className="text-sm text-gray-500">Please contact support to set up resellers in this province</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Admin Setup */}
          {getCurrentStepId() === 'admin' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Administrator Account</h3>

              <form onSubmit={(e) => e.preventDefault()} autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.adminFirstName}
                      onChange={e => updateFormData({ adminFirstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.adminLastName}
                      onChange={e => updateFormData({ adminLastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={e => updateFormData({ adminEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Password Notice */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      i
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Default Password</h4>
                      <p className="text-sm text-blue-800">
                        A temporary password <span className="font-mono font-semibold">temp123</span> will be set for this administrator.
                        They will be prompted to change it on first login.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden">
                </div>
              </form>
            </div>
          )}

          {/* Step 5: Customization */}
          {getCurrentStepId() === 'customize' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Branding & Category Configuration</h3>

              {/* Logo Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-3">Company Logo</label>
                <p className="text-xs text-gray-500 mb-4">Upload a JPG or PNG file (max 5MB). JPG files will be automatically converted to PNG.</p>

                {logoPreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-w-xs max-h-32 rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview('');
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <ImageIcon className="w-4 h-4" />
                      <span>{logoFile?.name}</span>
                      {logoFile?.type.includes('jpeg') && <span className="text-xs text-blue-600">(will be converted to PNG)</span>}
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">Click to upload logo</span>
                      <span className="text-xs text-gray-500 mt-1">JPG or PNG (max 5MB)</span>
                    </div>
                  </label>
                )}

                {/* Optional URL fallback */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Or provide a logo URL:</label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={e => updateFormData({ logoUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                    disabled={!!logoFile}
                  />
                </div>
              </div>

              {/* Color Scheme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => updateFormData({ primaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={e => updateFormData({ secondaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={e => updateFormData({ accentColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Category Management Section */}
              <div className="border-t-4 border-blue-200 bg-blue-50 rounded-lg p-6 mt-8">
                <h4 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                  📋 Warning Categories Configuration
                </h4>
                <p className="text-sm text-blue-800 mb-6 font-medium">
                  ⚠️ IMPORTANT: Customize the disciplinary categories for your organization. You can edit, remove, or add categories and configure their escalation paths.
                </p>
                
                <div className="grid gap-4">
                  {formData.customCategories.map((category, index) => (
                    <CategoryEditor 
                      key={category.id}
                      category={category}
                      onUpdate={(updatedCategory) => {
                        const updated = [...formData.customCategories];
                        updated[index] = updatedCategory;
                        updateFormData({ customCategories: updated });
                      }}
                      onRemove={() => {
                        const updated = formData.customCategories.filter((_, i) => i !== index);
                        updateFormData({ customCategories: updated });
                      }}
                    />
                  ))}

                  {/* Warning if fewer than 3 categories */}
                  {formData.customCategories.length < 3 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-semibold text-red-900 mb-1">
                            Minimum 3 Categories Required
                          </h5>
                          <p className="text-sm text-red-800">
                            You currently have <strong>{formData.customCategories.length}</strong> {formData.customCategories.length === 1 ? 'category' : 'categories'}.
                            Please add at least <strong>{3 - formData.customCategories.length}</strong> more {3 - formData.customCategories.length === 1 ? 'category' : 'categories'} to proceed with deployment.
                            This ensures your organization has adequate disciplinary options configured.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simplified choice: Template vs Blank */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryTemplateSelector(true)}
                      className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl">📋</span>
                        <Plus className="w-5 h-5 text-blue-400 group-hover:text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Choose from Template</span>
                      <p className="text-xs text-gray-500 mt-1">SA-compliant categories</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newCategory: OrganizationCategory = {
                          id: `custom-${Date.now()}`,
                          name: '',
                          description: '',
                          level: 'verbal',
                          color: '#6366f1',
                          icon: '📋',
                          isActive: true,
                          isDefault: false,
                          escalationPath: ['verbal', 'first_written', 'final_written']
                        };
                        updateFormData({
                          customCategories: [...formData.customCategories, newCategory]
                        });
                      }}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center group"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl">✏️</span>
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Create Blank Category</span>
                      <p className="text-xs text-gray-500 mt-1">Start from scratch</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Deployment Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <h4 className="font-semibold mb-4">Deployment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Company:</span> {formData.companyName}
                  </div>
                  <div>
                    <span className="text-gray-600">Plan:</span> {SUBSCRIPTION_PLANS[formData.selectedPlan].name}
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Cost:</span> R###
                  </div>
                  <div>
                    <span className="text-gray-600">Province:</span> {SA_PROVINCES[formData.province]?.name}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="text-sm text-green-800">
                    <strong>Revenue Breakdown (Monthly):</strong><br />
                    • Client pays: R###<br />
                    • Reseller commission (50%): R###<br />
                    • Your income (30%): R###<br />
                    • Company fund (20%): R###
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0 || isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleDeploy}
                disabled={!validateCurrentStep().isValid || isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Deploy & Pay
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!validateCurrentStep().isValid}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Category Template Selector Modal */}
      {showCategoryTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg w-[90%] max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Category Templates
                  </h4>
                  <p className="text-xs text-gray-600">
                    Click to expand details, then click "Add" to use a template
                  </p>
                </div>
                <button
                  onClick={() => setShowCategoryTemplateSelector(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Templates List */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid gap-2">
                {UNIVERSAL_SA_CATEGORIES.map((template) => {
                  const severityConfig = {
                    minor: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Minor' },
                    serious: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Serious' },
                    gross_misconduct: { bg: 'bg-red-100', text: 'text-red-800', label: 'Gross Misconduct' }
                  };
                  const severity = severityConfig[template.severity];
                  const isExpanded = expandedTemplateId === template.id;

                  return (
                    <div
                      key={template.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all"
                    >
                      {/* Collapsed Header - Always Visible */}
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTemplateId(isExpanded ? null : template.id);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-semibold text-gray-900 truncate">
                                {template.name}
                              </h5>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${severity.bg} ${severity.text} flex-shrink-0`}>
                                {severity.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCategory: OrganizationCategory = {
                                id: `custom-${Date.now()}`,
                                name: template.name,
                                description: template.description,
                                level: 'verbal',
                                color: '#6366f1',
                                icon: template.icon,
                                isActive: true,
                                isDefault: false,
                                escalationPath: template.escalationPath
                              };
                              updateFormData({
                                customCategories: [...formData.customCategories, newCategory]
                              });
                              setShowCategoryTemplateSelector(false);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            Add
                          </button>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-50">
                          <p className="text-sm text-gray-600 mb-2 mt-2">
                            {template.description}
                          </p>

                          {/* Common Examples */}
                          {template.commonExamples.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Common Examples:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                {template.commonExamples.map((example, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-gray-400 mt-0.5">•</span>
                                    <span>{example}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};