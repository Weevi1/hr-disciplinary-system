// frontend/src/components/admin/steps/ConfigurationStep.tsx
// 🏆 UPDATED CONFIGURATION STEP - UNIVERSAL CATEGORIES SYSTEM
// ✅ Uses the 8 universal categories as base
// ✅ Allow enable/disable of universal categories
// ✅ Add custom categories functionality
// ✅ Real-time preview of category configuration
// ✅ Built for white label customization

import { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Plus, 
  Settings, 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock,
  FileText,
  Scale,
  Target,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { WizardFormData } from '../OrganizationWizard';

// Import the universal categories - TODO: Fix imports
// import { 
//   UNIVERSAL_SA_CATEGORIES,
//   UniversalCategory,
//   WarningLevel 
// } from '../../../services/UniversalCategories';

// Temporary minimal replacements
type WarningLevel = 'verbal' | 'written' | 'final';
const UNIVERSAL_SA_CATEGORIES = [
  { id: 'attendance', name: 'Attendance Issues' },
  { id: 'performance', name: 'Performance Issues' },
  { id: 'conduct', name: 'Misconduct' },
  { id: 'policy', name: 'Policy Violations' },
];

interface StepProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
}

interface CustomCategory {
  id: string;
  name: string;
  description: string;
  severity: 'minor' | 'serious' | 'gross_misconduct';
  escalationPath: WarningLevel[];
}

interface CategorySelection {
  universalCategories: string[]; // IDs of enabled universal categories
  customCategories: CustomCategory[];
}

