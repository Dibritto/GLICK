import * as React from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-brand-blue text-brand-graphite hover:bg-brand-blue/90 shadow-[0_0_15px_rgba(44,199,255,0.3)]",
      secondary: "bg-brand-lead text-white hover:bg-brand-lead/80",
      outline: "border border-brand-lead bg-transparent text-white hover:bg-brand-lead/20",
      ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-brand-lead/20",
      danger: "bg-brand-red text-white hover:bg-brand-red/90 shadow-[0_0_15px_rgba(255,59,48,0.2)]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "p-2",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
