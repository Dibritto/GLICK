import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"
          >
            {icon} {label}
          </label>
        )}
        <div className="relative">
          {icon && !label && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-lg bg-brand-graphite border border-brand-lead px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-all ${
              error ? "border-brand-red" : ""
            } ${icon && !label ? "pl-10" : ""} ${className}`}
            {...props}
          />
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

Input.displayName = "Input";
