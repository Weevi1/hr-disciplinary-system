// frontend/src/services/SuperUserSessionService.ts
// Session timeout and re-authentication service for super-users

import React from 'react';
import { auth, db } from '../config/firebase';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Logger from '../utils/logger';
import { EncryptionService } from './EncryptionService';

interface SuperUserSession {
  userId: string;
  email: string;
  role: string;
  lastValidated: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId: string;
  isActive: boolean;
}

interface ReauthenticationOptions {
  reason?: string;
  requiredPermissions?: string[];
  maxSessionAge?: number; // in milliseconds
}

/**
 * SuperUser Session Management Service
 * Handles session timeout, re-authentication, and security validation
 */
export class SuperUserSessionService {
  private static sessionTimeoutMs = 1800000; // 30 minutes
  private static reauthTimeoutMs = 3600000; // 1 hour for sensitive operations
  private static sessionTimer: NodeJS.Timeout | null = null;
  private static currentSession: SuperUserSession | null = null;
  private static unsubscribeSession: (() => void) | null = null;

  /**
   * Initialize super-user session monitoring
   */
  static async initializeSession(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      const userToken = await user.getIdTokenResult();
      
      // Only initialize session for super-users
      if (userToken.claims.role !== 'super-user') {
        Logger.debug('Not a super-user, skipping session initialization');
        return;
      }

      Logger.debug('Initializing super-user session', { uid: user.uid, email: user.email });

      const sessionId = `${user.uid}_${Date.now()}`;
      const sessionData: SuperUserSession = {
        userId: user.uid,
        email: user.email || '',
        role: userToken.claims.role as string,
        lastValidated: new Date(),
        lastActivity: new Date(),
        sessionId,
        isActive: true,
        ipAddress: await this.getUserIP(),
        userAgent: navigator.userAgent
      };

      // Store session in Firestore
      const sessionRef = doc(db, 'superUserSessions', user.uid);
      await setDoc(sessionRef, {
        ...sessionData,
        lastValidated: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      this.currentSession = sessionData;
      this.startSessionMonitoring();
      this.setupActivityTracking();

      Logger.success('Super-user session initialized', { sessionId, userId: user.uid });
    } catch (error) {
      Logger.error('Failed to initialize super-user session:', error);
      throw error;
    }
  }

  /**
   * Start monitoring session timeout
   */
  private static startSessionMonitoring(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeoutMs);

    // Listen for session changes in Firestore
    if (auth.currentUser && this.unsubscribeSession) {
      this.unsubscribeSession();
    }

    if (auth.currentUser) {
      const sessionRef = doc(db, 'superUserSessions', auth.currentUser.uid);
      this.unsubscribeSession = onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
          const sessionData = doc.data();
          if (!sessionData.isActive) {
            this.handleForceLogout('Session revoked by administrator');
          }
        }
      });
    }
  }

  /**
   * Setup activity tracking to extend session
   */
  private static setupActivityTracking(): void {
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = this.throttle(() => {
      this.updateSessionActivity();
    }, 30000); // Update every 30 seconds max

    activities.forEach(activity => {
      document.addEventListener(activity, updateActivity, true);
    });
  }

  /**
   * Public method to track activity (called by components)
   */
  static async trackActivity(): Promise<void> {
    await this.updateSessionActivity();
  }

  /**
   * Update session activity timestamp
   */
  private static async updateSessionActivity(): Promise<void> {
    if (!auth.currentUser || !this.currentSession) return;

    try {
      const sessionRef = doc(db, 'superUserSessions', auth.currentUser.uid);

      // Encrypt session activity data
      const encryptedActivity = EncryptionService.encrypt(new Date().toISOString());

      await setDoc(sessionRef, {
        lastActivity: serverTimestamp(),
        encryptedActivity // Store encrypted timestamp for audit
      }, { merge: true });

      if (this.currentSession) {
        this.currentSession.lastActivity = new Date();
      }

      // Reset session timer
      this.startSessionMonitoring();
    } catch (error) {
      Logger.error('Failed to update session activity:', error);
    }
  }

  /**
   * Handle session timeout
   */
  private static async handleSessionTimeout(): Promise<void> {
    Logger.warn('Super-user session timed out');
    
    try {
      await this.endSession('Session timeout');
      
      // Show timeout modal
      this.showTimeoutModal();
    } catch (error) {
      Logger.error('Failed to handle session timeout:', error);
    }
  }

  /**
   * Handle force logout (revoked by admin)
   */
  private static async handleForceLogout(reason: string): Promise<void> {
    Logger.warn('Super-user session force logout:', reason);
    
    await this.endSession(reason);
    window.location.href = '/login?reason=force_logout&message=' + encodeURIComponent(reason);
  }

  /**
   * End the current session
   */
  static async endSession(reason: string = 'Manual logout'): Promise<void> {
    if (!auth.currentUser) return;

    try {
      // Update session as inactive in Firestore
      const sessionRef = doc(db, 'superUserSessions', auth.currentUser.uid);
      await setDoc(sessionRef, {
        isActive: false,
        endedAt: serverTimestamp(),
        endReason: reason
      }, { merge: true });

      // Clear local session data
      this.currentSession = null;
      
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      if (this.unsubscribeSession) {
        this.unsubscribeSession();
        this.unsubscribeSession = null;
      }

      Logger.info('Super-user session ended', { reason });
    } catch (error) {
      Logger.error('Failed to end session:', error);
    }
  }

  /**
   * Require re-authentication for sensitive operations
   */
  static async requireReauthentication(
    password: string,
    options: ReauthenticationOptions = {}
  ): Promise<boolean> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    try {
      Logger.debug('Attempting super-user re-authentication');

      // Create credential
      const credential = EmailAuthProvider.credential(user.email, password);
      
      // Re-authenticate
      await reauthenticateWithCredential(user, credential);
      
      // Update session validation time
      if (this.currentSession) {
        this.currentSession.lastValidated = new Date();
        
        const sessionRef = doc(db, 'superUserSessions', user.uid);
        await setDoc(sessionRef, {
          lastValidated: serverTimestamp(),
          reauthReason: options.reason || 'Sensitive operation'
        }, { merge: true });
      }

      Logger.success('Super-user re-authentication successful');
      return true;
    } catch (error) {
      Logger.error('Super-user re-authentication failed:', error);
      
      // Log security event
      await this.logSecurityEvent('reauth_failed', {
        userId: user.uid,
        email: user.email,
        reason: options.reason,
        error: (error as Error).message
      });
      
      return false;
    }
  }

  /**
   * Check if session requires re-authentication
   */
  static requiresReauth(maxAge: number = this.reauthTimeoutMs): boolean {
    if (!this.currentSession) return true;

    const ageMs = Date.now() - this.currentSession.lastValidated.getTime();
    return ageMs > maxAge;
  }

  /**
   * Get current session info
   */
  static getCurrentSession(): SuperUserSession | null {
    return this.currentSession;
  }

  /**
   * Show session timeout modal
   */
  private static showTimeoutModal(): void {
    // Create timeout modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Session Expired</h3>
          <p class="text-gray-600 mb-4">Your super-user session has expired for security reasons. Please log in again to continue.</p>
          <button id="loginBtn" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Log In Again
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle login button click
    const loginBtn = modal.querySelector('#loginBtn');
    loginBtn?.addEventListener('click', () => {
      window.location.href = '/login?reason=session_timeout';
    });
  }

  /**
   * Log security events
   */
  private static async logSecurityEvent(event: string, details: any): Promise<void> {
    try {
      const user = auth.currentUser;
      const securityEvent = {
        event,
        userId: user?.uid || 'unknown',
        userEmail: user?.email || 'unknown',
        timestamp: serverTimestamp(),
        ipAddress: await this.getUserIP(),
        userAgent: navigator.userAgent,
        details
      };

      await setDoc(doc(db, 'securityEvents', `${event}_${Date.now()}`), securityEvent);
    } catch (error) {
      Logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Get user IP address
   */
  private static async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Throttle function utility
   */
  private static throttle(func: Function, limit: number) {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Extend session (called by user action)
   */
  static async extendSession(): Promise<void> {
    if (!auth.currentUser || !this.currentSession) return;

    try {
      const sessionRef = doc(db, 'superUserSessions', auth.currentUser.uid);
      await setDoc(sessionRef, {
        lastActivity: serverTimestamp()
      }, { merge: true });

      this.startSessionMonitoring(); // Reset timer
      Logger.debug('Super-user session extended');
    } catch (error) {
      Logger.error('Failed to extend session:', error);
    }
  }

  /**
   * Force logout all super-user sessions (admin function)
   */
  static async revokeAllSessions(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // This would typically be done via Cloud Function for security
      // But can be implemented client-side for testing
      Logger.warn('Revoking all super-user sessions');
      
      await this.endSession('All sessions revoked by administrator');
      await auth.signOut();
      
      window.location.href = '/login?reason=session_revoked';
    } catch (error) {
      Logger.error('Failed to revoke sessions:', error);
    }
  }
}

/**
 * React hook for super-user session management
 */
export function useSuperUserSession() {
  const [session, setSession] = React.useState<SuperUserSession | null>(null);
  const [requiresReauth, setRequiresReauth] = React.useState(false);

  React.useEffect(() => {
    const currentSession = SuperUserSessionService.getCurrentSession();
    setSession(currentSession);
    setRequiresReauth(SuperUserSessionService.requiresReauth());

    // Check reauth requirement every minute
    const interval = setInterval(() => {
      setRequiresReauth(SuperUserSessionService.requiresReauth());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    session,
    requiresReauth,
    extendSession: SuperUserSessionService.extendSession,
    requireReauth: SuperUserSessionService.requireReauthentication,
    endSession: SuperUserSessionService.endSession
  };
}

// Export removed for security - use React context instead
// SECURITY FIX: Removed global window exposure to prevent console manipulation