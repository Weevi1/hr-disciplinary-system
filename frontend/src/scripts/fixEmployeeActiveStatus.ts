// Quick fix to restore some employees to active status
// Run in browser console: fixEmployeeActiveStatus('robertson-spar')

import { DatabaseShardingService } from '../services/DatabaseShardingService';

export const fixEmployeeActiveStatus = async (organizationId: string) => {
  try {
    console.log('🔧 Fixing employee active status...');

    // Get all employees
    const result = await DatabaseShardingService.queryDocuments(organizationId, 'employees', []);
    const employees = result.documents.filter(e => e.profile && e.id !== 'metadata');

    console.log(`Found ${employees.length} employees to fix`);

    // Set first 2 employees as active, keep last one archived
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const shouldBeActive = i < 2; // First 2 active, rest archived

      if (employee.isActive !== shouldBeActive) {
        console.log(`🔄 Updating ${employee.profile.firstName} ${employee.profile.lastName}: ${employee.isActive} → ${shouldBeActive}`);

        const updatedEmployee = {
          ...employee,
          isActive: shouldBeActive,
          updatedAt: new Date()
        };

        await DatabaseShardingService.updateDocument(
          organizationId,
          'employees',
          employee.id,
          updatedEmployee
        );

        console.log(`✅ Updated ${employee.profile.firstName} ${employee.profile.lastName}`);
      }
    }

    console.log('🎉 Employee status fix complete!');
    console.log('Please refresh the page to see updated employee status');

  } catch (error) {
    console.error('❌ Failed to fix employee status:', error);
  }
};

// Make available in browser console
(window as any).fixEmployeeActiveStatus = fixEmployeeActiveStatus;