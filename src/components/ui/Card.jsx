import React from "react";

export default function Card({ children, className = "", title, action }) {
  return (
    <div className={`bg-white border border-border-custom rounded-lg shadow-sm ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-border-custom flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
