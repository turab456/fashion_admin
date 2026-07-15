import React from "react";

export default function KpiCard({ title, value, icon: Icon, trend, subtitle, iconBgColor = "bg-accent-light", iconColor = "text-accent" }) {
  return (
    <div className="bg-white p-6 border border-border-custom rounded-lg shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[13px] font-medium text-text-secondary">{title}</h3>
          <div className="text-[26px] font-bold text-text-primary mt-1 leading-tight">{value}</div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {(trend || subtitle) && (
        <div className="flex items-center gap-2 mt-auto text-[13px]">
          {trend && (
            <span className={`font-medium ${trend > 0 ? "text-success" : trend < 0 ? "text-danger" : "text-text-secondary"}`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
          {subtitle && <span className="text-text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
