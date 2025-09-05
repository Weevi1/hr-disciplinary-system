// frontend/src/services/FirebaseService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { auth, db } from '../config/firebase';

// Custom error types
export class FirebaseServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'FirebaseServiceError';
  }
}

// Logging utility
class Logger {
  static log(message: string, data?: any) {
    console.log(`[FirebaseService] ${message}`, data || '');
  }

  static error(message: string, error?: any) {
    console.error(`[FirebaseService] ERROR: ${message}`, error || '');
  }

  static warn(message: string, data?: any) {
    console.warn(`[FirebaseService] WARNING: ${message}`, data || '');
  }
}

// Error handler
class ErrorHandler {
  static handle(error: any, operation: string): never {
    Logger.error(`${operation} failed`, error);

    if (error instanceof FirestoreError) {
      throw new FirebaseServiceError(
        `Firestore error during ${operation}: ${error.message}`,
        error.code,
        error
      );
    }

    // Check for auth error by examining error properties
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      throw new FirebaseServiceError(
        `Auth error during ${operation}: ${error.message}`,
        error.code,
        error
      );
    }

    throw new FirebaseServiceError(
      `Unknown error during ${operation}`,
      'unknown',
      error
    );
  }
}

// Main Firebase Service
export class FirebaseService {
  // ============================================
  // AUTHENTICATION
  // ============================================
  
  /**
   * Sign in a user with email and password
   */
  static async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      Logger.log('Attempting sign in', { email });
      const credential = await signInWithEmailAndPassword(auth, email, password);
      Logger.log('Sign in successful', { uid: credential.user.uid });
      return credential.user;
    } catch (error) {
      ErrorHandler.handle(error, 'signIn');
    }
  }

  /**
   * Create a new user account
   */
  static async signUp(email: string, password: string): Promise<FirebaseUser> {
    try {
      Logger.log('Creating new user', { email });
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      Logger.log('User created successfully', { uid: credential.user.uid });
      return credential.user;
    } catch (error) {
      ErrorHandler.handle(error, 'signUp');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      Logger.log('Signing out user');
      await signOut(auth);
      Logger.log('Sign out successful');
    } catch (error) {
      ErrorHandler.handle(error, 'signOut');
    }
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // ============================================
  // GENERIC FIRESTORE OPERATIONS
  // ============================================

  /**
   * Get a single document
   */
  static async getDocument<T>(
    collectionName: string, 
    documentId: string
  ): Promise<T | null> {
    try {
      Logger.log('Getting document', { collection: collectionName, id: documentId });
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        Logger.log('Document found', { collection: collectionName, id: documentId });
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        Logger.warn('Document not found', { collection: collectionName, id: documentId });
        return null;
      }
    } catch (error) {
      ErrorHandler.handle(error, `getDocument(${collectionName}/${documentId})`);
    }
  }

  /**
   * Get all documents from a collection
   */
  static async getCollection<T>(
    collectionName: string,
    queryConstraints?: any[]
  ): Promise<T[]> {
    try {
      Logger.log('Getting collection', { collection: collectionName });
      const collectionRef = collection(db, collectionName);
      
      let q = queryConstraints 
        ? query(collectionRef, ...queryConstraints)
        : collectionRef;
      
      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      Logger.log('Collection retrieved', { 
        collection: collectionName, 
        count: documents.length 
      });
      
      return documents;
    } catch (error) {
      ErrorHandler.handle(error, `getCollection(${collectionName})`);
    }
  }

  /**
   * Create a new document
   */
  static async createDocument<T extends Record<string, any>>(
    collectionName: string,
    data: T,
    documentId?: string
  ): Promise<string> {
    try {
      const id = documentId || doc(collection(db, collectionName)).id;
      Logger.log('Creating document', { collection: collectionName, id });
      
      const docRef = doc(db, collectionName, id);
      
      // Remove id from data if it exists to avoid conflicts
      const { id: _, ...dataWithoutId } = data as any;
      
      await setDoc(docRef, {
        ...dataWithoutId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      Logger.log('Document created', { collection: collectionName, id });
      return id;
    } catch (error) {
      ErrorHandler.handle(error, `createDocument(${collectionName})`);
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument<T>(
    collectionName: string,
    documentId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      Logger.log('Updating document', { collection: collectionName, id: documentId });
      
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      } as any);
      
      Logger.log('Document updated', { collection: collectionName, id: documentId });
    } catch (error) {
      ErrorHandler.handle(error, `updateDocument(${collectionName}/${documentId})`);
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    try {
      Logger.log('Deleting document', { collection: collectionName, id: documentId });
      
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      
      Logger.log('Document deleted', { collection: collectionName, id: documentId });
    } catch (error) {
      ErrorHandler.handle(error, `deleteDocument(${collectionName}/${documentId})`);
    }
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Query documents with conditions
   */
  static async queryDocuments<T>(
    collectionName: string,
    conditions: Array<{
      field: string;
      operator: any;
      value: any;
    }>,
    orderByField?: string,
    limitCount?: number
  ): Promise<T[]> {
    try {
      Logger.log('Querying documents', { 
        collection: collectionName, 
        conditions: conditions.length 
      });
      
      const constraints: any[] = conditions.map(c => 
        where(c.field, c.operator, c.value)
      );
      
      if (orderByField) {
        constraints.push(orderBy(orderByField));
      }
      
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      
      return await this.getCollection<T>(collectionName, constraints);
    } catch (error) {
      ErrorHandler.handle(error, `queryDocuments(${collectionName})`);
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Create multiple documents in a batch
   */
  static async batchCreate<T extends Record<string, any>>(
    collectionName: string,
    documents: T[]
  ): Promise<string[]> {
    try {
      Logger.log('Batch creating documents', { 
        collection: collectionName, 
        count: documents.length 
      });
      
      const ids: string[] = [];
      
      // Process in chunks of 10 to avoid overloading
      for (let i = 0; i < documents.length; i += 10) {
        const chunk = documents.slice(i, i + 10);
        const promises = chunk.map(doc => this.createDocument(collectionName, doc));
        const chunkIds = await Promise.all(promises);
        ids.push(...chunkIds);
      }
      
      Logger.log('Batch create completed', { 
        collection: collectionName, 
        created: ids.length 
      });
      
      return ids;
    } catch (error) {
      ErrorHandler.handle(error, `batchCreate(${collectionName})`);
    }
  }
}

// Collection names constant
export const COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  EMPLOYEES: 'employees',
  WARNINGS: 'warnings',
  WARNING_CATEGORIES: 'warningCategories',
  ESCALATION_RULES: 'escalationRules',
  AUDIT_LOGS: 'auditLogs',
  DOCUMENTS: 'documents',
  TEMPLATES: 'templates'
} as const;
