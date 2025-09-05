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
  status: 'pending_review' | 'approved' | 'rejected' | 'draft';
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
      
      console.log('🔍 Loading warnings for organization:', organization.id);
      
      // Query warnings collection
      const warningsRef = collection(db, 'warnings');
      const q = query(
        warningsRef,
        where('organizationId', '==', organization.id),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Found warnings:', snapshot.docs.length);
      
      const warningData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Warning data:', doc.id, data);
        
        return {
          id: doc.id,
          ...data
        } as SimpleWarning;
      });
      
      setWarnings(warningData);
      
    } catch (err) {
      console.error('❌ Error loading warnings:', err);
      setError('Failed to load warnings');
    } finally {
      setLoading(false);
    }
  };

  // Update warning status (approve/reject)
  const updateWarningStatus = async (warningId: string, newStatus: 'approved' | 'rejected') => {
    try {
      // For now, just update local state
      setWarnings(warnings.map(w => 
        w.id === warningId ? { ...w, status: newStatus } : w
      ));
      
      console.log('✅ Updated warning status:', warningId, newStatus);
      // TODO: Update in Firebase
      
    } catch (err) {
      console.error('❌ Error updating warning status:', err);
    }
  };

  // Get statistics
  const getStats = () => {
    return {
      total: warnings.length,
      pending: warnings.filter(w => w.status === 'pending_review').length,
      approved: warnings.filter(w => w.status === 'approved').length,
      rejected: warnings.filter(w => w.status === 'rejected').length
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