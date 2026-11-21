"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function GradientButton({
  children,
  icon,
  className = "",
  size = "default",
  ...props
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    default: "px-6 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  }[size];

  return (
    <button
      className={`relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-2xl group transition-transform active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${className}`}
      {...props}
    >
      {/* Animated Conic Gradient Border in Orange/Gold */}
      <span className="absolute inset-[-200%] animate-border-rotate bg-[conic-gradient(from_0deg,#ea580c_0%,#f59e0b_25%,#fbbf24_50%,#f97316_75%,#ea580c_100%)] opacity-85 group-hover:opacity-100 transition-opacity" />

      {/* Button Body / Glass Dark Inner Container */}
      <span
        className={`relative w-full h-full ${sizeClasses} rounded-[15px] bg-[#0d0a17]/90 hover:bg-[#150f24]/90 dark:bg-[#0d0a17]/90 dark:hover:bg-[#150f24]/90 text-zinc-100 font-medium flex items-center justify-center gap-2.5 transition-colors backdrop-blur-xl shadow-lg shadow-amber-950/20`}
      >
        <span>{children}</span>
        {icon ?? (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 group-hover:bg-amber-500/30 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </span>
    </button>
  );
}
