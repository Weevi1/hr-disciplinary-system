// frontend/src/components/admin/PDFTemplateEditor.tsx
// 🎨 PDF TEMPLATE EDITOR - Visual Controls for PDF Customization
// ✅ 7 configurable panels: Colors, Typography, Layout, Branding, Sections, Watermark, Version
// ✅ Real-time state updates with onChange callback
// ✅ Accordion-style collapsible panels

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Type,
  Layout as LayoutIcon,
  Image,
  FileText,
  Shield,
  GitBranch
} from 'lucide-react';
import type { PDFTemplateSettings } from '../../types/core';
import { ThemedCard } from '../common/ThemedCard';
import { PDFSectionsEditor } from './PDFSectionsEditor';

interface PDFTemplateEditorProps {
  settings: PDFTemplateSettings;
  onChange: (settings: PDFTemplateSettings) => void;
}

type PanelKey = 'colors' | 'typography' | 'layout' | 'branding' | 'sections' | 'watermark' | 'version';

export const PDFTemplateEditor: React.FC<PDFTemplateEditorProps> = ({ settings, onChange }) => {
  // Expanded panels state
  const [expandedPanels, setExpandedPanels] = useState<Set<PanelKey>>(new Set(['colors', 'sections']));

  // Toggle panel expansion
  const togglePanel = (panel: PanelKey) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panel)) {
      newExpanded.delete(panel);
    } else {
      newExpanded.add(panel);
    }
    setExpandedPanels(newExpanded);
  };

  // Helper: Update nested settings
  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    onChange(newSettings);
  };

  // Panel component
  const Panel = ({
    id,
    title,
    icon: Icon,
    children
  }: {
    id: PanelKey;
    title: string;
    icon: any;
    children: React.ReactNode
  }) => {
    const isExpanded = expandedPanels.has(id);

    return (
      <div className="border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => togglePanel(id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
          style={{ backgroundColor: isExpanded ? 'var(--color-primary-bg)' : 'transparent' }}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {title}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 1. Colors Panel */}
      <Panel id="colors" title="Colors" icon={Palette}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Header Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.styling.headerBackground}
                onChange={(e) => updateSetting('styling.headerBackground', e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <input
                type="text"
                value={settings.styling.headerBackground}
                onChange={(e) => updateSetting('styling.headerBackground', e.target.value)}
                className="flex-1 px-3 py-2 rounded border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Section Headers
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.styling.sectionHeaderColor}
                onChange={(e) => updateSetting('styling.sectionHeaderColor', e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <input
                type="text"
                value={settings.styling.sectionHeaderColor}
                onChange={(e) => updateSetting('styling.sectionHeaderColor', e.target.value)}
                className="flex-1 px-3 py-2 rounded border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                placeholder="#333333"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="useBrandColors"
              checked={settings.styling.useBrandColors}
              onChange={(e) => updateSetting('styling.useBrandColors', e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="useBrandColors" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
              Use organization's brand colors
            </label>
          </div>
        </div>
      </Panel>

      {/* 2. Typography Panel */}
      <Panel id="typography" title="Typography" icon={Type}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Font Family
            </label>
            <select
              value={settings.styling.fontFamily}
              onChange={(e) => updateSetting('styling.fontFamily', e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)' }}
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Times">Times New Roman</option>
              <option value="Arial">Arial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Base Font Size: {settings.styling.fontSize}pt
            </label>
            <input
              type="range"
              min="10"
              max="12"
              step="0.5"
              value={settings.styling.fontSize}
              onChange={(e) => updateSetting('styling.fontSize', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span>10pt</span>
              <span>12pt</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Line Height: {settings.styling.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.1"
              value={settings.styling.lineHeight}
              onChange={(e) => updateSetting('styling.lineHeight', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* 3. Layout Panel */}
      <Panel id="layout" title="Layout" icon={LayoutIcon}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Page Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSetting('styling.pageSize', 'A4')}
                className={`px-4 py-2 rounded border font-medium ${
                  settings.styling.pageSize === 'A4' ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: settings.styling.pageSize === 'A4' ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: settings.styling.pageSize === 'A4' ? 'var(--color-primary-bg)' : 'transparent',
                  color: 'var(--color-text)'
                }}
              >
                A4
              </button>
              <button
                onClick={() => updateSetting('styling.pageSize', 'Letter')}
                className={`px-4 py-2 rounded border font-medium ${
                  settings.styling.pageSize === 'Letter' ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: settings.styling.pageSize === 'Letter' ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: settings.styling.pageSize === 'Letter' ? 'var(--color-primary-bg)' : 'transparent',
                  color: 'var(--color-text)'
                }}
              >
                Letter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Margins (mm)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Top</label>
                <input
                  type="number"
                  min="10"
                  max="40"
                  value={settings.styling.margins.top}
                  onChange={(e) => updateSetting('styling.margins.top', parseInt(e.target.value))}
                  className="w-full px-2 py-1 rounded border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Bottom</label>
                <input
                  type="number"
                  min="10"
                  max="40"
                  value={settings.styling.margins.bottom}
                  onChange={(e) => updateSetting('styling.margins.bottom', parseInt(e.target.value))}
                  className="w-full px-2 py-1 rounded border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Left</label>
                <input
                  type="number"
                  min="10"
                  max="40"
                  value={settings.styling.margins.left}
                  onChange={(e) => updateSetting('styling.margins.left', parseInt(e.target.value))}
                  className="w-full px-2 py-1 rounded border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Right</label>
                <input
                  type="number"
                  min="10"
                  max="40"
                  value={settings.styling.margins.right}
                  onChange={(e) => updateSetting('styling.margins.right', parseInt(e.target.value))}
                  className="w-full px-2 py-1 rounded border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* 4. Branding Panel */}
      <Panel id="branding" title="Branding" icon={Image}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showLogo"
              checked={settings.content.showLogo}
              onChange={(e) => updateSetting('content.showLogo', e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="showLogo" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
              Show company logo
            </label>
          </div>

          {settings.content.showLogo && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Logo Position
                </label>
                <select
                  value={settings.content.logoPosition}
                  onChange={(e) => updateSetting('content.logoPosition', e.target.value)}
                  className="w-full px-3 py-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)' }}
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Logo Max Height: {settings.content.logoMaxHeight}mm
                </label>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={settings.content.logoMaxHeight}
                  onChange={(e) => updateSetting('content.logoMaxHeight', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>10mm</span>
                  <span>30mm</span>
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* 5. Sections Panel - Enhanced with drag-and-drop */}
      <Panel id="sections" title="PDF Sections" icon={FileText}>
        <PDFSectionsEditor
          settings={settings}
          onChange={onChange}
        />
      </Panel>

      {/* 6. Watermark Panel */}
      <Panel id="watermark" title="Watermark" icon={Shield}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showWatermark"
              checked={settings.content.showWatermark}
              onChange={(e) => updateSetting('content.showWatermark', e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="showWatermark" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
              Enable watermark
            </label>
          </div>

          {settings.content.showWatermark && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={settings.content.watermarkText}
                  onChange={(e) => updateSetting('content.watermarkText', e.target.value)}
                  className="w-full px-3 py-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="CONFIDENTIAL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Opacity: {Math.round(settings.content.watermarkOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.content.watermarkOpacity}
                  onChange={(e) => updateSetting('content.watermarkOpacity', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* 7. Version Control Panel */}
      <Panel id="version" title="Version Control" icon={GitBranch}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              PDF Generator Version
            </label>
            <select
              value={settings.generatorVersion}
              onChange={(e) => updateSetting('generatorVersion', e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)' }}
            >
              <option value="1.0.0">v1.0.0 (Legacy)</option>
              <option value="1.1.0">v1.1.0 (Current)</option>
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Version determines PDF format for new warnings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoUpgrade"
              checked={settings.autoUpgrade}
              onChange={(e) => updateSetting('autoUpgrade', e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="autoUpgrade" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
              Auto-upgrade to new versions when released
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="betaFeatures"
              checked={settings.betaFeatures}
              onChange={(e) => updateSetting('betaFeatures', e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="betaFeatures" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
              Enable experimental features
            </label>
          </div>
        </div>
      </Panel>
    </div>
  );
};
