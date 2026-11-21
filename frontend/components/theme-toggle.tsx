"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md ${className || ""}`}
        aria-label="Toggle theme placeholder"
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white backdrop-blur-md transition-colors ${className || ""}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform text-amber-400 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform text-purple-400" />
      )}
    </Button>
  );
}
