// Delete all employees to start fresh
// Run in browser console: deleteAllEmployees('robertson-spar')

import { DatabaseShardingService } from '../services/DatabaseShardingService';

export const deleteAllEmployees = async (organizationId: string) => {
  try {
    console.log('🗑️ Deleting all employees to start fresh...');

    // Get all employees
    const result = await DatabaseShardingService.queryDocuments(organizationId, 'employees', []);
    const employees = result.documents.filter(e => e.profile && e.id !== 'metadata');

    console.log(`Found ${employees.length} employees to delete`);

    for (const employee of employees) {
      console.log(`🗑️ Deleting ${employee.profile.firstName} ${employee.profile.lastName}...`);

      await DatabaseShardingService.deleteDocument(
        organizationId,
        'employees',
        employee.id
      );

      console.log(`✅ Deleted ${employee.profile.firstName} ${employee.profile.lastName}`);
    }

    console.log('🎉 All employees deleted!');
    console.log('You can now create fresh employees with proper active status');

  } catch (error) {
    console.error('❌ Failed to delete employees:', error);
  }
};

// Make available in browser console
(window as any).deleteAllEmployees = deleteAllEmployees;