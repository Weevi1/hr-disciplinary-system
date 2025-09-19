// REPLACE ENTIRE FILE: functions/src/audioCleanup.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// 🎯 CORS CONFIGURATION - MOVE THIS TO TOP LEVEL
const corsHandler = cors.default({
  origin: [
    'https://hr-disciplinary-system.web.app',
    'https://hr-disciplinary-system.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

interface AudioCleanupResult {
  totalScanned: number;
  totalExpired: number;
  successfulDeletions: number;
  failedDeletions: number;
  errors: string[];
  organizationsProcessed: string[];
  processingTime: number;
  triggeredBy?: string;
  triggerMethod: 'scheduled' | 'manual';
}

interface ExpiredAudioFile {
  warningId: string;
  organizationId: string;
  recordingId: string;
  storagePath: string;
  storageUrl: string;
  expiredDate: Date;
  warningLevel: string;
  employeeName: string;
}

/**
 * Verify user has super-user privileges
 */
async function verifySuperUser(context: functions.https.CallableContext): Promise<void> {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to access audio cleanup functions'
    );
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User record not found'
    );
  }

  const userData = userDoc.data();
  const userRole = userData?.role?.id || userData?.role;

  if (userRole !== 'super-user') {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Audio cleanup is restricted to super-users only. Current role: ${userRole}`
    );
  }

  console.log(`✅ Super-user access verified for ${context.auth.uid}`);
}

/**
 * Core cleanup logic - works across ALL organizations
 */
async function performGlobalAudioCleanup(
  triggerMethod: 'scheduled' | 'manual',
  triggeredBy?: string
): Promise<AudioCleanupResult> {
  const startTime = Date.now();
  console.log(`🧹 Starting ${triggerMethod} audio cleanup at:`, new Date().toISOString());

  const result: AudioCleanupResult = {
    totalScanned: 0,
    totalExpired: 0,
    successfulDeletions: 0,
    failedDeletions: 0,
    errors: [],
    organizationsProcessed: [],
    processingTime: 0,
    triggeredBy,
    triggerMethod
  };

  try {
    const orgsSnapshot = await db.collection('organizations').get();

    console.log(`🏢 Found ${orgsSnapshot.size} organizations to process for cleanup`);
    
    for (const orgDoc of orgsSnapshot.docs) {
      const organizationId = orgDoc.id;
      const organizationName = orgDoc.data().name || 'Unknown';
      
      result.organizationsProcessed.push(organizationId);
      
      console.log(`🏢 Processing organization: ${organizationName} (${organizationId})`);
      
      try {
        const warningsQuery = db
          .collection(`organizations/${organizationId}/warnings`)
          .where('audioRecording', '!=', null)
          .where('audioRecording.autoDeleteDate', '<=', new Date());

        const warningsSnapshot = await warningsQuery.get();
        result.totalScanned += warningsSnapshot.size;

        // Also check total warnings with audio (for debugging)
        const allWarningsWithAudio = await db
          .collection(`organizations/${organizationId}/warnings`)
          .where('audioRecording', '!=', null)
          .get();

        console.log(`📄 Organization ${organizationName}: ${allWarningsWithAudio.size} total warnings with audio, ${warningsSnapshot.size} with expired audio`);

        for (const warningDoc of warningsSnapshot.docs) {
          try {
            const warningData = warningDoc.data();
            const audioRecording = warningData.audioRecording;

            if (!audioRecording || !audioRecording.autoDeleteDate) {
              continue;
            }

            const expiredFile: ExpiredAudioFile = {
              warningId: warningDoc.id,
              organizationId,
              recordingId: audioRecording.recordingId,
              storagePath: audioRecording.storagePath || 
                `warnings/${organizationId}/${warningDoc.id}/audio/${audioRecording.recordingId}.webm`,
              storageUrl: audioRecording.storageUrl || '',
              expiredDate: audioRecording.autoDeleteDate.toDate(),
              warningLevel: warningData.level || 'unknown',
              employeeName: warningData.employeeName || 'Unknown'
            };

            result.totalExpired++;
            
            console.log(`🗑️ Processing expired audio for warning ${warningDoc.id} in ${organizationName}`);

            await deleteAudioFromStorage(expiredFile);
            await updateWarningAfterDeletion(warningDoc.id, organizationId, expiredFile, organizationName);

            result.successfulDeletions++;
            console.log(`✅ Successfully deleted audio for warning ${warningDoc.id} in ${organizationName}`);

          } catch (error) {
            result.failedDeletions++;
            const errorMsg = `Failed to delete audio for warning ${warningDoc.id} in ${organizationName}: ${error}`;
            result.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }
      } catch (orgError) {
        const errorMsg = `Failed to process organization ${organizationName}: ${orgError}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    result.processingTime = Date.now() - startTime;

    console.log('🎯 Global audio cleanup completed:', {
      totalScanned: result.totalScanned,
      totalExpired: result.totalExpired,
      successfulDeletions: result.successfulDeletions,
      failedDeletions: result.failedDeletions,
      processingTimeMs: result.processingTime,
      organizationsProcessed: result.organizationsProcessed.length,
      triggerMethod: result.triggerMethod,
      triggeredBy: result.triggeredBy
    });

    await logGlobalCleanupAudit(result);
    return result;

  } catch (error) {
    console.error('❌ Critical error in global audio cleanup:', error);
    result.errors.push(`Critical error: ${error}`);
    result.processingTime = Date.now() - startTime;
    
    await logGlobalCleanupAudit(result);
    throw error;
  }
}

