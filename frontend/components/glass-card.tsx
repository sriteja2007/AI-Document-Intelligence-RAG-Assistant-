import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "panel" | "glow";
  className?: string;
}

export function GlassCard({
  children,
  variant = "default",
  className = "",
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: "glass-card",
    panel: "glass-panel",
    glow: "glass-card hover:border-purple-500/30 transition-all hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.15)]",
  }[variant];

  return (
    <div
      className={`rounded-2xl p-6 relative overflow-hidden ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
