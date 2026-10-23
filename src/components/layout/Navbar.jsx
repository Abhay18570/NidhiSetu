import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { SITE_CONFIG } from '../../config/site';
import Logo from '../common/Logo';
import Button from '../common/Button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const closeMenu = () => setMobileMenuOpen(false);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#D3DDEB] gov-shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Main Logo & Title */}
          <div className="flex-shrink-0 py-2">
            <Logo />
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {SITE_CONFIG.navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#174EA6] bg-[#E8F0FE] font-semibold border-b-2 border-[#174EA6]'
                      : 'text-[#0B1F54] hover:text-[#174EA6] hover:bg-slate-50'
                  }`
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Action CTAs: Login & Register */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button
              to="/login"
              variant="outline"
              size="sm"
              icon={LogIn}
              className="text-xs font-semibold"
            >
              {t('nav.login', 'Portal Login')}
            </Button>
            <Button
              to="/register"
              variant="primary"
              size="sm"
              icon={UserPlus}
              className="text-xs font-semibold"
            >
              {t('nav.register', 'Register')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#0B1F54] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('nav.closeMenu', 'Close Menu') : t('nav.openMenu', 'Open Menu')}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-[#D3DDEB] bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150"
          id="mobile-menu"
        >
          <div className="flex flex-col space-y-1">
            {SITE_CONFIG.navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-base font-medium flex items-center justify-between ${
                    isActive
                      ? 'text-[#174EA6] bg-[#E8F0FE] font-bold border-l-4 border-[#174EA6]'
                      : 'text-[#0B1F54] hover:bg-slate-50'
                  }`
                }
              >
                <span>{t(link.labelKey)}</span>
              </NavLink>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
            <Button
              to="/login"
              onClick={closeMenu}
              variant="outline"
              size="md"
              icon={LogIn}
              className="w-full text-center"
            >
              {t('nav.login', 'Login')}
            </Button>
            <Button
              to="/register"
              onClick={closeMenu}
              variant="primary"
              size="md"
              icon={UserPlus}
              className="w-full text-center"
            >
              {t('nav.register', 'Register')}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
