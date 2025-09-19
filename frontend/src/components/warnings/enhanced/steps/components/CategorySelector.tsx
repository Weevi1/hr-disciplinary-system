// frontend/src/components/warnings/enhanced/steps/components/CategorySelector.tsx
// 🎯 FOCUSED CATEGORY SELECTOR - V2 TREATMENT
// ✅ Extracted from CombinedIncidentStep, escalation path visualization
// ✅ Mobile-first design, visual category indicators

import React, { useState, useMemo, useCallback } from 'react';
import { Brain, ChevronDown, ChevronUp, Target, Scale, AlertTriangle, TrendingUp } from 'lucide-react';
import type { WarningCategory, EscalationRecommendation } from '../../../../../services/WarningService';
import { getEscalationPath, getLevelLabel } from '../../../../../services/UniversalCategories';

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
  const [showDetails, setShowDetails] = useState(!!selectedCategoryId);
  const [isOpen, setIsOpen] = useState(false);

  // Get selected category
  const selectedCategory = useMemo(() => 
    categories.find(cat => cat.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    onCategorySelect(categoryId);
    setShowDetails(true);
    setIsOpen(false);
  }, [onCategorySelect]);

  // Get category severity color
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get escalation path for selected category
  const escalationPath = useMemo(() => {
    if (!selectedCategory) return [];
    return getEscalationPath(selectedCategory.name);
  }, [selectedCategory]);

  // Get recommended level index
  const recommendedLevelIndex = useMemo(() => {
    if (!lraRecommendation || !escalationPath.length) return -1;
    return escalationPath.findIndex(level => level === lraRecommendation.suggestedLevel);
  }, [lraRecommendation, escalationPath]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Category Selection</h3>
            <p className="text-sm text-gray-600">Choose the type of misconduct or policy violation</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {categories.length} categories
        </div>
      </div>

      {/* Category Selector Dropdown */}
      <div className="relative">
        <div className="space-y-2">
          {/* Selected Category Display */}
          <div 
            className={`
              relative border rounded-lg cursor-pointer transition-all
              ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-300 hover:border-gray-400'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            {selectedCategory ? (
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {selectedCategory.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium border
                          ${getSeverityColor(selectedCategory.severity)}
                        `}>
                          {selectedCategory.severity} Severity
                        </span>
                        {lraRecommendation && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            → {getLevelLabel(lraRecommendation.suggestedLevel)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">Select a category...</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            )}
          </div>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
              {/* Category List */}
              <div className="max-h-80 overflow-y-auto">
                {categories.length > 0 ? (
                  <div className="py-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                              <Target className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">
                                {category.name}
                              </div>
                              {category.description && (
                                <div className="text-sm text-gray-600 truncate mt-1">
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 ml-4">
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium border
                              ${getSeverityColor(category.severity)}
                            `}>
                              {category.severity}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No categories available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Category Details */}
      {selectedCategory && showDetails && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Category Details</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Category Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Category Information</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Severity Level:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedCategory.severity)}`}>
                      {selectedCategory.severity}
                    </span>
                  </div>
                  {selectedCategory.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedCategory.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">LRA Recommendation</div>
                {lraRecommendation ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        {getLevelLabel(lraRecommendation.suggestedLevel)}
                      </span>
                      {lraRecommendation.isEscalation && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Escalation
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {lraRecommendation.reason}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Select an employee to see LRA recommendation
                  </div>
                )}
              </div>
            </div>

            {/* Escalation Path Visualization */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Progressive Discipline Path</div>
              <div className="flex flex-wrap gap-2">
                {escalationPath.map((level, index) => {
                  const isRecommended = index === recommendedLevelIndex;
                  const isPast = recommendedLevelIndex >= 0 && index < recommendedLevelIndex;
                  
                  return (
                    <div
                      key={level}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
                        ${isRecommended 
                          ? 'bg-purple-100 border-purple-300 text-purple-800' 
                          : isPast
                          ? 'bg-gray-100 border-gray-300 text-gray-600'
                          : 'bg-white border-gray-200 text-gray-700'
                        }
                      `}
                    >
                      {isRecommended && <TrendingUp className="w-4 h-4" />}
                      {isPast && <AlertTriangle className="w-4 h-4" />}
                      <span>{getLevelLabel(level)}</span>
                      {index < escalationPath.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {lraRecommendation && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Scale className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        Recommended Action: {getLevelLabel(lraRecommendation.suggestedLevel)}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        Based on {lraRecommendation.warningCount} total warnings 
                        {lraRecommendation.isEscalation && ' (escalation required)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};