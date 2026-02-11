// frontend/src/hooks/useSessionGuard.ts
// 🔒 SESSION GUARD: Inactivity auto-logout + forced app update on stale builds
// ✅ Tracks user activity (touch, click, scroll, keydown)
// ✅ Auto-logout after INACTIVITY_TIMEOUT_MS of no interaction
// ✅ Checks app version against Firestore on login + visibilitychange
// ✅ Forces reload when deployed build version changes

import { useEffect, useRef, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../auth/AuthContext';
import Logger from '../utils/logger';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const CURRENT_BUILD_VERSION = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : 'dev';

export const useSessionGuard = () => {
  const { user, logout } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update last activity timestamp
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check if user has been inactive too long
  const checkInactivity = useCallback(async () => {
    if (!user) return;

    const elapsed = Date.now() - lastActivityRef.current;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      Logger.info(`🔒 [SessionGuard] Auto-logout: ${Math.round(elapsed / 60000)}min inactive`);
      await logout();
    }
  }, [user, logout]);

  // Check if app version is stale — single tiny Firestore doc read
  const checkAppVersion = useCallback(async () => {
    if (CURRENT_BUILD_VERSION === 'dev') return; // Skip in dev mode

    try {
      const versionDoc = await getDoc(doc(db, 'system', 'appVersion'));
      const serverVersion = versionDoc.data()?.version;

      if (serverVersion && serverVersion !== CURRENT_BUILD_VERSION) {
        Logger.info(`🔄 [SessionGuard] App update detected (local: ${CURRENT_BUILD_VERSION}, server: ${serverVersion}) — reloading`);
        window.location.reload();
      }
    } catch (error) {
      // Don't block on version check failure — doc may not exist yet
      Logger.warn('[SessionGuard] Version check failed:', error);
    }
  }, []);

  // Track user activity events
  useEffect(() => {
    if (!user) return;

    const events = ['touchstart', 'click', 'scroll', 'keydown', 'mousemove'] as const;
    events.forEach(event => window.addEventListener(event, recordActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, recordActivity));
    };
  }, [user, recordActivity]);

  // Periodic inactivity check (backup for when tab stays in foreground)
  useEffect(() => {
    if (!user) return;

    intervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkInactivity]);

  // Visibility change — the key mobile event (user switches apps, comes back)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible — check both inactivity AND version
        checkInactivity();
        checkAppVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, checkInactivity, checkAppVersion]);

  // Check app version on initial login
  useEffect(() => {
    if (user) {
      checkAppVersion();
    }
  }, [user, checkAppVersion]);
};
