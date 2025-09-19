import Logger from '../utils/logger';
// frontend/src/services/DataServiceV2.ts
// 🎯 CLEAN PRODUCTION-READY DATA SERVICE
// ✅ Sharded architecture only
// ✅ No dead code or mixed patterns

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
  limit as limitTo,
  serverTimestamp,
  writeBatch,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type {
  Employee,
  User,
  Warning,
  WarningCategory,
  EscalationRule,
  Organization,
  WarningLevel
} from '../types/core';

// ============================================
// 🎯 CORE SHARDED DATA SERVICE
// ============================================

export class DataServiceV2 {

  // ============================================
  // 📊 WARNING CATEGORIES - SHARDED ONLY
  // ============================================

  static async getWarningCategories(organizationId: string): Promise<WarningCategory[]> {
    try {
      const categoriesRef = collection(db, 'organizations', organizationId, 'categories');
      const q = query(categoriesRef, where('isActive', '==', true), orderBy('name'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WarningCategory[];
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting categories:', error);
      return [];
    }
  }

  static async getWarningCategory(organizationId: string, categoryId: string): Promise<WarningCategory | null> {
    try {
      const categoryRef = doc(db, 'organizations', organizationId, 'categories', categoryId);
      const categoryDoc = await getDoc(categoryRef);

      if (!categoryDoc.exists()) return null;

      return {
        id: categoryDoc.id,
        ...categoryDoc.data()
      } as WarningCategory;
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting category:', error);
      return null;
    }
  }

  static async updateWarningCategory(
    organizationId: string,
    categoryId: string,
    updates: Partial<WarningCategory>
  ): Promise<void> {
    try {
      const categoryRef = doc(db, 'organizations', organizationId, 'categories', categoryId);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      Logger.error('[DataServiceV2] Error updating category:', error);
      throw error;
    }
  }

  // ============================================
  // 👥 EMPLOYEES - SHARDED ONLY
  // ============================================

  static async getEmployeesByOrganization(organizationId: string): Promise<Employee[]> {
    try {
      const employeesRef = collection(db, 'organizations', organizationId, 'employees');
      const q = query(employeesRef, orderBy('profile.lastName'), orderBy('profile.firstName'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertDate(doc.data().createdAt),
        updatedAt: this.convertDate(doc.data().updatedAt)
      })) as Employee[];
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting employees:', error);
      return [];
    }
  }

  static async getEmployee(organizationId: string, employeeId: string): Promise<Employee | null> {
    try {
      const employeeRef = doc(db, 'organizations', organizationId, 'employees', employeeId);
      const employeeDoc = await getDoc(employeeRef);

      if (!employeeDoc.exists()) return null;

      return {
        id: employeeDoc.id,
        ...employeeDoc.data(),
        createdAt: this.convertDate(employeeDoc.data().createdAt),
        updatedAt: this.convertDate(employeeDoc.data().updatedAt)
      } as Employee;
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting employee:', error);
      return null;
    }
  }

  static async saveEmployee(organizationId: string, employeeData: Partial<Employee>): Promise<string> {
    try {
      const employeeRef = employeeData.id ?
        doc(db, 'organizations', organizationId, 'employees', employeeData.id) :
        doc(collection(db, 'organizations', organizationId, 'employees'));

      const dataToSave = {
        ...employeeData,
        organizationId,
        updatedAt: serverTimestamp(),
        ...(employeeData.id ? {} : { createdAt: serverTimestamp() })
      };

      await setDoc(employeeRef, dataToSave);
      return employeeRef.id;
    } catch (error) {
      Logger.error('[DataServiceV2] Error saving employee:', error);
      throw error;
    }
  }

  static async employeeNumberExists(organizationId: string, employeeNumber: string): Promise<boolean> {
    try {
      const employeesRef = collection(db, 'organizations', organizationId, 'employees');
      const q = query(employeesRef, where('profile.employeeNumber', '==', employeeNumber));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      Logger.error('[DataServiceV2] Error checking employee number:', error);
      return false;
    }
  }

  // ============================================
  // ⚠️ WARNINGS - SHARDED ONLY
  // ============================================

  static async getWarningsByOrganization(organizationId: string, limitCount?: number): Promise<Warning[]> {
    try {
      const warningsRef = collection(db, 'organizations', organizationId, 'warnings');
      let q = query(warningsRef, orderBy('issueDate', 'desc'));

      if (limitCount) {
        q = query(warningsRef, orderBy('issueDate', 'desc'), limitTo(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        issueDate: this.convertDate(doc.data().issueDate),
        expiryDate: this.convertDate(doc.data().expiryDate),
        incidentDate: this.convertDate(doc.data().incidentDate),
        createdAt: this.convertDate(doc.data().createdAt),
        updatedAt: this.convertDate(doc.data().updatedAt)
      })) as Warning[];
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting warnings:', error);
      return [];
    }
  }

  static async getWarningsForEmployee(organizationId: string, employeeId: string): Promise<Warning[]> {
    try {
      const warningsRef = collection(db, 'organizations', organizationId, 'warnings');
      const q = query(
        warningsRef,
        where('employeeId', '==', employeeId),
        orderBy('issueDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        issueDate: this.convertDate(doc.data().issueDate),
        expiryDate: this.convertDate(doc.data().expiryDate),
        incidentDate: this.convertDate(doc.data().incidentDate),
        createdAt: this.convertDate(doc.data().createdAt),
        updatedAt: this.convertDate(doc.data().updatedAt)
      })) as Warning[];
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting employee warnings:', error);
      return [];
    }
  }

