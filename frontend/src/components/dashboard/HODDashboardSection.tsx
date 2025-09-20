// frontend/src/components/dashboard/HODDashboardSection.tsx
// ✨ PREMIUM HOD DASHBOARD SECTION WITH AUDIO CONSENT INTEGRATION
// ✅ Shows mandatory audio consent modal before opening warning wizard
// ✅ Updated "Issue Warning" button with audio notification
// ✅ Cannot bypass audio recording requirement
// 🔥 FIXED: Categories loading issue - now properly loads categories when needed

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  MessageCircle, 
  UserX, 
  Users, 
  TrendingUp,
  Calendar,
  Target,
  ChevronRight,
  Mic, // NEW: Audio recording icon
  BookOpen // NEW: Corrective Counselling icon
} from 'lucide-react';

// Import enhanced warning wizard (now includes audio consent)
import { EnhancedWarningWizard } from '../warnings/enhanced/EnhancedWarningWizard';

// Import corrective counselling modal
import { CorrectiveCounselling } from '../counselling/CorrectiveCounselling';
import { CounsellingFollowUp } from '../counselling/CounsellingFollowUp';

// Import hooks and services
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useCounsellingFollowUps } from '../../hooks/counselling/useCounsellingFollowUps';
import { API } from '../../api';
import { DataServiceV2 } from '../../services/DataServiceV2';
import { UNIVERSAL_SA_CATEGORIES } from '../../services/UniversalCategories';

// Import employee management
import { EmployeeManagement } from '../employees/EmployeeManagement';

// --- A Reusable Breakpoint Hook (for responsive rendering) ---
const useBreakpoint = (breakpoint: number) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);
  const handleResize = useCallback(() => setIsDesktop(window.innerWidth > breakpoint), [breakpoint]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isDesktop;
};

interface HODDashboardSectionProps {
  className?: string;
}

