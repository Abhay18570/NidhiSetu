import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import WhyNidhiSetuSection from '../components/home/WhyNidhiSetuSection';
import PortalsSection from '../components/home/PortalsSection';
import FaqSection from '../components/home/FaqSection';

export default function HomePage() {
  return (
    <>
      {/* Section 3: Hero */}
      <HeroSection />

      {/* Section 4: Portal Services */}
      <ServicesSection />

      {/* Section 5: How NidhiSetu Works */}
      <HowItWorksSection />

      {/* Section 6: Why NidhiSetu? */}
      <WhyNidhiSetuSection />

      {/* Section 7: User Portals */}
      <PortalsSection />

      {/* Section 8: FAQ & Help */}
      <FaqSection limit={6} showSearch={true} showViewAll={true} />
    </>
  );
}
