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
  X
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
  'first_written': 'First Written Warning',
  'second_written': 'Second Written Warning',
  'final_written': 'Final Written Warning',
  'suspension': 'Suspension',
  'dismissal': 'Dismissal'
};

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
  contactPerson: string;
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
    contactPerson: '',
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

      if (isSuperUser) {
        // Auto-select plan based on employee count
        const recommendedPlan = StripeService.getRecommendedTier(formData.employeeCount);
        setFormData(prev => ({ ...prev, selectedPlan: recommendedPlan }));
      } else if (isReseller) {
        // For resellers, auto-assign themselves, skip subscription, and check deployment limits
        setFormData(prev => ({
          ...prev,
          resellerId: user?.resellerId || '', // Use resellerId from user data
          selectedPlan: 'professional', // Default plan for reseller deployments
          subscriptionTier: 'professional'
        }));
        checkResellerDeploymentStatus();
      }
    }
  }, [isOpen, formData.employeeCount, isSuperUser, isReseller, user]);

  const loadAvailableResellers = async () => {
    try {
      const resellers = await DataService.getAllResellers();
      const activeResellers = resellers.filter(r => r.isActive);

      setAvailableResellers(activeResellers);
      // Logger.debug('Loaded resellers:', { total: resellers.length, active: activeResellers.length, resellers: activeResellers });
      
      // Auto-select reseller if only one available in selected province
      const provinceResellers = activeResellers.filter(r => r.province === formData.province);
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
        if (!formData.contactPerson.trim()) return { isValid: false, message: 'Contact person is required' };
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
        if (formData.adminPassword.length < 6) return { isValid: false, message: 'Password must be at least 6 characters' };
        if (formData.adminPassword !== formData.adminPasswordConfirm) return { isValid: false, message: 'Passwords do not match' };
        return { isValid: true };

      case 'customize': // Customization
        return { isValid: true }; // Customization step is always valid

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
          role: 'business-owner'
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
                      onChange={e => updateFormData({ employeeCount: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plans */}
              <div>
                <h4 className="text-md font-semibold mb-4">Select Subscription Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                    <div
                      key={key}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.selectedPlan === key
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateFormData({ selectedPlan: key as SubscriptionTier })}
                    >
                      <div className="text-center">
                        <h5 className="font-semibold">{plan.name}</h5>
                        <div className="text-2xl font-bold text-blue-600 my-2">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">per month</div>
                        <div className="text-sm">
                          Up to {plan.employeeLimit === 999999 ? 'unlimited' : plan.employeeLimit} employees
                        </div>
                        
                        {formData.selectedPlan === key && (
                          <Check className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Plan Recommendation */}
                {StripeService.getRecommendedTier(formData.employeeCount) !== formData.selectedPlan && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Based on {formData.employeeCount} employees, we recommend the{' '}
                        <strong>{SUBSCRIPTION_PLANS[StripeService.getRecommendedTier(formData.employeeCount)].name}</strong> plan
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Company Details */}
          {getCurrentStepId() === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Company Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={e => updateFormData({ industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail & Commerce</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="security">Security Services</option>
                    <option value="mining">Mining</option>
                    <option value="other">Other</option>
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => updateFormData({ contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Primary contact person"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={e => updateFormData({ adminPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum 6 characters"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                    <input
                      type="password"
                      value={formData.adminPasswordConfirm}
                      onChange={e => updateFormData({ adminPasswordConfirm: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                  </div>
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
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <Plus className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Add Custom Category</span>
                  </button>
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
                    <span className="text-gray-600">Monthly Cost:</span> {formatCurrency(SUBSCRIPTION_PLANS[formData.selectedPlan].price)}
                  </div>
                  <div>
                    <span className="text-gray-600">Province:</span> {SA_PROVINCES[formData.province]?.name}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="text-sm text-green-800">
                    <strong>Revenue Breakdown (Monthly):</strong><br />
                    • Client pays: {formatCurrency(SUBSCRIPTION_PLANS[formData.selectedPlan].price)}<br />
                    • Reseller commission (50%): {formatCurrency(Math.round(SUBSCRIPTION_PLANS[formData.selectedPlan].price * 0.5))}<br />
                    • Your income (30%): {formatCurrency(Math.round(SUBSCRIPTION_PLANS[formData.selectedPlan].price * 0.3))}<br />
                    • Company fund (20%): {formatCurrency(Math.round(SUBSCRIPTION_PLANS[formData.selectedPlan].price * 0.2))}
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
    </div>
  );
};