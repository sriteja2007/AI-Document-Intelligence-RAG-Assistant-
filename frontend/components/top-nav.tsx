"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Triangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

export interface TopNavProps {
  variant?: "landing" | "app";
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function TopNav({ variant = "landing", user }: TopNavProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    email?: string;
    avatarUrl?: string;
  } | null>(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      return;
    }

    if (variant === "app") {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user: authUser } }) => {
        if (authUser) {
          const email = authUser.email ?? "";
          const name =
            (authUser.user_metadata?.full_name as string) ||
            (authUser.user_metadata?.name as string) ||
            email.split("@")[0] ||
            "User";
          setCurrentUser({ email, name });
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const email = session.user.email ?? "";
          const name =
            (session.user.user_metadata?.full_name as string) ||
            (session.user.user_metadata?.name as string) ||
            email.split("@")[0] ||
            "User";
          setCurrentUser({ email, name });
        } else {
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, variant]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ];

  const userEmail = currentUser?.email || "user@example.com";
  const userName = currentUser?.name || (currentUser?.email ? currentUser.email.split("@")[0] : "User");
  const userInitial = userEmail.length > 0 ? userEmail[0].toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav h-16 transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 dark:bg-white/10 border border-white/20 backdrop-blur-md text-white shadow-sm transition-transform group-hover:scale-105">
            <Triangle className="w-3.5 h-3.5 fill-white text-white rotate-90" />
          </span>
          <span className="font-semibold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-white">
            DocuMind
          </span>
        </Link>

        {/* Center: Navigation Links (Landing Variant) */}
        {variant === "landing" ? (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-semibold tracking-widest uppercase text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {variant === "landing" ? (
            <>
              {/* GitHub Link Button */}
              <a
                href="https://github.com/sriteja2007/AI-Document-Intelligence-RAG-Assistant-"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white backdrop-blur-md transition-colors"
                aria-label="GitHub Repository"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Get Started Button */}
              <Link href="/signup">
                <Button
                  size="sm"
                  className="rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm px-4 py-2 backdrop-blur-md transition-all shadow-sm"
                >
                  Get started
                </Button>
              </Link>

              {/* Mobile Menu Trigger */}
              <div className="md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-zinc-300"
                        aria-label="Open mobile navigation"
                      >
                        <Menu className="w-5 h-5" />
                      </Button>
                    }
                  />
                  <SheetContent
                    side="right"
                    className="glass-panel border-l border-white/10 text-white w-64 p-6"
                  >
                    <SheetTitle className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-6">
                      Menu
                    </SheetTitle>
                    <div className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="text-sm uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                        <Link
                          href="/signup"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs">
                            Get started
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <>
              {/* App Variant Right Side: Theme Toggle & Real User Avatar */}
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full ring-1 ring-white/10 p-0"
                      aria-label="Open user menu"
                    >
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage
                          src={currentUser?.avatarUrl}
                          alt={userName}
                        />
                        <AvatarFallback className="bg-purple-950/80 text-purple-200 text-xs font-semibold">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
                <DropdownMenuContent
                  className="glass-panel w-56 border-white/10 text-zinc-100"
                  align="end"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                          {userName}
                        </p>
                        <p className="text-xs leading-none text-zinc-400 truncate max-w-[200px]">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-xs cursor-pointer hover:bg-white/10">
                    <Link href="/dashboard" className="w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs cursor-pointer hover:bg-white/10">
                    <Link href="/chat/new" className="w-full">
                      New chat
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-xs text-rose-400 cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-400"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
