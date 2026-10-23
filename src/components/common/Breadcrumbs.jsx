import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

export default function Breadcrumbs({ items = [] }) {
  const { t } = useLanguage();

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 bg-white border-b border-[#D3DDEB] text-xs">
      <div className="max-w-7xl mx-auto flex items-center flex-wrap gap-1.5 text-[#505F79]">
        <Link
          to="/"
          className="flex items-center gap-1 hover:text-[#174EA6] focus-visible:ring-1 focus-visible:ring-[#174EA6] rounded p-0.5"
        >
          <Home className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('nav.home', 'Home')}</span>
        </Link>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
              {isLast || !item.to ? (
                <span className="font-semibold text-[#0B1F54]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-[#174EA6] focus-visible:ring-1 focus-visible:ring-[#174EA6] rounded p-0.5"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
