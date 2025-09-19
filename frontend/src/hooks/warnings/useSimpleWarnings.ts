import Logger from '../../utils/logger';
// frontend/src/hooks/warnings/useSimpleWarnings.ts
// 🔧 SIMPLE VERSION - Directly query Firebase for warnings
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../auth/AuthContext';

// Simple warning interface
interface SimpleWarning {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  category: string;
  severity: string;
  description: string;
  status: 'issued' | 'delivered' | 'acknowledged';
  submittedBy: string;
  submittedDate: any; // Firestore timestamp
  incidentDate: any;
  [key: string]: any; // For any additional fields
}

export const useSimpleWarnings = () => {
  const { organization } = useAuth();
  const [warnings, setWarnings] = useState<SimpleWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWarnings = async () => {
    if (!organization?.id || !db) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      Logger.debug('🔍 Loading warnings for organization:', organization.id)
      
      // Query warnings collection
      const warningsRef = collection(db, 'warnings');
      const q = query(
        warningsRef,
        where('organizationId', '==', organization.id),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      Logger.debug(1610)
      
      const warningData = snapshot.docs.map(doc => {
        const data = doc.data();
        Logger.debug(1734)
        
        return {
          id: doc.id,
          ...data
        } as SimpleWarning;
      });
      
      setWarnings(warningData);
      
    } catch (err) {
      Logger.error('❌ Error loading warnings:', err)
      setError('Failed to load warnings');
    } finally {
      setLoading(false);
    }
  };

  // Update warning status
  const updateWarningStatus = async (warningId: string, newStatus: 'issued' | 'delivered' | 'acknowledged') => {
    try {
      // For now, just update local state
      setWarnings(warnings.map(w => 
        w.id === warningId ? { ...w, status: newStatus } : w
      ));
      
      Logger.success(2413)
      // TODO: Update in Firebase
      
    } catch (err) {
      Logger.error('❌ Error updating warning status:', err)
    }
  };

  // Get statistics
  const getStats = () => {
    return {
      total: warnings.length,
      issued: warnings.filter(w => w.status === 'issued').length,
      delivered: warnings.filter(w => w.status === 'delivered').length,
      acknowledged: warnings.filter(w => w.status === 'acknowledged').length
    };
  };

  useEffect(() => {
    loadWarnings();
  }, [organization?.id]);

  return {
    warnings,
    loading,
    error,
    stats: getStats(),
    loadWarnings,
    updateWarningStatus
  };
};