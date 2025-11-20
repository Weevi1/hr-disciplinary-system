// frontend/src/components/employees/EmployeeOrganogram.tsx
// 🏆 VISUAL ORGANOGRAM COMPONENT 
// ✅ Interactive hierarchy visualization
// ✅ Role-based visibility (HR sees more than HOD)
// ✅ Click-to-select employees
// ✅ Responsive design

import React, { useMemo, useState, useCallback } from 'react';
import { 
  User, 
  Users, 
  Crown, 
  Shield, 
  ChevronDown, 
  ChevronRight,
  Building,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import type { Employee } from '../../types';

interface EmployeeOrganogramProps {
  employees: Employee[];
  onEmployeeClick?: (employee: Employee) => void;
  selectedEmployee?: Employee | null;
  inline?: boolean; // Hide header when embedded in tabs
}

interface HierarchyNode {
  employee: Employee;
  children: HierarchyNode[];
  level: number;
}

// Role hierarchy for visual representation
const ROLE_HIERARCHY = {
  'executive-management': { level: 0, icon: Crown, color: 'from-purple-500 to-purple-600' },
  'hr-manager': { level: 1, icon: Shield, color: 'from-blue-500 to-blue-600' },
  'hod-manager': { level: 2, icon: Users, color: 'from-emerald-500 to-emerald-600' },
  'employee': { level: 3, icon: User, color: 'from-gray-500 to-gray-600' }
};

export const EmployeeOrganogram: React.FC<EmployeeOrganogramProps> = ({
  employees,
  onEmployeeClick,
  selectedEmployee,
  inline = false
}) => {
  const { user } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'departments'>('tree');

  // Build hierarchy tree from flat employee list
  const hierarchyTree = useMemo(() => {
    if (!employees.length) return [];

    const employeeMap = new Map<string, Employee>();
    employees.forEach(emp => employeeMap.set(emp.id, emp));

    const roots: HierarchyNode[] = [];
    const processed = new Set<string>();

    // Helper function to build tree recursively
    const buildTree = (empId: string, level = 0): HierarchyNode | null => {
      if (processed.has(empId)) return null;
      
      const employee = employeeMap.get(empId);
      if (!employee) return null;

      processed.add(empId);

      // Find direct reports
      const children: HierarchyNode[] = [];
      employees
        .filter(emp => emp.employment.managerId === empId)
        .forEach(emp => {
          const childNode = buildTree(emp.id, level + 1);
          if (childNode) children.push(childNode);
        });

      return { employee, children, level };
    };

    // Start with employees who have no manager (top level)
    const topLevelEmployees = employees.filter(emp => 
      !emp.employment.managerId || !employeeMap.has(emp.employment.managerId)
    );

    topLevelEmployees.forEach(emp => {
      const node = buildTree(emp.id);
      if (node) roots.push(node);
    });

    return roots;
  }, [employees]);

  // Filter visible employees based on user role
  const visibleHierarchy = useMemo(() => {
    if (!user) return hierarchyTree;

    // HR and Executive Managements see full hierarchy
    if (['hr-manager', 'executive-management'].includes(user.role?.id)) {
      return hierarchyTree;
    }

    // HOD managers see only their subtree
    if (user.role?.id === 'hod-manager') {
      // First try to find the manager in the hierarchy tree
      const findUserNode = (nodes: HierarchyNode[]): HierarchyNode[] => {
        for (const node of nodes) {
          if (node.employee.id === user.id) {
            return [node];
          }
          const found = findUserNode(node.children);
          if (found.length > 0) return found;
        }
        return [];
      };
      
      const userNode = findUserNode(hierarchyTree);
      if (userNode.length > 0) {
        return userNode;
      }
      
      // Fallback: If manager not found in hierarchy, show employees that report to them
      const directReports = employees.filter(emp => emp.employment.managerId === user.id);
      if (directReports.length > 0) {
        // Create a fake manager node if the manager isn't in the employee list
        const managerEmployee = employees.find(emp => emp.id === user.id) || {
          id: user.id,
          profile: {
            firstName: user.firstName || user.displayName?.split(' ')[0] || 'Manager',
            lastName: user.lastName || user.displayName?.split(' ')[1] || '',
            email: user.email || '',
            employeeNumber: 'MGR-' + user.id.slice(-6),
            department: user.department || 'Management',
            position: 'Manager'
          },
          employment: {
            department: user.department || 'Management',
            position: 'Manager',
            managerId: null
          }
        } as Employee;
        
        // Build children nodes for direct reports
        const children: HierarchyNode[] = [];
        directReports.forEach(emp => {
          const childNode: HierarchyNode = {
            employee: emp,
            children: employees
              .filter(child => child.employment.managerId === emp.id)
              .map(child => ({ employee: child, children: [], level: 2 })),
            level: 1
          };
          children.push(childNode);
        });
        
        return [{
          employee: managerEmployee,
          children,
          level: 0
        }];
      }
      
      return [];
    }

    return hierarchyTree;
  }, [hierarchyTree, user]);

  // Group employees by department
  const departmentGroups = useMemo(() => {
    const groups = new Map<string, Employee[]>();
    employees.forEach(emp => {
      const dept = emp.profile.department || 'Unassigned';
      if (!groups.has(dept)) groups.set(dept, []);
      groups.get(dept)!.push(emp);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [employees]);

  const toggleNode = useCallback((employeeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  }, []);

  const handleEmployeeClick = useCallback((employee: Employee) => {
    onEmployeeClick?.(employee);
  }, [onEmployeeClick]);

  // Classic Org Chart Employee Card
  const OrgChartCard: React.FC<{ 
    employee: Employee; 
    level: number; 
    hasChildren: boolean;
    isExpanded: boolean;
    isSelected: boolean;
    childCount?: number;
  }> = ({ employee, level, hasChildren, isExpanded, isSelected, childCount = 0 }) => {
    const role = employee.employment.position || 'Employee';
    const RoleIcon = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]?.icon || User;
    const colorClass = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]?.color || 'from-gray-500 to-gray-600';

    return (
      <div 
        className={`
          relative bg-white rounded-lg shadow-md border-2 transition-all duration-200 cursor-pointer
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
          ${level === 0 ? 'w-56' : 'w-48'}
        `}
        onClick={() => handleEmployeeClick(employee)}
      >
        <div className="p-3">
          {/* Profile Section */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`
              w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} 
              flex items-center justify-center shadow-md
            `}>
              <RoleIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {employee.profile.firstName} {employee.profile.lastName}
                </h3>
                {level === 0 && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-gray-600 truncate">{role}</p>
            </div>
          </div>

          {/* Department Info */}
          <div className="text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{employee.profile.department}</span>
            </div>
          </div>

          {/* Team Count & Expand Button */}
          {hasChildren && (
            <div className="flex items-center justify-between">
              <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                {childCount}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(employee.id);
                }}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-600" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render vertical organogram optimized for hundreds of employees
  const renderOrgChart = (nodes: HierarchyNode[], isRoot = true) => {
    if (nodes.length === 0) return null;

    return (
      <div className={`flex flex-col items-center space-y-6 ${isRoot ? 'w-full' : ''}`}>
        {nodes.map((node, index) => {
          const hasChildren = node.children.length > 0;
          const isExpanded = expandedNodes.has(node.employee.id);
          const isSelected = selectedEmployee?.id === node.employee.id;
          const childCount = employees.filter(emp => emp.employment.managerId === node.employee.id).length;

          return (
            <div key={node.employee.id} className="flex flex-col items-center relative">
              {/* Employee Card */}
              <div className="relative z-10">
                <OrgChartCard
                  employee={node.employee}
                  level={node.level}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  isSelected={isSelected}
                  childCount={childCount}
                />
              </div>

              {/* Connecting Lines and Children - Vertical Layout */}
              {hasChildren && isExpanded && (
                <div className="relative mt-4">
                  {/* Vertical line down from parent */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-blue-300 transform -translate-x-0.5"></div>
                  
                  {/* Children Container - Vertical Stack for scalability */}
                  <div className="pt-4 space-y-4">
                    {node.children.map((child, childIndex) => (
                      <div key={child.employee.id} className="relative flex items-center">
                        {/* Horizontal connector line */}
                        <div className="flex items-center">
                          {/* Vertical line segment */}
                          <div className="w-0.5 h-8 bg-blue-300"></div>
                          {/* Horizontal line to child */}
                          <div className="w-8 h-0.5 bg-blue-300"></div>
                        </div>
                        
                        {/* Child subtree */}
                        <div className="ml-2">
                          {renderOrgChart([child], false)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Vertical connector line for multiple children */}
                  {node.children.length > 1 && (
                    <div 
                      className="absolute left-1/2 w-0.5 bg-blue-300 transform -translate-x-0.5"
                      style={{
                        top: '16px',
                        height: `${(node.children.length - 1) * 112 + 32}px` // Adjust based on card height and spacing
                      }}
                    ></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Department view
  const renderDepartmentView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {departmentGroups.map(([department, deptEmployees]) => (
        <div key={department} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Building className="w-5 h-5" />
              {department}
            </h3>
            <p className="text-blue-100 text-sm">{deptEmployees.length} employees</p>
          </div>
          <div className="p-4 space-y-3">
            {deptEmployees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => handleEmployeeClick(employee)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all duration-200
                  hover:bg-blue-50 hover:border-blue-200 border border-transparent
                  ${selectedEmployee?.id === employee.id ? 'bg-blue-50 border-blue-500' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {employee.profile.firstName} {employee.profile.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{employee.employment.position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (!employees.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employees Found</h3>
        <p className="text-gray-600">Start by adding employees to your organization.</p>
      </div>
    );
  }

  return (
    <div className={inline ? 'space-y-3' : 'space-y-6'}>
      {/* Header with view controls - Hidden when inline */}
      {!inline && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Team Structure
              </h2>
              <p className="text-gray-600 mt-1">
                {user?.role?.id === 'hr-manager'
                  ? 'Complete organizational hierarchy'
                  : user?.role?.id === 'hod-manager'
                  ? 'Your team and direct reports'
                  : 'Team overview'}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${viewMode === 'tree'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Hierarchy
              </button>
              <button
                onClick={() => setViewMode('departments')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${viewMode === 'departments'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
              >
                Departments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organogram Content */}
      <div className={`rounded-lg border border-gray-200 ${inline ? 'bg-white p-3' : 'bg-gradient-to-br from-gray-50 to-white p-6'}`}>
        {viewMode === 'tree' ? (
          <div className={`max-h-96 overflow-y-auto overflow-x-auto ${inline ? 'p-2' : 'p-4'}`}>
            {visibleHierarchy.length > 0 ? (
              <div className="min-w-max pb-8">
                {renderOrgChart(visibleHierarchy)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {user?.role?.id === 'hod-manager' 
                    ? 'No Team Members Found'
                    : 'No Organizational Structure'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {user?.role?.id === 'hod-manager'
                    ? 'You currently have no direct reports assigned to you. Contact HR to add team members.'
                    : 'There are no employees to display in the organizational hierarchy.'}
                </p>
                {user?.role?.id === 'hod-manager' && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Role:</strong> {user.role?.id}</p>
                    <p><strong>Total Employees:</strong> {employees.length}</p>
                    <p><strong>Direct Reports:</strong> {employees.filter(emp => emp.employment.managerId === user.id).length}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          renderDepartmentView()
        )}
      </div>
    </div>
  );
};

export default EmployeeOrganogram;