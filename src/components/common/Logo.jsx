import { Link } from 'react-router-dom';

const LOGO_SOURCES = {
  light: '/branding/NidhiSetu%20Banking%20Logo%20Light.png',
  dark: '/branding/NidhiSetu%20Banking%20Logo%20Dark.png',
};

export default function Logo({ size = 'default', variant = 'light' }) {
  const width = size === 'sm' ? 144 : 176;
  const src = LOGO_SOURCES[variant] ?? LOGO_SOURCES.light;

  return (
    <Link
      to="/"
      className="inline-flex shrink-0 items-center rounded-md p-1 -m-1 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#174EA6]"
      aria-label="NidhiSetu Home"
    >
      <span className="block max-w-full" style={{ width }}>
        <img
          src={src}
          alt="NidhiSetu"
          width="1774"
          height="887"
          className="block h-auto w-auto max-w-full object-contain"
        />
      </span>
    </Link>
  );
}
