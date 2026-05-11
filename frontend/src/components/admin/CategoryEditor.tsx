// frontend/src/components/admin/CategoryEditor.tsx
//
// Single-category editor card used by EnhancedOrganizationWizard's
// categories step. Extracted in Phase 2 Tier 3D step 6. Lets a reseller
// edit one OrganizationCategory inline: name, description, color, icon,
// active toggle, and full escalation-path management (move up/down,
// duplicate, remove, add step).

import React, { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { WarningLevel } from '../../types/core';
import { type OrganizationCategory, WARNING_LEVEL_NAMES } from './wizardConstants';

interface CategoryEditorProps {
  category: OrganizationCategory;
  onUpdate: (category: OrganizationCategory) => void;
  onRemove: () => void;
}

export const CategoryEditor: React.FC<CategoryEditorProps> = ({ category, onUpdate, onRemove }) => {
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

  const availableLevels: WarningLevel[] = ['counselling', 'verbal', 'first_written', 'second_written', 'final_written', 'dismissal'];

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
            title={localCategory.isDefault ? 'Remove default category' : 'Remove custom category'}
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
                {availableLevels.map((level) => (
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
                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {WARNING_LEVEL_NAMES[level]}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                "Contact HR - Serious Offence" redirects the manager to HR instead of issuing a warning.
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
