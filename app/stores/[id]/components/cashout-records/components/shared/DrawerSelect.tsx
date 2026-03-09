"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { useDrawers } from "../../hooks/useDrawers";

interface DrawerSelectProps {
  storeId?: string;
  // We expect the drawer ID to be passed
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const DrawerSelect: React.FC<DrawerSelectProps> = ({
  storeId,
  value,
  onChange,
  error,
  disabled,
}) => {
  const { drawers, isLoading } = useDrawers(storeId);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the selected drawer name
  const selectedDrawer = drawers.find((d) => d.id === value);
  const displayValue = selectedDrawer ? selectedDrawer.category : "";

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        Withdraw From
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`w-full flex items-center justify-between bg-card border rounded-xl px-4 py-3 text-left shadow-sm hover:border-primary/50 transition-colors ${
          error ? "border-red-500" : "border-border"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <span className={displayValue ? "text-foreground font-medium" : "text-muted-foreground"}>
          {isLoading ? "Loading drawers..." : displayValue || "Select a drawer..."}
        </span>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        ) : (
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
          {drawers.length > 0 ? (
            drawers.map((drawer) => (
              <button
                key={drawer.id}
                type="button"
                onClick={() => handleSelect(drawer.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors ${
                  value === drawer.id ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <span className="font-medium">{drawer.category}</span>
                {value === drawer.id && <Check className="w-4 h-4" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No drawers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { DrawerSelect };