/**
 * Delete audio file from Firebase Storage
 */
async function deleteAudioFromStorage(expiredFile: ExpiredAudioFile): Promise<void> {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(expiredFile.storagePath);

    const [exists] = await file.exists();
    
    if (exists) {
      await file.delete();
      console.log(`🗑️ Deleted storage file: ${expiredFile.storagePath}`);
    } else {
      console.log(`⚠️ Storage file not found: ${expiredFile.storagePath}`);
    }

  } catch (error) {
    console.error(`❌ Error deleting storage file ${expiredFile.storagePath}:`, error);
    throw error;
  }
}

/**
 * 📄 Delete expired temporary PDF files
 */
async function cleanupExpiredPDFs(): Promise<{ deletedCount: number; errors: number }> {
  try {
    console.log('🔍 Checking for expired PDF files...');
    
    const now = admin.firestore.Timestamp.now();
    
    // Find expired PDFs in temporaryFiles collection
    const expiredPDFsSnapshot = await db
      .collection('temporaryFiles')
      .where('fileType', '==', 'pdf')
      .where('expiresAt', '<=', now.toDate())
      .where('isExpired', '==', false)
      .limit(50) // Process in batches
      .get();

    if (expiredPDFsSnapshot.empty) {
      console.log('✅ No expired PDF files found');
      return { deletedCount: 0, errors: 0 };
    }

    console.log(`📄 Found ${expiredPDFsSnapshot.size} expired PDF files`);

    let deletedCount = 0;
    let errors = 0;

    const batch = db.batch();
    const bucket = storage.bucket();

    for (const doc of expiredPDFsSnapshot.docs) {
      try {
        const pdfData = doc.data();
        
        // Delete from Firebase Storage
        if (pdfData.storagePath) {
          const file = bucket.file(pdfData.storagePath);
          const [exists] = await file.exists();
          
          if (exists) {
            await file.delete();
            console.log(`🗑️ Deleted PDF: ${pdfData.filename}`);
          }
        }

        // Mark as expired in Firestore
        batch.update(doc.ref, {
          isExpired: true,
          deletedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        deletedCount++;

      } catch (error) {
        console.error(`❌ Error deleting PDF ${doc.id}:`, error);
        errors++;
      }
    }

    // Commit batch updates
    await batch.commit();

    console.log(`✅ PDF cleanup complete: ${deletedCount} deleted, ${errors} errors`);
    return { deletedCount, errors };

  } catch (error) {
    console.error('❌ PDF cleanup failed:', error);
    return { deletedCount: 0, errors: 1 };
  }
}

/**
 * Update warning document after audio deletion
 */
async function updateWarningAfterDeletion(
  warningId: string, 
  organizationId: string, 
  expiredFile: ExpiredAudioFile,
  organizationName: string
): Promise<void> {
  try {
    const warningRef = db.doc(`organizations/${organizationId}/warnings/${warningId}`);
    
    await warningRef.update({
      'audioRecording.deleted': true,
      'audioRecording.deletedAt': admin.firestore.FieldValue.serverTimestamp(),
      'audioRecording.deletedReason': 'Expired - automatic cleanup',
      'audioRecording.originalExpiredDate': expiredFile.expiredDate,
      'audioRecording.deletedBySystem': true,
      'audioRecording.organizationName': organizationName,
      'audioRecording.storageUrl': admin.firestore.FieldValue.delete(),
      'audioRecording.available': false,
      'audioRecording.processingStatus': 'deleted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📝 Updated warning document ${warningId} in ${organizationName}`);

  } catch (error) {
    console.error(`❌ Error updating warning document ${warningId}:`, error);
    throw error;
  }
}

/**
 * Log global cleanup audit for compliance
 */
async function logGlobalCleanupAudit(result: AudioCleanupResult): Promise<void> {
  try {
    const auditRef = db.collection('audioCleanupAudits').doc();
    
    await auditRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      result: result,
      completedAt: new Date().toISOString(),
      version: '1.0',
      scope: 'global',
      systemTriggered: result.triggerMethod === 'scheduled',
      superUserTriggered: result.triggerMethod === 'manual' && result.triggeredBy,
      triggeredBy: result.triggeredBy || 'system'
    });

    console.log('📋 Global cleanup audit logged successfully');

  } catch (error) {
    console.error('❌ Error logging global cleanup audit:', error);
  }
}

// ============================================
// EXPORTED FUNCTIONS
// ============================================

/**
 * Daily scheduled function - runs at 2 AM UTC (now includes PDF cleanup!)
 */
export const cleanupExpiredAudio = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🧹 Starting scheduled cleanup (audio + PDFs)...');
    
    // Clean up audio files
    const audioResult = await performGlobalAudioCleanup('scheduled');
    
    // Clean up expired PDF files
    const pdfResult = await cleanupExpiredPDFs();
    
    console.log('✅ Scheduled cleanup complete:', {
      audio: audioResult,
      pdfs: pdfResult
    });
    
    return {
      audio: audioResult,
      pdfs: pdfResult,
      completedAt: new Date().toISOString()
    };
  });

