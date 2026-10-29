import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { Globe, Eye, PhoneCall, Check } from 'lucide-react';
import { SITE_CONFIG } from '../../config/site';

export default function UtilityBar() {
  const {
    language,
    setLanguage,
    languages,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    highContrast,
    toggleHighContrast,
    t,
  } = useLanguage();

  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const a11yRef = useRef(null);

  // Close accessibility dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (a11yRef.current && !a11yRef.current.contains(event.target)) {
        setIsA11yOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-[#0B1F54] text-white text-xs select-none">
      {/* Subtle National Tricolor Top Stripe */}
      <div className="gov-tricolor-stripe" aria-hidden="true" />

      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        {t('util.skipToMain', 'Skip to Main Content')}
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Prototype & Government-Style Advisory Tag */}
        <div className="flex items-center gap-2 text-slate-200">
          <span className="inline-block px-1.5 py-0.5 text-[0.625rem] uppercase font-bold tracking-wider bg-[#E89B24] text-[#0B1F54] rounded">
            Prototype
          </span>
          <span className="hidden sm:inline font-medium text-slate-300">
            {t('util.prototypeLabel', 'Institutional & Regulatory Prototype System')}
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="text-[0.6875rem] text-slate-300 font-normal">
            {t('util.notOfficial', 'Not an Official Govt Domain')}
          </span>
        </div>

        {/* Right Controls: A11y, Text Size, Language Selector, Helpline */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Help & Toll-Free Phone */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-300 hover:text-white">
            <PhoneCall className="w-3.5 h-3.5 text-[#E89B24]" aria-hidden="true" />
            <span className="text-[0.6875rem] font-mono">{SITE_CONFIG.tollFree}</span>
          </div>

          {/* Text Size Adjustment Controls (A-, A, A+) */}
          <div
            className="flex items-center border border-white/20 rounded overflow-hidden bg-white/5"
            role="group"
            aria-label={t('util.textSize', 'Text Size')}
          >
            <button
              type="button"
              onClick={decreaseFontSize}
              aria-label="Decrease font size"
              title="Decrease font size (A-)"
              className={`px-2 py-0.5 text-xs font-semibold hover:bg-white/20 transition-colors ${fontSize === 'sm' ? 'bg-[#174EA6] text-white' : 'text-slate-300'}`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={resetFontSize}
              aria-label="Normal font size"
              title="Reset font size (A)"
              className={`px-2 py-0.5 text-xs font-semibold border-x border-white/20 hover:bg-white/20 transition-colors ${fontSize === 'normal' ? 'bg-[#174EA6] text-white' : 'text-slate-300'}`}
            >
              A
            </button>
            <button
              type="button"
              onClick={increaseFontSize}
              aria-label="Increase font size"
              title="Increase font size (A+)"
              className={`px-2 py-0.5 text-xs font-semibold hover:bg-white/20 transition-colors ${fontSize === 'lg' ? 'bg-[#174EA6] text-white' : 'text-slate-300'}`}
            >
              A+
            </button>
          </div>

          {/* Accessibility Options Menu */}
          <div className="relative" ref={a11yRef}>
            <button
              type="button"
              onClick={() => setIsA11yOpen(!isA11yOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-slate-200 hover:text-white transition-colors"
              aria-expanded={isA11yOpen}
              aria-haspopup="true"
              aria-label={t('util.accessibility', 'Accessibility Options')}
            >
              <Eye className="w-3.5 h-3.5 text-[#E89B24]" aria-hidden="true" />
              <span className="hidden sm:inline text-xs">{t('util.accessibility', 'Accessibility')}</span>
            </button>

            {isA11yOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white text-[#0B1F54] rounded-md shadow-lg border border-[#D3DDEB] py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-3 py-1 font-semibold text-slate-500 border-b border-slate-100">
                  {t('util.accessibility', 'Accessibility Controls')}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    toggleHighContrast();
                    setIsA11yOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                  role="menuitem"
                >
                  <span className="font-medium">
                    {highContrast ? t('util.normalContrast', 'Normal Contrast') : t('util.highContrast', 'High Contrast')}
                  </span>
                  {highContrast && <Check className="w-4 h-4 text-[#13805E]" />}
                </button>

                <div className="px-3 py-2 text-[0.6875rem] text-[#505F79] bg-slate-50 border-t border-slate-100">
                  <span>{t('util.screenReader', 'Screen Reader Access Compliant')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Multilingual Selector: English | Hindi | Marathi */}
          <div className="flex items-center gap-1 border-l border-white/20 pl-3">
            <Globe className="w-3.5 h-3.5 text-[#E89B24]" aria-hidden="true" />
            <label htmlFor="language-select" className="sr-only">
              Select Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#0B1F54] text-white text-xs border border-white/20 rounded px-1.5 py-0.5 cursor-pointer hover:border-white/40 focus:outline-none focus:ring-1 focus:ring-[#E89B24]"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#0B1F54] text-white">
                  {l.native} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
