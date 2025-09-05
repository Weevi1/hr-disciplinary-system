// Add this as a temporary component to your SuperAdminDashboard or create a new page
// frontend/src/components/admin/CreateUsersButton.tsx

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { USER_ROLES, getPermissionsForRole } from '../../permissions/roleDefinitions';

export const CreateUsersButton = () => {
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string>('');

  const createAdditionalUsers = async () => {
    setCreating(true);
    setResult('');
    
    try {
      console.log('🚀 Creating additional users for Potas Pilots...');
      
      const orgId = 'potaspilots'; // Your organization ID
      
      // HR Manager User
      const hrManagerData = {
        id: `${orgId}-hr-manager`,
        email: 'hr@potaspilots.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: USER_ROLES['hr-manager'],
        organizationId: orgId,
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: getPermissionsForRole('hr-manager')
      };

      // HOD Manager User
      const hodManagerData = {
        id: `${orgId}-hod-manager`,
        email: 'manager@potaspilots.com',
        firstName: 'Mike',
        lastName: 'Wilson',
        role: USER_ROLES['hod-manager'],
        organizationId: orgId,
        departmentIds: ['operations', 'production'],
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: getPermissionsForRole('hod-manager')
      };

      // Create HR Manager
      const hrManagerRef = doc(db, 'users', hrManagerData.id);
      await setDoc(hrManagerRef, hrManagerData);
      console.log('✅ HR Manager created:', hrManagerData.email);

      // Create HOD Manager  
      const hodManagerRef = doc(db, 'users', hodManagerData.id);
      await setDoc(hodManagerRef, hodManagerData);
      console.log('✅ HOD Manager created:', hodManagerData.email);

      setResult(`✅ Successfully created:
📧 HR Manager: ${hrManagerData.email}
📧 HOD Manager: ${hodManagerData.email}

🎉 All users ready for login!`);

      console.log('🎉 All additional users created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating users:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.75rem',
      border: '2px solid #e2e8f0',
      margin: '1rem 0'
    }}>
      <h3 style={{ 
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#1e293b'
      }}>
        🚀 Create Demo Users for Potas Pilots
      </h3>
      
      <p style={{ 
        color: '#64748b',
        marginBottom: '1.5rem',
        lineHeight: '1.5'
      }}>
        Click the button below to create HR Manager and HOD Manager users for your Potas Pilots organization. 
        This will enable all 4 demo login roles.
      </p>

      <button
        onClick={createAdditionalUsers}
        disabled={creating}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: creating ? '#9ca3af' : '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: creating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {creating ? (
          <>
            <span>⏳</span>
            Creating Users...
          </>
        ) : (
          <>
            <span>👥</span>
            Create Missing Users
          </>
        )}
      </button>

      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: result.includes('❌') ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${result.includes('❌') ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '0.5rem',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          color: result.includes('❌') ? '#dc2626' : '#166534'
        }}>
          {result}
        </div>
      )}

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '0.5rem'
      }}>
        <h4 style={{ 
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: '#1e40af'
        }}>
          📋 Users That Will Be Created:
        </h4>
        <ul style={{ 
          margin: 0,
          paddingLeft: '1.25rem',
          color: '#1e40af',
          fontSize: '0.875rem'
        }}>
          <li><strong>HR Manager:</strong> hr@potaspilots.com</li>
          <li><strong>HOD Manager:</strong> manager@potaspilots.com</li>
        </ul>
        <p style={{
          fontSize: '0.75rem',
          color: '#64748b',
          marginTop: '0.5rem',
          marginBottom: 0
        }}>
          💡 These will join your existing business owner: potaspilots-business-owner@potaspilots.com
        </p>
      </div>
    </div>
  );
};
