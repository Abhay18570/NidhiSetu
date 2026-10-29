export default function Badge({
  children,
  variant = 'blue',
  size = 'md',
  className = '',
  icon: Icon
}) {
  const sizeClasses = {
    sm: 'text-[0.6875rem] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const variantClasses = {
    navy: 'bg-[#0B1F54]/10 text-[#0B1F54] border border-[#0B1F54]/20',
    blue: 'bg-[#E8F0FE] text-[#174EA6] border border-[#174EA6]/20 font-medium',
    saffron: 'bg-[#FEF7EC] text-[#C67C11] border border-[#E89B24]/30 font-semibold',
    green: 'bg-[#E6F4EA] text-[#13805E] border border-[#13805E]/20 font-medium',
    gray: 'bg-slate-100 text-[#505F79] border border-slate-200',
    outline: 'bg-transparent text-[#174EA6] border border-[#174EA6]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full leading-none tracking-normal ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.blue} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
