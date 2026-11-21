import React from "react";
import Link from "next/link";

interface FooterProps {
  className?: string;
  isFixed?: boolean;
}

export function Footer({ className = "", isFixed = false }: FooterProps) {
  const positionClass = isFixed
    ? "fixed bottom-0 left-0 right-0 z-40"
    : "relative w-full mt-auto";

  return (
    <footer
      className={`${positionClass} px-6 py-4 pointer-events-auto backdrop-blur-md border-t border-black/5 dark:border-white/5 bg-white/10 dark:bg-black/30 transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
        <div>
          &copy; 2026 DocuMind &bull; All Rights Reserved
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/support"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
