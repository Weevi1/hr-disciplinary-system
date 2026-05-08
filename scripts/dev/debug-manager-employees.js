// Debug script to check employee-manager assignments in Firestore
// Run this in the browser console on the HR dashboard

const debugManagerEmployees = async (managerId) => {
  console.log(`🔍 Debugging employees for manager: ${managerId}`);

  try {
    // Get the organization from auth context
    const orgId = window.authContext?.organization?.id;
    if (!orgId) {
      console.error('❌ No organization ID found');
      return;
    }

    console.log(`📋 Organization ID: ${orgId}`);

    // Query employees directly from Firestore
    const db = window.firebase?.firestore();
    if (!db) {
      console.error('❌ Firestore not available');
      return;
    }

    // Get all employees in organization
    const allEmployeesSnapshot = await db
      .collection('organizations')
      .doc(orgId)
      .collection('employees')
      .where('isActive', '==', true)
      .get();

    console.log(`👥 Total active employees: ${allEmployeesSnapshot.size}`);

    // Check each employee's manager assignment
    allEmployeesSnapshot.forEach(doc => {
      const employee = doc.data();
      const employeeManagerId = employee.employment?.managerId;
      const isAssignedToManager = employeeManagerId === managerId;

      console.log(`📝 Employee: ${employee.profile?.firstName} ${employee.profile?.lastName}`);
      console.log(`   - ID: ${doc.id}`);
      console.log(`   - Manager ID: ${employeeManagerId || 'None'}`);
      console.log(`   - Assigned to ${managerId}?: ${isAssignedToManager ? '✅ YES' : '❌ NO'}`);
      console.log('---');
    });

    // Count employees assigned to this manager
    const assignedEmployees = [];
    allEmployeesSnapshot.forEach(doc => {
      const employee = doc.data();
      if (employee.employment?.managerId === managerId) {
        assignedEmployees.push({
          id: doc.id,
          name: `${employee.profile?.firstName} ${employee.profile?.lastName}`,
          department: employee.profile?.department
        });
      }
    });

    console.log(`\n📊 SUMMARY for manager ${managerId}:`);
    console.log(`   - Assigned employees: ${assignedEmployees.length}`);
    if (assignedEmployees.length > 0) {
      console.log(`   - Employee list:`);
      assignedEmployees.forEach(emp => {
        console.log(`     • ${emp.name} (${emp.department}) - ID: ${emp.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging manager employees:', error);
  }
};

// Run the debug for the specific manager ID mentioned by user
debugManagerEmployees('xV719n2CBjfHxPnl1vdW9JZW7KV2');

console.log('🚀 Debug script loaded. Results will appear above.');
console.log('💡 You can also run: debugManagerEmployees("MANAGER_ID") for any manager');