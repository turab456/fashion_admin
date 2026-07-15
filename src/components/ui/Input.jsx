import React, { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = "text",
  className = "",
  wrapperClassName = "",
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col ${wrapperClassName}`}>
      {label && <label className="block text-[13px] font-medium text-text-primary mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full bg-white border rounded px-3 py-2 text-sm text-text-primary font-sans transition-all focus:outline-none
            ${error ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20" : "border-border-custom focus:border-accent focus:ring-2 focus:ring-accent/20"}
            ${Icon ? "pl-9" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-danger mt-1.5">{error}</span>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
