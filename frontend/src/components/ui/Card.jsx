import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  action,
  noPadding = false,
  className = '',
  contentClassName = '',
  ...props
}) => (
  <section
    className={`rounded-[28px] border border-[rgba(58,44,30,0.12)] bg-[rgba(255,255,255,0.78)] shadow-[0_16px_44px_rgba(89,66,44,0.08)] backdrop-blur ${className}`}
    {...props}
  >
    {(title || subtitle || action) && (
      <div className="flex flex-col gap-4 border-b border-[rgba(58,44,30,0.08)] px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold text-[#20150f]">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm leading-6 text-[#6b5a4f]">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-6'} ${contentClassName}`}>{children}</div>
  </section>
);

export default Card;
