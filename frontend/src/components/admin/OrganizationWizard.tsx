// frontend/src/components/admin/OrganizationWizard.tsx
// Enhanced version with Firebase Authentication user creation
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DataService } from '../../services/DataService';
import { UNIVERSAL_SA_CATEGORIES } from '../../services/UniversalCategories';
import { BasicInfoStep } from './steps/BasicInfoStep';
// IndustryTemplateStep removed - now using UniversalCategories
import { BrandingStep } from './steps/BrandingStep';
import { ConfigurationStep } from './steps/ConfigurationStep';
import { DeliverySettingsStep } from './steps/DeliverySettingsStep';
import { AdminSetupStep } from './steps/AdminSetupStep';
import { ReviewDeployStep } from './steps/ReviewDeployStep';

// Extended form data interface to include password fields
export interface WizardFormData {
  // Basic Info
  companyName: string;
  companySize: string;
  country: string;
  subdomain: string;
  
  // Industry field removed - using UniversalCategories
  
  // Branding
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Configuration
  warningCategories: string[];
  escalationRules: 'standard' | 'accelerated' | 'custom';
  
  // Delivery Settings
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  printEnabled: boolean;
  printAdminEmail: string;
  
  // Admin Setup - Enhanced with password fields
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  sendWelcomeEmail: boolean;
  requirePasswordChange: boolean;
}

