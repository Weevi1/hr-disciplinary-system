// frontend/src/hooks/useRecognitionData.ts
// Hook for fetching and managing recognition data from Firestore

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../auth/AuthContext';
import type { Recognition } from '../types/core';
import Logger from '../utils/logger';

interface RecognitionFilters {
  employeeId?: string;
  recognitionType?: string;
  departmentId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface RecognitionStats {
  totalCount: number;
  thisMonth: number;
  thisYear: number;
  byType: Record<string, number>;
  byDepartment: Record<string, number>;
  topRecognizedEmployees: Array<{ employeeId: string; employeeName: string; count: number }>;
}

export const useRecognitionData = (filters?: RecognitionFilters) => {
  const { user, organization } = useAuth();
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RecognitionStats>({
    totalCount: 0,
    thisMonth: 0,
    thisYear: 0,
    byType: {},
    byDepartment: {},
    topRecognizedEmployees: []
  });

  // Convert Firestore Timestamp to Date
  const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  };

  // Calculate statistics from recognitions
  const calculateStats = useCallback((recognitions: Recognition[]): RecognitionStats => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const byType: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const employeeCounts: Record<string, { name: string; count: number }> = {};

    let thisMonth = 0;
    let thisYear = 0;

    recognitions.forEach(rec => {
      const recDate = convertTimestamp(rec.recognitionDate);

      // Count by time period
      if (recDate >= startOfMonth) thisMonth++;
      if (recDate >= startOfYear) thisYear++;

      // Count by type
      byType[rec.recognitionType] = (byType[rec.recognitionType] || 0) + 1;

      // Count by department
      if (rec.departmentName) {
        byDepartment[rec.departmentName] = (byDepartment[rec.departmentName] || 0) + 1;
      }

      // Count by employee
      if (!employeeCounts[rec.employeeId]) {
        employeeCounts[rec.employeeId] = { name: rec.employeeName, count: 0 };
      }
      employeeCounts[rec.employeeId].count++;
    });

    // Get top 5 recognized employees
    const topRecognizedEmployees = Object.entries(employeeCounts)
      .map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCount: recognitions.length,
      thisMonth,
      thisYear,
      byType,
      byDepartment,
      topRecognizedEmployees
    };
  }, []);

  // Fetch recognitions from Firestore
  const fetchRecognitions = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const recognitionsRef = collection(db, 'organizations', organization.id, 'recognitions');
      const constraints: QueryConstraint[] = [];

      // Apply filters based on user role
      if (user?.role.id === 'hod-manager' && user.departmentIds?.length) {
        // HOD managers can only see their department recognitions
        constraints.push(where('departmentId', 'in', user.departmentIds));
      }

      // Apply additional filters
      if (filters?.employeeId) {
        constraints.push(where('employeeId', '==', filters.employeeId));
      }

      if (filters?.recognitionType) {
        constraints.push(where('recognitionType', '==', filters.recognitionType));
      }

      if (filters?.departmentId) {
        constraints.push(where('departmentId', '==', filters.departmentId));
      }

      // Order by recognition date (newest first)
      constraints.push(orderBy('recognitionDate', 'desc'));

      const q = query(recognitionsRef, ...constraints);
      const snapshot = await getDocs(q);

      const fetchedRecognitions: Recognition[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();

        // Apply date range filters (client-side since Firestore has query limitations)
        const recDate = convertTimestamp(data.recognitionDate);

        if (filters?.startDate && recDate < filters.startDate) return;
        if (filters?.endDate && recDate > filters.endDate) return;

        fetchedRecognitions.push({
          id: doc.id,
          ...data,
          recognitionDate: recDate,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
          certificateGeneratedAt: data.certificateGeneratedAt
            ? convertTimestamp(data.certificateGeneratedAt)
            : undefined
        } as Recognition);
      });

      setRecognitions(fetchedRecognitions);
      setStats(calculateStats(fetchedRecognitions));

      Logger.log('Recognition data fetched successfully', { count: fetchedRecognitions.length });
    } catch (err) {
      Logger.error('Error fetching recognitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recognitions');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, user?.role.id, user?.departmentIds, filters, calculateStats]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchRecognitions();
  }, [fetchRecognitions]);

  // Refresh function for manual reload
  const refresh = useCallback(() => {
    fetchRecognitions();
  }, [fetchRecognitions]);

  return {
    recognitions,
    loading,
    error,
    stats,
    refresh
  };
};
