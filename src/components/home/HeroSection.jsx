import { useLanguage } from '../../i18n/useLanguage';
import Button from '../common/Button';
import HeroCarousel from './HeroCarousel';
import { ShieldCheck, ArrowRight, Building2, FileCheck2, BellRing } from 'lucide-react';

const capabilities = [
  { key: 'hero.capabilityVerification', icon: FileCheck2 },
  { key: 'hero.capabilityCompliance', icon: ShieldCheck },
  { key: 'hero.capabilityRenewals', icon: BellRing },
];

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <HeroCarousel>
      <div className="hero-content">
        <div className="hero-badge">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>{t('hero.badge')}</span>
        </div>
        <h1 id="home-hero-heading">{t('hero.heading')}</h1>
        <p className="hero-description">{t('hero.description')}</p>
        <div className="hero-actions">
          <Button to="/login" variant="primary" size="lg" icon={Building2}>
            {t('hero.primaryCta')}
          </Button>
          <Button to="/services" variant="outline" size="lg" icon={ArrowRight} iconPosition="right">
            {t('hero.secondaryCta')}
          </Button>
        </div>
        <ul className="hero-capabilities">
          {capabilities.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </HeroCarousel>
  );
}
