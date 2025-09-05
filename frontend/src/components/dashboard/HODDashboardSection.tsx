// frontend/src/components/dashboard/HODDashboardSection.tsx
// ✨ PREMIUM HOD DASHBOARD SECTION WITH AUDIO CONSENT INTEGRATION
// ✅ Shows mandatory audio consent modal before opening warning wizard
// ✅ Updated "Issue Warning" button with audio notification
// ✅ Cannot bypass audio recording requirement
// 🔥 FIXED: Categories loading issue - now properly loads categories when needed

import React, { memo, useState, useEffect, useCallback } from 'react';
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

// Import audio consent modal and wizard
import { AudioConsentModal } from '../warnings/enhanced/modals/AudioConsentModal';
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
import { DataService } from '../../services/DataService';

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
  const { organization } = useOrganization();
  const { canCreateWarnings, canManageEmployees } = useMultiRolePermissions();
  const { dueFollowUps, counts: followUpCounts } = useCounsellingFollowUps();
  const isDesktop = useBreakpoint(768);

  // ============================================
  // NEW: AUDIO CONSENT & WIZARD STATE
  // ============================================
  
  const [showAudioConsentModal, setShowAudioConsentModal] = useState(false);
  const [showWarningWizard, setShowWarningWizard] = useState(false);
  const [showCorrectiveCounselling, setShowCorrectiveCounselling] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedFollowUpSession, setSelectedFollowUpSession] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingWizardData, setIsLoadingWizardData] = useState(false);

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
      
      // 🔥 FIXED: Proper categories loading with multiple fallbacks
      let loadedCategories: any[] = [];
      
      try {
        // First, try to get categories from organization context
        if (organization.categories && Array.isArray(organization.categories) && organization.categories.length > 0) {
          console.log('✅ Using categories from organization context:', organization.categories.length);
          loadedCategories = organization.categories;
        } else {
          // Fallback 1: Load categories directly from DataService
          console.log('⚠️ Organization categories not available, loading directly...');
          const categoriesFromService = await DataService.getWarningCategories(organization.id);
          
          if (categoriesFromService && categoriesFromService.length > 0) {
            console.log('✅ Loaded categories from DataService:', categoriesFromService.length);
            loadedCategories = categoriesFromService;
          } else {
            // Fallback 2: Use default manufacturing categories (since console shows manufacturing)
            console.log('⚠️ No categories from service, using manufacturing defaults');
            loadedCategories = getDefaultManufacturingCategories();
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

  // 🔥 FIXED: Complete 8-category fallback using UniversalCategories
  const getDefaultManufacturingCategories = () => {
    return [
      // 1. Attendance & Punctuality
      {
        id: 'attendance_punctuality',
        name: 'Attendance & Punctuality',
        severity: 'minor',
        description: 'Late coming, unauthorized absence, early departure without permission',
        lraSection: 'LRA Section 188(1)(a) - Incapacity or poor work performance',
        schedule8Reference: 'Schedule 8, Item 10 - Incapacity/poor performance procedures',
        escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written', 'dismissal']
      },
      // 2. Performance Issues
      {
        id: 'performance_issues',
        name: 'Performance Issues',
        severity: 'minor',
        description: 'Poor work quality, failure to meet targets, lack of productivity',
        lraSection: 'LRA Section 188(1)(a) - Incapacity or poor work performance',
        schedule8Reference: 'Schedule 8, Item 10 - Incapacity procedures',
        escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written', 'dismissal']
      },
      // 3. Safety Violations
      {
        id: 'safety_violations',
        name: 'Safety Violations',
        severity: 'serious',
        description: 'Failure to follow safety protocols, endangering self or others',
        lraSection: 'LRA Section 188(1)(b) - Misconduct',
        schedule8Reference: 'Schedule 8, Item 1 - Dismissible offences',
        escalationPath: ['first_written', 'final_written', 'dismissal']
      },
      // 4. Insubordination & Disrespect
      {
        id: 'insubordination_disrespect',
        name: 'Insubordination & Disrespect',
        severity: 'serious',
        description: 'Refusal to obey lawful instructions, disrespectful behavior to supervisors',
        lraSection: 'LRA Section 188(1)(b) - Misconduct',
        schedule8Reference: 'Schedule 8, Item 3 - Willful disobedience',
        escalationPath: ['first_written', 'final_written', 'dismissal']
      },
      // 5. Policy Violations
      {
        id: 'policy_violations',
        name: 'Policy Violations',
        severity: 'serious',
        description: 'Breach of company policies, procedures, or code of conduct',
        lraSection: 'LRA Section 188(1)(b) - Misconduct',
        schedule8Reference: 'Schedule 8, Item 4 - Willful negligence',
        escalationPath: ['verbal', 'first_written', 'final_written', 'dismissal']
      },
      // 6. Dishonesty & Theft
      {
        id: 'dishonesty_theft',
        name: 'Dishonesty & Theft',
        severity: 'gross_misconduct',
        description: 'Theft, fraud, falsification of records, dishonest conduct',
        lraSection: 'LRA Section 188(1)(b) - Misconduct',
        schedule8Reference: 'Schedule 8, Item 6 - Dishonesty',
        escalationPath: ['dismissal']
      },
      // 7. Substance Abuse
      {
        id: 'substance_abuse',
        name: 'Substance Abuse',
        severity: 'gross_misconduct',
        description: 'Use of alcohol or drugs during work hours, reporting to work intoxicated',
        lraSection: 'LRA Section 188(1)(b) - Misconduct',
        schedule8Reference: 'Schedule 8, Item 10 - Being under influence',
        escalationPath: ['final_written', 'dismissal']
      },
      // 8. Harassment & Discrimination
      {
        id: 'harassment_discrimination',
        name: 'Harassment & Discrimination',
        severity: 'gross_misconduct',
        description: 'Sexual harassment, discrimination, creating hostile work environment',
        lraSection: 'LRA Section 188(1)(b) - Misconduct',
        schedule8Reference: 'Schedule 8, Item 12 - Assault/harassment',
        escalationPath: ['final_written', 'dismissal']
      }
    ];
  };

  // ============================================
  // AUDIO CONSENT & WIZARD HANDLERS
  // ============================================
  
  const handleIssueWarning = useCallback(async () => {
    if (!canCreateWarnings()) return;
    
    console.log('🎯 Opening warning creation with mandatory audio recording...');
    
    // Always load fresh wizard data to ensure we have the latest categories
    await loadWizardData();
    
    // Show consent modal
    setShowAudioConsentModal(true);
  }, [canCreateWarnings, loadWizardData]);

  const handleAudioConsentGiven = useCallback(() => {
    console.log('✅ Audio recording consent given - opening wizard');
    console.log('📊 Categories available for wizard:', categories.length);
    console.log('👥 Employees available for wizard:', employees.length);
    setShowAudioConsentModal(false);
    setShowWarningWizard(true);
  }, [categories.length, employees.length]);

  const handleAudioConsentDeclined = useCallback(() => {
    console.log('❌ Audio recording consent declined');
    setShowAudioConsentModal(false);
  }, []);

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

  // 🎨 Custom color function for the tool grid
  const getToolButtonColorClasses = (color: string) => {
    const colorMap = {
      orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
      purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
      red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
      indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };
  
  const cardClasses = "bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100";

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <>
      <div className={`${cardClasses} p-4 md:p-6 ${className}`}>
        {/* --- Section Title --- */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
            Quick Tools
          </h3>
          <span className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-semibold">
              HOD
          </span>
        </div>

        {/* 🎯 NEW: Audio Recording Notice (only shows if warning creation is enabled) */}
        {canCreateWarnings() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                Warning processes are automatically recorded
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Consent required before proceeding with warning creation
            </p>
          </div>
        )}

        {/* --- Primary Tools Flexbox --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-5 md:mb-6">
          {toolActions.map((tool) => (
            <button 
              key={tool.id} 
              onClick={tool.action}
              disabled={tool.id === 'create-warning' && isLoadingWizardData}
              className={`group text-center p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-200 min-h-[90px] md:min-h-[100px] flex flex-col justify-center ${getToolButtonColorClasses(tool.color)} ${
                isLoadingWizardData && tool.id === 'create-warning' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <tool.icon className="w-6 h-6 md:w-7 md:h-7 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-xs md:text-sm text-center block">
                {tool.title}
              </span>
              {/* 🎯 NEW: Audio recording indicator */}
              {tool.hasAudioRecording && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Mic className="w-3 h-3 opacity-60" />
                  <span className="text-xs opacity-75">Auto-recorded</span>
                </div>
              )}
              {/* Loading indicator */}
              {isLoadingWizardData && tool.id === 'create-warning' && (
                <div className="flex justify-center mt-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* --- Team Snapshot --- */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200/80 rounded-xl flex justify-between items-center p-4 mb-5 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/80 p-2 rounded-full">
              <Users className="w-5 h-5 text-green-700" />
            </div>
            <span className="text-sm md:text-base font-semibold text-green-800">Your Team Members</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-green-700">
            {isLoadingWizardData ? (
              <div className="animate-pulse bg-green-200 h-8 w-8 rounded"></div>
            ) : (
              employees.length
            )}
          </span>
        </div>

        {/* --- Follow-up Notifications --- */}
        {followUpCounts.total > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-100 border border-orange-200/80 rounded-xl p-4 mb-5 md:mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/80 p-2 rounded-full">
                  <Calendar className="w-5 h-5 text-orange-700" />
                </div>
                <span className="text-sm md:text-base font-semibold text-orange-800">Counselling Follow-ups</span>
              </div>
              <div className="flex items-center gap-2">
                {followUpCounts.overdue > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    {followUpCounts.overdue} Overdue
                  </span>
                )}
                {followUpCounts.dueSoon > 0 && (
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                    {followUpCounts.dueSoon} Due Soon
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {dueFollowUps.slice(0, 3).map((session) => {
                const followUpDate = new Date(session.followUpDate);
                const isOverdue = followUpDate < new Date();
                const daysDiff = Math.ceil((followUpDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <button
                    key={session.id}
                    onClick={() => handleOpenFollowUp(session)}
                    className="w-full text-left p-3 bg-white/60 hover:bg-white/80 rounded-lg border border-orange-200/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-orange-900 text-sm">
                          {session.employeeName}
                        </div>
                        <div className="text-xs text-orange-700">
                          {session.category} • {new Date(session.dateCreated).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600' : daysDiff <= 1 ? 'text-amber-600' : 'text-orange-600'
                        }`}>
                          {isOverdue 
                            ? `Overdue ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`
                            : daysDiff === 0 
                              ? 'Due Today'
                              : `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`
                          }
                        </div>
                        <ChevronRight className="w-4 h-4 text-orange-500 group-hover:text-orange-700 transition-colors mt-1" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {dueFollowUps.length > 3 && (
              <div className="mt-3 text-center">
                <span className="text-xs text-orange-700">
                  +{dueFollowUps.length - 3} more follow-ups pending
                </span>
              </div>
            )}
          </div>
        )}

        {/* --- Secondary Management Actions --- */}
        {managementActions.length > 0 && (
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-3">Team Management & Planning</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {managementActions.map((action) => (
                <button 
                  key={action.id}
                  onClick={action.action}
                  className="group w-full flex items-center gap-4 p-3 text-left rounded-lg bg-gray-50/70 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${action.color}-100/80`}>
                    <action.icon className={`w-4 h-4 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 text-sm">{action.title}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}
      
      {/* 🎯 NEW: Audio Consent Modal */}
      {showAudioConsentModal && (
        <AudioConsentModal
          isOpen={showAudioConsentModal}
          organizationName={organization?.name || 'Organization'}
          managerName={user?.displayName || user?.firstName || 'Manager'}
          onConsent={handleAudioConsentGiven}
          onCancel={handleAudioConsentDeclined}
        />
      )}

      {/* Enhanced Warning Wizard */}
      {showWarningWizard && (
        <EnhancedWarningWizard
          employees={employees}
          categories={categories}
          currentManagerName={user?.displayName || user?.firstName || 'Manager'}
          organizationName={organization?.name || 'Organization'}
          onComplete={handleWarningWizardComplete}
          onCancel={handleWarningWizardCancel}
            isFullScreen={true}  // ← ADD THIS LINE
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

    </>
  );
});

HODDashboardSection.displayName = 'HODDashboardSection';