export const ConfigurationStep = ({ formData, setFormData }: StepProps) => {
  const [categorySelection, setCategorySelection] = useState<CategorySelection>({
    universalCategories: UNIVERSAL_SA_CATEGORIES.map(cat => cat.id), // All enabled by default
    customCategories: []
  });
  
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newCustomCategory, setNewCustomCategory] = useState<CustomCategory>({
    id: '',
    name: '',
    description: '',
    severity: 'serious',
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal']
  });

  // Initialize from formData on mount
  useEffect(() => {
    if (formData.warningCategories.length > 0) {
      // Parse existing selection from formData
      const universal: string[] = [];
      const custom: CustomCategory[] = [];
      
      formData.warningCategories.forEach(catName => {
        const universalMatch = UNIVERSAL_SA_CATEGORIES.find(uc => uc.name === catName);
        if (universalMatch) {
          universal.push(universalMatch.id);
        } else {
          // This is a custom category - create a basic structure
          custom.push({
            id: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: catName,
            description: 'Custom organization category',
            severity: 'serious',
            escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal']
          });
        }
      });
      
      setCategorySelection({ universalCategories: universal, customCategories: custom });
    }
  }, []);

  // Update formData whenever selection changes
  useEffect(() => {
    const selectedCategoryNames: string[] = [];
    
    // Add enabled universal categories
    categorySelection.universalCategories.forEach(catId => {
      const category = UNIVERSAL_SA_CATEGORIES.find(uc => uc.id === catId);
      if (category) {
        selectedCategoryNames.push(category.name);
      }
    });
    
    // Add custom categories
    categorySelection.customCategories.forEach(custom => {
      selectedCategoryNames.push(custom.name);
    });
    
    setFormData({ ...formData, warningCategories: selectedCategoryNames });
  }, [categorySelection]);

  const toggleUniversalCategory = (categoryId: string) => {
    setCategorySelection(prev => ({
      ...prev,
      universalCategories: prev.universalCategories.includes(categoryId)
        ? prev.universalCategories.filter(id => id !== categoryId)
        : [...prev.universalCategories, categoryId]
    }));
  };

  const addCustomCategory = () => {
    if (!newCustomCategory.name.trim()) return;
    
    const customCategory: CustomCategory = {
      ...newCustomCategory,
      id: newCustomCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    
    setCategorySelection(prev => ({
      ...prev,
      customCategories: [...prev.customCategories, customCategory]
    }));
    
    // Reset form
    setNewCustomCategory({
      id: '',
      name: '',
      description: '',
      severity: 'serious',
      escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal']
    });
    setShowAddCustom(false);
  };

  const removeCustomCategory = (customId: string) => {
    setCategorySelection(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(cat => cat.id !== customId)
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return '#10b981';
      case 'serious': return '#f59e0b';
      case 'gross_misconduct': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'minor': return <Shield className="h-4 w-4" />;
      case 'serious': return <AlertTriangle className="h-4 w-4" />;
      case 'gross_misconduct': return <X className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const totalEnabledCategories = categorySelection.universalCategories.length + categorySelection.customCategories.length;

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '0.75rem',
          color: '#1e293b'
        }}>
          Warning Categories Configuration
        </h3>
        <p style={{ 
          color: '#475569',
          fontSize: '1rem',
          lineHeight: '1.5',
          marginBottom: '1rem'
        }}>
          Configure which warning categories will be available for this organization. You can enable/disable universal categories or add custom ones.
        </p>
        
        {/* Summary */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            {totalEnabledCategories}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>
              {totalEnabledCategories} Categories Enabled
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {categorySelection.universalCategories.length} Universal + {categorySelection.customCategories.length} Custom
            </div>
          </div>
        </div>
      </div>

      {/* Universal Categories Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Scale className="h-5 w-5 text-blue-600" />
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            Universal Categories (SA Labor Law Compliant)
          </h4>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          {UNIVERSAL_SA_CATEGORIES.map((category, index) => {
            const isEnabled = categorySelection.universalCategories.includes(category.id);
            const isExpanded = expandedCategory === category.id;
            
            return (
              <div key={category.id}>
                <div style={{
                  padding: '1rem',
                  borderBottom: index < UNIVERSAL_SA_CATEGORIES.length - 1 ? '1px solid #f1f5f9' : 'none',
                  backgroundColor: isEnabled ? '#fefffe' : '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      {/* Toggle */}
                      <button
                        onClick={() => toggleUniversalCategory(category.id)}
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '0.25rem',
                          border: isEnabled ? '2px solid #3b82f6' : '2px solid #d1d5db',
                          backgroundColor: isEnabled ? '#3b82f6' : 'white',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isEnabled && <Check className="h-4 w-4" />}
                      </button>
                      
                      {/* Category Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <h5 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: isEnabled ? '#1e293b' : '#6b7280',
                            margin: 0
                          }}>
                            {category.name}
                          </h5>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.75rem',
                            backgroundColor: getSeverityColor(category.severity),
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {getSeverityIcon(category.severity)}
                            {category.severity.replace('_', ' ')}
                          </div>
                        </div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: isEnabled ? '#64748b' : '#9ca3af',
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      style={{
                        padding: '0.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr' }}>
                        {/* Legal Framework */}
                        <div>
                          <h6 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Scale className="h-4 w-4" />
                            Legal Framework
                          </h6>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: 0,
                            lineHeight: '1.4'
                          }}>
                            {category.lraSection}<br />
                            {category.schedule8Reference}
                          </p>
                        </div>
                        
                        {/* Escalation Path */}
                        <div>
                          <h6 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Target className="h-4 w-4" />
                            Escalation Path ({category.escalationPath.length} steps)
                          </h6>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {category.escalationPath.map((level, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '0.125rem 0.375rem',
                                  fontSize: '0.75rem',
                                  backgroundColor: '#e2e8f0',
                                  color: '#475569',
                                  borderRadius: '0.25rem',
                                  fontWeight: '500'
                                }}
                              >
                                {idx + 1}. {level.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Examples */}
                      {category.commonExamples.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <h6 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <FileText className="h-4 w-4" />
                            Common Examples
                          </h6>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            {category.commonExamples.slice(0, 3).map((example, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '0.375rem',
                                  fontWeight: '500'
                                }}
                              >
                                {example}
                              </span>
                            ))}
                            {category.commonExamples.length > 3 && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                fontStyle: 'italic',
                                alignSelf: 'center'
                              }}>
                                +{category.commonExamples.length - 3} more...
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Categories Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings className="h-5 w-5 text-purple-600" />
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              Custom Categories
            </h4>
          </div>
          
          <button
            onClick={() => setShowAddCustom(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
          >
            <Plus className="h-4 w-4" />
            Add Custom Category
          </button>
        </div>

        {/* Custom Categories List */}
        {categorySelection.customCategories.length > 0 ? (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            {categorySelection.customCategories.map((custom, index) => (
              <div
                key={custom.id}
                style={{
                  padding: '1rem',
                  borderBottom: index < categorySelection.customCategories.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <h5 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: 0
                    }}>
                      {custom.name}
                    </h5>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.75rem',
                      backgroundColor: getSeverityColor(custom.severity),
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getSeverityIcon(custom.severity)}
                      {custom.severity.replace('_', ' ')}
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                  }}>
                    {custom.description}
                  </p>
                </div>
                
                <button
                  onClick={() => removeCustomCategory(custom.id)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '2px dashed #e2e8f0',
            borderRadius: '0.5rem',
            color: '#64748b'
          }}>
            <Settings className="h-8 w-8 mx-auto mb-2" style={{ color: '#9ca3af' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              No custom categories added yet. Click "Add Custom Category" to create organization-specific categories.
            </p>
          </div>
        )}
      </div>

      {/* Add Custom Category Modal */}
      {showAddCustom && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '32rem',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h4 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              Add Custom Category
            </h4>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCustomCategory.name}
                  onChange={(e) => setNewCustomCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Social Media Policy Violations"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Description
                </label>
                <textarea
                  value={newCustomCategory.description}
                  onChange={(e) => setNewCustomCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this category covers..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              {/* Severity */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Severity Level
                </label>
                <select
                  value={newCustomCategory.severity}
                  onChange={(e) => setNewCustomCategory(prev => ({ ...prev, severity: e.target.value as 'minor' | 'serious' | 'gross_misconduct' }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="minor">Minor - Correctable behavior issues</option>
                  <option value="serious">Serious - Policy violations or misconduct</option>
                  <option value="gross_misconduct">Gross Misconduct - Severe violations</option>
                </select>
              </div>
            </div>
            
            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1.5rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAddCustom(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addCustomCategory}
                disabled={!newCustomCategory.name.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  backgroundColor: newCustomCategory.name.trim() ? '#8b5cf6' : '#9ca3af',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: newCustomCategory.name.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Rules */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Target className="h-5 w-5 text-indigo-600" />
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            Escalation Rules
          </h4>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[
              { id: 'standard', name: 'Standard Progressive Discipline', description: 'Follow standard LRA Section 188 escalation paths for each category' },
              { id: 'accelerated', name: 'Accelerated Discipline', description: 'Faster escalation for repeat offenders and serious violations' },
              { id: 'custom', name: 'Custom Rules', description: 'Organization-specific escalation logic (configured post-deployment)' }
            ].map((rule) => (
              <label
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: formData.escalationRules === rule.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: formData.escalationRules === rule.id ? '#eff6ff' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="escalationRules"
                  value={rule.id}
                  checked={formData.escalationRules === rule.id}
                  onChange={(e) => setFormData({ ...formData, escalationRules: e.target.value as 'standard' | 'accelerated' | 'custom' })}
                  style={{ margin: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    {rule.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    lineHeight: '1.4'
                  }}>
                    {rule.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <Eye className="h-5 w-5 text-blue-600" />
          <h5 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            Configuration Summary
          </h5>
        </div>
        
        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Universal Categories Enabled:</span>
            <span style={{ fontWeight: '600' }}>{categorySelection.universalCategories.length} of {UNIVERSAL_SA_CATEGORIES.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Custom Categories:</span>
            <span style={{ fontWeight: '600' }}>{categorySelection.customCategories.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Categories:</span>
            <span style={{ fontWeight: '600' }}>{totalEnabledCategories}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Escalation Rules:</span>
            <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
              {formData.escalationRules.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        {totalEnabledCategories === 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '500' }}>
              Warning: No categories enabled. The organization will not be able to issue warnings.
            </span>
          </div>
        )}
        
        {totalEnabledCategories < 3 && totalEnabledCategories > 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fed7aa',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '500' }}>
              Consider enabling more categories for comprehensive disciplinary management.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};