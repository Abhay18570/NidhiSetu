import { Menu, Globe, Shield } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../i18n/useLanguage';
import NotificationMenu from './NotificationMenu';
import UserMenu from './UserMenu';

export default function DashboardHeader({ onToggleSidebar }) {
  const { currentRole, currentInstitution } = useAuth();
  const { language, setLanguage, languages } = useLanguage();

  const roleHeaders = {
    institution: {
      tag: 'INSTITUTION WORKSPACE',
      sub: currentInstitution ? `${currentInstitution.name} (${currentInstitution.aisheCode})` : 'Affiliated Technical Institution',
      color: 'bg-[#174EA6]/10 text-[#174EA6] border-[#174EA6]/20',
    },
    officer: {
      tag: 'REGULATORY SCRUTINY WORKSPACE',
      sub: 'AICTE Western Regional Bureau — Officer Scrutiny Console',
      color: 'bg-[#E89B24]/15 text-[#C67C11] border-[#E89B24]/30',
    },
    admin: {
      tag: 'PLATFORM ADMINISTRATION',
      sub: 'NidhiSetu System Governance & Audit Control Center',
      color: 'bg-[#0B1F54]/10 text-[#0B1F54] border-[#0B1F54]/20',
    },
  };

  const headerInfo = roleHeaders[currentRole] || roleHeaders.institution;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#D3DDEB] gov-shadow-sm">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Role Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            aria-label="Toggle Dashboard Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${headerInfo.color}`}>
                {headerInfo.tag}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                <Shield className="w-3 h-3 text-[#E89B24]" />
                <span>SIH Demo Prototype</span>
              </span>
            </div>
            <span className="text-xs font-bold text-[#0B1F54] line-clamp-1 mt-0.5">
              {headerInfo.sub}
            </span>
          </div>
        </div>

        {/* Right: Language switch + Notifications + UserMenu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Language Dropdown */}
          <div className="flex items-center gap-1 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-[#174EA6]" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-[#0B1F54] font-semibold cursor-pointer focus:outline-none"
              aria-label="Switch Language in Dashboard"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>

          <NotificationMenu />
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
