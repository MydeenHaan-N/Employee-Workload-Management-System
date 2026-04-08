import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#f5efe7] disabled:cursor-not-allowed disabled:opacity-60';

  const variantClasses = {
    primary: 'border-[#c46a2f] bg-[#c46a2f] text-white shadow-[0_12px_30px_rgba(196,106,47,0.25)] hover:bg-[#ad5922] focus:ring-[#c46a2f]',
    secondary: 'border-[#2f6b5f] bg-[#2f6b5f] text-white shadow-[0_12px_30px_rgba(47,107,95,0.22)] hover:bg-[#25564d] focus:ring-[#2f6b5f]',
    outline: 'border-[rgba(58,44,30,0.14)] bg-white/70 text-[#2b2018] hover:bg-white focus:ring-[#c46a2f]',
    ghost: 'border-transparent bg-transparent text-[#6b5a4f] hover:bg-white/60 focus:ring-[#c46a2f]',
    danger: 'border-[#b83d3d] bg-[#b83d3d] text-white shadow-[0_12px_28px_rgba(184,61,61,0.2)] hover:bg-[#9c3232] focus:ring-[#b83d3d]',
  };

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-4.5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  );
};

export default Button;
