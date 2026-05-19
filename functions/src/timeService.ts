// functions/src/timeService.ts
// Server time service for fraud-proof timestamp validation
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

/**
 * Get server timestamp for client-side validation
 * Ensures managers can't manipulate device clocks to get incorrect escalation recommendations
 *
 * @returns Current server time as ISO string and Unix timestamp
 */
export const getServerTime = onCall(
  { region: 'us-central1', cors: true, invoker: 'public' },
  async (_request: CallableRequest) => {
    try {
      const now = admin.firestore.Timestamp.now();

      return {
        success: true,
        serverTime: {
          iso: now.toDate().toISOString(),
          timestamp: now.toMillis(),
          date: now.toDate()
        }
      };
    } catch (error) {
      console.error('Error getting server time:', error);
      throw new HttpsError(
        'internal',
        'Failed to get server time'
      );
    }
  }
);

interface ActiveWarningsRequest {
  employeeId: string;
  organizationId: string;
  categoryId?: string;
}

/**
 * Get active warnings for employee using server-side time validation
 * Prevents client-side clock manipulation from affecting escalation logic
 *
 * @param data.employeeId - Employee ID to get warnings for
 * @param data.organizationId - Organization ID
 * @param data.categoryId - Optional: filter by category
 * @returns Active warnings that haven't expired (based on server time)
 */
export const getActiveWarningsServerSide = onCall(
  { region: 'us-central1', cors: true, invoker: 'public' },
  async (request: CallableRequest<ActiveWarningsRequest>) => {
    try {
      const { employeeId, organizationId, categoryId } = request.data || ({} as ActiveWarningsRequest);

      if (!employeeId || !organizationId) {
        throw new HttpsError(
          'invalid-argument',
          'Employee ID and Organization ID are required'
        );
      }

      // Get server time for validation
      const now = admin.firestore.Timestamp.now();

      // Simple query - only filter by employeeId and isActive to avoid index requirements
      const db = admin.firestore();
      const snapshot = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('warnings')
        .where('employeeId', '==', employeeId)
        .where('isActive', '==', true)
        .get();

      // Filter in code using server time and optional category
      const warnings = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const expiryDate = data.expiryDate;

          // Check if not expired (using SERVER time)
          const isNotExpired = !expiryDate || expiryDate.toDate() > now.toDate();

          // Check category if specified
          const matchesCategory = !categoryId || data.categoryId === categoryId;

          return isNotExpired && matchesCategory;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to ISO strings for client
          issueDate: doc.data().issueDate?.toDate().toISOString(),
          expiryDate: doc.data().expiryDate?.toDate().toISOString(),
          incidentDate: doc.data().incidentDate?.toDate().toISOString(),
          createdAt: doc.data().createdAt?.toDate().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate().toISOString(),
          deliveryDate: doc.data().deliveryDate?.toDate().toISOString(),
          signatureDate: doc.data().signatureDate?.toDate().toISOString()
        }));

      return {
        success: true,
        warnings,
        count: warnings.length,
        serverTime: now.toDate().toISOString()
      };
    } catch (error) {
      console.error('Error getting active warnings:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        'internal',
        'Failed to get active warnings'
      );
    }
  }
);
