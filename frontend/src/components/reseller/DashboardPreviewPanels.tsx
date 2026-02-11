// frontend/src/components/reseller/DashboardPreviewPanels.tsx
// Dashboard preview panels for Branding & CI tab — Manager, HR, and Executive views

import React from 'react';
import {
  X,
  AlertTriangle,
  MessageCircle,
  UserX,
  Award,
  Users,
  Shield,
  Clock,
  Building2,
  ChevronRight,
  Quote
} from 'lucide-react';
import type { DashboardThemeSettings } from '../../types/core';

interface PreviewProps {
  dashTheme: DashboardThemeSettings;
  brandingData: { primaryColor: string; secondaryColor: string; accentColor: string; tagline: string };
  logoPreview: string;
  clientName: string;
}

// ============================================
// SHARED HELPERS
// ============================================

const getShapeRadius = (shape?: string) => {
  const map: Record<string, string> = { flat: '0px', rounded: '12px', pill: '9999px' };
  return map[shape || 'rounded'];
};

const getSharedStyles = (t: DashboardThemeSettings, brandingData: PreviewProps['brandingData']) => ({
  pageBg: t.pageBackground || '#f9fafb',
  topBarBg: t.topBar?.background || '#ffffff',
  topBarText: t.topBar?.textColor || '#111827',
  fontStack: t.fontFamily ? `'${t.fontFamily}', system-ui, sans-serif` : "'Inter', system-ui, sans-serif",
  greetingBg: (t.greetingBanner?.gradientStart && t.greetingBanner?.gradientEnd)
    ? `linear-gradient(135deg, ${t.greetingBanner.gradientStart}, ${t.greetingBanner.gradientEnd})`
    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
  btnRadius: getShapeRadius(t.buttonShape),
});

// ============================================
// PHONE FRAME WRAPPER
// ============================================

const PhoneFrame: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  dashTheme: DashboardThemeSettings;
}> = ({ title, onClose, children, dashTheme }) => {
  const pageBg = dashTheme.pageBackground || '#f9fafb';
  const topBarBg = dashTheme.topBar?.background || '#ffffff';
  const fontStack = dashTheme.fontFamily ? `'${dashTheme.fontFamily}', system-ui, sans-serif` : "'Inter', system-ui, sans-serif";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col items-center gap-4 max-h-[95vh]">
        <div className="flex items-center gap-4">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          className="relative overflow-hidden flex-1 min-h-0"
          style={{
            width: '375px',
            maxHeight: 'calc(95vh - 60px)',
            borderRadius: '32px',
            border: '8px solid #1f2937',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 0 0 2px #374151',
            backgroundColor: '#1f2937'
          }}
        >
          {/* Notch */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '120px', height: '24px', backgroundColor: '#1f2937',
            borderRadius: '0 0 16px 16px', zIndex: 10
          }} />
          <div
            className="overflow-y-auto"
            style={{
              height: '100%',
              maxHeight: 'calc(95vh - 76px)',
              backgroundColor: pageBg,
              fontFamily: fontStack,
              borderRadius: '24px'
            }}
          >
            {/* Status bar spacer */}
            <div style={{ height: '28px', backgroundColor: topBarBg }} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TOP BAR + GREETING (shared across all phone previews)
// ============================================

