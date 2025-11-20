// frontend/src/components/admin/PDFTemplatePreview.tsx
// 📄 PDF TEMPLATE PREVIEW - Live preview of PDF templates with sample data
// ✅ Real-time regeneration when settings change (debounced)
// ✅ Zoom controls and download test PDF functionality
// ✅ Uses PDFGenerationService to generate realistic previews

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertCircle,
  Loader,
  FileText
} from 'lucide-react';
import type { PDFTemplateSettings, Organization } from '../../types/core';
import { ThemedCard } from '../common/ThemedCard';
// 🚀 LAZY LOAD: PDFGenerationService imported dynamically (saves 574KB bundle)
import Logger from '../../utils/logger';

interface PDFTemplatePreviewProps {
  settings: PDFTemplateSettings;
  organization: Organization;
}

export const PDFTemplatePreview: React.FC<PDFTemplatePreviewProps> = ({
  settings,
  organization
}) => {
  // State
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const regenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate PDF with current settings
  const generatePreviewPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      Logger.debug('Generating PDF preview with current settings...');

      // Generate sample warning data
      const sampleData = generateSampleWarningData(organization, settings);

      // Generate PDF blob
      // 🚀 LAZY LOAD: Import PDFGenerationService dynamically when needed
      const { PDFGenerationService } = await import('../../services/PDFGenerationService');

      // 🎨 TEMPLATE PREVIEW: Pass the settings being previewed to see how they affect the PDF
      const pdfBlob = await PDFGenerationService.generateWarningPDF(
        sampleData,
        settings.generatorVersion,
        settings  // Pass the template settings being previewed
      );

      // Create new blob URL and update state
      // Note: We handle cleanup in setPdfBlobUrl's updater function to avoid circular dependency
      setPdfBlobUrl((prevUrl) => {
        // Revoke old blob URL to free memory
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return URL.createObjectURL(pdfBlob);
      });

      Logger.success('PDF preview generated successfully');
    } catch (err) {
      Logger.error('Failed to generate PDF preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  }, [settings, organization]);

  // Debounced regeneration when settings change
  useEffect(() => {
    // Clear existing timeout
    if (regenerationTimeoutRef.current) {
      clearTimeout(regenerationTimeoutRef.current);
    }

    // Set new timeout (500ms debounce)
    regenerationTimeoutRef.current = setTimeout(() => {
      generatePreviewPDF();
    }, 500);

    // Cleanup
    return () => {
      if (regenerationTimeoutRef.current) {
        clearTimeout(regenerationTimeoutRef.current);
      }
    };
  }, [settings, generatePreviewPDF]);

  // Initial generation on mount
  useEffect(() => {
    generatePreviewPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Download test PDF
  const handleDownloadTestPDF = () => {
    if (!pdfBlobUrl) return;

    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${organization.name}_PDF_Template_Preview.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Logger.debug('Test PDF downloaded');
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  return (
    <ThemedCard padding="md" shadow="md">
      <div className="space-y-4">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Live PDF Preview
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Sample warning with current template settings
            </p>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg border"
                 style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
              </button>

              <span className="text-xs font-medium mx-1" style={{ color: 'var(--color-text)' }}>
                {zoom}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
              </button>

              <button
                onClick={handleZoomReset}
                className="p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ml-1"
                title="Reset Zoom"
              >
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  1:1
                </span>
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={generatePreviewPDF}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)'
              }}
              title="Regenerate Preview"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Download button */}
            <button
              onClick={handleDownloadTestPDF}
              disabled={!pdfBlobUrl || isGenerating}
              className="px-3 py-1.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)'
              }}
              title="Download Test PDF"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="relative w-full" style={{ minHeight: '600px' }}>
          {/* Loading overlay */}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center z-10 rounded-lg"
                 style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2"
                        style={{ color: 'var(--color-text-inverse)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-inverse)' }}>
                  Generating preview...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 mb-4" style={{ color: 'var(--color-error)' }} />
              <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Preview Generation Failed
              </h4>
              <p className="text-sm text-center max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
                {error}
              </p>
              <button
                onClick={generatePreviewPDF}
                className="mt-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* PDF iframe */}
          {pdfBlobUrl && !error && (
            <div className="w-full overflow-auto rounded-lg border"
                 style={{
                   borderColor: 'var(--color-border)',
                   height: '700px',
                   backgroundColor: '#525659' // PDF viewer gray background
                 }}>
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  minHeight: zoom > 100 ? `${700 * (zoom / 100)}px` : '700px'
                }}
                title="PDF Preview"
              />
            </div>
          )}

          {/* Empty state (initial load) */}
          {!pdfBlobUrl && !error && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Generating Preview...
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Please wait while we generate a sample PDF
              </p>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg"
             style={{ backgroundColor: 'var(--color-info-bg)' }}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0"
                       style={{ color: 'var(--color-info)' }} />
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <p className="font-medium mb-1">Preview uses sample data</p>
            <p>
              This preview shows how warning documents will appear with your current template settings.
              Changes are automatically reflected after 500ms.
            </p>
          </div>
        </div>
      </div>
    </ThemedCard>
  );
};

