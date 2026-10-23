export default function SectionHeading({
  badge,
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const isCenter = align === 'center';

  return (
    <div className={`mb-10 sm:mb-12 ${isCenter ? 'text-center max-w-3xl mx-auto' : 'text-left max-w-3xl'} ${className}`}>
      {badge && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0B1F54]/10 text-[#0B1F54] mb-3`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E89B24]" aria-hidden="true" />
          <span>{badge}</span>
        </div>
      )}

      <h2 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold text-[#0B1F54] tracking-tight leading-tight">
        {title}
      </h2>

      {/* Government styling accent bar */}
      <div className={`h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4 ${isCenter ? 'mx-auto' : ''}`} aria-hidden="true" />

      {subtitle && (
        <p className="text-base text-[#505F79] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