  static async saveWarning(organizationId: string, warningData: Partial<Warning>): Promise<string> {
    try {
      const warningRef = warningData.id ?
        doc(db, 'organizations', organizationId, 'warnings', warningData.id) :
        doc(collection(db, 'organizations', organizationId, 'warnings'));

      const dataToSave = {
        ...warningData,
        organizationId,
        updatedAt: serverTimestamp(),
        ...(warningData.id ? {} : { createdAt: serverTimestamp() })
      };

      await setDoc(warningRef, dataToSave);
      return warningRef.id;
    } catch (error) {
      Logger.error('[DataServiceV2] Error saving warning:', error);
      throw error;
    }
  }

  // ============================================
  // 👤 USERS - SHARDED ONLY
  // ============================================

  static async getUsersByOrganization(organizationId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'organizations', organizationId, 'users');
      const q = query(
        usersRef,
        where('isActive', '==', true),
        orderBy('lastName'),
        orderBy('firstName')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertDate(doc.data().createdAt),
        lastLogin: this.convertOptionalDate(doc.data().lastLogin)
      })) as User[];
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting users:', error);
      return [];
    }
  }

  static async getUser(organizationId: string, userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'organizations', organizationId, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return null;

      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: this.convertDate(userDoc.data().createdAt),
        lastLogin: this.convertOptionalDate(userDoc.data().lastLogin)
      } as User;
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting user:', error);
      return null;
    }
  }

  // ============================================
  // 📄 TEMPLATES - SHARDED ONLY
  // ============================================

  static async getDocumentTemplates(organizationId: string): Promise<any[]> {
    try {
      const templatesRef = collection(db, 'organizations', organizationId, 'templates');
      const q = query(
        templatesRef,
        where('isActive', '==', true),
        orderBy('name')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertDate(doc.data().createdAt),
        updatedAt: this.convertDate(doc.data().updatedAt)
      }));
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting templates:', error);
      return [];
    }
  }

  // ============================================
  // ⚙️ ESCALATION RULES - SHARDED ONLY
  // ============================================

  static async getEscalationRules(organizationId: string): Promise<EscalationRule[]> {
    try {
      const rulesRef = collection(db, 'organizations', organizationId, 'escalationRules');
      const q = query(
        rulesRef,
        where('isActive', '==', true),
        orderBy('category')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EscalationRule[];
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting escalation rules:', error);
      return [];
    }
  }

  // ============================================
  // 🏢 ORGANIZATIONS - FLAT (Global level)
  // ============================================

  static async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const orgRef = doc(db, 'organizations', organizationId);
      const orgDoc = await getDoc(orgRef);

      if (!orgDoc.exists()) return null;

      return {
        id: orgDoc.id,
        ...orgDoc.data(),
        createdAt: this.convertDate(orgDoc.data().createdAt),
        updatedAt: this.convertDate(orgDoc.data().updatedAt)
      } as Organization;
    } catch (error) {
      Logger.error('[DataServiceV2] Error getting organization:', error);
      return null;
    }
  }

  // ============================================
  // 🔧 UTILITY METHODS
  // ============================================

  private static convertDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp.toDate) return timestamp.toDate();
    return new Date(timestamp);
  }

  private static convertOptionalDate(timestamp: any): Date | null {
    if (!timestamp) return null;
    return this.convertDate(timestamp);
  }
}