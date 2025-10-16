// frontend/src/components/admin/SectionEditorModal.tsx
// 📝 SECTION EDITOR MODAL - Edit section content with custom field insertion
// ✅ Rich text editing for heading and body
// ✅ Custom field picker with available placeholders
// ✅ Bullet point management
// ✅ Per-section styling options
// ✅ Live preview of section rendering

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Type,
  List,
  Palette,
  Eye,
  Code
} from 'lucide-react';
import type { PDFSectionConfig } from '../../types/core';
import { UnifiedModal } from '../common/UnifiedModal';
import { Z_INDEX } from '../../constants/zIndex';

interface SectionEditorModalProps {
  section: PDFSectionConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: PDFSectionConfig) => void;
}

// Available custom fields that can be inserted
const AVAILABLE_FIELDS = {
  'Employee Fields': [
    { label: 'First Name', placeholder: '{{employee.firstName}}' },
    { label: 'Last Name', placeholder: '{{employee.lastName}}' },
    { label: 'Employee Number', placeholder: '{{employee.employeeNumber}}' },
    { label: 'Email', placeholder: '{{employee.email}}' },
    { label: 'Phone', placeholder: '{{employee.phoneNumber}}' },
    { label: 'Department', placeholder: '{{employee.department}}' },
    { label: 'Position', placeholder: '{{employee.position}}' }
  ],
  'Warning Fields': [
    { label: 'Warning Level', placeholder: '{{warning.level}}' },
    { label: 'Issue Date', placeholder: '{{warning.issueDate}}' },
    { label: 'Incident Date', placeholder: '{{warning.incidentDate}}' },
    { label: 'Category', placeholder: '{{warning.category}}' },
    { label: 'Description', placeholder: '{{warning.description}}' },
    { label: 'Next Level', placeholder: '{{warning.nextLevel}}' }
  ],
  'Organization Fields': [
    { label: 'Company Name', placeholder: '{{organization.name}}' },
    { label: 'Industry', placeholder: '{{organization.industry}}' }
  ],
  'Manager Fields': [
    { label: 'Manager Name', placeholder: '{{manager.name}}' },
    { label: 'Manager Position', placeholder: '{{manager.position}}' }
  ]
};

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({
  section,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedSection, setEditedSection] = useState<PDFSectionConfig | null>(null);
  const [showFieldPicker, setShowFieldPicker] = useState<'heading' | 'body' | null>(null);
  const [newBulletPoint, setNewBulletPoint] = useState('');

  // Initialize edited section when modal opens
  useEffect(() => {
    if (section && isOpen) {
      setEditedSection({ ...section });
    }
  }, [section, isOpen]);

  if (!editedSection || !isOpen) return null;

  // Insert custom field at cursor position
  const insertField = (fieldTarget: 'heading' | 'body', placeholder: string) => {
    if (fieldTarget === 'heading') {
      setEditedSection({
        ...editedSection,
        content: {
          ...editedSection.content,
          heading: editedSection.content.heading + ' ' + placeholder
        }
      });
    } else {
      setEditedSection({
        ...editedSection,
        content: {
          ...editedSection.content,
          body: (editedSection.content.body || '') + ' ' + placeholder
        }
      });
    }
    setShowFieldPicker(null);
  };

  // Add bullet point
  const addBulletPoint = () => {
    if (newBulletPoint.trim()) {
      setEditedSection({
        ...editedSection,
        content: {
          ...editedSection.content,
          bulletPoints: [
            ...(editedSection.content.bulletPoints || []),
            newBulletPoint.trim()
          ]
        }
      });
      setNewBulletPoint('');
    }
  };

  // Remove bullet point
  const removeBulletPoint = (index: number) => {
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        bulletPoints: editedSection.content.bulletPoints?.filter((_, i) => i !== index)
      }
    });
  };

  // Update bullet point
  const updateBulletPoint = (index: number, value: string) => {
    const newBulletPoints = [...(editedSection.content.bulletPoints || [])];
    newBulletPoints[index] = value;
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        bulletPoints: newBulletPoints
      }
    });
  };

  // Add subsection
  const addSubsection = () => {
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: [
          ...(editedSection.content.subsections || []),
          {
            title: 'New Subsection',
            content: []  // Default to bullet points
          }
        ]
      }
    });
  };

  // Remove subsection
  const removeSubsection = (index: number) => {
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: editedSection.content.subsections?.filter((_, i) => i !== index)
      }
    });
  };

  // Update subsection title
  const updateSubsectionTitle = (index: number, title: string) => {
    const newSubsections = [...(editedSection.content.subsections || [])];
    newSubsections[index] = { ...newSubsections[index], title };
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: newSubsections
      }
    });
  };

  // Update subsection content (paragraph)
  const updateSubsectionContent = (index: number, content: string) => {
    const newSubsections = [...(editedSection.content.subsections || [])];
    newSubsections[index] = { ...newSubsections[index], content };
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: newSubsections
      }
    });
  };

  // Toggle subsection content type (paragraph <-> bullet points)
  const toggleSubsectionContentType = (index: number, type: 'paragraph' | 'bullet') => {
    const newSubsections = [...(editedSection.content.subsections || [])];
    const currentContent = newSubsections[index].content;

    if (type === 'paragraph' && Array.isArray(currentContent)) {
      // Convert bullet points to paragraph
      newSubsections[index] = { ...newSubsections[index], content: currentContent.join(' ') };
    } else if (type === 'bullet' && typeof currentContent === 'string') {
      // Convert paragraph to bullet points
      newSubsections[index] = { ...newSubsections[index], content: currentContent ? [currentContent] : [] };
    }

    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: newSubsections
      }
    });
  };

  // Update subsection bullet point
  const updateSubsectionBulletPoint = (subsectionIndex: number, pointIndex: number, value: string) => {
    const newSubsections = [...(editedSection.content.subsections || [])];
    const bullets = newSubsections[subsectionIndex].content as string[];
    bullets[pointIndex] = value;
    newSubsections[subsectionIndex] = { ...newSubsections[subsectionIndex], content: bullets };
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: newSubsections
      }
    });
  };

  // Remove subsection bullet point
  const removeSubsectionBulletPoint = (subsectionIndex: number, pointIndex: number) => {
    const newSubsections = [...(editedSection.content.subsections || [])];
    const bullets = (newSubsections[subsectionIndex].content as string[]).filter((_, i) => i !== pointIndex);
    newSubsections[subsectionIndex] = { ...newSubsections[subsectionIndex], content: bullets };
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: newSubsections
      }
    });
  };

  // Add bullet point to subsection
  const addSubsectionBulletPoint = (subsectionIndex: number) => {
    const newSubsections = [...(editedSection.content.subsections || [])];
    const bullets = newSubsections[subsectionIndex].content as string[];
    bullets.push('');
    newSubsections[subsectionIndex] = { ...newSubsections[subsectionIndex], content: bullets };
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        subsections: newSubsections
      }
    });
  };

  // Handle save
  const handleSave = () => {
    if (editedSection) {
      onSave({
        ...editedSection,
        updatedAt: new Date(),
        updatedBy: 'current-user' // TODO: Get from auth context
      });
      onClose();
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      zIndex={Z_INDEX.MODAL}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Edit Section: {section?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Customize section content and insert custom fields
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Section Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Name
          </label>
          <input
            type="text"
            value={editedSection.name}
            onChange={(e) => setEditedSection({ ...editedSection, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Employee Information"
          />
        </div>

        {/* Section Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <input
            type="text"
            value={editedSection.description || ''}
            onChange={(e) => setEditedSection({ ...editedSection, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Brief description of this section's purpose"
          />
        </div>

        {/* Heading */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              <Type className="w-4 h-4 inline mr-1" />
              Heading
            </label>
            <button
              onClick={() => setShowFieldPicker('heading')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              Insert Field
            </button>
          </div>
          <input
            type="text"
            value={editedSection.content.heading}
            onChange={(e) => setEditedSection({
              ...editedSection,
              content: { ...editedSection.content, heading: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium"
            placeholder="Section heading"
          />

          {/* Field Picker for Heading */}
          {showFieldPicker === 'heading' && (
            <div className="mt-2 p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-900">Available Fields</span>
                <button
                  onClick={() => setShowFieldPicker(null)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Close
                </button>
              </div>
              {Object.entries(AVAILABLE_FIELDS).map(([category, fields]) => (
                <div key={category} className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">{category}</div>
                  <div className="flex flex-wrap gap-1">
                    {fields.map((field) => (
                      <button
                        key={field.placeholder}
                        onClick={() => insertField('heading', field.placeholder)}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-100 hover:border-blue-400 transition-colors"
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              <Type className="w-4 h-4 inline mr-1" />
              Body Text
            </label>
            <button
              onClick={() => setShowFieldPicker('body')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              Insert Field
            </button>
          </div>
          <textarea
            value={editedSection.content.body || ''}
            onChange={(e) => setEditedSection({
              ...editedSection,
              content: { ...editedSection.content, body: e.target.value }
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Main section content. Use {{placeholders}} for dynamic data."
          />

          {/* Field Picker for Body */}
          {showFieldPicker === 'body' && (
            <div className="mt-2 p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-900">Available Fields</span>
                <button
                  onClick={() => setShowFieldPicker(null)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Close
                </button>
              </div>
              {Object.entries(AVAILABLE_FIELDS).map(([category, fields]) => (
                <div key={category} className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">{category}</div>
                  <div className="flex flex-wrap gap-1">
                    {fields.map((field) => (
                      <button
                        key={field.placeholder}
                        onClick={() => insertField('body', field.placeholder)}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-100 hover:border-blue-400 transition-colors"
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bullet Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <List className="w-4 h-4 inline mr-1" />
            Bullet Points (optional)
          </label>

          {/* Existing Bullet Points */}
          {editedSection.content.bulletPoints && editedSection.content.bulletPoints.length > 0 && (
            <div className="space-y-2 mb-3">
              {editedSection.content.bulletPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateBulletPoint(index, e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => removeBulletPoint(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Bullet Point */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newBulletPoint}
              onChange={(e) => setNewBulletPoint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBulletPoint()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Add bullet point (press Enter or click +)"
            />
            <button
              onClick={addBulletPoint}
              disabled={!newBulletPoint.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Subsections (optional) - For Employee Rights, Consequences, etc. */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <List className="w-4 h-4 inline mr-1" />
            Subsections (optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Create structured multi-part sections with titles and content blocks. Used for Employee Rights, Consequences, etc.
          </p>

          {/* Existing Subsections List */}
          {editedSection.content.subsections && editedSection.content.subsections.length > 0 && (
            <div className="space-y-4 mb-4">
              {editedSection.content.subsections.map((subsection, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {/* Subsection Title */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-700">Subsection Title</label>
                    <input
                      type="text"
                      value={subsection.title}
                      onChange={(e) => updateSubsectionTitle(index, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                      placeholder="e.g., Your Rights:"
                    />
                  </div>

                  {/* Subsection Content Type Toggle */}
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-xs font-medium text-gray-700">Content Type:</label>
                    <button
                      onClick={() => toggleSubsectionContentType(index, 'paragraph')}
                      className={`px-2 py-1 text-xs rounded ${
                        typeof subsection.content === 'string'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Paragraph
                    </button>
                    <button
                      onClick={() => toggleSubsectionContentType(index, 'bullet')}
                      className={`px-2 py-1 text-xs rounded ${
                        Array.isArray(subsection.content)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Bullet Points
                    </button>
                  </div>

                  {/* Subsection Content Editor */}
                  {typeof subsection.content === 'string' ? (
                    // Paragraph content
                    <textarea
                      value={subsection.content}
                      onChange={(e) => updateSubsectionContent(index, e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Enter paragraph content (use {{placeholders}} for dynamic data)"
                    />
                  ) : (
                    // Bullet points content
                    <div className="space-y-2">
                      {subsection.content.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-center gap-2">
                          <span className="text-gray-400">•</span>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateSubsectionBulletPoint(index, pointIndex, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => removeSubsectionBulletPoint(index, pointIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSubsectionBulletPoint(index)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add bullet point
                      </button>
                    </div>
                  )}

                  {/* Delete Subsection Button */}
                  <button
                    onClick={() => removeSubsection(index)}
                    className="mt-3 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Subsection
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subsection Button */}
          <button
            onClick={addSubsection}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Subsection
          </button>
        </div>

        {/* Section Styling (Optional) */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Palette className="w-4 h-4 inline mr-1" />
            Section Styling (optional)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Heading Font Size (pt)</label>
              <input
                type="number"
                min="10"
                max="20"
                value={editedSection.styling?.headingFontSize || ''}
                onChange={(e) => setEditedSection({
                  ...editedSection,
                  styling: {
                    ...editedSection.styling,
                    headingFontSize: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Default"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Body Font Size (pt)</label>
              <input
                type="number"
                min="8"
                max="16"
                value={editedSection.styling?.bodyFontSize || ''}
                onChange={(e) => setEditedSection({
                  ...editedSection,
                  styling: {
                    ...editedSection.styling,
                    bodyFontSize: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Default"
              />
            </div>
          </div>
        </div>

        {/* Lock Section */}
        {section?.type === 'standard' && (
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editedSection.isLocked || false}
                onChange={(e) => setEditedSection({ ...editedSection, isLocked: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Lock section (prevent editing in future)
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Type className="w-4 h-4" />
          Save Section
        </button>
      </div>
    </UnifiedModal>
  );
};
