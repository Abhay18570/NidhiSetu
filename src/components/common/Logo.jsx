import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/useLanguage';

export default function Logo({ size = 'default', showTagline = true, light = false }) {
  const { t } = useLanguage();

  const isSmall = size === 'sm';

  return (
    <Link
      to="/"
      className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-[#174EA6] rounded-md p-1 -m-1 transition-opacity hover:opacity-95"
      aria-label="NidhiSetu Home"
    >
      {/* Insignia / Seal Graphic */}
      <div className={`relative flex items-center justify-center shrink-0 ${isSmall ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg ${light ? 'bg-white/10 ring-1 ring-white/20' : 'bg-[#0B1F54] shadow-sm'}`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isSmall ? 'w-7 h-7' : 'w-8 h-8'}
          aria-hidden="true"
        >
          {/* Bridge Arch Base */}
          <path
            d="M8 46 C 18 31, 46 31, 56 46"
            stroke="#E89B24"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Bridge Suspension Pillars */}
          <path
            d="M14 46 L14 50 M26 40 L26 50 M38 40 L38 50 M50 46 L50 50"
            stroke="#E89B24"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line x1="8" y1="50" x2="56" y2="50" stroke="#174EA6" strokeWidth="3" strokeLinecap="round" />
          
          {/* Central Security Shield */}
          <path
            d="M32 12 L46 19 V29 C46 38 32 44 32 44 C32 44 18 38 18 29 V19 Z"
            fill={light ? "#174EA6" : "#0B1F54"}
            stroke={light ? "#FFFFFF" : "#E89B24"}
            strokeWidth="2.5"
          />
          {/* Verification Checkmark */}
          <path
            d="M25 28 L29 32 L39 22"
            stroke="#13805E"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text Branding */}
      <div className="min-w-0 flex flex-col text-left">
        <div className="flex items-baseline gap-2">
          <span className={`font-extrabold tracking-tight ${isSmall ? 'text-lg' : 'text-xl'} ${light ? 'text-white' : 'text-[#0B1F54]'}`}>
            NidhiSetu
          </span>
          <span className={`font-semibold text-xs px-1.5 py-0.5 rounded ${light ? 'bg-white/15 text-amber-300' : 'bg-[#E89B24]/15 text-[#C67C11]'}`}>
            निधिसेतु
          </span>
        </div>
        {showTagline && (
          <span className={`text-[11px] font-medium leading-tight line-clamp-1 ${light ? 'text-slate-200' : 'text-[#505F79]'}`}>
            {t('nav.tagline', 'AI-Powered Security Deposit & FDR Management Platform')}
          </span>
        )}
      </div>
    </Link>
  );
}
