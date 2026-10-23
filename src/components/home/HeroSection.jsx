import { useLanguage } from '../../i18n/useLanguage';
import Button from '../common/Button';
import HeroIllustration from './HeroIllustration';
import { ShieldCheck, ArrowRight, Building2, FileCheck2, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F7FB] via-white to-[#F5F7FB] pt-8 pb-16 lg:pt-14 lg:pb-20 border-b border-[#D3DDEB]">
      {/* Decorative top ambient glow (very subtle, clean government portal tone) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-gradient-to-r from-[#174EA6]/5 via-[#E89B24]/5 to-[#13805E]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Government-style category badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#0B1F54]/10 text-[#0B1F54] border border-[#0B1F54]/15">
              <Sparkles className="w-3.5 h-3.5 text-[#E89B24]" aria-hidden="true" />
              <span>{t('hero.badge')}</span>
            </div>

            {/* Main Page H1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1F54] tracking-tight leading-[1.15]">
              {t('hero.heading')}
            </h1>

            {/* Sub-text description */}
            <p className="text-base sm:text-lg text-[#505F79] leading-relaxed max-w-2xl font-normal">
              {t('hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                to="/login"
                variant="primary"
                size="lg"
                icon={Building2}
                className="font-bold shadow-md hover:shadow-lg transition-shadow"
              >
                {t('hero.primaryCta', 'Institution Login')}
              </Button>
              <Button
                to="/services"
                variant="outline"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="font-semibold"
              >
                {t('hero.secondaryCta', 'Explore Services')}
              </Button>
            </div>

            {/* Official Trust Indicators / Highlights */}
            <div className="pt-6 border-t border-[#D3DDEB]/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E8F0FE] text-[#174EA6] shrink-0">
                  <Building2 className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1F54]">12,400+</div>
                  <div className="text-[11px] text-[#505F79]">Institutions Tracked</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#FEF7EC] text-[#E89B24] shrink-0">
                  <FileCheck2 className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1F54]">₹4,850 Cr+</div>
                  <div className="text-[11px] text-[#505F79]">Guaranteed Deposits</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E6F4EA] text-[#13805E] shrink-0">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1F54]">99.8%</div>
                  <div className="text-[11px] text-[#505F79]">Automated Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
