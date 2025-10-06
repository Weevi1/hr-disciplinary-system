// frontend/src/components/warnings/enhanced/steps/components/CategorySelector.tsx
// 🎯 FOCUSED CATEGORY SELECTOR - V2 TREATMENT
// ✅ Extracted from CombinedIncidentStep, escalation path visualization
// ✅ Mobile-first design, visual category indicators

import React, { useState, useMemo, useCallback } from 'react';
import { Brain, ChevronDown, ChevronUp, Target, Scale, AlertTriangle, TrendingUp, X, Search, User } from 'lucide-react';
import type { WarningCategory, EscalationRecommendation } from '../../../../../services/WarningService';
import { getEscalationPath, getLevelLabel } from '../../../../../services/UniversalCategories';

// Import unified theming components
import { ThemedCard, ThemedSectionHeader } from '../../../../common/ThemedCard';

interface CategorySelectorProps {
  categories: WarningCategory[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  lraRecommendation?: EscalationRecommendation | null;
  disabled?: boolean;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  lraRecommendation,
  disabled = false,
  className = ""
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModal, setIsMobileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;

    const term = searchTerm.toLowerCase();
    return categories.filter(category => {
      const name = category.name?.toLowerCase() || '';
      const description = category.description?.toLowerCase() || '';
      const severity = category.severity?.toLowerCase() || '';

      return name.includes(term) ||
             description.includes(term) ||
             severity.includes(term);
    });
  }, [categories, searchTerm]);

  // Get selected category
  const selectedCategory = useMemo(() =>
    categories.find(cat => cat.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    onCategorySelect(categoryId);
    setShowDetails(false);
    setIsOpen(false);
    setIsMobileModal(false);
    setSearchTerm("");
  }, [onCategorySelect]);

  // Handle opening selector (mobile vs desktop)
  const handleOpenSelector = useCallback(() => {
    if (disabled) return;

    // Check if mobile view
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileModal(true);
    } else {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen]);

  // Handle mobile modal close
  const handleMobileModalClose = useCallback(() => {
    setIsMobileModal(false);
    setSearchTerm("");
  }, []);

  // Get category severity color using theme variables
  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return {
          backgroundColor: 'var(--color-alert-error-bg)',
          color: 'var(--color-alert-error-text)',
          borderColor: 'var(--color-alert-error-border)'
        };
      case 'medium':
        return {
          backgroundColor: 'var(--color-alert-warning-bg)',
          color: 'var(--color-alert-warning-text)',
          borderColor: 'var(--color-alert-warning-border)'
        };
      case 'low':
        return {
          backgroundColor: 'var(--color-alert-success-bg)',
          color: 'var(--color-alert-success-text)',
          borderColor: 'var(--color-alert-success-border)'
        };
      default:
        return {
          backgroundColor: 'var(--color-muted)',
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)'
        };
    }
  };

  // Get escalation path for selected category
  const escalationPath = useMemo(() => {
    if (!selectedCategory) return [];
    // Use category ID instead of name for proper lookup
    return selectedCategory.escalationPath || getEscalationPath(selectedCategory.id);
  }, [selectedCategory]);

  // Get recommended level index
  const recommendedLevelIndex = useMemo(() => {
    if (!lraRecommendation || !escalationPath.length) return -1;
    return escalationPath.findIndex(level => level === lraRecommendation.suggestedLevel);
  }, [lraRecommendation, escalationPath]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <ThemedSectionHeader
        icon={Brain}
        title="Category Selection"
        subtitle="Choose the type of misconduct or policy violation"
        rightContent={
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {categories.length}
          </div>
        }
      />

      {/* Category Selector Dropdown */}
      <div className="relative">
        <div className="space-y-2">
          {/* Selected Category Display */}
          <ThemedCard
            hover
            padding="sm"
            className={`cursor-pointer transition-all min-h-[48px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              borderWidth: '1px',
              borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-border)',
              boxShadow: isOpen ? '0 0 0 2px var(--color-primary-light)' : undefined
            }}
            onClick={handleOpenSelector}
          >
            {selectedCategory ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {selectedCategory.name}
                    </div>
                    {selectedCategory.description && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {selectedCategory.description}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Select a category...
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            )}
          </ThemedCard>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="fixed top-20 left-4 right-4 z-[10001] bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden md:absolute md:top-full md:left-0 md:right-0">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  autoFocus
                />
              </div>

              {/* Category List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCategories.length > 0 ? (
                  <div className="py-2">
                    {filteredCategories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className="w-full text-left px-3 py-3 transition-colors hover:bg-opacity-50"
                        style={{
                          color: 'var(--color-text)',
                          ':hover': { backgroundColor: 'var(--color-primary-light)' }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Category Icon - using severity for color */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{
                              backgroundColor: category.severity === 'serious' || category.severity === 'gross_misconduct'
                                ? 'var(--color-error-bg)'
                                : category.severity === 'moderate'
                                ? 'var(--color-warning-bg)'
                                : 'var(--color-primary-bg)',
                              color: category.severity === 'serious' || category.severity === 'gross_misconduct'
                                ? 'var(--color-error)'
                                : category.severity === 'moderate'
                                ? 'var(--color-warning)'
                                : 'var(--color-primary)'
                            }}
                          >
                            {category.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                              {category.name}
                            </div>
                            {category.description && (
                              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No categories found</p>
                    {searchTerm && (
                      <p className="text-sm text-gray-400 mt-1">
                        matching "{searchTerm}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal for Category Selection */}
      {isMobileModal && (
        <div className="mobile-category-modal">
          <div className="mobile-category-modal-backdrop" onClick={handleMobileModalClose} />
          <div className="mobile-category-modal-content">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Category</h3>
              <button
                onClick={handleMobileModalClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                autoFocus
              />
            </div>

            {/* Mobile Category Cards */}
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {filteredCategories.length > 0 ? (
                <div>
                  {filteredCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="w-full text-left px-4 py-4 transition-colors flex items-start gap-3"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Category Icon - using severity for color */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: category.severity === 'serious' || category.severity === 'gross_misconduct'
                            ? 'var(--color-error-bg)'
                            : category.severity === 'moderate'
                            ? 'var(--color-warning-bg)'
                            : 'var(--color-primary-bg)',
                          color: category.severity === 'serious' || category.severity === 'gross_misconduct'
                            ? 'var(--color-error)'
                            : category.severity === 'moderate'
                            ? 'var(--color-warning)'
                            : 'var(--color-primary)'
                        }}
                      >
                        {category.icon}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-medium text-base text-left" style={{ color: 'var(--color-text)' }}>
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-left mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {category.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No categories found</p>
                  {searchTerm && (
                    <p className="text-sm text-gray-400 mt-1">
                      matching "{searchTerm}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Category Details */}
      {selectedCategory && showDetails && (
        <ThemedCard className="rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>Category Details</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm"
              style={{ color: 'var(--color-primary)' }}
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Category Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Category Information</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Severity Level:</span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium border"
                      style={getSeverityStyles(selectedCategory.severity)}
                    >
                      {selectedCategory.severity}
                    </span>
                  </div>
                  {selectedCategory.description && (
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Description:</span>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{selectedCategory.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>LRA Recommendation</div>
                {lraRecommendation ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {getLevelLabel(lraRecommendation.suggestedLevel)}
                      </span>
                      {lraRecommendation.isEscalation && (
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: 'var(--color-alert-warning-bg)',
                            color: 'var(--color-alert-warning-text)'
                          }}
                        >
                          Escalation
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {lraRecommendation.reason}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm italic" style={{ color: 'var(--color-text-tertiary)' }}>
                    Select an employee to see LRA recommendation
                  </div>
                )}
              </div>
            </div>

            {/* Escalation Path Visualization */}
            <div>
              <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>Progressive Discipline Path</div>
              <div className="flex flex-wrap gap-2">
                {escalationPath.map((level, index) => {
                  const isRecommended = index === recommendedLevelIndex;
                  const isPast = recommendedLevelIndex >= 0 && index < recommendedLevelIndex;
                  
                  return (
                    <div
                      key={level}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
                      style={{
                        backgroundColor: isRecommended
                          ? 'var(--color-badge-primary)'
                          : isPast
                          ? 'var(--color-muted)'
                          : 'var(--color-card-background)',
                        borderColor: isRecommended
                          ? 'var(--color-primary)'
                          : 'var(--color-border)',
                        color: isRecommended
                          ? 'var(--color-badge-primary-text)'
                          : 'var(--color-text-secondary)'
                      }}
                    >
                      {isRecommended && <TrendingUp className="w-4 h-4" />}
                      {isPast && <AlertTriangle className="w-4 h-4" />}
                      <span>{getLevelLabel(level)}</span>
                      {index < escalationPath.length - 1 && (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {lraRecommendation && (
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)', border: '1px solid var(--color-alert-info-border)' }}>
                  <div className="flex items-start gap-2">
                    <Scale className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-alert-info-text)' }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-alert-info-text)' }}>
                        Recommended Action: {getLevelLabel(lraRecommendation.suggestedLevel)}
                      </div>
                      <div className="text-sm mt-1" style={{ color: 'var(--color-alert-info-text)' }}>
                        Based on {lraRecommendation.categoryWarningCount ?? 0} previous warning(s) in this category
                        {lraRecommendation.isEscalation && ' (escalation required)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ThemedCard>
      )}
    </div>
  );
};