export const HODDashboardSection = memo<HODDashboardSectionProps>(({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, categories: contextCategories } = useOrganization();
  const { canCreateWarnings, canManageEmployees } = useMultiRolePermissions();
  const { dueFollowUps, counts: followUpCounts } = useCounsellingFollowUps();
  const isDesktop = useBreakpoint(768);

  // ============================================
  // NEW: AUDIO CONSENT & WIZARD STATE
  // ============================================
  
  const [showWarningWizard, setShowWarningWizard] = useState(false);

  const [showCorrectiveCounselling, setShowCorrectiveCounselling] = useState(false);
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedFollowUpSession, setSelectedFollowUpSession] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingWizardData, setIsLoadingWizardData] = useState(false);

  // Debug showWarningWizard changes
  useEffect(() => {
    console.log(`🔍 showWarningWizard changed to: ${showWarningWizard}`);
  }, [showWarningWizard]);

  // Debug employees array changes
  useEffect(() => {
    console.log(`🔍 employees array changed:`, {
      count: employees.length,
      employees: employees.map(e => `${e.firstName} ${e.lastName}`),
      timestamp: Date.now()
    });
  }, [employees]);

  // Debug categories array changes
  useEffect(() => {
    console.log(`🔍 categories array changed:`, {
      count: categories.length,
      categories: categories.map(c => c.name),
      timestamp: Date.now()
    });
  }, [categories]);

  // 🔥 PERFORMANCE: Memoize computed props to prevent wizard unmount/remount
  const currentManagerName = useMemo(() => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Manager';
  }, [user?.firstName, user?.lastName]);

  const organizationName = useMemo(() => {
    return organization?.name || 'Your Organization';
  }, [organization?.name]);

  // ============================================
  // 🔥 FIXED: IMPROVED WIZARD DATA LOADING
  // ============================================
  
  const loadWizardData = useCallback(async () => {
    if (!organization?.id || isLoadingWizardData) return;

    setIsLoadingWizardData(true);
    try {
      console.log('🔄 Loading wizard data for organization:', organization.id);
      
      // Load employees managed by this user (not all employees)
      const employeesData = await API.employees.getByManager(user?.id || '', organization.id);
      console.log('📋 HOD Dashboard: Loaded managed employees:', employeesData.length);
      
      // Transform employees to the expected format
      const transformedEmployees = employeesData.map(emp => ({
        id: emp.id,
        firstName: emp.profile?.firstName || emp.firstName || 'Unknown',
        lastName: emp.profile?.lastName || emp.lastName || 'Employee',
        position: emp.profile?.position || emp.employment?.position || 'Unknown Position',
        department: emp.profile?.department || emp.employment?.department || 'Unknown',
        email: emp.profile?.email || emp.contact?.email || emp.email || '',
        phone: emp.profile?.phone || emp.contact?.phone || emp.phone || '',
        deliveryPreference: (emp.deliveryPreference || 'email') as 'email' | 'whatsapp' | 'print',
        recentWarnings: emp.recentWarnings || { count: 0 },
        riskIndicators: emp.riskIndicators || { highRisk: false, reasons: [] }
      }));
      
      console.log('📋 HOD Dashboard: Transformed employees:', transformedEmployees.map(e => `${e.firstName} ${e.lastName}`));
      setEmployees(transformedEmployees);
      
      // 🔥 OPTIMIZED: Use categories from OrganizationContext to eliminate extra queries
      let loadedCategories: any[] = [];

      try {
        // First, try to get categories from organization context (now loaded by OrganizationProvider)
        if (contextCategories && Array.isArray(contextCategories) && contextCategories.length > 0) {
          console.log('✅ Using categories from organization context:', contextCategories.length);
          loadedCategories = contextCategories;
        } else {
          // Fallback 1: Check if organization object has categories (legacy)
          if (organization.categories && Array.isArray(organization.categories) && organization.categories.length > 0) {
            console.log('✅ Using categories from organization object:', organization.categories.length);
            loadedCategories = organization.categories;
          } else {
            // Fallback 2: Load categories directly from DataService (should be rare now)
            console.log('⚠️ Organization categories not available in context, loading directly...');
            const categoriesFromService = await DataServiceV2.getWarningCategories(organization.id);

            if (categoriesFromService && categoriesFromService.length > 0) {
              console.log('✅ Loaded categories from DataService:', categoriesFromService.length);
              loadedCategories = categoriesFromService;
            } else {
              // Fallback 3: Use default manufacturing categories (should be very rare)
              console.log('⚠️ No categories from service, using manufacturing defaults');
              loadedCategories = getDefaultManufacturingCategories();
            }
          }
        }
        
        // Transform categories to ensure proper structure
        const transformedCategories = loadedCategories.map(cat => ({
          id: cat.id,
          name: cat.name || 'Unknown Category',
          severity: cat.severity || 'medium',
          description: cat.description || '',
          lraSection: cat.lraSection || 'LRA Section 188',
          schedule8Reference: cat.schedule8Reference || 'Schedule 8',
          escalationPath: cat.escalationPath || ['verbal_warning', 'first_written', 'final_written', 'dismissal']
        }));
        
        console.log('📋 HOD Dashboard: Final categories:', transformedCategories.map(c => c.name));
        setCategories(transformedCategories);
        
      } catch (categoryError) {
        console.error('❌ Error loading categories, using defaults:', categoryError);
        setCategories(getDefaultManufacturingCategories());
      }
      
    } catch (error) {
      console.error('❌ Error loading wizard data:', error);
      setEmployees([]); // Set empty array on error
      setCategories(getDefaultManufacturingCategories()); // Ensure we always have categories
    } finally {
      setIsLoadingWizardData(false);
    }
  }, [organization?.id, organization?.categories, user?.id]); // Remove isLoadingWizardData to prevent loop

  // Load team members and categories data when component mounts
  useEffect(() => {
    if (organization?.id && user?.id && !isLoadingWizardData) {
      loadWizardData();
    }
  }, [organization?.id, user?.id]); // Remove loadWizardData dependency to prevent loop

  // 🔥 FIXED: Use UniversalCategories as the single source of truth for fallback
  const getDefaultManufacturingCategories = () => {
    // Transform UniversalCategories to the expected format
    return UNIVERSAL_SA_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      severity: cat.severity,
      description: cat.description,
      lraSection: cat.lraSection,
      schedule8Reference: cat.schedule8Reference,
      escalationPath: cat.escalationPath
    }));
  };

  // ============================================
  // AUDIO CONSENT & WIZARD HANDLERS
  // ============================================

  const handleIssueWarning = useCallback(async () => {
    if (!canCreateWarnings()) return;

    console.log('🎯 Opening warning wizard with integrated audio consent...');

    // FIXED: Load data FIRST, then show wizard with stable props
    await loadWizardData();

    // Only show wizard after data is loaded to ensure stable props
    setShowWarningWizard(true);
  }, [canCreateWarnings, loadWizardData]);

  // Audio consent handling is now integrated into the wizard

  const handleWarningWizardComplete = useCallback(() => {
    console.log('✅ Warning wizard completed');
    setShowWarningWizard(false);
  }, []);

  const handleWarningWizardCancel = useCallback(() => {
    console.log('❌ Warning wizard cancelled');
    setShowWarningWizard(false);
  }, []);

  const handleOpenCorrectiveCounselling = useCallback(() => {
    console.log('📋 Opening corrective counselling modal');
    setShowCorrectiveCounselling(true);
  }, []);

  const handleCorrectiveCounsellingClose = useCallback(() => {
    console.log('❌ Corrective counselling modal closed');
    setShowCorrectiveCounselling(false);
  }, []);


  // ============================================
  // COUNSELLING FOLLOW-UP HANDLERS
  // ============================================

  const handleOpenFollowUp = useCallback((session: any) => {
    console.log('📅 Opening follow-up for session:', session.id);
    setSelectedFollowUpSession(session);
    setShowFollowUpModal(true);
  }, []);

  const handleFollowUpClose = useCallback(() => {
    console.log('❌ Follow-up modal closed');
    setShowFollowUpModal(false);
    setSelectedFollowUpSession(null);
  }, []);

  const handleFollowUpComplete = useCallback(() => {
    console.log('✅ Follow-up completed');
    setShowFollowUpModal(false);
    setSelectedFollowUpSession(null);
    // Refresh follow-ups data would happen automatically via the hook
  }, []);

  // ============================================
  // TOOL ACTIONS CONFIGURATION
  // ============================================
  
  // 🎯 UPDATED: Issue Warning action now shows consent modal
  const toolActions = [
    {
      id: 'create-warning',
      title: 'Issue Warning',
      icon: AlertTriangle,
      color: 'orange',
      action: handleIssueWarning, // Updated to show consent modal
      enabled: canCreateWarnings(),
      hasAudioRecording: true // NEW: Flag for audio recording
    },
    {
      id: 'book-hr-meeting',
      title: 'HR Meeting',
      icon: MessageCircle,
      color: 'purple',
      action: () => navigate('/book-hr-meeting'),
      enabled: true,
      hasAudioRecording: false
    },
    {
      id: 'report-absence',
      title: 'Report Absence',
      icon: UserX,
      color: 'red',
      action: () => navigate('/report-absence'),
      enabled: true,
      hasAudioRecording: false
    },
    {
      id: 'corrective-counselling',
      title: 'Counselling',
      icon: BookOpen,
      color: 'blue',
      action: handleOpenCorrectiveCounselling,
      enabled: true,
      hasAudioRecording: false
    },
  ].filter(action => action.enabled);

  const managementActions = [
    {
      id: 'team-performance',
      title: 'Team Performance',
      description: 'Review department performance metrics',
      icon: TrendingUp,
      color: 'green',
      action: () => navigate('/team/performance'),
      enabled: canManageEmployees()
    },
    {
      id: 'schedule-review',
      title: 'Schedule Reviews',
      description: 'Plan performance reviews for team members',
      icon: Calendar,
      color: 'blue',
      action: () => navigate('/reviews/schedule'),
      enabled: canManageEmployees()
    },
    {
      id: 'team-goals',
      title: 'Team Goals',
      description: 'Set and track overall department objectives',
      icon: Target,
      color: 'indigo',
      action: () => navigate('/goals'),
      enabled: canManageEmployees()
    }
  ].filter(action => action.enabled);

  // 🎨 SuperUser design system gradient colors for tool buttons
  const getToolButtonColorClasses = (color: string) => {
    const colorMap = {
      orange: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      purple: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      red: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      indigo: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };
  
  const cardClasses = "bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100";

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* --- Compact Section Header --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">HOD Dashboard</h3>
            <div className="text-sm text-gray-500">Department management tools</div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
            Head of Department
          </span>
        </div>

        {/* 🎯 Compact Audio Notice */}
        {canCreateWarnings() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-900 font-medium">Warning processes include audio recording</span>
              <span className="text-xs text-blue-700">(consent required)</span>
            </div>
          </div>
        )}

        {/* --- Compact Tools Grid --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {toolActions.map((tool) => (
            <button 
              key={tool.id} 
              onClick={tool.action}
              disabled={tool.id === 'create-warning' && isLoadingWizardData}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 ${getToolButtonColorClasses(tool.color)} ${
                isLoadingWizardData && tool.id === 'create-warning' ? 'opacity-50 cursor-not-allowed' : ''
              } hover:shadow-md`}
            >
              <tool.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tool.title}</span>
              {tool.hasAudioRecording && <Mic className="w-3 h-3 opacity-60" />}
              {isLoadingWizardData && tool.id === 'create-warning' && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              )}
            </button>
          ))}
        </div>

        {/* --- Follow-up Section --- */}
        {followUpCounts.total > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-orange-600" />
              Follow-ups Due ({followUpCounts.due})
            </h4>
            <div className="space-y-2">
              {dueFollowUps.slice(0, 3).map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleOpenFollowUp(session)}
                  className="w-full text-left p-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all text-sm"
                >
                  <div className="font-medium text-gray-900">{session.employeeName}</div>
                  <div className="text-xs text-gray-600">{session.sessionType}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Team Overview --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <button 
            onClick={() => setShowEmployeeManagement(true)}
            className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-900">Team Members</span>
            </div>
            <span className="text-lg font-bold text-emerald-600">
              {isLoadingWizardData ? '...' : employees.length}
            </span>
          </button>
        </div>
      </div>

      {/* Audio consent is now integrated into the wizard as first step */}

      {/* Enhanced Warning Wizard */}
      {showWarningWizard && (
        <EnhancedWarningWizard
          key="warning-wizard" // Add stable key
          employees={employees}
          categories={categories}
          currentManagerName={currentManagerName}
          organizationName={organizationName}
          onComplete={handleWarningWizardComplete}
          onCancel={handleWarningWizardCancel}
        />
      )}

      {/* Corrective Counselling Modal */}
      {showCorrectiveCounselling && (
        <CorrectiveCounselling onClose={handleCorrectiveCounsellingClose} />
      )}

      {/* Counselling Follow-up Modal */}
      {showFollowUpModal && selectedFollowUpSession && (
        <CounsellingFollowUp 
          counsellingSession={selectedFollowUpSession}
          onClose={handleFollowUpClose}
          onComplete={handleFollowUpComplete}
        />
      )}

      {/* Employee Management Modal */}
      {showEmployeeManagement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
              <button
                onClick={() => setShowEmployeeManagement(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto">
              <EmployeeManagement />
            </div>
          </div>
        </div>
      )}

    </>
  );
});

HODDashboardSection.displayName = 'HODDashboardSection';

