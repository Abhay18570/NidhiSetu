import { Link } from 'react-router-dom';

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-[#0B1F54] hover:bg-[#071438] text-white border border-[#0B1F54] focus-visible:ring-[#0B1F54] shadow-sm',
    royal:
      'bg-[#174EA6] hover:bg-[#0F397F] text-white border border-[#174EA6] focus-visible:ring-[#174EA6] shadow-sm',
    saffron:
      'bg-[#E89B24] hover:bg-[#C67C11] text-white border border-[#E89B24] focus-visible:ring-[#E89B24] shadow-sm',
    success:
      'bg-[#13805E] hover:bg-[#0D5B43] text-white border border-[#13805E] focus-visible:ring-[#13805E] shadow-sm',
    outline:
      'bg-transparent hover:bg-[#174EA6]/5 text-[#174EA6] border border-[#174EA6] focus-visible:ring-[#174EA6]',
    secondary:
      'bg-white hover:bg-slate-50 text-[#0B1F54] border border-[#D3DDEB] focus-visible:ring-[#0B1F54] shadow-sm',
    ghost:
      'bg-transparent hover:bg-slate-100 text-[#0B1F54] border border-transparent focus-visible:ring-[#0B1F54]',
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`;

  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
}
