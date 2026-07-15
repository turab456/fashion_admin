import React from "react";

export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto border border-border-custom rounded-lg bg-white ${className}`}>
      <table className="w-full border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead><tr>{children}</tr></thead>;
}

export function TableHead({ children, className = "" }) {
  return (
    <th className={`bg-gray-50 border-b border-border-custom px-4 py-3 text-xs font-semibold text-text-secondary whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = "" }) {
  return (
    <tr className={`border-b border-border-custom hover:bg-gray-50 transition-colors last:border-b-0 ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-sm text-text-primary align-middle ${className}`}>
      {children}
    </td>
  );
}
