// frontend/src/components/audio/AudioWaveform.tsx
// Animated waveform visualization for audio playback
// Uses simple CSS-driven animation (no Web Audio API / no CORS issues)

import React, { useRef, useEffect, useCallback } from 'react';

interface AudioWaveformProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  primaryColor?: string;
  backgroundColor?: string;
  className?: string;
}

// Helper to draw rounded rectangle (fallback for older browsers)
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
};

// Generate a stable pseudo-random waveform pattern for each bar
const generateWaveformPattern = (barCount: number): number[] => {
  const pattern: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Create a natural-looking waveform shape (higher in middle, varied)
    const center = barCount / 2;
    const distFromCenter = Math.abs(i - center) / center;
    const base = 0.3 + 0.5 * (1 - distFromCenter * distFromCenter);
    // Add pseudo-random variation using sine waves
    const variation = 0.2 * Math.sin(i * 2.7) + 0.15 * Math.sin(i * 4.3) + 0.1 * Math.sin(i * 7.1);
    pattern.push(Math.max(0.15, Math.min(1, base + variation)));
  }
  return pattern;
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioElement,
  isPlaying,
  barCount = 32,
  height = 40,
  primaryColor = '#3b82f6',
  backgroundColor = '#e5e7eb',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const patternRef = useRef<number[]>(generateWaveformPattern(barCount));
  const timeRef = useRef<number>(0);

  // Draw idle state (minimal gray dots)
  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / barCount) * 0.7;
    const gap = (canvas.width / barCount) * 0.3;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      const barHeight = 4;
      const y = (canvas.height - barHeight) / 2;

      ctx.fillStyle = backgroundColor;
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 2);
    }
  }, [barCount, backgroundColor]);

  // Animated playback visualization
  const drawAnimated = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    timeRef.current += 0.06;
    const t = timeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / barCount) * 0.7;
    const gap = (canvas.width / barCount) * 0.3;
    const pattern = patternRef.current;

    for (let i = 0; i < barCount; i++) {
      // Combine the static pattern with time-based animation
      const wave1 = 0.3 * Math.sin(t * 2.5 + i * 0.4);
      const wave2 = 0.2 * Math.sin(t * 3.8 + i * 0.7);
      const wave3 = 0.1 * Math.sin(t * 5.2 + i * 1.1);
      const animated = pattern[i] + wave1 + wave2 + wave3;
      const normalised = Math.max(0.1, Math.min(1, animated));

      const barHeight = Math.max(4, normalised * canvas.height * 0.85);
      const x = i * (barWidth + gap);
      const y = (canvas.height - barHeight) / 2;

      ctx.fillStyle = primaryColor;
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 2);
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawAnimated);
    }
  }, [isPlaying, barCount, primaryColor]);

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying) {
      drawAnimated();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      drawIdle();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, drawAnimated, drawIdle]);

  // Initial draw on mount
  useEffect(() => {
    drawIdle();
  }, [drawIdle]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      if (!isPlaying) {
        drawIdle();
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [height, isPlaying, drawIdle]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
};

export default AudioWaveform;