interface OrganizationWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const OrganizationWizard = ({ onClose, onSuccess }: OrganizationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    // Basic Info
    companyName: '',
    companySize: '',
    country: 'SA',
    subdomain: '',
    
    // Industry removed - using UniversalCategories
    
    // Branding
    logoUrl: '',
    primaryColor: '#8b5cf6',
    secondaryColor: '#3b82f6',
    
    // Configuration
    warningCategories: [],
    escalationRules: 'standard',
    
    // Delivery Settings
    emailEnabled: true,
    whatsappEnabled: true,
    printEnabled: false,
    printAdminEmail: '',
    
    // Admin Setup - Default to demo password
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: 'demo123',
    adminPasswordConfirm: 'demo123',
    sendWelcomeEmail: true,
    requirePasswordChange: true
  });

  const steps = [
    { id: 'basic-info', title: 'Basic Information', component: BasicInfoStep },
    { id: 'branding', title: 'Branding', component: BrandingStep },
    { id: 'configuration', title: 'Configuration', component: ConfigurationStep },
    { id: 'delivery-settings', title: 'Delivery Settings', component: DeliverySettingsStep },
    { id: 'admin-setup', title: 'Administrator Setup', component: AdminSetupStep },
    { id: 'review-deploy', title: 'Review & Deploy', component: ReviewDeployStep }
  ];

  const updateProgress = (step: number, total: number, message: string) => {
    const progress = Math.round((step / total) * 100);
    setDeploymentProgress(progress);
    console.log(`📋 Deployment Progress (${progress}%): ${message}`);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Basic Info
        return !!(formData.companyName && formData.companySize && formData.subdomain);
      case 1: // Branding (industry step removed)
        return true; // Optional step
      case 2: // Configuration (automatically uses UniversalCategories)
        return true; // UniversalCategories are always available
      case 3: // Delivery Settings
        return formData.emailEnabled || formData.whatsappEnabled || formData.printEnabled;
      case 4: // Admin Setup
        const basicFieldsValid = !!(formData.adminFirstName && formData.adminLastName && formData.adminEmail);
        const passwordValid = formData.adminPassword === formData.adminPasswordConfirm && formData.adminPassword.length >= 3;
        return basicFieldsValid && passwordValid;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    console.log('🚀 Starting enhanced organization deployment with Firebase Auth...');
    setIsDeploying(true);
    setDeploymentError(null);
    setDeploymentProgress(0);

    try {
      const totalSteps = 8;
      
      // Step 1: Create organization configuration
      updateProgress(1, totalSteps, 'Creating organization configuration...');
      
      const organizationConfig = {
        id: formData.subdomain,
        name: formData.companyName,
        // Industry field removed - using UniversalCategories
        size: formData.companySize,
        country: formData.country,
        subdomain: formData.subdomain,
        
        // Branding
        branding: {
          logo: formData.logoUrl,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor
        },
        
        // Settings
        settings: {
          escalationRules: formData.escalationRules,
          deliveryMethods: {
            email: formData.emailEnabled,
            whatsapp: formData.whatsappEnabled,
            print: formData.printEnabled,
            printAdminEmail: formData.printAdminEmail
          }
        },
        
        createdAt: new Date().toISOString(),
        isActive: true
      };

      console.log('📋 Organization config created:', organizationConfig);

      // Step 2: Create organization in Firestore
      updateProgress(2, totalSteps, 'Creating organization in database...');
      const organizationId = await DataService.createOrganization(organizationConfig);
      console.log('✅ Organization created with ID:', organizationId);

      // Step 3: Create Firebase Authentication user for admin
      updateProgress(3, totalSteps, 'Creating administrator account...');
      
      const functions = getFunctions();
      const createOrganizationAdmin = httpsCallable(functions, 'createOrganizationAdmin');
      
      try {
        const adminResult = await createOrganizationAdmin({
          email: formData.adminEmail,
          password: formData.adminPassword,
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          role: 'business-owner',
          organizationId: organizationId,
          sendWelcomeEmail: formData.sendWelcomeEmail,
          requirePasswordChange: formData.requirePasswordChange
        });

        console.log('✅ Firebase Auth admin created:', adminResult.data);
        
        // Development mode - show login credentials in console
        console.log(`🔐 [DEVELOPMENT] New Admin Login Details:`);
        console.log(`   📧 Email: ${formData.adminEmail}`);
        console.log(`   🔑 Password: ${formData.adminPassword}`);
        console.log(`   🏢 Organization ID: ${formData.subdomain}`);
        console.log(`   ⚠️  Password change required: ${formData.requirePasswordChange}`);
        
      } catch (authError: any) {
        console.error('❌ Error creating Firebase Auth user:', authError);
        
        // If Firebase function fails, create just the Firestore user for now
        console.log('⚠️ Falling back to Firestore-only user creation...');
        await DataService.createUser({
          id: `${organizationId}-business-owner`,
          email: formData.adminEmail,
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          role: 'business-owner',
          organizationId: organizationId,
          isActive: true,
          createdAt: new Date().toISOString(),
          requirePasswordChange: formData.requirePasswordChange
        });
      }

      // Step 4: Create sample employees
      updateProgress(4, totalSteps, 'Creating sample employees...');
      
      const sampleEmployees = [
        {
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@' + formData.subdomain + '.com',
          department: 'Operations',
          position: 'Team Lead',
          manager: `${organizationId}-business-owner`,
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          organizationId: organizationId
        },
        {
          employeeId: 'EMP002',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@' + formData.subdomain + '.com',
          department: 'Human Resources',
          position: 'HR Coordinator',
          manager: `${organizationId}-business-owner`,
          startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          organizationId: organizationId
        }
      ];

      for (const employee of sampleEmployees) {
        await DataService.createEmployee(employee);
        console.log('✅ Sample employee created:', employee.firstName, employee.lastName);
      }

      // Step 5: Create warning categories using UniversalCategories
      updateProgress(5, totalSteps, 'Setting up 8 universal warning categories...');
      
      // Create all 8 universal categories for the organization
      for (const category of UNIVERSAL_SA_CATEGORIES) {
        await DataService.createWarningCategory({
          id: `${organizationId}-${category.id}`,
          name: category.name,
          organizationId: organizationId,
          categoryId: category.id,
          severity: category.severity,
          escalationPath: category.escalationPath,
          isActive: true,
          createdAt: new Date().toISOString()
        });
        console.log('✅ Universal warning category created:', category.name);
      }

      // Step 6: Set up document templates
      updateProgress(6, totalSteps, 'Creating document templates...');
      
      await createDocumentTemplates(organizationId, formData);

      // Step 7: Create audit log
      updateProgress(7, totalSteps, 'Logging deployment...');
      
      await DataService.createAuditLog({
        action: 'ORGANIZATION_DEPLOYED',
        resourceType: 'organization',
        resourceId: organizationId,
        organizationId: organizationId,
        details: {
          deployedBy: 'super-user',
          categoriesUsed: 'UniversalCategories',
          totalCategories: UNIVERSAL_SA_CATEGORIES.length,
          adminEmail: formData.adminEmail,
          features: {
            authenticationEnabled: true,
            deliveryMethods: {
              email: formData.emailEnabled,
              whatsapp: formData.whatsappEnabled,
              print: formData.printEnabled
            }
          }
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ Audit event logged');

      // Step 8: Complete
      updateProgress(8, totalSteps, 'Deployment completed successfully!');
      
      console.log('🎉 Enhanced organization deployment completed successfully!');
      
      // Show success for a moment before closing
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      setDeploymentError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsDeploying(false);
    }
  };

  // Helper function to get universal warning categories
  const getUniversalCategories = () => {
    return UNIVERSAL_SA_CATEGORIES.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      severity: category.severity,
      escalationPath: category.escalationPath
    }));
  };

  // Helper function to create document templates
  const createDocumentTemplates = async (organizationId: string, formData: WizardFormData) => {
    const templates = [
      {
        id: `${organizationId}-warning-letter`,
        type: 'warning_letter',
        name: 'Standard Warning Letter',
        organizationId: organizationId,
        content: `
Dear {{employeeName}},

This letter serves as a formal warning regarding {{warningCategory}} on {{issueDate}}.

Details: {{description}}

This warning is issued in accordance with company policy and will remain on your personnel file.

Sincerely,
{{managerName}}
${formData.companyName}
        `.trim(),
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    for (const template of templates) {
      await DataService.createDocumentTemplate(template);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  if (isDeploying) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '28rem',
          width: '90%',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
              🚀
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Deploying Organization
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Creating your organization with Firebase Authentication...
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '0.5rem',
            backgroundColor: '#e2e8f0',
            borderRadius: '0.25rem',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: `${deploymentProgress}%`,
              height: '100%',
              backgroundColor: '#8b5cf6',
              transition: 'width 0.3s ease',
              borderRadius: '0.25rem'
            }} />
          </div>

          <p style={{ 
            fontSize: '0.875rem', 
            color: '#374151',
            fontWeight: '500'
          }}>
            {deploymentProgress}% Complete
          </p>

          {deploymentError && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              textAlign: 'left'
            }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#dc2626',
                margin: 0
              }}>
                <strong>Error:</strong> {deploymentError}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        width: '90%',
        maxWidth: '80rem',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '2rem'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
              🚀 Deploy New Organization
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Indicator */}
        <div style={{ padding: '1rem 2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {steps.map((step, index) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: index <= currentStep ? '#8b5cf6' : '#e2e8f0',
                  color: index <= currentStep ? 'white' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: index < currentStep ? '#8b5cf6' : '#e2e8f0',
                    marginLeft: '0.5rem'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={{ padding: '0 2rem 2rem 2rem' }}>
          <CurrentStepComponent 
            formData={formData} 
            setFormData={setFormData}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              color: currentStep === 0 ? '#9ca3af' : '#374151',
              borderRadius: '0.375rem',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#374151',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleDeploy}
                disabled={!validateCurrentStep()}
                style={{
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  backgroundColor: validateCurrentStep() ? '#8b5cf6' : '#9ca3af',
                  color: 'white',
                  borderRadius: '0.375rem',
                  cursor: validateCurrentStep() ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                🚀 Deploy Organization
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  backgroundColor: validateCurrentStep() ? '#8b5cf6' : '#9ca3af',
                  color: 'white',
                  borderRadius: '0.375rem',
                  cursor: validateCurrentStep() ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem'
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
