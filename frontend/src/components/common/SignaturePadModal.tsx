// frontend/src/components/common/SignaturePadModal.tsx
// Purpose-built full-screen signature capture modal
// ✅ React portal — renders on document.body, immune to parent CSS !important rules
// ✅ All inline styles — no className on any element (no CSS specificity issues)
// ✅ SVG export via stroke tracking (90% smaller than PNG)
// ✅ DPI-aware canvas with viewport-based dimension calculation
// ✅ Fixed 1.69:1 aspect ratio matching PDF signature box (59mm x 35mm)
// ✅ Guide markings: baseline + "x" start mark
// ✅ Mobile-first: body scroll prevention, touch-action: none, native event listeners
// ✅ Focus trap for accessibility (WCAG 2.1 AA)
// ✅ Consistent dark slate strokes (#1e293b)

import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { generateSVGFromStrokes } from '../../utils/signatureSVG';
import { formatSADateTime, SA_TIMEZONE } from '../../utils/saLocale';

// PDF signature box: 59mm render width x 35mm render height = 1.686:1
const SIGNATURE_ASPECT_RATIO = 59 / 35;

interface SignaturePadModalProps {
  title: string;
  signerName: string;
  onSave: (signature: string) => void;
  onClose: () => void;
  initialSignature?: string | null;
}

interface SignatureStroke {
  points: { x: number; y: number }[];
  timestamp: number;
}

// ─── Inner content (rendered via portal on document.body) ───────────────

