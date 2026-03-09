"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface StandardSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const StandardSelect = forwardRef<HTMLSelectElement, StandardSelectProps>(
  ({ label, error, className = "", containerClassName = "", children, ...props }, ref) => {
    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            className={`
              w-full appearance-none px-4 py-3 
              bg-muted border border-border/50 rounded-xl 
              text-sm text-foreground 
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              [&_option]:bg-background [&_option]:text-foreground
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground/50 transition-colors group-focus-within:text-primary">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-red-500 text-[10px] font-medium ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

StandardSelect.displayName = "StandardSelect";
