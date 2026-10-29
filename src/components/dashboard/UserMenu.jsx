import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../i18n/useLanguage';
import { User, LogOut, Shield, Settings, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { currentUser, currentRole, logout } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const roleLabels = {
    institution: 'Educational Institution',
    officer: 'AICTE Scrutiny Officer',
    admin: 'System Administrator',
  };

  const profilePath =
    currentRole === 'institution'
      ? '/institution/profile'
      : currentRole === 'officer'
      ? '/officer/activity'
      : '/admin/settings';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#174EA6]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User Account Menu"
      >
        <div className="w-8 h-8 rounded-full bg-[#0B1F54] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-[#0B1F54] line-clamp-1 max-w-[8.75rem]">
            {currentUser.name}
          </span>
          <span className="text-[0.625rem] text-[#505F79] font-medium line-clamp-1">
            {roleLabels[currentRole] || currentRole}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-[#D3DDEB] py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-4 py-2.5 border-b border-slate-100">
            <div className="font-bold text-[#0B1F54] text-sm">{currentUser.name}</div>
            <div className="text-[0.6875rem] text-slate-500 font-mono truncate">{currentUser.email}</div>
            <div className="inline-block mt-1 px-1.5 py-0.5 rounded text-[0.625rem] uppercase font-bold tracking-wider bg-[#0B1F54]/10 text-[#0B1F54]">
              {roleLabels[currentRole] || currentRole}
            </div>
          </div>

          <div className="py-1">
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[#0B1F54] hover:bg-slate-50"
              role="menuitem"
            >
              <User className="w-4 h-4 text-[#174EA6]" />
              <span>{t('dash.profile', 'Account Profile')}</span>
            </Link>

            <Link
              to={currentRole === 'institution' ? '/institution/settings' : '/admin/settings'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[#0B1F54] hover:bg-slate-50"
              role="menuitem"
            >
              <Settings className="w-4 h-4 text-[#174EA6]" />
              <span>{t('dash.settings', 'Preferences & Security')}</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-red-600 hover:bg-red-50 font-semibold"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>{t('dash.logout', 'Sign Out of Portal')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
