// frontend/src/services/EmployeeService.ts
import { DataService } from './DataService';
import type { Employee } from '../types';
import { WarningService } from './WarningService';


// Define the EmployeeWithContext interface
interface EmployeeWithContext {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  deliveryPreference: string;
  recentWarnings: {
    count: number;
    lastDate?: Date;
    lastCategory?: string;
    level?: string;
  };
  riskIndicators: {
    highRisk: boolean;
    reasons: string[];
  };
}

export class EmployeeService {
  /**
   * Get all employees for the current organization
   */
  static async getAll(): Promise<Employee[]> {
    try {
      // Get current organization
      const organization = await DataService.getOrganization();
      
      // Load employees for that organization
      return await DataService.loadEmployees(organization.id);
    } catch (error) {
      console.error('Error loading employees:', error);
      return [];
    }
  }

  /**
   * Get employees by organization ID
   */
  static async getByOrganization(organizationId: string): Promise<Employee[]> {
    try {
      return await DataService.loadEmployees(organizationId);
    } catch (error) {
      console.error('Error loading employees:', error);
      return [];
    }
  }

  /**
   * Get a single employee by ID
   */
  static async getById(employeeId: string): Promise<Employee | null> {
    try {
      return await DataService.getEmployee(employeeId);
    } catch (error) {
      console.error('Error loading employee:', error);
      return null;
    }
  }

  /**
   * Create or update an employee
   */
  static async save(employee: Employee): Promise<void> {
    try {
      const organization = await DataService.getOrganization();
      await DataService.saveEmployee(organization.id, employee);
    } catch (error) {
      console.error('Error saving employee:', error);
      throw error;
    }
  }

  /**
   * Archive an employee
   */
  static async archive(employeeId: string, reason?: string): Promise<void> {
    try {
      const organization = await DataService.getOrganization();
      await DataService.archiveEmployee(organization.id, employeeId, reason);
    } catch (error) {
      console.error('Error archiving employee:', error);
      throw error;
    }
  }

