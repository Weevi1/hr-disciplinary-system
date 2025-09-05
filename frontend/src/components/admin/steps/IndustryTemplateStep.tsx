// frontend/src/components/admin/steps/IndustryTemplateStep.tsx
// 🏆 COMPLETE INDUSTRY TEMPLATE STEP - All 7 Enhanced Sectors Integrated
// Updated to reflect our complete sector implementation

import type { WizardFormData } from '../OrganizationWizard';

interface StepProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
}

export const IndustryTemplateStep = ({ formData, setFormData }: StepProps) => {
  const industryTemplates = [
    // 🏭 ENHANCED MANUFACTURING - Complete implementation
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      icon: '🏭',
      description: 'Production safety, quality control, MEIBC compliance',
      categories: [
        'PPE Safety Violations',
        'Lockout/Tagout (LOTO) Violations', 
        'Quality Control Violations',
        'Unauthorized Absence',
        'Equipment Safety Breaches'
      ],
      features: [
        '🏆 MEIBC compliance built-in',
        'OHS Act Section 7, 8 & 9 integration',
        'Safety-first escalation logic',
        'Production impact assessment'
      ],
      color: '#3b82f6',
      enhanced: true,
      legalFramework: 'MEIBC + OHS Act',
      sectoralDetermination: null,
      priority: 'Production Ready'
    },

    // ⛏️ ENHANCED MINING - Complete MHSA implementation
    {
      id: 'mining',
      name: 'Mining',
      icon: '⛏️',
      description: 'MHSA compliance, underground/surface operations',
      categories: [
        'Underground Safety Violations',
        'Surface Safety Violations', 
        'Mineral Theft (High-Value)',
        'Substance Abuse (Zero Tolerance)',
        'Certification Violations'
      ],
      features: [
        '🏆 MHSA Act 29 of 1996 compliance',
        'Underground vs surface risk analysis',
        'Inspector of Mines integration',
        'Criminal law precedents included'
      ],
      color: '#8b5cf6',
      enhanced: true,
      legalFramework: 'MHSA + Criminal Law',
      sectoralDetermination: null,
      priority: 'Production Ready'
    },

    // 🛡️ ENHANCED SECURITY - PSIRA compliant implementation
    {
      id: 'security',
      name: 'Security',
      icon: '🛡️',
      description: 'PSIRA compliance, armed/unarmed operations, client protection',
      categories: [
        'Firearm Handling Violations',
        'PSIRA Registration Violations',
        'Security Protocol Breaches',
        'Shift Work Violations',
        'Client Conduct Issues'
      ],
      features: [
        '🏆 PSIRA Act 56 of 2001 compliance',
        'Armed vs unarmed risk analysis',
        'Client type considerations',
        'Firearms Control Act integration'
      ],
      color: '#f59e0b',
      enhanced: true,
      legalFramework: 'PSIRA Act + Firearms Control Act',
      sectoralDetermination: 'Sectoral Determination 6: Private Security',
      priority: 'Production Ready'
    },

    // 🏥 ENHANCED HEALTHCARE - Professional standards implementation
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: '🏥',
      description: 'Patient safety, professional standards, essential services',
      categories: [
        'Patient Safety Violations',
        'Professional Registration Violations',
        'Infection Control Violations',
        'Confidentiality Breaches',
        'Substance Abuse (Clinical)'
      ],
      features: [
        '🏆 Health Professions Act compliance',
        'Patient impact assessment',
        'Professional board integration',
        'POPIA confidentiality protection'
      ],
      color: '#ef4444',
      enhanced: true,
      legalFramework: 'Health Professions Act + POPIA',
      sectoralDetermination: null,
      priority: 'Production Ready'
    },

    // 🛒 ENHANCED RETAIL - Sectoral Determination 9 implementation
    {
      id: 'retail',
      name: 'Retail',
      icon: '🛒',
      description: 'Customer service excellence, cash handling, inventory control',
      categories: [
        'Cash Theft Violations',
        'Customer Service Violations',
        'Health & Safety Violations',
        'Inventory Management Issues',
        'Technology/POS Violations'
      ],
      features: [
        '🏆 Sectoral Determination 9 compliance',
        'Customer impact assessment',
        'Financial loss calculation',
        'Consumer Protection Act integration'
      ],
      color: '#10b981',
      enhanced: true,
      legalFramework: 'Consumer Protection Act + OHS Act',
      sectoralDetermination: 'Sectoral Determination 9: Wholesale & Retail',
      priority: 'Production Ready'
    },

    // 🏗️ ENHANCED CONSTRUCTION - High safety requirements implementation
    {
      id: 'construction',
      name: 'Construction',
      icon: '🏗️',
      description: 'Site safety, equipment operations, CIDB compliance',
      categories: [
        'Construction Safety Violations',
        'PPE & Safety Equipment Violations',
        'Equipment & Machinery Violations',
        'Work Method Violations',
        'Environmental & Waste Violations'
      ],
      features: [
        '🏆 Construction Regulations 2003',
        'Project type risk analysis',
        'Weather condition assessment',
        'CIDB and NEMA integration'
      ],
      color: '#f97316',
      enhanced: true,
      legalFramework: 'OHS Act + Construction Regulations',
      sectoralDetermination: null,
      priority: 'Production Ready'
    },

    // 🌾 ENHANCED AGRICULTURE - Sectoral Determination 13 implementation
    {
      id: 'agriculture',
      name: 'Agriculture',
      icon: '🌾',
      description: 'Farm worker protection, seasonal work, environmental compliance',
      categories: [
        'Agricultural Safety Violations',
        'Chemical & Pesticide Violations',
        'Animal Handling Violations',
        'Housing & Accommodation Issues',
        'Environmental Conservation Violations'
      ],
      features: [
        '🏆 Sectoral Determination 13 compliance',
        'Seasonal timing considerations',
        'Worker type protection',
        'ESTA housing rights integration'
      ],
      color: '#84cc16',
      enhanced: true,
      legalFramework: 'ESTA + Agricultural Remedies Act',
      sectoralDetermination: 'Sectoral Determination 13: Farm Workers',
      priority: 'Production Ready'
    },

    // 🚛 TRANSPORT - Standard implementation (future enhancement)
    {
      id: 'transport',
      name: 'Transport & Logistics',
      icon: '🚛',
      description: 'Vehicle operations, cargo handling, route management',
      categories: [
        'Vehicle Safety Violations',
        'Route Compliance Issues',
        'Cargo Handling Violations',
        'Documentation Failures',
        'Driver Conduct Issues'
      ],
      features: [
        'Fleet management integration',
        'Route tracking support',
        'Driver performance monitoring',
        'DOT compliance ready'
      ],
      color: '#06b6d4',
      enhanced: false,
      legalFramework: 'LRA + Road Traffic Act',
      sectoralDetermination: 'Sectoral Determination 11: Taxi Sector',
      priority: 'Coming Soon'
    }
  ];

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: '#1e293b'
        }}>
          Select Industry Template
        </h3>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          Choose an industry template with sector-specific categories, legal compliance, and AI-powered analysis tailored to South African regulations.
        </p>
      </div>

      {/* Enhanced Sectors Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 Enhanced AI-Powered Sectors
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontWeight: '600'
          }}>
            Production Ready
          </span>
        </h4>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(3, 1fr)' : window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {industryTemplates.filter(t => t.enhanced).map((template) => (
            <div
              key={template.id}
              onClick={() => setFormData({ ...formData, industry: template.id })}
              style={{
                border: `3px solid ${formData.industry === template.id ? template.color : '#e2e8f0'}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: formData.industry === template.id ? `${template.color}10` : 'white',
                position: 'relative',
                boxShadow: formData.industry === template.id ? `0 8px 25px ${template.color}20` : '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (formData.industry !== template.id) {
                  e.currentTarget.style.borderColor = `${template.color}60`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${template.color}15`;
                }
              }}
              onMouseLeave={(e) => {
                if (formData.industry !== template.id) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
              }}
            >
              {/* Enhanced Badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}>
                🏆 Enhanced AI
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '3rem',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${template.color}15`,
                  borderRadius: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {template.icon}
                </div>
                
                <h4 style={{ 
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: '#1e293b'
                }}>
                  {template.name}
                </h4>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  {template.description}
                </p>
              </div>
              
              {/* Legal Framework */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  Legal Framework:
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  display: 'inline-block',
                  marginBottom: '0.5rem'
                }}>
                  {template.legalFramework}
                </span>
                
                {template.sectoralDetermination && (
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#ede9fe',
                      color: '#6b21a8',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontWeight: '600'
                    }}>
                      {template.sectoralDetermination}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Sample Categories */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  Key Categories:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {template.categories.slice(0, 3).map((cat) => (
                    <span 
                      key={cat}
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontWeight: '500'
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    +{template.categories.length - 3} more
                  </span>
                </div>
              </div>
              
              {/* Enhanced Features */}
              <div>
                <p style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  AI Features:
                </p>
                <ul style={{ 
                  margin: 0,
                  paddingLeft: '1rem',
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  {template.features.map((feature) => (
                    <li key={feature} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ 
                        color: '#10b981',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}>
                        ✓
                      </span> 
                      <span style={{
                        fontWeight: feature.includes('🏆') ? '600' : 'normal',
                        color: feature.includes('🏆') ? '#166534' : '#64748b'
                      }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Sectors Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 Standard Sectors
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontWeight: '600'
          }}>
            Enhancement Coming Soon
          </span>
        </h4>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
          gap: '1rem'
        }}>
          {industryTemplates.filter(t => !t.enhanced).map((template) => (
            <div
              key={template.id}
              onClick={() => setFormData({ ...formData, industry: template.id })}
              style={{
                border: `2px solid ${formData.industry === template.id ? template.color : '#e2e8f0'}`,
                borderRadius: '0.5rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: formData.industry === template.id ? `${template.color}10` : 'white',
                position: 'relative',
                opacity: 0.8
              }}
              onMouseEnter={(e) => {
                if (formData.industry !== template.id) {
                  e.currentTarget.style.borderColor = `${template.color}60`;
                  e.currentTarget.style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (formData.industry !== template.id) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
            >
              {/* Coming Soon Badge */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem'
              }}>
                {template.priority}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{
                  fontSize: '2.5rem',
                  width: '3.5rem',
                  height: '3.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${template.color}15`,
                  borderRadius: '0.5rem',
                  flexShrink: 0
                }}>
                  {template.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: '#1e293b'
                  }}>
                    {template.name}
                  </h4>
                  <p style={{ 
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginBottom: '0.75rem'
                  }}>
                    {template.description}
                  </p>
                  
                  {/* Legal Framework */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500'
                    }}>
                      {template.legalFramework}
                    </span>
                  </div>
                  
                  {/* Sectoral Determination */}
                  {template.sectoralDetermination && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#ede9fe',
                        color: '#6b21a8',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {template.sectoralDetermination}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <p style={{ 
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#475569',
                      marginBottom: '0.25rem'
                    }}>
                      Included Features:
                    </p>
                    <ul style={{ 
                      margin: 0,
                      paddingLeft: '1rem',
                      fontSize: '0.75rem',
                      color: '#64748b'
                    }}>
                      {template.features.slice(0, 3).map((feature) => (
                        <li key={feature} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          marginBottom: '0.125rem'
                        }}>
                          <span style={{ color: '#10b981' }}>✓</span> 
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Features Info */}
      <div style={{ 
        marginTop: '2rem',
        backgroundColor: '#f0fdf4',
        border: '2px solid #10b981',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ color: '#10b981', fontSize: '2rem' }}>🏆</span>
          <div>
            <p style={{ 
              fontSize: '1.125rem',
              fontWeight: '700',
              marginBottom: '0.75rem',
              color: '#166534'
            }}>
              Enhanced AI Sectors - World-Class Features:
            </p>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#166534'
            }}>
              <div>
                <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Legal Compliance:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>Sector-specific legislation integration</li>
                  <li>Sectoral determination compliance</li>
                  <li>Real case law references</li>
                  <li>CCMA-ready documentation</li>
                </ul>
              </div>
              <div>
                <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>AI Intelligence:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>Risk assessment algorithms</li>
                  <li>Suspension-first philosophy</li>
                  <li>Context-aware escalation</li>
                  <li>Professional standards enforcement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div style={{ 
        marginTop: '1rem',
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ color: '#f59e0b', fontSize: '2rem' }}>🚀</span>
          <div>
            <p style={{ 
              fontSize: '1.125rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              color: '#92400e'
            }}>
              18-24 Month Competitive Advantage
            </p>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#92400e',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Our sector-specific AI analysis and South African legal compliance integration represents 
              the most advanced HR disciplinary system available. No competitor can replicate this 
              level of sophistication without significant development investment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
