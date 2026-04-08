import React, { useId } from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  helpText,
  className = '',
  as = 'input',
  children,
  ...props
}) => {
  const generatedId = useId();
  const inputId = name || generatedId;
  const Tag = as;
  const classes = `w-full rounded-2xl border border-[rgba(58,44,30,0.14)] bg-white/80 px-4 py-3 text-sm text-[#20150f] outline-none transition focus:border-[#c46a2f] focus:ring-4 focus:ring-[rgba(196,106,47,0.14)] disabled:cursor-not-allowed disabled:bg-[rgba(245,239,231,0.7)] ${error ? 'border-[#b83d3d] focus:border-[#b83d3d] focus:ring-[rgba(184,61,61,0.14)]' : ''} ${className}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[#3a2c1e]">
          {label}
          {required ? <span className="ml-1 text-[#b83d3d]">*</span> : null}
        </label>
      )}
      <Tag
        id={inputId}
        name={name}
        type={as === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={classes}
        {...props}
      >
        {children}
      </Tag>
      {error ? <p className="text-sm text-[#b83d3d]">{error}</p> : null}
      {!error && helpText ? <p className="text-sm text-[#6b5a4f]">{helpText}</p> : null}
    </div>
  );
};

export default Input;