const SignaturePadContent: React.FC<SignaturePadModalProps> = ({
  title,
  signerName,
  onSave,
  onClose,
  initialSignature = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<SignatureStroke[]>([]);
  const dprRef = useRef(window.devicePixelRatio || 1);

  const [hasDrawn, setHasDrawn] = useState(!!initialSignature);
  const [canvasReady, setCanvasReady] = useState(false);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  // Prevent background scrolling
  usePreventBodyScroll(true);

  // Focus trap for accessibility
  const focusTrapRef = useFocusTrap({
    isActive: true,
    onEscape: onClose,
  });

  // Get initials and surname from full name
  const getInitialsAndSurname = useCallback((fullName: string): string => {
    if (!fullName?.trim()) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || '';
    const initials = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + '.').join(' ');
    return `${initials} ${parts[parts.length - 1]}`;
  }, []);

  // Draw guide markings to help user position signature for optimal PDF rendering
  const drawGuides = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    const margin = 16;
    const baselineY = height * 0.72;

    // Signing zone — subtle dotted rectangle showing the ideal signature area
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.strokeRect(margin, margin, width - margin * 2, baselineY - margin + 8);
    ctx.setLineDash([]);

    // Baseline — solid line where signature should sit
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin + 24, baselineY);
    ctx.lineTo(width - margin, baselineY);
    ctx.stroke();

    // "x" start mark at left of baseline — indicates where to start signing
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    const xSize = 7;
    const xCenter = margin + 12;
    ctx.beginPath();
    ctx.moveTo(xCenter - xSize, baselineY - xSize);
    ctx.lineTo(xCenter + xSize, baselineY + xSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xCenter + xSize, baselineY - xSize);
    ctx.lineTo(xCenter - xSize, baselineY + xSize);
    ctx.stroke();

    // Small hint text below the baseline
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('sign above the line', width / 2, baselineY + 6);

    ctx.restore();
  }, []);

  // Calculate canvas dimensions from viewport (synchronous, before first paint)
  useLayoutEffect(() => {
    const vh = window.visualViewport?.height || window.innerHeight;
    const vw = window.visualViewport?.width || window.innerWidth;

    const headerH = headerRef.current?.offsetHeight || 72;
    const footerH = footerRef.current?.offsetHeight || 68;
    const textH = 52; // instruction text + hint text + margins
    const padding = 24;

    const availW = vw - 32; // 16px each side
    const availH = vh - headerH - footerH - textH - padding;

    let w = Math.min(availW, 600);
    let h = Math.round(w / SIGNATURE_ASPECT_RATIO);
    if (h > availH) {
      h = Math.max(availH, 100);
      w = Math.round(h * SIGNATURE_ASPECT_RATIO);
    }

    setDims({ width: Math.round(w), height: Math.round(h) });
  }, []);

  // Initialize canvas once dimensions are computed and canvas element exists
  useEffect(() => {
    if (!dims) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = dims;
    const dpr = dprRef.current;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw guide markings
    drawGuides(ctx, width, height);

    // Stroke styling
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawn(true);
        setCanvasReady(true);
      };
      img.onerror = () => setCanvasReady(true);
      img.src = initialSignature;
    } else {
      setCanvasReady(true);
    }
  }, [dims]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get coordinates from native event
  const getCoords = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleStart = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);

    isDrawingRef.current = true;
    setHasDrawn(true);

    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    strokesRef.current = [...strokesRef.current, {
      points: [{ x, y }],
      timestamp: Date.now(),
    }];
  }, [getCoords]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    const strokes = strokesRef.current;
    if (strokes.length > 0) {
      strokes[strokes.length - 1].points.push({ x, y });
    }
  }, [getCoords]);

  const handleEnd = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  // Set up native event listeners
  useEffect(() => {
    if (!canvasReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleStart, { passive: false });
    canvas.addEventListener('mousemove', handleMove, { passive: false });
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);

      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [canvasReady, handleStart, handleMove, handleEnd]);

  const isValidSignature = useCallback(() => {
    const strokes = strokesRef.current;
    return (
      strokes.length >= 1 &&
      (strokes.some(s => s.points.length >= 5) || strokes.length >= 2)
    );
  }, []);

  const clearCanvas = useCallback(() => {
    if (!dims) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const { width, height } = dims;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    drawGuides(ctx, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);

    strokesRef.current = [];
    setHasDrawn(false);
  }, [dims, drawGuides]);

  const saveSignature = useCallback(() => {
    if (!hasDrawn || !isValidSignature() || !dims) return;

    const { width, height } = dims;
    if (width === 0 || height === 0) return;

    const saTimestamp = formatSADateTime(new Date(), SA_TIMEZONE);
    const initialsAndSurname = getInitialsAndSurname(signerName);

    // Generate SVG from stroke data (guides NOT included — clean signature only)
    const svgDataURL = generateSVGFromStrokes({
      strokes: strokesRef.current,
      width,
      height,
      signerName: initialsAndSurname,
      timestamp: saTimestamp,
      strokeColor: '#1e293b',
      strokeWidth: 2,
      textColor: '#64748b',
      fontSize: 10,
    });

    // Burn metadata on canvas for visual feedback
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const padding = 8;
      const fontSize = 10;
      const lineSpacing = 2;

      ctx.save();
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      let yPosition = height - padding;
      ctx.fillText(saTimestamp, width - padding, yPosition);

      if (initialsAndSurname) {
        yPosition -= (fontSize + lineSpacing);
        ctx.fillText(initialsAndSurname, width - padding, yPosition);
      }

      ctx.restore();
    }

    onSave(svgDataURL);
  }, [hasDrawn, isValidSignature, dims, signerName, getInitialsAndSurname, onSave]);

  const dpr = dprRef.current;

  // All inline styles — no className anywhere — immune to external CSS
  return (
    <div
      ref={focusTrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Header */}
      <div
        ref={headerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            {signerName}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close signature pad"
        >
          <X style={{ width: 20, height: 20, color: '#6b7280' }} />
        </button>
      </div>

      {/* Canvas area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 16px',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <p style={{
          fontSize: '12px',
          textAlign: 'center',
          color: '#64748b',
          margin: '0 0 8px 0',
          flexShrink: 0,
        }}>
          Sign on the line below
        </p>
        {dims && (
          <canvas
            ref={canvasRef}
            width={dims.width * dpr}
            height={dims.height * dpr}
            style={{
              width: dims.width,
              height: dims.height,
              touchAction: 'none',
              display: 'block',
              flexShrink: 0,
              flexGrow: 0,
              borderRadius: '12px',
              border: '2px solid #cbd5e1',
            }}
          />
        )}
        <p style={{
          fontSize: '12px',
          textAlign: 'center',
          color: '#94a3b8',
          margin: '8px 0 0 0',
          flexShrink: 0,
        }}>
          This signature will appear on the official PDF document
        </p>
      </div>

      {/* Footer actions */}
      <div
        ref={footerRef}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          flexShrink: 0,
        }}
      >
        <button
          onClick={clearCanvas}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: 'transparent',
            fontSize: '14px',
            fontWeight: 500,
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
        <button
          onClick={saveSignature}
          disabled={!hasDrawn}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            cursor: hasDrawn ? 'pointer' : 'default',
            opacity: hasDrawn ? 1 : 0.5,
            backgroundColor: hasDrawn ? 'var(--color-primary, #2563eb)' : '#cbd5e1',
          }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

// ─── Portal wrapper — renders outside all parent containers ─────────────
// This prevents CSS rules like `.enhanced-warning-wizard-container canvas { ... !important }`
// from overriding canvas dimensions.

export const SignaturePadModal: React.FC<SignaturePadModalProps> = (props) => {
  return createPortal(<SignaturePadContent {...props} />, document.body);
};