/**
 * Manual cleanup function - super user only (WITH CORS)
 */
export const manualAudioCleanup = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Auth verification
      const context: functions.https.CallableContext = {
        auth: undefined,
        app: undefined,
        instanceIdToken: undefined,
        rawRequest: req
      };

      const authHeader = req.headers.authorization as string;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Missing or invalid authentication token'
          }
        });
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        context.auth = {
          uid: decodedToken.uid,
          token: decodedToken
        };
      } catch (error) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Invalid authentication token'
          }
        });
      }

      await verifySuperUser(context);

      console.log('🔧 Manual audio cleanup triggered by super-user:', context.auth!.uid);

      const result = await performGlobalAudioCleanup('manual', context.auth!.uid);
      
      const response = {
        success: true,
        result: result,
        triggeredBy: context.auth!.uid,
        triggeredAt: new Date().toISOString()
      };

      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(200).json({ data: response });

    } catch (error: any) {
      console.error('❌ Manual cleanup failed:', error);
      
      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(500).json({
        error: {
          status: 'INTERNAL',
          message: `Cleanup failed: ${error.message}`
        }
      });
    }
  });
});

/**
 * Get cleanup statistics - super user only (WITH CORS)
 */
export const getCleanupStats = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Create context from request
      const context: functions.https.CallableContext = {
        auth: undefined,
        app: undefined,
        instanceIdToken: undefined,
        rawRequest: req
      };

      // Verify authentication manually
      const authHeader = req.headers.authorization as string;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Missing or invalid authentication token'
          }
        });
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        context.auth = {
          uid: decodedToken.uid,
          token: decodedToken
        };
      } catch (error) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Invalid authentication token'
          }
        });
      }

      // Verify super user
      await verifySuperUser(context);

      // Your existing logic
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const auditsSnapshot = await db
        .collection('audioCleanupAudits')
        .where('timestamp', '>=', thirtyDaysAgo)
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

      const audits = auditsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || data.timestamp
        };
      });

      const result = {
        success: true,
        recentAudits: audits,
        totalAudits: audits.length,
        lastCleanup: audits.length > 0 ? audits[0].timestamp : null
      };

      // Set CORS headers and return
      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(200).json({ data: result });

    } catch (error: any) {
      console.error('❌ Error fetching cleanup stats:', error);
      
      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      if (error.code === 'permission-denied') {
        return res.status(403).json({
          error: {
            status: 'PERMISSION_DENIED',
            message: error.message
          }
        });
      }

      return res.status(500).json({
        error: {
          status: 'INTERNAL',
          message: `Failed to fetch stats: ${error.message}`
        }
      });
    }
  });
});

