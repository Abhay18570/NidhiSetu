import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../i18n/useLanguage';
import Logo from '../common/Logo';
import {
  LayoutDashboard,
  Building2,
  FileText,
  FileCheck2,
  Bell,
  Settings,
  ShieldCheck,
  Users,
  ScrollText,
  Activity,
  LogOut,
  ExternalLink,
  X,
  Layers,
  Landmark,
  RotateCcw,
  ShieldAlert,
  Sliders,
  BarChart2,
} from 'lucide-react';

export default function DashboardSidebar({ isOpen, onClose }) {
  const { currentRole, currentInstitution, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate('/login');
  };

  const navConfigs = {
    institution: [
      { path: '/institution/dashboard', label: t('dash.menu.dashboard', 'Dashboard'), icon: LayoutDashboard },
      { path: '/institution/portfolio', label: t('dash.menu.portfolio', 'Unified Portfolio Overview'), icon: Building2 },
      { path: '/institution/renewals', label: t('dash.menu.renewals', 'FDR Renewals & Continuity'), icon: RotateCcw },
      { path: '/institution/release-requests', label: t('dash.menu.releases', 'Administrative Releases'), icon: FileCheck2 },
      { path: '/institution/compliance', label: t('dash.menu.institutionCompliance', 'Compliance & Adequacy'), icon: ShieldCheck },
      { path: '/institution/profile', label: t('dash.menu.profile', 'Institution Profile'), icon: Building2 },
      { path: '/institution/applications', label: t('dash.menu.applications', 'FDR Applications'), icon: FileText },
      { path: '/institution/fdr-records', label: t('dash.menu.fdrRecords', 'FDR Repository'), icon: FileCheck2 },
      { path: '/institution/notifications', label: t('dash.menu.notifications', 'Notifications'), icon: Bell },
      { path: '/institution/settings', label: t('dash.menu.settings', 'Settings & Security'), icon: Settings },
    ],
    officer: [
      { path: '/officer/command-center', label: t('dash.menu.commandCenter', 'Regulatory Command Center'), icon: ShieldAlert },
      { path: '/officer/action-inbox', label: t('dash.menu.actionInbox', 'Unified Action Inbox'), icon: Layers },
      { path: '/officer/portfolio-analytics', label: t('dash.menu.portfolioAnalytics', 'Portfolio Analytics'), icon: Activity },
      { path: '/officer/dashboard', label: t('dash.menu.scrutinyDash', 'Scrutiny Console'), icon: LayoutDashboard },
      { path: '/officer/renewals', label: t('dash.menu.officerRenewals', 'Renewal Applications'), icon: RotateCcw },
      { path: '/officer/release-requests', label: t('dash.menu.officerReleases', 'Release Requests'), icon: FileCheck2 },
      { path: '/officer/compliance', label: t('dash.menu.officerCompliance', 'Regulatory Compliance'), icon: ShieldCheck },
      { path: '/officer/institutions', label: t('dash.menu.instRegistry', 'Institution Registry'), icon: Building2 },
      { path: '/officer/verification-queue', label: t('dash.menu.queue', 'Verification Queue'), icon: Layers },
      { path: '/officer/document-intelligence', label: t('dash.menu.documentIntelligence', 'Document Intelligence'), icon: ScrollText },
      { path: '/officer/bank-verifications', label: t('dash.menu.bankVerifications', 'Bank Confirmations'), icon: Landmark },
      { path: '/officer/cases', label: t('dash.menu.cases', 'Assigned Cases'), icon: FileCheck2 },
      { path: '/officer/activity', label: t('dash.menu.activity', 'Scrutiny History'), icon: Activity },
    ],
    admin: [
      { path: '/admin/command-center', label: t('dash.menu.adminCommandCenter', 'Admin Command Center'), icon: ShieldAlert },
      { path: '/admin/demo-center', label: t('dash.menu.demoCenter', 'SIH Demonstration Center'), icon: Sliders },
      { path: '/admin/dashboard', label: t('dash.menu.adminOverview', 'Platform Overview'), icon: LayoutDashboard },
      { path: '/admin/renewal-monitoring', label: t('dash.menu.renewalMonitoring', 'Renewal & Portfolio Telemetry'), icon: RotateCcw },
      { path: '/admin/compliance-rules', label: t('dash.menu.complianceRules', 'Regulatory Rules'), icon: ShieldCheck },
      { path: '/admin/compliance-monitoring', label: t('dash.menu.complianceMonitoring', 'Compliance Monitoring'), icon: Activity },
      { path: '/admin/users', label: t('dash.menu.userMgmt', 'User Accounts'), icon: Users },
      { path: '/admin/institutions', label: t('dash.menu.allInstitutions', 'All Institutions'), icon: Building2 },
      { path: '/admin/audit-logs', label: t('dash.menu.auditLogs', 'System Audit Trail'), icon: ScrollText },
      { path: '/admin/bank-monitoring', label: t('dash.menu.bankMonitoring', 'Bank Simulator Monitoring'), icon: Landmark },
      { path: '/admin/settings', label: t('dash.menu.adminSettings', 'Governance & Reset'), icon: Settings },
    ],
  };


  const currentNav = navConfigs[currentRole] || navConfigs.institution;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-150"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1F54] text-slate-300 flex flex-col border-r border-[#162E73] transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Dashboard Sidebar"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <Logo size="sm" light={true} showTagline={false} />
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Navigation Menu
          </div>

          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#174EA6] text-white shadow-sm border-l-4 border-l-[#E89B24]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-[#E89B24]" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Institutional Info Box for Institution Role */}
          {currentRole === 'institution' && currentInstitution && (
            <div className="mt-6 pt-4 border-t border-white/10 px-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#E89B24]">Active Institute</div>
                <div className="font-bold text-white line-clamp-1">{currentInstitution.name}</div>
                <div className="text-slate-400 font-mono text-[10px]">AISHE: {currentInstitution.aisheCode}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 bg-[#071438] space-y-1.5 shrink-0 text-xs">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-white/5 font-medium"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E89B24]" />
              <span>Public Portal</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold text-left transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
