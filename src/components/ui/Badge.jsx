import React from "react";

export default function Badge({ children, variant = "gray", className = "" }) {
  const variants = {
    success: "bg-success-light text-green-800",
    danger: "bg-danger-light text-red-800",
    warning: "bg-warning-light text-amber-800",
    info: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const style = variants[variant] || variants.gray;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {children}
    </span>
  );
}