const PhoneTopBar: React.FC<{
  orgName: string; role: string; userName: string;
  styles: ReturnType<typeof getSharedStyles>;
  logoPreview: string; brandingData: PreviewProps['brandingData'];
}> = ({ orgName, role, userName, styles, logoPreview, brandingData }) => (
  <>
    <div style={{
      backgroundColor: styles.topBarBg, color: styles.topBarText,
      borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {logoPreview ? (
          <img src={logoPreview} alt="" style={{ height: '24px', width: 'auto', borderRadius: '4px' }} />
        ) : (
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: `linear-gradient(135deg, ${brandingData.primaryColor}, ${brandingData.secondaryColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '10px', fontWeight: 700
          }}>
            {orgName.charAt(0)}
          </div>
        )}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>{orgName}</div>
          <div style={{ fontSize: '9px', opacity: 0.6, lineHeight: 1 }}>by Fifo</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <div style={{ fontSize: '11px', fontWeight: 500 }}>{userName}</div>
        <div style={{ fontSize: '9px', opacity: 0.6 }}>{role}</div>
      </div>
    </div>
    {/* Greeting */}
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
      <div style={{
        background: styles.greetingBg, borderRadius: '12px', padding: '14px 16px',
        color: 'white', position: 'relative' as const, overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-16px', right: '-16px',
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.08)'
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.85 }}>Good Morning,</div>
            <div style={{ fontSize: '17px', fontWeight: 700, marginTop: '2px' }}>{userName.split(' ')[0]}!</div>
          </div>
          <div style={{
            fontSize: '8px', backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase' as const
          }}>
            {role}
          </div>
        </div>
      </div>
    </div>
  </>
);

// ============================================
// QUOTES CARD (shared)
// ============================================

const QuotesCard: React.FC<{ cardBg: string }> = ({ cardBg }) => (
  <div style={{
    backgroundColor: cardBg, borderRadius: '16px', padding: '16px',
    border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative' as const, overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: '-4px', right: '12px', fontSize: '60px', fontFamily: 'Georgia, serif', color: '#3b82f6', opacity: 0.06, lineHeight: 1 }}>"</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Quote style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#6b7280' }}>Daily Inspiration</span>
    </div>
    <p style={{ fontSize: '13px', color: '#111827', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '10px' }}>
      "There is no passion to be found playing small — in settling for a life that is less than the one you are capable of living."
    </p>
    <p style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>— Nelson Mandela</p>
  </div>
);

// ============================================
// MINI PREVIEWS (inline, always visible)
// ============================================

// ----- Manager Mini Preview -----
export const ManagerMiniPreview: React.FC<{ dashTheme: DashboardThemeSettings; clientName: string; logoPreview: string; brandingData: PreviewProps['brandingData'] }> = ({
  dashTheme: t, clientName, logoPreview, brandingData
}) => {
  const shapeMap: Record<string, string> = { flat: '0px', rounded: '8px', pill: '9999px' };
  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden"
      style={{
        backgroundColor: t.pageBackground || '#f8fafc',
        fontFamily: t.fontFamily ? `'${t.fontFamily}', system-ui, sans-serif` : undefined
      }}
    >
      {/* Top bar */}
      <div className="px-4 py-2 text-xs font-medium flex items-center justify-between border-b"
        style={{ backgroundColor: t.topBar?.background || '#ffffff', color: t.topBar?.textColor || '#111827', borderColor: '#e5e7eb' }}>
        <span>{clientName}</span>
        <span style={{ opacity: 0.7 }}>Manager Name</span>
      </div>
      {/* Greeting */}
      <div className="px-4 py-3 text-white text-sm font-semibold" style={{
        background: (t.greetingBanner?.gradientStart && t.greetingBanner?.gradientEnd)
          ? `linear-gradient(135deg, ${t.greetingBanner.gradientStart}, ${t.greetingBanner.gradientEnd})`
          : 'linear-gradient(135deg, #3b82f6, #6366f1)'
      }}>
        Good Morning, Manager!
      </div>
      {/* Action buttons */}
      <div className="p-3 grid grid-cols-4 gap-2">
        {([
          { label: 'Warn', color: t.actionButtons?.issueWarning || '#f59e0b' },
          { label: 'Meeting', color: t.actionButtons?.hrMeeting || '#6366f1' },
          { label: 'Absence', color: t.actionButtons?.reportAbsence || '#ef4444' },
          { label: 'Kudos', color: t.actionButtons?.recognition || '#10b981' },
        ]).map((card) => (
          <div key={card.label} className="text-white text-center py-2 text-[10px] font-medium"
            style={{ backgroundColor: card.color, borderRadius: shapeMap[t.buttonShape || 'rounded'] }}>
            {card.label}
          </div>
        ))}
      </div>
      {/* Nav cards */}
      <div className="px-3 pb-3 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-medium rounded-md flex items-center justify-between"
          style={{ backgroundColor: t.navCards?.teamMembers || '#ffffff', border: '1px solid #e5e7eb' }}>
          <span style={{ color: '#374151' }}>Team Members</span>
          <span style={{ backgroundColor: '#3b82f6', color: 'white', fontSize: '8px', padding: '1px 5px', borderRadius: '6px' }}>12</span>
        </div>
        {['Follow-ups', 'Warnings'].map((label) => (
          <div key={label} className="px-3 py-2 text-[10px] font-medium rounded-md"
            style={{ backgroundColor: t.navCards?.general || '#ffffff', border: '1px solid #e5e7eb', color: '#374151' }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ----- HR Mini Preview -----
export const HRMiniPreview: React.FC<{ dashTheme: DashboardThemeSettings; clientName: string }> = ({
  dashTheme: t, clientName
}) => {
  const mc = t.hrDashboard?.metricColors;
  const defaultColors = {
    absenceReports: '#ef4444', meetingRequests: '#14b8a6',
    activeWarnings: '#f59e0b', reviewFollowups: '#14b8a6', totalEmployees: '#22c55e'
  };
  const metrics = [
    { label: 'Absence', color: mc?.absenceReports || defaultColors.absenceReports, val: '3' },
    { label: 'Meetings', color: mc?.meetingRequests || defaultColors.meetingRequests, val: '5' },
    { label: 'Warnings', color: mc?.activeWarnings || defaultColors.activeWarnings, val: '12' },
    { label: 'Reviews', color: mc?.reviewFollowups || defaultColors.reviewFollowups, val: '4' },
    { label: 'Employees', color: mc?.totalEmployees || defaultColors.totalEmployees, val: '48' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden"
      style={{ backgroundColor: t.pageBackground || '#f8fafc', fontFamily: t.fontFamily ? `'${t.fontFamily}', system-ui, sans-serif` : undefined }}>
      {/* Top bar */}
      <div className="px-4 py-2 text-xs font-medium flex items-center justify-between border-b"
        style={{ backgroundColor: t.topBar?.background || '#ffffff', color: t.topBar?.textColor || '#111827', borderColor: '#e5e7eb' }}>
        <span>{clientName}</span>
        <span style={{ opacity: 0.7 }}>HR Manager</span>
      </div>
      {/* Greeting */}
      <div className="px-4 py-3 text-white text-sm font-semibold" style={{
        background: (t.greetingBanner?.gradientStart && t.greetingBanner?.gradientEnd)
          ? `linear-gradient(135deg, ${t.greetingBanner.gradientStart}, ${t.greetingBanner.gradientEnd})`
          : 'linear-gradient(135deg, #3b82f6, #6366f1)'
      }}>
        Good Morning, HR!
      </div>
      {/* 5 metric cards: 2+2+1 */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(0, 2).map((m) => (
            <div key={m.label} className="text-white text-center py-2 rounded-lg" style={{ backgroundColor: m.color }}>
              <div className="text-[10px] font-medium opacity-90">{m.label}</div>
              <div className="text-lg font-bold">{m.val}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(2, 4).map((m) => (
            <div key={m.label} className="text-white text-center py-2 rounded-lg" style={{ backgroundColor: m.color }}>
              <div className="text-[10px] font-medium opacity-90">{m.label}</div>
              <div className="text-lg font-bold">{m.val}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-white text-center py-2 rounded-lg" style={{ backgroundColor: metrics[4].color }}>
            <div className="text-[10px] font-medium opacity-90">{metrics[4].label}</div>
            <div className="text-lg font-bold">{metrics[4].val}</div>
          </div>
        </div>
      </div>
      {/* Tab bar hint */}
      <div className="px-3 pb-3 flex gap-2">
        {['Warnings', 'Employees', 'Departments'].map((t) => (
          <div key={t} className="flex-1 text-center text-[9px] text-gray-500 border border-gray-200 rounded py-1.5">{t}</div>
        ))}
      </div>
    </div>
  );
};

// ----- Executive Mini Preview -----
export const ExecutiveMiniPreview: React.FC<{ dashTheme: DashboardThemeSettings; clientName: string }> = ({
  dashTheme: t, clientName
}) => {
  const mc = t.executiveDashboard?.metricColors;
  const defaultColors = {
    totalEmployees: '#22c55e', activeWarnings: '#f59e0b',
    highPriority: '#ef4444', departments: '#3b82f6'
  };
  const metrics = [
    { label: 'Employees', color: mc?.totalEmployees || defaultColors.totalEmployees, val: '48' },
    { label: 'Warnings', color: mc?.activeWarnings || defaultColors.activeWarnings, val: '12' },
    { label: 'High Priority', color: mc?.highPriority || defaultColors.highPriority, val: '3' },
    { label: 'Departments', color: mc?.departments || defaultColors.departments, val: '6' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden"
      style={{ backgroundColor: t.pageBackground || '#f8fafc', fontFamily: t.fontFamily ? `'${t.fontFamily}', system-ui, sans-serif` : undefined }}>
      <div className="px-4 py-2 text-xs font-medium flex items-center justify-between border-b"
        style={{ backgroundColor: t.topBar?.background || '#ffffff', color: t.topBar?.textColor || '#111827', borderColor: '#e5e7eb' }}>
        <span>{clientName}</span>
        <span style={{ opacity: 0.7 }}>Executive</span>
      </div>
      <div className="px-4 py-3 text-white text-sm font-semibold" style={{
        background: (t.greetingBanner?.gradientStart && t.greetingBanner?.gradientEnd)
          ? `linear-gradient(135deg, ${t.greetingBanner.gradientStart}, ${t.greetingBanner.gradientEnd})`
          : 'linear-gradient(135deg, #3b82f6, #6366f1)'
      }}>
        Good Morning, Director!
      </div>
      {/* 4 metric cards: 2x2 */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="text-white text-center py-2 rounded-lg" style={{ backgroundColor: m.color }}>
            <div className="text-[10px] font-medium opacity-90">{m.label}</div>
            <div className="text-lg font-bold">{m.val}</div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 flex gap-2">
        {['Organization', 'Warnings', 'Employees'].map((t) => (
          <div key={t} className="flex-1 text-center text-[9px] text-gray-500 border border-gray-200 rounded py-1.5">{t}</div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// PHONE FRAME PREVIEWS (modal, full-detail)
// ============================================

// ----- Manager Phone Preview -----
export const ManagerPhonePreview: React.FC<PreviewProps & { onClose: () => void }> = ({
  dashTheme, brandingData, logoPreview, clientName, onClose
}) => {
  const t = dashTheme;
  const styles = getSharedStyles(t, brandingData);
  const orgName = clientName;

  return (
    <PhoneFrame title="Manager Dashboard — Mobile" onClose={onClose} dashTheme={t}>
      <PhoneTopBar orgName={orgName} role="HOD Manager" userName="Thabo Molefe" styles={styles} logoPreview={logoPreview} brandingData={brandingData} />

      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        {/* 2x2 Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Issue Warning', color: t.actionButtons?.issueWarning || '#f59e0b', Icon: AlertTriangle },
            { label: 'HR Meeting', color: t.actionButtons?.hrMeeting || '#6366f1', Icon: MessageCircle },
            { label: 'Report Absence', color: t.actionButtons?.reportAbsence || '#ef4444', Icon: UserX },
            { label: 'Recognition', color: t.actionButtons?.recognition || '#10b981', Icon: Award },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: card.color, borderRadius: styles.btnRadius, color: 'white',
              padding: '16px 8px', display: 'flex', flexDirection: 'column' as const,
              alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '90px',
              position: 'relative' as const, overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)', borderRadius: 'inherit' }} />
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
                <card.Icon style={{ width: '16px', height: '16px' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center' as const, position: 'relative' as const }}>{card.label}</span>
            </div>
          ))}
        </div>

        {/* Team Members Card */}
        <div style={{
          backgroundColor: t.navCards?.teamMembers || 'white',
          borderRadius: getShapeRadius(t.buttonShape), padding: '14px 16px',
          border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>Team Members</span>
                <span style={{ backgroundColor: '#3b82f6', color: 'white', fontSize: '11px', fontWeight: 600, padding: '1px 8px', borderRadius: '10px' }}>12</span>
              </div>
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>View and manage your team</p>
            </div>
            <ChevronRight style={{ width: '18px', height: '18px', color: '#9ca3af', flexShrink: 0 }} />
          </div>
        </div>

        {/* Final Warnings Watch List */}
        <div style={{
          backgroundColor: t.navCards?.general || 'white', borderRadius: '16px',
          border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>Final Warnings</span>
                  <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 600, padding: '1px 8px', borderRadius: '10px' }}>2</span>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Employees requiring monitoring</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {['Sarah Johnson', 'Mike Peters'].map((name) => (
              <div key={name} style={{ padding: '10px 12px', backgroundColor: 'rgba(239,68,68,0.04)', borderRadius: '10px', borderLeft: '3px solid #ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#111827' }}>{name}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>23d left</span>
                </div>
                <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Late Attendance · 7 days ago</p>
              </div>
            ))}
          </div>
        </div>

        <QuotesCard cardBg={t.navCards?.general || 'white'} />
        <div style={{ height: '16px' }} />
      </div>
    </PhoneFrame>
  );
};

// ----- HR Phone Preview -----
export const HRPhonePreview: React.FC<PreviewProps & { onClose: () => void }> = ({
  dashTheme, brandingData, logoPreview, clientName, onClose
}) => {
  const t = dashTheme;
  const styles = getSharedStyles(t, brandingData);
  const mc = t.hrDashboard?.metricColors;
  const defaults = { absenceReports: '#ef4444', meetingRequests: '#14b8a6', activeWarnings: '#f59e0b', reviewFollowups: '#14b8a6', totalEmployees: '#22c55e' };
  const metrics = [
    { label: 'Absence Reports', color: mc?.absenceReports || defaults.absenceReports, val: '3', sub: '8 total', Icon: UserX },
    { label: 'Meeting Requests', color: mc?.meetingRequests || defaults.meetingRequests, val: '5', sub: '12 total', Icon: MessageCircle },
    { label: 'Active Warnings', color: mc?.activeWarnings || defaults.activeWarnings, val: '12', sub: '4 undelivered', Icon: Shield },
    { label: 'Review Follow-ups', color: mc?.reviewFollowups || defaults.reviewFollowups, val: '4', sub: '1 overdue', Icon: Clock },
    { label: 'Total Employees', color: mc?.totalEmployees || defaults.totalEmployees, val: '48', sub: '45 active', Icon: Users },
  ];

  return (
    <PhoneFrame title="HR Dashboard — Mobile" onClose={onClose} dashTheme={t}>
      <PhoneTopBar orgName={clientName} role="HR Manager" userName="Lindiwe Nkosi" styles={styles} logoPreview={logoPreview} brandingData={brandingData} />

      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        {/* 2x2 + 1 metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {metrics.map((m) => (
            <div key={m.label} style={{
              backgroundColor: m.color, borderRadius: styles.btnRadius, color: 'white',
              padding: '12px 8px', display: 'flex', flexDirection: 'column' as const,
              alignItems: 'center', gap: '4px', minHeight: '80px'
            }}>
              <m.Icon style={{ width: '16px', height: '16px', opacity: 0.8 }} />
              <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.9, textAlign: 'center' as const }}>{m.label}</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{m.val}</span>
              <span style={{ fontSize: '9px', opacity: 0.8 }}>{m.sub}</span>
            </div>
          ))}
        </div>

        {/* Tab cards */}
        {['Warnings Overview', 'Employee Management', 'Departments'].map((label) => (
          <div key={label} style={{
            backgroundColor: t.navCards?.general || 'white', borderRadius: '12px',
            padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{label}</span>
            <ChevronRight style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
          </div>
        ))}

        <QuotesCard cardBg={t.navCards?.general || 'white'} />
        <div style={{ height: '16px' }} />
      </div>
    </PhoneFrame>
  );
};

// ----- Executive Phone Preview -----
export const ExecutivePhonePreview: React.FC<PreviewProps & { onClose: () => void }> = ({
  dashTheme, brandingData, logoPreview, clientName, onClose
}) => {
  const t = dashTheme;
  const styles = getSharedStyles(t, brandingData);
  const mc = t.executiveDashboard?.metricColors;
  const defaults = { totalEmployees: '#22c55e', activeWarnings: '#f59e0b', highPriority: '#ef4444', departments: '#3b82f6' };
  const metrics = [
    { label: 'Total Employees', color: mc?.totalEmployees || defaults.totalEmployees, val: '48', Icon: Users },
    { label: 'Active Warnings', color: mc?.activeWarnings || defaults.activeWarnings, val: '12', sub: '4 undelivered', Icon: AlertTriangle },
    { label: 'High Priority', color: mc?.highPriority || defaults.highPriority, val: '3', sub: 'Critical cases', Icon: Shield },
    { label: 'Departments', color: mc?.departments || defaults.departments, val: '6', Icon: Building2 },
  ];

  return (
    <PhoneFrame title="Executive Dashboard — Mobile" onClose={onClose} dashTheme={t}>
      <PhoneTopBar orgName={clientName} role="Business Owner" userName="Johan van der Merwe" styles={styles} logoPreview={logoPreview} brandingData={brandingData} />

      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        {/* 2x2 metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {metrics.map((m) => (
            <div key={m.label} style={{
              backgroundColor: m.color, borderRadius: styles.btnRadius, color: 'white',
              padding: '12px 8px', display: 'flex', flexDirection: 'column' as const,
              alignItems: 'center', gap: '4px', minHeight: '80px'
            }}>
              <m.Icon style={{ width: '16px', height: '16px', opacity: 0.8 }} />
              <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.9, textAlign: 'center' as const }}>{m.label}</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{m.val}</span>
              {m.sub && <span style={{ fontSize: '9px', opacity: 0.8 }}>{m.sub}</span>}
            </div>
          ))}
        </div>

        {/* Tab cards */}
        {['Organization', 'Warnings Overview', 'Employees', 'Categories'].map((label) => (
          <div key={label} style={{
            backgroundColor: t.navCards?.general || 'white', borderRadius: '12px',
            padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{label}</span>
            <ChevronRight style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
          </div>
        ))}

        <QuotesCard cardBg={t.navCards?.general || 'white'} />
        <div style={{ height: '16px' }} />
      </div>
    </PhoneFrame>
  );
};
