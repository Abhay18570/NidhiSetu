import { useEffect, useRef, useState } from 'react';
import { preload } from 'react-dom';
import { Pause, Play } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import campusImage from '../../assets/hero/institutional-security.webp';
import verificationImage from '../../assets/hero/fdr-verification.webp';
import bankingImage from '../../assets/hero/banking-assurance.webp';
import './HeroCarousel.css';

const slides = [
  { src: campusImage, label: 'hero.slideCampus' },
  { src: verificationImage, label: 'hero.slideVerification' },
  { src: bankingImage, label: 'hero.slideBanking' },
];
const ROTATION_MS = 3000;
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function HeroCarousel({ children }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(MOTION_QUERY).matches);
  const [ready, setReady] = useState(() => slides.map(() => false));
  const [navigationVersion, setNavigationVersion] = useState(0);
  const pendingSlide = useRef(null);
  const pointerFocus = useRef(false);

  // React hoists this resource hint into <head>; it is only requested on the homepage.
  preload(campusImage, { as: 'image', fetchPriority: 'high' });

  useEffect(() => {
    const media = window.matchMedia(MOTION_QUERY);
    const onChange = (event) => setReducedMotion(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (hovered || focused || paused || reducedMotion) return;
    const interval = window.setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      // Keep the current photograph visible on slow connections.
      if (ready[next]) setActiveIndex(next);
    }, ROTATION_MS);
    return () => window.clearInterval(interval);
  }, [activeIndex, hovered, focused, paused, reducedMotion, ready, navigationVersion]);

  function selectSlide(index) {
    pendingSlide.current = ready[index] ? null : index;
    if (ready[index]) setActiveIndex(index);
    // Also restart when the currently selected indicator is clicked.
    setNavigationVersion((version) => version + 1);
  }

  function onImageLoad(index) {
    setReady((previous) => previous[index]
      ? previous
      : previous.map((loaded, i) => loaded || i === index));
    if (pendingSlide.current === index) {
      pendingSlide.current = null;
      setActiveIndex(index);
    }
  }

  return (
    <section
      className="home-hero"
      aria-labelledby="home-hero-heading"
      aria-roledescription={t('hero.carouselRole')}
      onMouseEnter={() => {
        if (window.matchMedia('(hover: hover)').matches) setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="hero-backgrounds" aria-hidden="true">
        {slides.map((slide, index) => (
          <img
            key={slide.src}
            className="hero-background"
            data-active={index === activeIndex}
            src={slide.src}
            alt=""
            width="1920"
            height="1080"
            // Once the first image is ready, fetch the hidden slides explicitly.
            // Some browsers defer lazy images with zero opacity indefinitely.
            loading={index === 0 || ready[0] ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
            onLoad={() => onImageLoad(index)}
          />
        ))}
      </div>
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-container">{children}</div>
      <div
        className="hero-controls"
        role="group"
        aria-label={t('hero.carouselControls')}
        onPointerDownCapture={() => {
          pointerFocus.current = true;
          setFocused(false);
        }}
        onKeyDownCapture={() => {
          pointerFocus.current = false;
          setFocused(true);
        }}
        onFocusCapture={() => setFocused(!pointerFocus.current)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            pointerFocus.current = false;
            setFocused(false);
          }
        }}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.label}
            type="button"
            className="hero-pagination"
            aria-label={t(slide.label)}
            aria-pressed={index === activeIndex}
            onClick={() => selectSlide(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
        {!reducedMotion && (
          <button
            type="button"
            className="hero-playback"
            aria-label={t(paused ? 'hero.resume' : 'hero.pause')}
            onClick={() => setPaused((previous) => !previous)}
          >
            {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
