export default function Card({
  children,
  className = '',
  hoverEffect = false,
  highlightTop = false,
  highlightColor = 'saffron',
  role,
  ariaLabel,
  onClick,
}) {
  const topBarColors = {
    saffron: 'border-t-4 border-t-[#E89B24]',
    blue: 'border-t-4 border-t-[#174EA6]',
    navy: 'border-t-4 border-t-[#0B1F54]',
    green: 'border-t-4 border-t-[#13805E]',
  };

  const hoverClasses = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-md hover:border-[#B5C7DF] transition-all duration-200'
    : '';

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`bg-white rounded-lg border border-[#D3DDEB] gov-shadow-sm p-6 ${highlightTop ? topBarColors[highlightColor] : ''} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
