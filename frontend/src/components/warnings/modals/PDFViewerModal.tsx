import Logger from '../../../utils/logger';
// frontend/src/components/warnings/PDFViewerModal.tsx
// 📄 FIXED PDF VIEWER MODAL FOR WARNING DOCUMENTS - PART 1
// ✅ CRITICAL FIX: Proper null safety for warning.pdfFilename access
// ✅ Works with Firebase Storage URLs and generated PDFs
// ✅ Full-screen viewing with zoom and download capabilities
// ✅ Integrates with existing warning data structure

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../../constants/zIndex';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  FileText,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Home,
  RefreshCw
} from 'lucide-react';
import type { Warning } from '../../types/warning';

// ============================================
// INTERFACES
// ============================================

interface PDFViewerModalProps {
  warning?: Warning | any; // CRITICAL: Made optional to prevent undefined access
  isOpen: boolean;
  onClose: () => void;
  allowDownload?: boolean;
  allowPrint?: boolean;
  initialZoom?: number;
  className?: string;
}

interface ViewerState {
  isLoading: boolean;
  error: string | null;
  pdfUrl: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
  fit: 'width' | 'height' | 'page' | 'custom';
}

// ============================================
// COMPONENT
// ============================================

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  warning,
  isOpen,
  onClose,
  allowDownload = true,
  allowPrint = true,
  initialZoom = 1,
  className = ''
}) => {

  // ============================================
  // REFS & STATE
  // ============================================
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  const [state, setState] = useState<ViewerState>({
    isLoading: true,
    error: null,
    pdfUrl: null,
    currentPage: 1,
    totalPages: 1,
    zoom: initialZoom,
    rotation: 0,
    isFullscreen: false,
    fit: 'width'
  });

  // ============================================
  // EARLY VALIDATION - PREVENT UNDEFINED ACCESS
  // ============================================

  // CRITICAL FIX: Validate warning object exists
  const isValidWarning = warning && typeof warning === 'object';
  const safeWarning = isValidWarning ? warning : {
    id: 'unknown',
    employeeName: 'Unknown Employee',
    employeeNumber: 'N/A',
    organizationId: 'unknown',
    pdfFilename: null,
    pdfGenerated: false
  };

  // Safe property access with fallbacks
  const warningId = safeWarning.id || 'unknown';
  const employeeName = safeWarning.employeeName || 'Unknown Employee';
  const employeeNumber = safeWarning.employeeNumber || 'N/A';
  const organizationId = safeWarning.organizationId || 'unknown';
  const pdfFilename = safeWarning.pdfFilename || null;
  const pdfGenerated = Boolean(safeWarning.pdfGenerated);

  // ============================================
  // PDF URL GENERATION
  // ============================================

  const generatePDFUrl = useCallback(async () => {
    // CRITICAL: Don't proceed if modal not open or no valid warning
    if (!isOpen || !isValidWarning) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'No valid warning data provided' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let pdfUrl: string | null = null;

      // Try to get existing PDF URL from Firebase Storage
      if (pdfGenerated && pdfFilename) {
        // Construct Firebase Storage URL
        const storagePath = `warnings/${organizationId}/${warningId}/pdfs/${pdfFilename}`;
        pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(storagePath)}?alt=media`;
        Logger.debug(4082)
      }

      // If no existing PDF, generate one on-the-fly
      if (!pdfUrl) {
        Logger.debug('🔄 Generating PDF on-the-fly for warning:', warningId)
        
        try {
          // Import PDFGenerationService dynamically
          const { PDFGenerationService } = await import('@/services/PDFGenerationService');
          
          // Generate PDF blob
          const pdfBlob = await PDFGenerationService.generateWarningPDF(safeWarning);
          
          // Create object URL
          pdfUrl = URL.createObjectURL(pdfBlob);
          Logger.success(4674)
        } catch (genError) {
          Logger.error('❌ PDF generation failed:', genError)
          throw new Error('Failed to generate PDF document');
        }
      }

      setState(prev => ({ 
        ...prev, 
        pdfUrl, 
        isLoading: false 
      }));

    } catch (error) {
      Logger.error('❌ PDF generation/loading failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load PDF document'
      }));
    }
  }, [isOpen, isValidWarning, warningId, organizationId, pdfGenerated, pdfFilename, safeWarning]);

  // ============================================
  // LIFECYCLE EFFECTS
  // ============================================

  useEffect(() => {
    if (isOpen) {
      generatePDFUrl();
    }
    
    // Cleanup object URLs
    return () => {
      if (state.pdfUrl && state.pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.pdfUrl);
      }
    };
  }, [isOpen, generatePDFUrl]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);
  // ============================================
  // VIEWER CONTROLS
  // ============================================

  const handleZoomIn = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      zoom: Math.min(prev.zoom * 1.2, 5),
      fit: 'custom' 
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      zoom: Math.max(prev.zoom / 1.2, 0.2),
      fit: 'custom' 
    }));
  }, []);

  const handleRotate = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      rotation: (prev.rotation + 90) % 360 
    }));
  }, []);

  const handleFitToWidth = useCallback(() => {
    setState(prev => ({ ...prev, fit: 'width', zoom: 1 }));
  }, []);

  const handleFitToPage = useCallback(() => {
    setState(prev => ({ ...prev, fit: 'page', zoom: 0.8 }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  // ============================================
  // DOWNLOAD & PRINT HANDLERS
  // ============================================

  const handleDownload = useCallback(async () => {
    if (!state.pdfUrl) return;

    try {
      const response = await fetch(state.pdfUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // CRITICAL FIX: Safe filename access
      link.download = pdfFilename || `Warning_${employeeName.replace(/\s+/g, '_')}_${warningId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      Logger.error('Download failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Download failed. Please try again.' 
      }));
    }
  }, [state.pdfUrl, pdfFilename, employeeName, warningId]);

  const handlePrint = useCallback(() => {
    if (state.pdfUrl) {
      const printWindow = window.open(state.pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  }, [state.pdfUrl]);

  const handleOpenInNewTab = useCallback(() => {
    if (state.pdfUrl) {
      window.open(state.pdfUrl, '_blank');
    }
  }, [state.pdfUrl]);

  const handleRefresh = useCallback(() => {
    generatePDFUrl();
  }, [generatePDFUrl]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getWarningTitle = (): string => {
    if (!isValidWarning) return 'Warning Document';
    const level = safeWarning.level || 'verbal';
    return `${level.replace('_', ' ').toUpperCase()} WARNING - ${employeeName}`;
  };

  const getWarningSubtitle = (): string => {
    if (!isValidWarning) return 'Document Preview';
    const category = safeWarning.category || 'General Warning';
    const issueDate = safeWarning.issueDate ? new Date(safeWarning.issueDate).toLocaleDateString() : 'N/A';
    return `${category} • ${issueDate} • ${employeeNumber}`;
  };

  // ============================================
  // EARLY RETURN FOR INVALID STATE
  // ============================================

  if (!isOpen) return null;

  // CRITICAL: Show error if no valid warning provided
  if (!isValidWarning) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm ${className}`} style={{ zIndex: Z_INDEX.modalNested1 }}>
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Warning Data</h3>
            <p className="text-gray-600 mb-4">Unable to display PDF - warning data is missing or invalid.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER COMPONENT
  // ============================================

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm ${className}`}
      style={{ zIndex: Z_INDEX.modalNested1 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className={`
          bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300
          ${state.isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-[95vw] h-[95vh] max-w-6xl'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{getWarningTitle()}</h2>
              <p className="text-blue-100 text-sm">{getWarningSubtitle()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Controls */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title={state.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {state.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              {allowDownload && (
                <button
                  onClick={handleDownload}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="Download PDF"
                  disabled={!state.pdfUrl}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              {allowPrint && (
                <button
                  onClick={handlePrint}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="Print"
                  disabled={!state.pdfUrl}
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleOpenInNewTab}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Open in New Tab"
                disabled={!state.pdfUrl}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 bg-gray-100" style={{ height: 'calc(100% - 80px)' }}>
          {state.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading PDF document...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a moment for large files</p>
              </div>
            </div>
          )}

          {state.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center max-w-md mx-auto p-6">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Load Error</h3>
                <p className="text-gray-600 mb-4">{state.error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.pdfUrl && !state.isLoading && !state.error && (
            <div className="w-full h-full">
              <iframe
                ref={iframeRef}
                src={`${state.pdfUrl}#view=FitH&zoom=${state.zoom * 100}&rotate=${state.rotation}`}
                className="w-full h-full border-0"
                title={`Warning PDF - ${employeeName}`}
                onLoad={() => {
                  Logger.success(17223)
                }}
                onError={() => {
                  setState(prev => ({
                    ...prev,
                    error: 'Failed to display PDF. The document may be corrupted or unsupported.'
                  }));
                }}
              />
            </div>
          )}
        </div>

        {/* Footer - Document Status */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  safeWarning.status === 'approved' ? 'bg-green-500' : 
                  safeWarning.status === 'delivered' ? 'bg-blue-500' : 
                  'bg-gray-400'
                }`} />
                <span className="text-gray-600">
                  Status: {safeWarning.status?.replace('_', ' ').toUpperCase() || 'DRAFT'}
                </span>
              </div>
              {pdfGenerated && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Official Document</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Document ID: {warningId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};