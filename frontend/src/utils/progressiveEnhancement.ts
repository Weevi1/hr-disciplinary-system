/**
 * 🚀 PROGRESSIVE ENHANCEMENT ENGINE
 * 2025 users get cutting-edge features, 2012 users get functional excellence
 * ZERO performance punishment for modern devices
 */

import { globalDeviceCapabilities, DeviceCapabilities } from './deviceDetection';

export interface FeatureSupport {
  // Core capabilities
  hasModernJS: boolean;
  hasAdvancedCSS: boolean;
  hasWebRTC: boolean;
  hasAdvancedGraphics: boolean;
  hasModernAudio: boolean;

  // Performance tiers
  performanceTier: 'high' | 'medium' | 'low';
  memoryTier: 'high' | 'medium' | 'low';
  networkTier: 'fast' | 'medium' | 'slow';

  // UI Enhancement levels
  animationLevel: 'full' | 'reduced' | 'minimal';
  interactionLevel: 'advanced' | 'standard' | 'basic';
  visualLevel: 'premium' | 'standard' | 'simplified';
}

export class ProgressiveEnhancement {
  private static featureSupport: FeatureSupport | null = null;

  /**
   * Analyze device capabilities and determine feature support levels
   */
  static analyzeCapabilities(): FeatureSupport {
    if (this.featureSupport) return this.featureSupport;

    const capabilities = globalDeviceCapabilities || this.detectCapabilities();

    this.featureSupport = {
      // Core capabilities
      hasModernJS: this.hasModernJavaScript(),
      hasAdvancedCSS: this.hasAdvancedCSS(),
      hasWebRTC: this.hasWebRTC(),
      hasAdvancedGraphics: this.hasAdvancedGraphics(),
      hasModernAudio: capabilities.hasModernAudio,

      // Performance tiers
      performanceTier: this.getPerformanceTier(capabilities),
      memoryTier: this.getMemoryTier(capabilities),
      networkTier: this.getNetworkTier(),

      // UI Enhancement levels
      animationLevel: this.getAnimationLevel(capabilities),
      interactionLevel: this.getInteractionLevel(capabilities),
      visualLevel: this.getVisualLevel(capabilities)
    };

    return this.featureSupport;
  }

  /**
   * Detect capabilities if globalDeviceCapabilities not available
   */
  private static detectCapabilities(): DeviceCapabilities {
    const userAgent = navigator.userAgent;
    return {
      isLegacyDevice: /Android [234]/.test(userAgent) || /OS [567]_/.test(userAgent),
      hasModernAudio: 'mediaDevices' in navigator && 'MediaRecorder' in window,
      hasModernCSS: CSS?.supports?.('display', 'grid') && CSS?.supports?.('color', 'var(--test)'),
      hasGoodPerformance: (navigator as any).hardwareConcurrency > 4,
      supportsMediaRecorder: 'MediaRecorder' in window,
      browserInfo: {
        name: 'unknown',
        version: 'unknown',
        isAndroid4x: /Android [234]/.test(userAgent),
        isIOS6to7: /OS [567]_/.test(userAgent)
      }
    };
  }

