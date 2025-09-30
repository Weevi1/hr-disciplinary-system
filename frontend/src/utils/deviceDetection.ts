/**
 * 🚨 2012-ERA DEVICE DETECTION UTILITIES
 * Critical for South Africa rollout - many users have older Android devices
 */

export interface DeviceCapabilities {
  isLegacyDevice: boolean;
  hasModernAudio: boolean;
  hasModernCSS: boolean;
  hasGoodPerformance: boolean;
  supportsMediaRecorder: boolean;
  browserInfo: {
    name: string;
    version: string;
    isAndroid4x: boolean;
    isIOS6to7: boolean;
  };
}

/**
 * Detects if device is from 2012-era with limited capabilities
 */
export const detectDeviceCapabilities = (): DeviceCapabilities => {
  const userAgent = navigator.userAgent;

  // Android 4.x detection (2012-2013 era)
  const isAndroid4x = /Android [234]\./.test(userAgent);

  // iOS 6-7 detection (2012-2013 era)
  const isIOS6to7 = /OS [67]_/.test(userAgent);

  // Legacy device indicators
  const isLegacyDevice = isAndroid4x ||
                        isIOS6to7 ||
                        /Android [234]/.test(userAgent) ||
                        /iPhone OS [1-7]_/.test(userAgent);

  // Check for modern audio support
  const hasModernAudio = 'mediaDevices' in navigator &&
                        'MediaRecorder' in window;

  // Check for CSS Grid and variables support
  const hasModernCSS = CSS?.supports?.('display', 'grid') &&
                      CSS?.supports?.('color', 'var(--test)');

  // Performance indicators
  const hasGoodPerformance = (navigator as any).hardwareConcurrency > 2 &&
                            navigator.deviceMemory > 1;

  // MediaRecorder support (critical for warning wizard)
  const supportsMediaRecorder = 'MediaRecorder' in window;

  // Browser detection
  let browserName = 'unknown';
  let browserVersion = 'unknown';

  if (/Chrome\//.test(userAgent)) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
  } else if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown';
  } else if (/Android.*Browser/.test(userAgent)) {
    browserName = 'Android Browser';
    browserVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || 'unknown';
  }

  return {
    isLegacyDevice,
    hasModernAudio,
    hasModernCSS,
    hasGoodPerformance,
    supportsMediaRecorder,
    browserInfo: {
      name: browserName,
      version: browserVersion,
      isAndroid4x,
      isIOS6to7
    }
  };
};

/**
 * Get appropriate loading limits based on device capability
 */
export const getPerformanceLimits = (capabilities: DeviceCapabilities) => {
  if (capabilities.isLegacyDevice) {
    return {
      employeeListLimit: 10,
      warningHistoryLimit: 5,
      imageMaxSize: 500, // KB
      audioMaxDuration: 30, // seconds
      enableAnimations: false,
      enableTransitions: false
    };
  }

  return {
    employeeListLimit: 50,
    warningHistoryLimit: 20,
    imageMaxSize: 2048, // KB
    audioMaxDuration: 180, // seconds
    enableAnimations: true,
    enableTransitions: true
  };
};

/**
 * Apply legacy device CSS classes for progressive enhancement
 */
export const applyLegacyDeviceStyles = (capabilities: DeviceCapabilities) => {
  const body = document.body;

  if (capabilities.isLegacyDevice) {
    body.classList.add('legacy-device');
  }

  if (capabilities.browserInfo.isAndroid4x) {
    body.classList.add('android-4x');
  }

  if (capabilities.browserInfo.isIOS6to7) {
    body.classList.add('ios-6-7');
  }

  if (!capabilities.hasModernAudio) {
    body.classList.add('no-modern-audio');
  }

  if (!capabilities.hasModernCSS) {
    body.classList.add('no-modern-css');
  }
};

/**
 * Fix viewport height for older mobile browsers
 */
export const fixViewportHeight = () => {
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Add class for CSS to use
    document.documentElement.classList.add('js-viewport-fixed');
  };

  // Set on load
  setViewportHeight();

  // Update on resize (handle orientation changes)
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
};

/**
 * Performance monitoring for legacy devices
 */
export const monitorPerformance = (capabilities: DeviceCapabilities) => {
  if (!capabilities.isLegacyDevice) return;

  // Memory usage warning for legacy devices
  const checkMemory = () => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize / 1048576; // MB

      if (usedMemory > 50) { // 50MB threshold for legacy devices
        console.warn('High memory usage detected on legacy device:', usedMemory.toFixed(2), 'MB');

        // Trigger garbage collection hint if available
        if (window.gc) {
          window.gc();
        }
      }
    }
  };

  // Check memory every 30 seconds
  setInterval(checkMemory, 30000);
};

/**
 * Initialize all legacy device optimizations
 */
export const initializeLegacySupport = () => {
  const capabilities = detectDeviceCapabilities();

  // Apply CSS classes
  applyLegacyDeviceStyles(capabilities);

  // Fix viewport issues
  fixViewportHeight();

  // Start performance monitoring
  monitorPerformance(capabilities);

  // Log device info for debugging
  if (capabilities.isLegacyDevice) {
    console.log('Legacy device detected:', {
      browser: capabilities.browserInfo,
      hasModernAudio: capabilities.hasModernAudio,
      hasModernCSS: capabilities.hasModernCSS,
      performance: getPerformanceLimits(capabilities)
    });
  }

  return capabilities;
};

// Global device capabilities
export let globalDeviceCapabilities: DeviceCapabilities;

// Auto-initialize on import
if (typeof window !== 'undefined') {
  globalDeviceCapabilities = initializeLegacySupport();
}