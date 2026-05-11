// frontend/src/components/organization/CategoryTemplateSelectorModal.tsx
//
// "Select Category Template" modal for OrganizationCategoriesViewer.
// Extracted in Phase 2 Tier 3D step 4. User picks one of the 8 universal
// SA labour-law-compliant category templates; parent's `newCategory`
// state is populated and the modal closes.

import React from 'react';
import { Shield, X, Target, ChevronRight } from 'lucide-react';
import { UNIVERSAL_SA_CATEGORIES, getLevelLabel } from '../../services/UniversalCategories';
import { getSeverityColor, getSeverityIcon } from './categoryHelpers';

interface NewCategoryShape {
  name: string;
  description: string;
  level: string;
  color: string;
  icon: string;
  isActive: boolean;
  isDefault: boolean;
  escalationPath: string[];
}

interface CategoryTemplateSelectorModalProps {
  onSelect: (categoryDraft: NewCategoryShape) => void;
  onClose: () => void;
}

export const CategoryTemplateSelectorModal: React.FC<CategoryTemplateSelectorModalProps> = ({
  onSelect,
  onClose,
}) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        maxWidth: '48rem',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Modal Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.5rem',
              backgroundColor: '#dbeafe',
              borderRadius: '0.5rem',
            }}
          >
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              Select Category Template
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
              Choose from 8 universal SA labor law compliant categories
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#6b7280',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Templates List - Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {UNIVERSAL_SA_CATEGORIES.map((template) => {
            const severityColor = getSeverityColor(template.severity);
            const severityIcon = getSeverityIcon(template.severity);

            return (
              <div
                key={template.id}
                onClick={() => {
                  // Map template fields to newCategory structure
                  onSelect({
                    name: template.name,
                    description: template.description,
                    level: template.escalationPath?.[0] || 'verbal',
                    color: severityColor,
                    icon: template.icon || '📋',
                    isActive: true,
                    isDefault: false,
                    escalationPath:
                      template.escalationPath || ['verbal', 'first_written', 'final_written'],
                  });
                }}
                style={{
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                  {/* Icon */}
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{template.icon}</div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {template.name}
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: severityColor,
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ transform: 'scale(0.8)' }}>{severityIcon}</span>
                        {template.severity?.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                      {template.description}
                    </p>

                    {/* Escalation Path */}
                    {template.escalationPath && template.escalationPath.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Target className="w-3 h-3" />
                          Escalation Path:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {template.escalationPath.map((level, index) => (
                            <React.Fragment key={index}>
                              <span
                                style={{
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                  fontSize: '0.625rem',
                                  fontWeight: 500,
                                  borderRadius: '0.25rem',
                                }}
                              >
                                {getLevelLabel(level)}
                              </span>
                              {index < template.escalationPath!.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {template.commonExamples && template.commonExamples.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                          Common Examples:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {template.commonExamples.slice(0, 3).map((example, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '0.625rem',
                                borderRadius: '0.25rem',
                              }}
                            >
                              {example}
                            </span>
                          ))}
                          {template.commonExamples.length > 3 && (
                            <span
                              style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                fontSize: '0.625rem',
                                borderRadius: '0.25rem',
                              }}
                            >
                              +{template.commonExamples.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div style={{ flexShrink: 0, color: '#9ca3af' }}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Footer */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.625rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);