// ============================================
// SAMPLE DATA GENERATOR
// ============================================

/**
 * Generate realistic sample warning data for preview
 */
function generateSampleWarningData(
  organization: Organization,
  settings: PDFTemplateSettings
): any {
  const now = new Date();

  return {
    // Warning identification
    warningId: 'PREVIEW_SAMPLE',
    organizationId: organization.id,
    status: 'issued',
    pdfGeneratorVersion: settings.generatorVersion,
    pdfSettings: settings,  // Include the template settings being previewed

    // Manager information
    issuedByName: 'John Smith',

    // Dates
    issuedDate: now,
    incidentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago

    // Employee data
    employee: {
      firstName: 'Jane',
      lastName: 'Doe',
      employeeNumber: 'EMP001',
      department: 'Operations',
      position: 'Production Operator',
      email: 'jane.doe@example.com',
      phone: '+27 82 123 4567'
    },

    // Warning classification
    warningLevel: 'first_written',
    category: 'Attendance Issues',

    // Incident details
    description: 'Employee arrived 45 minutes late to shift without prior notification or valid reason. This is the third occurrence of tardiness in the past month.',
    incidentTime: '08:45',
    incidentLocation: 'Production Floor A',

    // Organization branding
    organization: organization,

    // Signatures (sample)
    signatures: {
      managerName: 'John Smith',
      managerSignature: null, // Will show placeholder in preview
      employeeSignature: null,
      witnessSignature: null
    },

    // Additional fields
    additionalNotes: 'Employee expressed understanding of the policy and committed to improved punctuality.',
    validityPeriod: 6,

    // 🆕 Corrective Discussion Fields (Session 48 - Unified Warning/Counselling System)
    employeeStatement: 'I apologize for being late. I had car trouble and my phone battery died so I couldn\'t call ahead. I understand this has happened before and I take full responsibility. I will ensure I leave earlier to account for potential delays.',

    expectedBehaviorStandards: 'All employees are expected to:\n• Arrive at their designated workstation at least 5 minutes before shift start time\n• Notify their supervisor immediately if they will be late (via phone call, not SMS)\n• Maintain a punctuality record of at least 95% over any 3-month period\n• Plan transportation with buffer time to account for potential delays',

    factsLeadingToDecision: 'After reviewing the attendance records, CCTV footage, and the employee\'s statement, the following facts were established:\n\n1. Employee arrived at 08:45 AM, 45 minutes after shift start (08:00 AM)\n2. No advance notification was provided to the supervisor\n3. This is the third late arrival in the past 30 days\n4. Previous verbal warning was issued on ' + new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString() + '\n5. Employee\'s explanation is noted, but the pattern of tardiness remains a concern\n\nGiven the repeated nature of the offense and the previous warning, escalation to a written warning is appropriate under our progressive discipline policy.',

    improvementCommitments: [
      {
        commitment: 'Leave home 30 minutes earlier each day to ensure on-time arrival',
        timeline: 'Immediate - starting next shift'
      },
      {
        commitment: 'Keep phone charged and ensure supervisor\'s number is saved for emergency contact',
        timeline: 'Immediate'
      },
      {
        commitment: 'Maintain 100% on-time attendance for the next 90 days',
        timeline: '90 days from ' + now.toLocaleDateString()
      }
    ],

    reviewDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now

    interventionDetails: 'Employee was provided with a copy of the attendance policy and counseled on time management strategies. Discussed setting multiple alarms and planning alternative transport routes.',

    resourcesProvided: [
      'Company Attendance Policy (Updated 2024)',
      'Time Management Tips for Shift Workers',
      'Emergency Contact Procedures Guide'
    ],

    // LRA recommendation (sample previous warning)
    disciplineRecommendation: {
      recommendedLevel: 'first_written',
      reasoning: 'Progressive discipline - first written warning appropriate for repeated attendance issues',
      activeWarnings: [
        {
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          level: 'verbal',
          category: 'Attendance Issues',
          description: 'Late arrival without notification'
        }
      ],
      lraCompliance: {
        isCompliant: true,
        notes: 'Follows progressive discipline as per LRA guidelines'
      }
    },

    // Legal compliance
    legalCompliance: {
      framework: 'LRA 1995 - South African Labour Law',
      isCompliant: true,
      requirements: [
        'Progressive discipline followed as per Schedule 8 of LRA',
        'Employee provided with opportunity to respond',
        'Proportionate response to misconduct severity',
        'Documented evidence of incident',
        'Prior warnings considered in escalation decision'
      ],
      safetyRisk: false,
      repeatOffense: true,
      priorWarnings: 1,
      notes: 'Warning issued in accordance with company disciplinary code and LRA guidelines'
    }
  };
}