/**
 * Get global audio statistics - super user only (WITH CORS)
 */
export const getGlobalAudioStats = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Similar auth verification as above
      const context: functions.https.CallableContext = {
        auth: undefined,
        app: undefined,
        instanceIdToken: undefined,
        rawRequest: req
      };

      const authHeader = req.headers.authorization as string;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Missing or invalid authentication token'
          }
        });
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        context.auth = {
          uid: decodedToken.uid,
          token: decodedToken
        };
      } catch (error) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Invalid authentication token'
          }
        });
      }

      await verifySuperUser(context);

      console.log('📊 Fetching global audio statistics...');

      let totalAudioRecordings = 0;
      let totalExpiredRecordings = 0;
      let totalStorageUsed = 0;
      const organizationStats: any[] = [];

      const orgsSnapshot = await db.collection('organizations').get();
      console.log(`🏢 Found ${orgsSnapshot.size} organizations to analyze for audio`);
      
      for (const orgDoc of orgsSnapshot.docs) {
        const organizationId = orgDoc.id;
        const organizationName = orgDoc.data().name || 'Unknown';
        
        try {
          const warningsWithAudioQuery = db
            .collection(`organizations/${organizationId}/warnings`)
            .where('audioRecording', '!=', null);

          const warningsSnapshot = await warningsWithAudioQuery.get();
          console.log(`📄 Organization ${organizationName}: Found ${warningsSnapshot.size} warnings with audio`);
          
          let orgAudioCount = 0;
          let orgExpiredCount = 0;
          let orgStorageUsed = 0;
          const now = new Date();

          warningsSnapshot.docs.forEach(doc => {
            const warningData = doc.data();
            const audioRecording = warningData.audioRecording;
            
            if (audioRecording && !audioRecording.deleted) {
              orgAudioCount++;
              totalAudioRecordings++;
              
              if (audioRecording.size) {
                orgStorageUsed += audioRecording.size;
                totalStorageUsed += audioRecording.size;
              }
              
              if (audioRecording.autoDeleteDate && 
                  new Date(audioRecording.autoDeleteDate.toDate()) <= now) {
                orgExpiredCount++;
                totalExpiredRecordings++;
              }
            }
          });

          organizationStats.push({
            organizationId,
            organizationName,
            audioRecordings: orgAudioCount,
            expiredRecordings: orgExpiredCount,
            storageUsed: orgStorageUsed
          });

        } catch (error) {
          console.error(`Error processing organization ${organizationName}:`, error);
        }
      }

      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const result = {
        success: true,
        globalStats: {
          totalOrganizations: orgsSnapshot.size,
          totalAudioRecordings,
          totalExpiredRecordings,
          totalStorageUsed,
          totalStorageUsedFormatted: formatBytes(totalStorageUsed),
          needsCleanup: totalExpiredRecordings > 0
        },
        organizationBreakdown: organizationStats,
        generatedAt: new Date().toISOString()
      };

      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(200).json({ data: result });

    } catch (error: any) {
      console.error('❌ Error fetching global audio stats:', error);
      
      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(500).json({
        error: {
          status: 'INTERNAL',
          message: `Failed to fetch global stats: ${error.message}`
        }
      });
    }
  });
});

