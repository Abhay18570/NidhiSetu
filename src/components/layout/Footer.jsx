import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/useLanguage';
import { SITE_CONFIG } from '../../config/site';
import Logo from '../common/Logo';
import { Shield, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B1F54] text-slate-300 border-t-4 border-t-[#E89B24] mt-auto">
      {/* Upper Footer: 4 Grid Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Logo size="default" light={true} showTagline={false} />
            
            <p className="text-xs leading-relaxed text-slate-300">
              {t('footer.brandDesc')}
            </p>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/10 text-white text-xs border border-white/15">
                <Shield className="w-4 h-4 text-[#E89B24]" aria-hidden="true" />
                <span className="font-medium">AI-Verified Institutional Deposits</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/20 pb-2">
              {t('footer.quickLinks', 'Quick Navigation')}
            </h3>
            <ul className="space-y-2 text-xs">
              {SITE_CONFIG.navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-1.5 hover:text-white hover:underline transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-[#E89B24]" aria-hidden="true" />
                    <span>{t(link.labelKey)}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 hover:text-white hover:underline transition-colors"
                >
                  <ArrowRight className="w-3 h-3 text-[#E89B24]" aria-hidden="true" />
                  <span>{t('nav.login', 'Portal Login')}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 hover:text-white hover:underline transition-colors"
                >
                  <ArrowRight className="w-3 h-3 text-[#E89B24]" aria-hidden="true" />
                  <span>{t('nav.register', 'Institution Registration')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portal Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/20 pb-2">
              {t('footer.services', 'Portal Services')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/services" className="hover:text-white hover:underline transition-colors">
                  {t('services.s1.title', 'FDR Submission & Ingestion')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white hover:underline transition-colors">
                  {t('services.s2.title', 'Bank Branch Verification')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white hover:underline transition-colors">
                  {t('services.s3.title', 'Regulatory Compliance Scoring')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white hover:underline transition-colors">
                  {t('services.s4.title', 'Maturity & Renewal Alerts')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white hover:underline transition-colors">
                  {t('services.s5.title', 'Application Status Tracker (ARN)')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white hover:underline transition-colors">
                  {t('services.s6.title', 'Administrative & Audit Ledgers')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Helpdesk & Grievance */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/20 pb-2">
              {t('footer.help', 'Help & Coordination')}
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="text-white font-semibold">Toll-Free National Helpline</div>
                  <div className="font-mono text-slate-200">{SITE_CONFIG.tollFree}</div>
                  <div className="text-[11px] text-slate-400">{SITE_CONFIG.hours}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="text-white font-semibold">Technical Support</div>
                  <div className="font-mono text-[11px] text-slate-300">nidhisetu-support@demo.in</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-[11px] text-slate-300 leading-snug">
                  {SITE_CONFIG.officeAddress}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prototype Warning Banner */}
        <div className="mt-8 pt-6 border-t border-white/10 text-xs bg-black/20 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#E89B24] text-[#0B1F54] shrink-0 mt-0.5">
              Disclaimer
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </div>

      {/* Lower Footer: Compliance Links & Copyright */}
      <div className="bg-[#071438] border-t border-white/10 text-[11px] py-4 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>© 2026 NidhiSetu. {t('footer.rights')}</span>
          </div>

          <div className="flex items-center flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              {t('footer.terms', 'Terms of Use')}
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/accessibility" className="hover:text-white transition-colors">
              {t('footer.accessibility', 'Accessibility Statement')}
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              {t('footer.contact', 'Grievance Redressal')}
            </Link>
          </div>

          <div className="text-slate-400">
            {t('footer.lastUpdated')}
          </div>
        </div>
      </div>
    </footer>
  );
}
