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

  // Extended color palette
  muted: string;
  mutedHover: string;
  subtle: string;
  emphasis: string;
  highlight: string;
  selection: string;

  // Navigation colors
  navBg: string;
  navText: string;
  navHover: string;
  navActive: string;

  // Button variants
  btnGhost: string;
  btnGhostHover: string;
  btnOutline: string;
  btnOutlineBorder: string;
  btnOutlineHover: string;

  // Alert variants
  alertInfoBg: string;
  alertInfoBorder: string;
  alertInfoText: string;
  alertSuccessBg: string;
  alertSuccessBorder: string;
  alertSuccessText: string;
  alertWarningBg: string;
  alertWarningBorder: string;
  alertWarningText: string;
  alertErrorBg: string;
  alertErrorBorder: string;
  alertErrorText: string;

  // Badge variants
  badgeDefault: string;
  badgeDefaultText: string;
  badgePrimary: string;
  badgePrimaryText: string;
  badgeSuccess: string;
  badgeSuccessText: string;
  badgeWarning: string;
  badgeWarningText: string;
  badgeError: string;
  badgeErrorText: string;

  // Navigation tab states
  navTabActive: string;
  navTabInactive: string;
  navTabHover: string;

  // Dashboard-specific colors
  statCardBg: string;
  metricPositive: string;
  metricNegative: string;
  urgentBg: string;
  urgentBorder: string;
  urgentText: string;

  // Interactive states
  hoverOverlay: string;
  focusRing: string;
  loadingBg: string;

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

  // Extended color palette
  muted: '#f3f4f6',
  mutedHover: '#e5e7eb',
  subtle: '#f9fafb',
  emphasis: '#1f2937',
  highlight: '#fef3c7',
  selection: '#dbeafe',

  // Navigation colors
  navBg: '#ffffff',
  navText: '#374151',
  navHover: '#f3f4f6',
  navActive: '#eff6ff',

  // Button variants
  btnGhost: 'transparent',
  btnGhostHover: '#f3f4f6',
  btnOutline: 'transparent',
  btnOutlineBorder: '#d1d5db',
  btnOutlineHover: '#f9fafb',

  // Alert variants
  alertInfoBg: '#eff6ff',
  alertInfoBorder: '#bfdbfe',
  alertInfoText: '#1e40af',
  alertSuccessBg: '#ecfdf5',
  alertSuccessBorder: '#a7f3d0',
  alertSuccessText: '#065f46',
  alertWarningBg: '#fffbeb',
  alertWarningBorder: '#fed7aa',
  alertWarningText: '#92400e',
  alertErrorBg: '#fef2f2',
  alertErrorBorder: '#fecaca',
  alertErrorText: '#991b1b',

  // Badge variants
  badgeDefault: '#f3f4f6',
  badgeDefaultText: '#374151',
  badgePrimary: '#eff6ff',
  badgePrimaryText: '#1e40af',
  badgeSuccess: '#ecfdf5',
  badgeSuccessText: '#065f46',
  badgeWarning: '#fffbeb',
  badgeWarningText: '#92400e',
  badgeError: '#fef2f2',
  badgeErrorText: '#991b1b',

  // Navigation tab states
  navTabActive: '#3b82f6',
  navTabInactive: '#6b7280',
  navTabHover: '#4b5563',

  // Dashboard-specific colors
  statCardBg: '#ffffff',
  metricPositive: '#10b981',
  metricNegative: '#ef4444',
  urgentBg: '#fef2f2',
  urgentBorder: '#fecaca',
  urgentText: '#991b1b',

  // Interactive states
  hoverOverlay: 'rgba(0, 0, 0, 0.05)',
  focusRing: '#3b82f6',
  loadingBg: '#f9fafb',

  // Shadows
  shadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  shadowXl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const darkTheme: ThemeColors = {
  // Rich dark backgrounds with depth
  background: '#0a0e1a', // Deep dark blue-black
  backgroundSecondary: '#151b2e', // Rich dark blue
  backgroundTertiary: '#1f2937', // Elevated dark surface

  // High contrast text for readability
  text: '#f8fafc', // Pure white-ish
  textSecondary: '#e2e8f0', // Light gray
  textTertiary: '#94a3b8', // Medium gray
  textInverse: '#0a0e1a',

  // Subtle borders with blue tint
  border: '#374151', // Subtle blue-gray
  borderSecondary: '#4b5563', // More visible blue-gray

  // Premium dark components
  cardBackground: '#1a202c', // Rich dark blue
  cardBorder: '#2d3748', // Visible blue-gray border
  inputBackground: '#1a202c', // Match card background
  inputBorder: '#4a5568', // Clear input borders
  inputBorderFocus: '#63b3ed', // Bright blue focus

  // Vibrant accent colors that pop in dark
  primary: '#60a5fa', // Bright blue
  primaryHover: '#3b82f6', // Darker blue
  secondary: '#a78bfa', // Bright purple
  secondaryHover: '#8b5cf6', // Darker purple
  accent: '#34d399', // Bright green
  accentHover: '#10b981', // Darker green
  success: '#48cc8b', // Vibrant green
  warning: '#f6ad55', // Warm orange
  error: '#fc8181', // Bright red
  info: '#63b3ed', // Bright blue

  // Extended dark palette
  muted: '#374151',
  mutedHover: '#4b5563',
  subtle: '#1f2937',
  emphasis: '#f9fafb',
  highlight: '#365314',
  selection: '#1e3a8a',

  // Dark navigation colors
  navBg: '#1a202c',
  navText: '#e2e8f0',
  navHover: '#2d3748',
  navActive: '#2c5282',

  // Dark button variants
  btnGhost: 'transparent',
  btnGhostHover: '#2d3748',
  btnOutline: 'transparent',
  btnOutlineBorder: '#4a5568',
  btnOutlineHover: '#2d3748',

  // Dark alert variants
  alertInfoBg: '#1e3a8a',
  alertInfoBorder: '#3b82f6',
  alertInfoText: '#93c5fd',
  alertSuccessBg: '#065f46',
  alertSuccessBorder: '#059669',
  alertSuccessText: '#a7f3d0',
  alertWarningBg: '#92400e',
  alertWarningBorder: '#d97706',
  alertWarningText: '#fcd34d',
  alertErrorBg: '#991b1b',
  alertErrorBorder: '#dc2626',
  alertErrorText: '#fca5a5',

  // Dark badge variants
  badgeDefault: '#374151',
  badgeDefaultText: '#d1d5db',
  badgePrimary: '#1e3a8a',
  badgePrimaryText: '#93c5fd',
  badgeSuccess: '#065f46',
  badgeSuccessText: '#a7f3d0',
  badgeWarning: '#92400e',
  badgeWarningText: '#fcd34d',
  badgeError: '#991b1b',
  badgeErrorText: '#fca5a5',

  // Navigation tab states
  navTabActive: '#60a5fa',
  navTabInactive: '#9ca3af',
  navTabHover: '#d1d5db',

  // Dashboard-specific colors
  statCardBg: '#1a202c',
  metricPositive: '#34d399',
  metricNegative: '#fc8181',
  urgentBg: '#991b1b',
  urgentBorder: '#dc2626',
  urgentText: '#fca5a5',

  // Interactive states
  hoverOverlay: 'rgba(255, 255, 255, 0.1)',
  focusRing: '#60a5fa',
  loadingBg: '#1f2937',

  // Enhanced shadows for depth
  shadowSm: '0 1px 3px 0 rgb(0 0 0 / 0.5)',
  shadow: '0 4px 6px -1px rgb(0 0 0 / 0.6), 0 2px 4px -1px rgb(0 0 0 / 0.3)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.7), 0 4px 6px -2px rgb(0 0 0 / 0.4)',
  shadowXl: '0 20px 25px -5px rgb(0 0 0 / 0.8), 0 10px 10px -5px rgb(0 0 0 / 0.5)',
};