  /**
   * Check for modern JavaScript features
   */
  private static hasModernJavaScript(): boolean {
    try {
      // Test for ES6+ features
      eval('const test = () => {}; class Test {}; async function asyncTest() {}');
      return typeof WeakMap !== 'undefined' &&
             typeof Symbol !== 'undefined' &&
             typeof Promise !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Check for advanced CSS capabilities
   */
  private static hasAdvancedCSS(): boolean {
    return !!(CSS?.supports) &&
           CSS.supports('display', 'grid') &&
           CSS.supports('display', 'flex') &&
           CSS.supports('color', 'var(--test)') &&
           CSS.supports('backdrop-filter', 'blur(10px)') &&
           CSS.supports('transform', 'translate3d(0,0,0)');
  }

  /**
   * Check for WebRTC support
   */
  private static hasWebRTC(): boolean {
    return !!(navigator.mediaDevices?.getUserMedia) &&
           typeof RTCPeerConnection !== 'undefined' &&
           'MediaRecorder' in window;
  }

  /**
   * Check for advanced graphics capabilities
   */
  private static hasAdvancedGraphics(): boolean {
    const canvas = document.createElement('canvas');
    const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(webgl && window.requestAnimationFrame);
  }

  /**
   * Determine performance tier
   */
  private static getPerformanceTier(capabilities: DeviceCapabilities): 'high' | 'medium' | 'low' {
    if (capabilities.isLegacyDevice) return 'low';

    const cores = (navigator as any).hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 2;

    if (cores >= 8 && memory >= 8) return 'high';
    if (cores >= 4 && memory >= 4) return 'medium';
    return 'low';
  }

  /**
   * Determine memory tier
   */
  private static getMemoryTier(capabilities: DeviceCapabilities): 'high' | 'medium' | 'low' {
    if (capabilities.isLegacyDevice) return 'low';

    const memory = (navigator as any).deviceMemory || 2;
    if (memory >= 8) return 'high';
    if (memory >= 4) return 'medium';
    return 'low';
  }

  /**
   * Determine network tier
   */
  private static getNetworkTier(): 'fast' | 'medium' | 'slow' {
    const connection = (navigator as any).connection;
    if (!connection) return 'medium';

    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') return 'fast';
    if (effectiveType === '3g') return 'medium';
    return 'slow';
  }

  /**
   * Determine animation support level
   */
  private static getAnimationLevel(capabilities: DeviceCapabilities): 'full' | 'reduced' | 'minimal' {
    if (capabilities.isLegacyDevice) return 'minimal';

    // Check for advanced animation support
    if (this.hasAdvancedGraphics() && this.hasAdvancedCSS()) return 'full';
    if (CSS?.supports?.('transition', 'transform 0.3s')) return 'reduced';
    return 'minimal';
  }

  /**
   * Determine interaction support level
   */
  private static getInteractionLevel(capabilities: DeviceCapabilities): 'advanced' | 'standard' | 'basic' {
    if (capabilities.isLegacyDevice) return 'basic';

    const hasTouch = 'ontouchstart' in window;
    const hasPointer = 'PointerEvent' in window;
    const hasGestures = 'GestureEvent' in window;

    if (hasPointer && hasGestures && this.hasAdvancedCSS()) return 'advanced';
    if (hasTouch && this.hasModernJavaScript()) return 'standard';
    return 'basic';
  }

  /**
   * Determine visual enhancement level
   */
  private static getVisualLevel(capabilities: DeviceCapabilities): 'premium' | 'standard' | 'simplified' {
    if (capabilities.isLegacyDevice) return 'simplified';

    if (this.hasAdvancedCSS() && this.hasAdvancedGraphics()) return 'premium';
    if (capabilities.hasModernCSS) return 'standard';
    return 'simplified';
  }

  /**
   * Get component loading strategy based on capabilities
   */
  static getComponentStrategy(componentType: string): 'enhanced' | 'standard' | 'simplified' {
    const features = this.analyzeCapabilities();

    switch (componentType) {
      case 'warning-wizard':
        if (features.hasWebRTC && features.performanceTier === 'high') return 'enhanced';
        if (features.hasModernJS && features.performanceTier === 'medium') return 'standard';
        return 'simplified';

      case 'employee-management':
        if (features.memoryTier === 'high' && features.performanceTier === 'high') return 'enhanced';
        if (features.memoryTier === 'medium') return 'standard';
        return 'simplified';

      case 'navigation':
        if (features.animationLevel === 'full' && features.interactionLevel === 'advanced') return 'enhanced';
        if (features.animationLevel === 'reduced') return 'standard';
        return 'simplified';

      case 'pdf-generation':
        if (features.memoryTier === 'high') return 'enhanced';
        if (features.memoryTier === 'medium') return 'standard';
        return 'simplified';

      default:
        if (features.performanceTier === 'high') return 'enhanced';
        if (features.performanceTier === 'medium') return 'standard';
        return 'simplified';
    }
  }

  /**
   * Get CSS classes for progressive enhancement
   */
  static getCSSClasses(): string[] {
    const features = this.analyzeCapabilities();
    const classes = [];

    // Performance classes
    classes.push(`perf-${features.performanceTier}`);
    classes.push(`memory-${features.memoryTier}`);
    classes.push(`network-${features.networkTier}`);

    // Feature classes
    classes.push(`anim-${features.animationLevel}`);
    classes.push(`interact-${features.interactionLevel}`);
    classes.push(`visual-${features.visualLevel}`);

    // Capability classes
    if (features.hasModernJS) classes.push('modern-js');
    if (features.hasAdvancedCSS) classes.push('advanced-css');
    if (features.hasWebRTC) classes.push('webrtc');
    if (features.hasAdvancedGraphics) classes.push('advanced-graphics');
    if (features.hasModernAudio) classes.push('modern-audio');

    return classes;
  }

  /**
   * Apply progressive enhancement classes to document
   */
  static applyEnhancementClasses(): void {
    const classes = this.getCSSClasses();
    document.documentElement.classList.add(...classes);

    // Log capabilities for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Progressive Enhancement Applied:', {
        featureSupport: this.analyzeCapabilities(),
        cssClasses: classes
      });
    }
  }

  /**
   * Get loading thresholds based on device capability
   */
  static getLoadingThresholds() {
    const features = this.analyzeCapabilities();

    return {
      employeeListLimit: features.memoryTier === 'high' ? 200 :
                        features.memoryTier === 'medium' ? 50 : 10,

      warningHistoryLimit: features.memoryTier === 'high' ? 100 :
                          features.memoryTier === 'medium' ? 20 : 5,

      imageMaxSize: features.memoryTier === 'high' ? 5120 : // 5MB
                   features.memoryTier === 'medium' ? 2048 : // 2MB
                   500, // 500KB

      audioMaxDuration: features.hasWebRTC ? 300 : // 5 minutes
                       features.hasModernAudio ? 180 : // 3 minutes
                       30, // 30 seconds

      animationDuration: features.animationLevel === 'full' ? 300 :
                        features.animationLevel === 'reduced' ? 150 :
                        50,

      debounceDelay: features.performanceTier === 'high' ? 100 :
                    features.performanceTier === 'medium' ? 300 :
                    500
    };
  }

  /**
   * Check if feature should be enabled
   */
  static shouldEnableFeature(feature: string): boolean {
    const features = this.analyzeCapabilities();

    switch (feature) {
      case 'advanced-animations':
        return features.animationLevel === 'full';

      case 'audio-recording':
        return features.hasWebRTC || features.hasModernAudio;

      case 'background-blur':
        return features.hasAdvancedCSS;

      case 'virtualized-lists':
        return features.memoryTier !== 'low';

      case 'real-time-collaboration':
        return features.hasWebRTC && features.networkTier === 'fast';

      case 'advanced-pdf-features':
        return features.memoryTier === 'high';

      case 'offline-support':
        return features.hasModernJS && 'serviceWorker' in navigator;

      default:
        return features.performanceTier !== 'low';
    }
  }
}

// Auto-apply enhancement classes when module loads
if (typeof window !== 'undefined') {
  // Apply classes after device detection is complete
  setTimeout(() => {
    ProgressiveEnhancement.applyEnhancementClasses();
  }, 100);
}