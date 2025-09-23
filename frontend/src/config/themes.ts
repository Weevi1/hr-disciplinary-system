// Theme configuration for HR Disciplinary System
// Provides light, dark, and branded theme options

export type ThemeName = 'light' | 'dark' | 'branded';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Border colors
  border: string;
  borderSecondary: string;

  // Component colors
  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputBorderFocus: string;

  // Semantic colors (stay consistent across themes)
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  // Shadows (with transparency)
  shadowSm: string;
  shadow: string;
  shadowLg: string;
  shadowXl: string;
}

export const lightTheme: ThemeColors = {
  // Backgrounds
  background: '#f8fafc', // gray-50
  backgroundSecondary: '#f1f5f9', // gray-100
  backgroundTertiary: '#e2e8f0', // gray-200

  // Text
  text: '#0f172a', // gray-900
  textSecondary: '#475569', // gray-600
  textTertiary: '#64748b', // gray-500
  textInverse: '#ffffff',

  // Borders
  border: '#e2e8f0', // gray-200
  borderSecondary: '#cbd5e1', // gray-300

  // Components
  cardBackground: '#ffffff',
  cardBorder: '#e2e8f0',
  inputBackground: '#ffffff',
  inputBorder: '#cbd5e1',
  inputBorderFocus: '#3b82f6',

  // Semantic colors
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  secondary: '#6366f1',
  secondaryHover: '#4f46e5',
  accent: '#10b981',
  accentHover: '#059669',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Shadows
  shadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  shadowXl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const darkTheme: ThemeColors = {
  // Backgrounds
  background: '#0f172a', // gray-900
  backgroundSecondary: '#1e293b', // gray-800
  backgroundTertiary: '#334155', // gray-700

  // Text
  text: '#f1f5f9', // gray-100
  textSecondary: '#cbd5e1', // gray-300
  textTertiary: '#94a3b8', // gray-400
  textInverse: '#0f172a',

  // Borders
  border: '#334155', // gray-700
  borderSecondary: '#475569', // gray-600

  // Components
  cardBackground: '#1e293b',
  cardBorder: '#334155',
  inputBackground: '#1e293b',
  inputBorder: '#475569',
  inputBorderFocus: '#60a5fa',

  // Semantic colors (slightly adjusted for dark mode)
  primary: '#60a5fa', // Brighter for dark background
  primaryHover: '#3b82f6',
  secondary: '#a78bfa', // Brighter for dark background
  secondaryHover: '#8b5cf6',
  accent: '#34d399', // Brighter for dark background
  accentHover: '#10b981',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',

  // Shadows (darker with more opacity)
  shadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  shadow: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
  shadowXl: '0 20px 25px -5px rgb(0 0 0 / 0.6)',
};

// Branded theme will be dynamically generated based on organization colors
export const generateBrandedTheme = (
  primaryColor: string,
  secondaryColor: string,
  accentColor: string
): ThemeColors => {
  // Use light theme as base and override with brand colors
  return {
    ...lightTheme,
    primary: primaryColor,
    primaryHover: adjustBrightness(primaryColor, -20),
    secondary: secondaryColor,
    secondaryHover: adjustBrightness(secondaryColor, -20),
    accent: accentColor,
    accentHover: adjustBrightness(accentColor, -20),
    inputBorderFocus: primaryColor,

    // Subtle brand color tinting for backgrounds
    background: tintColor('#f8fafc', primaryColor, 0.02),
    backgroundSecondary: tintColor('#f1f5f9', primaryColor, 0.03),
    cardBackground: tintColor('#ffffff', primaryColor, 0.01),
  };
};

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;

  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;

  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// Helper function to tint a color with another color
function tintColor(baseColor: string, tintColor: string, amount: number): string {
  const base = hexToRgb(baseColor);
  const tint = hexToRgb(tintColor);

  if (!base || !tint) return baseColor;

  const r = Math.round(base.r * (1 - amount) + tint.r * amount);
  const g = Math.round(base.g * (1 - amount) + tint.g * amount);
  const b = Math.round(base.b * (1 - amount) + tint.b * amount);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Function to apply theme to CSS variables
export function applyTheme(theme: ThemeColors): void {
  const root = document.documentElement;

  // Background colors
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-background-secondary', theme.backgroundSecondary);
  root.style.setProperty('--color-background-tertiary', theme.backgroundTertiary);

  // Text colors
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty('--color-text-tertiary', theme.textTertiary);
  root.style.setProperty('--color-text-inverse', theme.textInverse);

  // Border colors
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-border-secondary', theme.borderSecondary);

  // Component colors
  root.style.setProperty('--color-card-background', theme.cardBackground);
  root.style.setProperty('--color-card-border', theme.cardBorder);
  root.style.setProperty('--color-input-background', theme.inputBackground);
  root.style.setProperty('--color-input-border', theme.inputBorder);
  root.style.setProperty('--color-input-border-focus', theme.inputBorderFocus);

  // Semantic colors
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', theme.primaryHover);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-secondary-hover', theme.secondaryHover);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-accent-hover', theme.accentHover);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-warning', theme.warning);
  root.style.setProperty('--color-error', theme.error);
  root.style.setProperty('--color-info', theme.info);

  // Shadows
  root.style.setProperty('--shadow-sm', theme.shadowSm);
  root.style.setProperty('--shadow', theme.shadow);
  root.style.setProperty('--shadow-lg', theme.shadowLg);
  root.style.setProperty('--shadow-xl', theme.shadowXl);
}