/**
 * Preview audio cleanup - super user only (WITH CORS)
 * Shows what would be deleted without actually deleting
 */
export const previewAudioCleanup = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Auth verification
      const context: functions.https.CallableContext = {
        auth: undefined,
        app: undefined,
        instanceIdToken: undefined,
        rawRequest: req
      };

      const authHeader = req.headers.authorization as string;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Missing or invalid authentication token'
          }
        });
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        context.auth = {
          uid: decodedToken.uid,
          token: decodedToken
        };
      } catch (error) {
        return res.status(401).json({
          error: {
            status: 'UNAUTHENTICATED',
            message: 'Invalid authentication token'
          }
        });
      }

      await verifySuperUser(context);

      console.log('👁️ previewAudioCleanup called');

      // Helper function to format bytes
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      // Find all warnings with audio that are expired across all organizations
      let totalScanned = 0;
      let totalExpired = 0;
      let estimatedSpaceFreed = 0;
      let oldestExpiredDateStr: string | null = null;
      let newestExpiredDateStr: string | null = null;
      const organizationsAffected: any[] = [];

      const orgsSnapshot = await db.collection('organizations').get();
      
      for (const orgDoc of orgsSnapshot.docs) {
        const organizationId = orgDoc.id;
        const organizationName = orgDoc.data().name || 'Unknown';
        
        try {
          const warningsQuery = db
            .collection(`organizations/${organizationId}/warnings`)
            .where('audioRecording', '!=', null)
            .where('audioRecording.autoDeleteDate', '<=', new Date());

          const warningsSnapshot = await warningsQuery.get();
          
          if (warningsSnapshot.size > 0) {
            let orgExpiredCount = 0;
            let orgEstimatedSpaceFreed = 0;

            warningsSnapshot.docs.forEach(doc => {
              const warningData = doc.data();
              const audioRecording = warningData.audioRecording;
              
              if (audioRecording && !audioRecording.deleted && audioRecording.autoDeleteDate) {
                totalScanned++;
                totalExpired++;
                orgExpiredCount++;
                
                // Estimate file size (5MB default if not specified)
                const fileSize = audioRecording.size || (5 * 1024 * 1024);
                estimatedSpaceFreed += fileSize;
                orgEstimatedSpaceFreed += fileSize;
                
                // Track date range - convert to string immediately
                const expiredDate: Date = audioRecording.autoDeleteDate.toDate();
                const expiredDateStr = expiredDate.toISOString();
                
                if (oldestExpiredDateStr === null || expiredDateStr < oldestExpiredDateStr) {
                  oldestExpiredDateStr = expiredDateStr;
                }
                if (newestExpiredDateStr === null || expiredDateStr > newestExpiredDateStr) {
                  newestExpiredDateStr = expiredDateStr;
                }
              }
            });

            if (orgExpiredCount > 0) {
              organizationsAffected.push({
                organizationId,
                organizationName,
                expiredCount: orgExpiredCount,
                estimatedSpaceFreed: orgEstimatedSpaceFreed,
                estimatedSpaceFreedFormatted: formatBytes(orgEstimatedSpaceFreed)
              });
            }
          }
        } catch (error) {
          console.error(`Error processing organization ${organizationName}:`, error);
        }
      }

      const result = {
        success: true,
        preview: {
          totalScanned,
          totalExpired,
          organizationsAffected,
          estimatedSpaceFreed,
          estimatedSpaceFreedFormatted: formatBytes(estimatedSpaceFreed),
          oldestExpiredDate: oldestExpiredDateStr,
          newestExpiredDate: newestExpiredDateStr
        },
        generatedAt: new Date().toISOString(),
        note: 'This is a preview only. No files will be deleted.'
      };

      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(200).json({ data: result });

    } catch (error: any) {
      console.error('❌ previewAudioCleanup error:', error);
      
      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      return res.status(500).json({
        error: {
          status: 'INTERNAL',
          message: `Failed to preview cleanup: ${error.message}`
        }
      });
    }
  });
});