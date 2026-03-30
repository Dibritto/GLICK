import * as React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, icon, id, children, ...props }, ref) => {
    const selectId = id || React.useId();
    const errorId = `${selectId}-error`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={selectId}
            className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"
          >
            {icon} {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`w-full appearance-none rounded-lg bg-brand-graphite border border-brand-lead px-4 py-2.5 text-sm text-white focus:border-brand-blue/50 focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-all cursor-pointer ${
              error ? "border-brand-red" : ""
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p id={errorId} className="text-xs text-brand-red" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
