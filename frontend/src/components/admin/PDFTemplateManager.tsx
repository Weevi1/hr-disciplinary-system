// frontend/src/components/admin/PDFTemplateManager.tsx
// 📄 PDF TEMPLATE MANAGER - Visual PDF Template Editor for SuperAdmin
// ✅ Per-organization PDF customization with live preview
// ✅ Version management and bulk operations
// ✅ Integrates PDFTemplateEditor and PDFTemplatePreview

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Loader
} from 'lucide-react';
import type { Organization, PDFTemplateSettings } from '../../types/core';
import { ThemedCard } from '../common/ThemedCard';
import { PDFTemplateEditor } from './PDFTemplateEditor';
import { PDFTemplatePreview } from './PDFTemplatePreview';
import { PDFTemplateService } from '../../services/PDFTemplateService';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';

interface PDFTemplateManagerProps {
  organizations: Organization[];
  onTemplateUpdate?: () => void; // Callback to refresh organizations after save
}

export const PDFTemplateManager: React.FC<PDFTemplateManagerProps> = ({ organizations, onTemplateUpdate }) => {
  // Hooks
  const { user } = useAuth();

  // State
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editorSettings, setEditorSettings] = useState<PDFTemplateSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Selected organization
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  // Filter organizations by search
  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle organization selection
  const handleSelectOrganization = useCallback((org: Organization) => {
    setSelectedOrgId(org.id);
    setShowEditor(true);

    // Load org's PDF settings or use defaults
    if (org.pdfSettings) {
      Logger.debug('✅ Loading existing PDF settings from organization');
      setEditorSettings(org.pdfSettings);
    } else {
      Logger.debug('⚠️ No PDF settings found, initializing defaults');
      const defaults = getDefaultPDFSettings();
      Logger.debug('Default settings created:', defaults);
      setEditorSettings(defaults);
    }

    Logger.debug('Selected organization for PDF template editing:', org.name);
  }, []);

  // Handle saving template
  const handleSaveTemplate = useCallback(async (settings: PDFTemplateSettings) => {
    if (!selectedOrgId || !user?.id) {
      Logger.warn('⚠️ Cannot save: missing selectedOrgId or user.id');
      return;
    }

    setIsSaving(true);

    try {
      Logger.debug('💾 Saving PDF template for organization:', selectedOrgId);

      // Save via PDFTemplateService
      await PDFTemplateService.saveTemplate(selectedOrgId, settings, user.id);

      Logger.success('PDF template saved successfully!');
      alert('✅ PDF Template saved successfully!');

      // Refresh organizations data to show updated version
      if (onTemplateUpdate) {
        Logger.debug('🔄 Refreshing organizations data after template save...');
        await onTemplateUpdate();
      }

    } catch (error) {
      Logger.error('Failed to save PDF template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to save PDF template: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedOrgId, user, onTemplateUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ThemedCard padding="md" shadow="md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              📄 PDF Template Manager
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Customize PDF generation per organization with live preview
            </p>
          </div>
        </div>
      </ThemedCard>

      {/* Main Layout: Organization List + Editor/Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Organization List */}
        <div className="lg:col-span-1">
          <ThemedCard padding="md" shadow="md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Organizations ({organizations.length})
                </h3>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                        style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-background)'
                  }}
                />
              </div>

              {/* Organization List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredOrgs.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2"
                                 style={{ color: 'var(--color-text-tertiary)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      No organizations found
                    </p>
                  </div>
                ) : (
                  filteredOrgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrganization(org)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedOrgId === org.id ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: selectedOrgId === org.id
                          ? 'var(--color-primary-bg)'
                          : 'var(--color-background)',
                        border: selectedOrgId === org.id
                          ? '1px solid var(--color-primary)'
                          : '1px solid var(--color-border)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate"
                               style={{ color: 'var(--color-text)' }}>
                            {org.name}
                          </div>
                          <div className="text-xs mt-0.5"
                               style={{ color: 'var(--color-text-secondary)' }}>
                            {org.pdfSettings?.generatorVersion || 'No version set'}
                          </div>
                        </div>
                        {selectedOrgId === org.id && (
                          <Check className="w-5 h-5 flex-shrink-0 ml-2"
                                 style={{ color: 'var(--color-primary)' }} />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </ThemedCard>
        </div>

        {/* Right: Editor + Preview */}
        <div className="lg:col-span-2">
          {!selectedOrg ? (
            // Empty state
            <ThemedCard padding="lg" shadow="md">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4"
                          style={{ color: 'var(--color-text-tertiary)' }} />
                <h3 className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--color-text)' }}>
                  Select an Organization
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Choose an organization from the list to customize its PDF templates
                </p>
              </div>
            </ThemedCard>
          ) : (
            // Editor & Preview
            <div className="space-y-6">
              {/* Organization Header */}
              <ThemedCard padding="md" shadow="md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      {selectedOrg.name}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      PDF Version: {selectedOrg.pdfSettings?.generatorVersion || 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                      style={{
                        backgroundColor: showPreview ? 'var(--color-primary)' : 'transparent',
                        color: showPreview ? 'var(--color-text-inverse)' : 'var(--color-text)',
                        border: `1px solid ${showPreview ? 'transparent' : 'var(--color-border)'}`
                      }}
                    >
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                    <button
                      onClick={() => {
                        if (editorSettings) {
                          handleSaveTemplate(editorSettings);
                        }
                      }}
                      disabled={isSaving}
                      className="px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-text-inverse)'
                      }}
                    >
                      {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                      {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                  </div>
                </div>
              </ThemedCard>

              {/* PDF Template Editor */}
              {editorSettings && (
                <PDFTemplateEditor
                  settings={editorSettings}
                  onChange={setEditorSettings}
                />
              )}

              {/* Live PDF Preview */}
              {showPreview && editorSettings && selectedOrg && (
                <PDFTemplatePreview
                  settings={editorSettings}
                  organization={selectedOrg}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper: Get default PDF settings
function getDefaultPDFSettings(): PDFTemplateSettings {
  // Use PDFTemplateService for consistency
  return PDFTemplateService.getDefaultSettings('system');
}
