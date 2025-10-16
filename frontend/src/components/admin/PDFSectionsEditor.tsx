// frontend/src/components/admin/PDFSectionsEditor.tsx
// 🎨 PDF SECTIONS EDITOR - Drag-and-drop section management with CRUD operations
// ✅ Sortable section list with drag handles
// ✅ Edit, delete, reorder sections
// ✅ Custom field support
// ✅ Add custom sections

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit2,
  Trash2,
  Plus,
  Lock
} from 'lucide-react';
import type { PDFSectionConfig, PDFTemplateSettings } from '../../types/core';
import { SectionEditorModal } from './SectionEditorModal';

interface PDFSectionsEditorProps {
  settings: PDFTemplateSettings;
  onChange: (settings: PDFTemplateSettings) => void;
}

// Sortable Section Item Component
const SortableSection: React.FC<{
  section: PDFSectionConfig;
  onToggle: (id: string) => void;
  onEdit: (section: PDFSectionConfig) => void;
  onDelete: (id: string) => void;
}> = ({ section, onToggle, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2 border rounded-lg bg-white hover:border-gray-400 transition-colors"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={section.enabled}
        onChange={() => onToggle(section.id)}
        className="w-4 h-4 cursor-pointer"
      />

      {/* Section Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {section.name}
          </span>
          {section.isLocked && (
            <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0">
            {section.type}
          </span>
        </div>
        {section.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {section.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(section)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          aria-label="Edit section"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {!section.isLocked && section.type === 'custom' && (
          <button
            onClick={() => onDelete(section.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="Delete section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const PDFSectionsEditor: React.FC<PDFSectionsEditorProps> = ({
  settings,
  onChange
}) => {
  // Modal state
  const [editingSection, setEditingSection] = useState<PDFSectionConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get sections from settings, or use legacy feature flags to create sections
  const getSections = (): PDFSectionConfig[] => {
    if (settings.sections && settings.sections.length > 0) {
      return settings.sections;
    }

    // Legacy: Convert feature flags to section configs
    const legacySections: PDFSectionConfig[] = [
      {
        id: 'previous-disciplinary-actions',
        type: 'standard',
        name: 'Previous Disciplinary Actions',
        enabled: settings.features.enablePreviousWarnings,
        order: 0,
        content: {
          heading: 'Previous Disciplinary Action',
          body: 'This section provides a record of any prior warnings or disciplinary actions.'
        }
      },
      {
        id: 'consequences-section',
        type: 'standard',
        name: 'Consequences Section',
        enabled: settings.features.enableConsequences,
        order: 1,
        content: {
          heading: 'Consequences of Further Misconduct',
          body: 'Failure to improve your conduct may result in further disciplinary action.'
        }
      },
      {
        id: 'employee-rights-lra',
        type: 'standard',
        name: 'Employee Rights (LRA Compliance)',
        enabled: settings.features.enableEmployeeRights,
        order: 2,
        content: {
          heading: 'Your Rights as an Employee',
          body: 'In accordance with the Labour Relations Act 66 of 1995...'
        },
        isLocked: true
      },
      {
        id: 'appeal-history',
        type: 'standard',
        name: 'Appeal History Section',
        enabled: settings.features.enableAppealSection,
        order: 3,
        content: {
          heading: 'Appeal Information',
          body: 'If you wish to appeal this warning...'
        }
      },
      {
        id: 'signatures',
        type: 'standard',
        name: 'Signature Section',
        enabled: settings.features.enableSignatures,
        order: 4,
        content: {
          heading: 'Acknowledgment of Receipt',
          body: 'By signing below, you acknowledge receipt of this warning.'
        }
      }
    ];

    return legacySections;
  };

  const sections = getSections();

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Handle drag end (reordering)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex);

      // Update order numbers
      const updatedSections = reorderedSections.map((section, index) => ({
        ...section,
        order: index
      }));

      // Save to settings
      onChange({
        ...settings,
        sections: updatedSections
      });
    }
  };

  // Toggle section enabled/disabled
  const handleToggle = (id: string) => {
    const updatedSections = sections.map((section) =>
      section.id === id ? { ...section, enabled: !section.enabled } : section
    );

    onChange({
      ...settings,
      sections: updatedSections
    });
  };

  // Edit section (open modal)
  const handleEdit = (section: PDFSectionConfig) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  // Save edited section
  const handleSaveSection = (updatedSection: PDFSectionConfig) => {
    const updatedSections = sections.map((s) =>
      s.id === updatedSection.id ? updatedSection : s
    );

    onChange({
      ...settings,
      sections: updatedSections
    });

    setIsModalOpen(false);
    setEditingSection(null);
  };

  // Delete section
  const handleDelete = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;

    if (confirm(`Are you sure you want to delete "${section.name}"?\n\nThis action cannot be undone.`)) {
      const updatedSections = sections
        .filter((s) => s.id !== id)
        .map((section, index) => ({ ...section, order: index }));

      onChange({
        ...settings,
        sections: updatedSections
      });
    }
  };

  // Add custom section
  const handleAddSection = () => {
    const newSection: PDFSectionConfig = {
      id: `custom-section-${Date.now()}`,
      type: 'custom',
      name: 'New Custom Section',
      enabled: true,
      order: sections.length,
      content: {
        heading: 'Custom Section Heading',
        body: 'Enter your custom content here. You can use {{placeholders}} for dynamic data.',
        bulletPoints: []
      },
      description: 'Custom section created by user',
      createdAt: new Date(),
      createdBy: 'current-user' // TODO: Get from auth context
    };

    // Add to sections array
    onChange({
      ...settings,
      sections: [...sections, newSection]
    });

    // Automatically open edit modal for new section
    setTimeout(() => {
      setEditingSection(newSection);
      setIsModalOpen(true);
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <strong>Drag</strong> sections to reorder, <strong>check/uncheck</strong> to enable/disable,
          click <strong>Edit</strong> to customize content and add custom fields.
        </p>
      </div>

      {/* Sortable Section List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Custom Section Button */}
      <button
        onClick={handleAddSection}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Custom Section
      </button>

      {/* Section Count */}
      <div className="text-xs text-gray-500 text-center">
        {sections.filter((s) => s.enabled).length} of {sections.length} sections enabled
      </div>

      {/* Section Editor Modal */}
      <SectionEditorModal
        section={editingSection}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSection(null);
        }}
        onSave={handleSaveSection}
      />
    </div>
  );
};
