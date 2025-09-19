// frontend/src/components/warnings/enhanced/steps/DigitalSignaturePad.tsx
// 🎯 REUSABLE DIGITAL SIGNATURE PAD - V2 TREATMENT
// ✅ Fixed memory leaks, proper cleanup, mobile-optimized
// ✅ Touch gesture support, signature validation

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PenTool, RefreshCw, Check, X } from 'lucide-react';

interface DigitalSignaturePadProps {
  onSignatureComplete: (signature: string | null) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  initialSignature?: string | null;
  className?: string;
  width?: number;
  height?: number;
}

interface SignatureStroke {
  points: { x: number; y: number }[];
  timestamp: number;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  onSignatureComplete,
  disabled = false,
  label,
  placeholder = "Click and drag to sign",
  initialSignature = null,
  className = "",
  width = 400,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  const [canvasReady, setCanvasReady] = useState(false);

  // Initialize canvas with proper settings
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size properly for high DPI displays
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Premium signature styling
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    
    // Clear background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setCanvasReady(true);
  }, []);

  // Get coordinates from mouse or touch event
  const getEventCoordinates = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const { x, y } = getEventCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Start new stroke
    const newStroke: SignatureStroke = {
      points: [{ x, y }],
      timestamp: Date.now()
    };
    setStrokes(prev => [...prev, newStroke]);
  }, [disabled, getEventCoordinates]);

  // Continue drawing
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getEventCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();

    // Add point to current stroke
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const currentStroke = updated[updated.length - 1];
      currentStroke.points.push({ x, y });
      return updated;
    });
  }, [isDrawing, disabled, getEventCoordinates]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setHasSignature(true);
    
    // Save signature
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      onSignatureComplete(dataURL);
    }
  }, [isDrawing, onSignatureComplete]);

  // Clear signature
  const clearSignature = useCallback(() => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    setStrokes([]);
    onSignatureComplete(null);
  }, [disabled, onSignatureComplete]);

  // Set up event listeners with proper cleanup
  useEffect(() => {
    if (!canvasReady || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Event listeners
    const mouseDownHandler = (e: MouseEvent) => startDrawing(e);
    const mouseMoveHandler = (e: MouseEvent) => draw(e);
    const mouseUpHandler = () => stopDrawing();
    const mouseLeaveHandler = () => stopDrawing();
    
    const touchStartHandler = (e: TouchEvent) => startDrawing(e);
    const touchMoveHandler = (e: TouchEvent) => draw(e);
    const touchEndHandler = () => stopDrawing();

    // Add listeners
    canvas.addEventListener('mousedown', mouseDownHandler, { passive: false });
    canvas.addEventListener('mousemove', mouseMoveHandler, { passive: false });
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);
    
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler);

    // Store cleanup function
    cleanupRef.current = () => {
      canvas.removeEventListener('mousedown', mouseDownHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mouseup', mouseUpHandler);
      canvas.removeEventListener('mouseleave', mouseLeaveHandler);
      
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
    };

    return cleanupRef.current;
  }, [canvasReady, disabled, startDrawing, draw, stopDrawing]);

  // Initialize canvas on mount
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Load initial signature
  useEffect(() => {
    if (initialSignature && canvasReady) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature, canvasReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Signature validation
  const isValidSignature = strokes.length >= 2 && strokes.some(stroke => stroke.points.length >= 3);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {hasSignature && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              <span>Signed</span>
            </div>
          )}
          <button
            type="button"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <div className={`
        relative border-2 border-dashed rounded-lg bg-white
        ${disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
        ${hasSignature && isValidSignature ? 'border-green-300 bg-green-50' : ''}
        ${hasSignature && !isValidSignature ? 'border-amber-300 bg-amber-50' : ''}
      `}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`
            block w-full h-full cursor-crosshair rounded-lg
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
        
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <PenTool className="w-4 h-4" />
              <span>{placeholder}</span>
            </div>
          </div>
        )}

        {hasSignature && !isValidSignature && (
          <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
            Signature too simple
          </div>
        )}
      </div>

      {/* Stroke count indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400">
          Strokes: {strokes.length} | Valid: {isValidSignature ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
};