// Branded theme will be dynamically generated based on organization colors
export const generateBrandedTheme = (
  primaryColor: string,
  secondaryColor: string,
  accentColor: string
): ThemeColors => {
  // Create a branded experience with prominent use of organization colors
  return {
    ...lightTheme,

    // Prominent brand color usage
    primary: primaryColor,
    primaryHover: adjustBrightness(primaryColor, -15),
    secondary: secondaryColor,
    secondaryHover: adjustBrightness(secondaryColor, -15),
    accent: accentColor,
    accentHover: adjustBrightness(accentColor, -15),

    // Focus states use brand colors
    inputBorderFocus: primaryColor,

    // Branded backgrounds - more prominent tinting
    background: tintColor('#fafafa', primaryColor, 0.04), // Subtle brand background
    backgroundSecondary: tintColor('#f5f5f5', primaryColor, 0.06), // More noticeable tint
    backgroundTertiary: tintColor('#eeeeee', primaryColor, 0.08), // Even more brand presence

    // Branded components
    cardBackground: tintColor('#ffffff', primaryColor, 0.02), // Subtle brand cards
    cardBorder: tintColor('#e5e7eb', primaryColor, 0.15), // Brand-colored borders

    // Branded inputs
    inputBackground: tintColor('#ffffff', primaryColor, 0.01),
    inputBorder: tintColor('#d1d5db', primaryColor, 0.2), // Noticeable brand tint

    // Enhanced text colors with brand influence
    textSecondary: tintColor('#6b7280', primaryColor, 0.1),
    textTertiary: tintColor('#9ca3af', primaryColor, 0.15),

    // Branded borders
    border: tintColor('#e5e7eb', primaryColor, 0.2),
    borderSecondary: tintColor('#d1d5db', primaryColor, 0.25),

    // Branded extended palette
    muted: tintColor('#f3f4f6', primaryColor, 0.08),
    mutedHover: tintColor('#e5e7eb', primaryColor, 0.1),
    subtle: tintColor('#f9fafb', primaryColor, 0.04),
    emphasis: tintColor('#1f2937', primaryColor, 0.1),
    highlight: tintColor('#fef3c7', primaryColor, 0.15),
    selection: tintColor('#dbeafe', primaryColor, 0.3),

    // Branded navigation
    navBg: tintColor('#ffffff', primaryColor, 0.03),
    navText: tintColor('#374151', primaryColor, 0.1),
    navHover: tintColor('#f3f4f6', primaryColor, 0.1),
    navActive: tintColor('#eff6ff', primaryColor, 0.2),

    // Branded button variants
    btnGhost: 'transparent',
    btnGhostHover: tintColor('#f3f4f6', primaryColor, 0.1),
    btnOutline: 'transparent',
    btnOutlineBorder: tintColor('#d1d5db', primaryColor, 0.3),
    btnOutlineHover: tintColor('#f9fafb', primaryColor, 0.08),

    // Branded alert variants
    alertInfoBg: tintColor('#eff6ff', primaryColor, 0.2),
    alertInfoBorder: tintColor('#bfdbfe', primaryColor, 0.3),
    alertInfoText: tintColor('#1e40af', primaryColor, 0.2),
    alertSuccessBg: tintColor('#ecfdf5', accentColor, 0.2),
    alertSuccessBorder: tintColor('#a7f3d0', accentColor, 0.3),
    alertSuccessText: tintColor('#065f46', accentColor, 0.2),
    alertWarningBg: '#fffbeb',
    alertWarningBorder: '#fed7aa',
    alertWarningText: '#92400e',
    alertErrorBg: '#fef2f2',
    alertErrorBorder: '#fecaca',
    alertErrorText: '#991b1b',

    // Branded badge variants
    badgeDefault: tintColor('#f3f4f6', primaryColor, 0.1),
    badgeDefaultText: tintColor('#374151', primaryColor, 0.15),
    badgePrimary: tintColor('#eff6ff', primaryColor, 0.3),
    badgePrimaryText: tintColor('#1e40af', primaryColor, 0.2),
    badgeSuccess: tintColor('#ecfdf5', accentColor, 0.3),
    badgeSuccessText: tintColor('#065f46', accentColor, 0.2),
    badgeWarning: '#fffbeb',
    badgeWarningText: '#92400e',
    badgeError: '#fef2f2',
    badgeErrorText: '#991b1b',

    // Branded navigation tab states
    navTabActive: primaryColor,
    navTabInactive: tintColor('#6b7280', primaryColor, 0.2),
    navTabHover: tintColor('#4b5563', primaryColor, 0.15),

    // Branded dashboard-specific colors
    statCardBg: tintColor('#ffffff', primaryColor, 0.02),
    metricPositive: accentColor,
    metricNegative: '#ef4444',
    urgentBg: tintColor('#fef2f2', primaryColor, 0.1),
    urgentBorder: tintColor('#fecaca', primaryColor, 0.2),
    urgentText: tintColor('#991b1b', primaryColor, 0.1),

    // Branded interactive states
    hoverOverlay: hexToRgba(primaryColor, 0.08),
    focusRing: primaryColor,
    loadingBg: tintColor('#f9fafb', primaryColor, 0.05),

    // Enhanced shadows with brand color hints
    shadowSm: `0 1px 2px 0 ${hexToRgba(primaryColor, 0.1)}`,
    shadow: `0 4px 6px -1px ${hexToRgba(primaryColor, 0.15)}, 0 2px 4px -1px ${hexToRgba(primaryColor, 0.06)}`,
    shadowLg: `0 10px 15px -3px ${hexToRgba(primaryColor, 0.2)}, 0 4px 6px -2px ${hexToRgba(primaryColor, 0.08)}`,
    shadowXl: `0 20px 25px -5px ${hexToRgba(primaryColor, 0.25)}, 0 10px 10px -5px ${hexToRgba(primaryColor, 0.1)}`,
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

// Helper function to convert hex to rgba string
function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
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

  // Extended color palette
  root.style.setProperty('--color-muted', theme.muted);
  root.style.setProperty('--color-muted-hover', theme.mutedHover);
  root.style.setProperty('--color-subtle', theme.subtle);
  root.style.setProperty('--color-emphasis', theme.emphasis);
  root.style.setProperty('--color-highlight', theme.highlight);
  root.style.setProperty('--color-selection', theme.selection);

  // Navigation colors
  root.style.setProperty('--color-nav-bg', theme.navBg);
  root.style.setProperty('--color-nav-text', theme.navText);
  root.style.setProperty('--color-nav-hover', theme.navHover);
  root.style.setProperty('--color-nav-active', theme.navActive);

  // Button variants
  root.style.setProperty('--color-btn-ghost', theme.btnGhost);
  root.style.setProperty('--color-btn-ghost-hover', theme.btnGhostHover);
  root.style.setProperty('--color-btn-outline', theme.btnOutline);
  root.style.setProperty('--color-btn-outline-border', theme.btnOutlineBorder);
  root.style.setProperty('--color-btn-outline-hover', theme.btnOutlineHover);

  // Alert variants
  root.style.setProperty('--color-alert-info-bg', theme.alertInfoBg);
  root.style.setProperty('--color-alert-info-border', theme.alertInfoBorder);
  root.style.setProperty('--color-alert-info-text', theme.alertInfoText);
  root.style.setProperty('--color-alert-success-bg', theme.alertSuccessBg);
  root.style.setProperty('--color-alert-success-border', theme.alertSuccessBorder);
  root.style.setProperty('--color-alert-success-text', theme.alertSuccessText);
  root.style.setProperty('--color-alert-warning-bg', theme.alertWarningBg);
  root.style.setProperty('--color-alert-warning-border', theme.alertWarningBorder);
  root.style.setProperty('--color-alert-warning-text', theme.alertWarningText);
  root.style.setProperty('--color-alert-error-bg', theme.alertErrorBg);
  root.style.setProperty('--color-alert-error-border', theme.alertErrorBorder);
  root.style.setProperty('--color-alert-error-text', theme.alertErrorText);

  // Badge variants
  root.style.setProperty('--color-badge-default', theme.badgeDefault);
  root.style.setProperty('--color-badge-default-text', theme.badgeDefaultText);
  root.style.setProperty('--color-badge-primary', theme.badgePrimary);
  root.style.setProperty('--color-badge-primary-text', theme.badgePrimaryText);
  root.style.setProperty('--color-badge-success', theme.badgeSuccess);
  root.style.setProperty('--color-badge-success-text', theme.badgeSuccessText);
  root.style.setProperty('--color-badge-warning', theme.badgeWarning);
  root.style.setProperty('--color-badge-warning-text', theme.badgeWarningText);
  root.style.setProperty('--color-badge-error', theme.badgeError);
  root.style.setProperty('--color-badge-error-text', theme.badgeErrorText);

  // Navigation tab states
  root.style.setProperty('--color-nav-tab-active', theme.navTabActive);
  root.style.setProperty('--color-nav-tab-inactive', theme.navTabInactive);
  root.style.setProperty('--color-nav-tab-hover', theme.navTabHover);

  // Dashboard-specific colors
  root.style.setProperty('--color-stat-card-bg', theme.statCardBg);
  root.style.setProperty('--color-metric-positive', theme.metricPositive);
  root.style.setProperty('--color-metric-negative', theme.metricNegative);
  root.style.setProperty('--color-urgent-bg', theme.urgentBg);
  root.style.setProperty('--color-urgent-border', theme.urgentBorder);
  root.style.setProperty('--color-urgent-text', theme.urgentText);

  // Interactive states
  root.style.setProperty('--color-hover-overlay', theme.hoverOverlay);
  root.style.setProperty('--color-focus-ring', theme.focusRing);
  root.style.setProperty('--color-loading-bg', theme.loadingBg);

  // Shadows
  root.style.setProperty('--shadow-sm', theme.shadowSm);
  root.style.setProperty('--shadow', theme.shadow);
  root.style.setProperty('--shadow-lg', theme.shadowLg);
  root.style.setProperty('--shadow-xl', theme.shadowXl);
}