  /**
   * Delete an employee (soft delete)
   */
  static async delete(employeeId: string): Promise<void> {
    try {
      const organization = await DataService.getOrganization();
      await DataService.deleteEmployee(organization.id, employeeId);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  /**
   * Search employees by name or employee code
   */
  static async search(searchTerm: string): Promise<Employee[]> {
    try {
      const allEmployees = await this.getAll();
      const searchLower = searchTerm.toLowerCase();
      
      return allEmployees.filter(employee => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const employeeCode = employee.employeeNumber?.toLowerCase() || '';
        
        return fullName.includes(searchLower) || employeeCode.includes(searchLower);
      });
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
  }

  /**
   * Get employees by department
   */
  static async getByDepartment(department: string): Promise<Employee[]> {
    try {
      const allEmployees = await this.getAll();
      return allEmployees.filter(employee => 
        employee.department === department && employee.isActive
      );
    } catch (error) {
      console.error('Error loading department employees:', error);
      return [];
    }
  }

 /**
 * 🔧 FIXED: Get employees managed by a specific manager
 * Used by Manager Dashboard to show team quick access
 */
static async getEmployeesByManager(managerId: string): Promise<Employee[]> {
  try {
    console.log('[EmployeeService] Getting employees for manager:', managerId);
    
    // Get all employees first
    const allEmployees = await this.getAll();
    console.log('[EmployeeService] Total employees loaded:', allEmployees.length);
    
    // 🔧 FIXED: Check employment.managerId which is where the form saves it
    const managedEmployees = allEmployees.filter(employee => {
      const isDirectlyManaged = employee.employment?.managerId === managerId;
      
      if (isDirectlyManaged) {
        console.log('[EmployeeService] Found directly managed employee:', employee.profile.firstName, employee.profile.lastName);
      }
      
      return isDirectlyManaged && employee.isActive;
    });
    
    console.log('[EmployeeService] Found directly managed employees:', managedEmployees.length);
    
    // If no employees found with direct manager relationship,
    // check if this manager is responsible for specific departments
    if (managedEmployees.length === 0) {
      try {
        const userProfile = await DataService.getUserProfile(managerId);
        console.log('[EmployeeService] User profile for fallback:', {
          name: `${userProfile?.firstName} ${userProfile?.lastName}`,
          role: userProfile?.role?.id,
          departmentIds: userProfile?.departmentIds
        });
        
        if (userProfile?.role?.id === 'hod-manager' && userProfile?.departmentIds) {
          console.log('[EmployeeService] Checking department-based assignments...');
          
          // Return employees from manager's departments
          const departmentEmployees = allEmployees.filter(employee => {
            // 🔧 FIXED: Check both profile.department and employment.department
            const employeeDept = employee.profile.department || employee.employment?.department || '';
            const isInManagedDepartment = userProfile.departmentIds?.includes(employeeDept.toLowerCase()) || 
                                        userProfile.departmentIds?.includes(employeeDept) &&
                                        employee.isActive;
            
            if (isInManagedDepartment) {
              console.log('[EmployeeService] Found department employee:', {
                name: `${employee.profile.firstName} ${employee.profile.lastName}`,
                department: employeeDept,
                managedDepartments: userProfile.departmentIds
              });
            }
            
            return isInManagedDepartment;
          });
          
          console.log('[EmployeeService] Found department employees:', departmentEmployees.length);
          
          // 🚀 TEMPORARY FIX: If still no matches, let's see what departments we have
          if (departmentEmployees.length === 0) {
            console.log('[EmployeeService] 🔍 DEBUGGING - No department matches found');
            console.log('[EmployeeService] Manager departments:', userProfile.departmentIds);
            
            const allDepartments = new Set(allEmployees.map(emp => emp.profile.department));
            console.log('[EmployeeService] Available employee departments:', Array.from(allDepartments));
            
            // Try case-insensitive matching
            const flexibleDepartmentEmployees = allEmployees.filter(employee => {
              const employeeDept = (employee.profile.department || '').toLowerCase();
              const hasMatch = userProfile.departmentIds?.some(managedDept => {
                const managedDeptLower = managedDept.toLowerCase();
                return employeeDept.includes(managedDeptLower) || managedDeptLower.includes(employeeDept);
              }) && employee.isActive;
              
              if (hasMatch) {
                console.log('[EmployeeService] Found flexible match:', {
                  employee: `${employee.profile.firstName} ${employee.profile.lastName}`,
                  employeeDept: employee.profile.department,
                  managedDepts: userProfile.departmentIds
                });
              }
              
              return hasMatch;
            });
            
            console.log('[EmployeeService] Found flexible department matches:', flexibleDepartmentEmployees.length);
            return flexibleDepartmentEmployees;
          }
          
          return departmentEmployees;
        }
      } catch (error) {
        console.warn('[EmployeeService] Could not get user profile for department filtering:', error);
      }
    }
    
    return managedEmployees;
    
  } catch (error) {
    console.error('[EmployeeService] Error getting employees by manager:', error);
    return []; // Return empty array instead of throwing
  }
}

  /**
   * 🚀 NEW: Get employees with rich warning context for system
   */
static async getEmployeesWithWarningContext(organizationId: string): Promise<EmployeeWithContext[]> {
  try {
    console.log('[EmployeeService] Loading employees with warning context for org:', organizationId);
    
    // Load all employees
    const employees = await DataService.loadEmployees(organizationId);
    console.log('[EmployeeService] Found employees:', employees.length);
    
    // Transform to EmployeeWithContext with warning data
    const employeesWithContext: EmployeeWithContext[] = await Promise.all(
      employees.map(async (employee) => {
        try {
          // Get warning history for this employee
          const warningHistory = await WarningService.getEmployeeWarnings(employee.id, organizationId);
          
          // Calculate warning statistics
          const now = new Date();
          const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
          
          const recentWarnings = warningHistory.filter(w => 
            DataService.convertDate(w.createdAt) > sixMonthsAgo
          );
          
          const lastWarning = warningHistory.length > 0 
            ? warningHistory.sort((a, b) => DataService.convertDate(b.createdAt).getTime() - DataService.convertDate(a.createdAt).getTime())[0]
            : null;
          
          // Calculate risk indicators
          const riskFactors = [];
          let isHighRisk = false;
          
          if (recentWarnings.length >= 3) {
            riskFactors.push('Multiple recent warnings');
            isHighRisk = true;
          }
          
          if (lastWarning && DataService.convertDate(lastWarning.createdAt) > new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))) {
            riskFactors.push('Warning within last 30 days');
            isHighRisk = true;
          }
          
          if (employee.currentDisciplinaryLevel === 'final_written') {
            riskFactors.push('On final written warning');
            isHighRisk = true;
          }
          
          // Get delivery preference (default to email if not set)
          const deliveryPreference = employee.preferredDeliveryMethod || 'email';
          
          const employeeWithContext: EmployeeWithContext = {
            id: employee.id,
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            department: employee.department || 'Unknown',
            position: employee.position || 'Unknown',
            deliveryPreference: deliveryPreference,
            recentWarnings: {
              count: recentWarnings.length,
              lastDate: lastWarning ? DataService.convertDate(lastWarning.createdAt) : undefined,
              lastCategory: lastWarning?.category || undefined,
              level: lastWarning?.level || undefined
            },
            riskIndicators: {
              highRisk: isHighRisk,
              reasons: riskFactors
            }
          };
          
          return employeeWithContext;
          
        } catch (employeeError) {
          console.error('[EmployeeService] Error processing employee:', employee.id, employeeError);
          
          // Return basic employee data if warning context fails
          return {
            id: employee.id,
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            department: employee.department || 'Unknown',
            position: employee.position || 'Unknown',
            deliveryPreference: employee.preferredDeliveryMethod || 'email',
            recentWarnings: {
              count: 0,
            },
            riskIndicators: {
              highRisk: false,
              reasons: []
            }
          };
        }
      })
    );
    
    console.log('[EmployeeService] Processed employees with context:', employeesWithContext.length);
    return employeesWithContext;
    
  } catch (error) {
    console.error('[EmployeeService] Error getting employees with warning context:', error);
    return [];
  }
}

  /**
   * Get active employees count
   */
  static async getActiveCount(): Promise<number> {
    try {
      const allEmployees = await this.getAll();
      return allEmployees.filter(employee => employee.isActive).length;
    } catch (error) {
      console.error('Error counting employees:', error);
      return 0;
    }
  }

  /**
   * Get employee statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDepartment: Record<string, number>;
    withWarnings: number;
  }> {
    try {
      const allEmployees = await this.getAll();
      
      const stats = {
        total: allEmployees.length,
        active: allEmployees.filter(e => e.isActive).length,
        inactive: allEmployees.filter(e => !e.isActive).length,
        byDepartment: {} as Record<string, number>,
        withWarnings: allEmployees.filter(e => 
          (e.warningCount || 0) > 0
        ).length
      };

      // Count by department
      allEmployees.forEach(employee => {
        const dept = employee.department || 'Unknown';
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        withWarnings: 0
      };
    }
  }
}
