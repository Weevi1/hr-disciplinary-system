// frontend/src/components/audio/AudioWaveform.tsx
// Real-time animated frequency bars visualization using Web Audio API

import React, { useRef, useEffect, useCallback, useState } from 'react';

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
    // Fallback for older browsers
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Draw idle state (minimal gray bars)
  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / barCount) * 0.7;
    const gap = (canvas.width / barCount) * 0.3;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      const barHeight = 4; // Minimal height when idle
      const y = (canvas.height - barHeight) / 2;

      ctx.fillStyle = backgroundColor;
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 2);
    }
  }, [barCount, backgroundColor]);

  // Animation loop for active playback
  const draw = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / barCount) * 0.7;
    const gap = (canvas.width / barCount) * 0.3;

    for (let i = 0; i < barCount; i++) {
      // Map bar index to frequency data index
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const barHeight = Math.max(4, (dataArray[dataIndex] / 255) * canvas.height);

      const x = i * (barWidth + gap);
      const y = (canvas.height - barHeight) / 2;

      ctx.fillStyle = primaryColor;
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 2);
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [isPlaying, barCount, primaryColor]);

  // Initialize Web Audio API when audio element is available
  useEffect(() => {
    // Skip if no audio element or already connected to this element
    if (!audioElement || connectedElementRef.current === audioElement) return;

    try {
      // Create AudioContext (handle vendor prefixes)
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('Web Audio API not supported');
          return;
        }
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;

      // Create analyser node
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Create source from audio element (only once per element)
      sourceRef.current = audioContext.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);

      connectedElementRef.current = audioElement;
      setIsReady(true);
    } catch (error) {
      // This can happen if the audio element is already connected to another context
      console.warn('Could not connect audio to analyser:', error);
      // Still mark as connected to prevent retry loops
      connectedElementRef.current = audioElement;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [audioElement]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!analyserRef.current) {
      // No analyser available, just draw idle state
      drawIdle();
      return;
    }

    // Resume AudioContext if suspended (browser autoplay policy)
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      drawIdle();
    }
  }, [isPlaying, draw, drawIdle]);

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
