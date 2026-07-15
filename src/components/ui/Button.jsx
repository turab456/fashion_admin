import React from "react";

export default function Button({
  children,
  variant = "primary", // primary, secondary, danger, ghost
  size = "md", // sm, md, lg
  className = "",
  disabled = false,
  loading = false,
  icon: Icon,
  type = "button",
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none rounded";
  
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover border border-accent hover:border-accent-hover",
    secondary: "bg-white text-text-primary border border-border-custom hover:bg-page hover:border-border-color-hover",
    danger: "bg-danger text-white hover:bg-red-700 border border-danger hover:border-red-700",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-gray-100 border border-transparent",
    outline: "bg-transparent text-text-primary border border-border-custom hover:bg-gray-50",
    success: "bg-success text-white hover:bg-emerald-700 border border-success hover:border-emerald-700",
    "success-outline": "bg-transparent text-success border border-success hover:bg-success hover:text-white",
    "danger-outline": "bg-transparent text-danger border border-danger hover:bg-danger hover:text-white",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-3 gap-2",
  };

  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;
  const disabledStyles = (disabled || loading) ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
          {children}
        </>
      )}
    </button>
  );
}
