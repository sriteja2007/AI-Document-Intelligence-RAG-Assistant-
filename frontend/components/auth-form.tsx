"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Triangle, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address (e.g. name@company.com)";
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = "Please enter your password";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    if (!validate()) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          const rawMsg = error.message.toLowerCase();
          if (
            rawMsg.includes("invalid login credentials") ||
            rawMsg.includes("invalid_grant") ||
            error.status === 400
          ) {
            setServerError("Wrong email or password. Please check your credentials and try again.");
          } else if (rawMsg.includes("email not confirmed")) {
            setServerError("Please verify your email address before logging in.");
          } else {
            setServerError(error.message);
          }
          setIsLoading(false);
          return;
        }

        if (data.user) {
          toast.success("Signed in successfully!");
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          const rawMsg = error.message.toLowerCase();
          if (
            rawMsg.includes("user already registered") ||
            rawMsg.includes("already registered") ||
            rawMsg.includes("already exists")
          ) {
            setServerError("This email is already registered. Please log in instead.");
          } else if (rawMsg.includes("password should be at least")) {
            setServerError("Password must be at least 8 characters long.");
          } else {
            setServerError(error.message);
          }
          setIsLoading(false);
          return;
        }

        if (data.session) {
          // Immediately signed in (if email confirmation is not required)
          toast.success("Account created successfully!");
          router.push("/dashboard");
          router.refresh();
        } else if (data.user) {
          // Supabase project requires email confirmation
          setServerSuccess(
            "Account created! Please check your email to verify your account, then log in."
          );
          setIsLoading(false);
        }
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setServerError(errMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    toast.info("Google login coming soon");
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 z-10">
      <GlassCard
        variant="glow"
        className="p-8 sm:p-10 border border-zinc-200 dark:border-white/15 bg-white/90 dark:bg-black/60 shadow-2xl backdrop-blur-2xl rounded-3xl space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group focus:outline-none mb-1"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-300 dark:border-white/20 backdrop-blur-md text-zinc-900 dark:text-white shadow-sm transition-transform group-hover:scale-105">
              <Triangle className="w-4 h-4 fill-current rotate-90" />
            </span>
            <span className="font-bold text-xl tracking-tight text-zinc-950 dark:text-white">
              DocuMind
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            {isLogin
              ? "Sign in to access your grounded document intelligence"
              : "Start asking questions grounded in your documents"}
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Server Success Alert */}
        {serverSuccess && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{serverSuccess}</span>
          </div>
        )}

        {/* Visual-only "Continue with Google" Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-white/15 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-white font-medium text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none backdrop-blur-md shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-zinc-200 dark:border-white/10" />
          <span className="absolute bg-white dark:bg-[#0f0b1a] px-3 text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-medium">
            Or continue with email
          </span>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                if (serverError) setServerError(null);
              }}
              disabled={isLoading}
              className={`h-11 rounded-xl bg-zinc-50 dark:bg-white/5 border text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus-visible:ring-purple-500/40 ${
                errors.email ? "border-rose-500/60" : "border-zinc-300 dark:border-white/15"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-0.5">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block"
              >
                Password
              </label>
              {isLogin && (
                <span className="text-[11px] text-purple-600 dark:text-purple-300 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                  if (serverError) setServerError(null);
                }}
                disabled={isLoading}
                className={`h-11 rounded-xl bg-zinc-50 dark:bg-white/5 border pr-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus-visible:ring-purple-500/40 ${
                  errors.password ? "border-rose-500/60" : "border-zinc-300 dark:border-white/15"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-0.5">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button with Loading State */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all shadow-lg shadow-purple-950/40 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
              </>
            ) : (
              <span>{isLogin ? "Sign in" : "Create account"}</span>
            )}
          </Button>
        </form>

        {/* Switch Link between Login & Signup */}
        <div className="text-center pt-2 border-t border-zinc-200 dark:border-white/10">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 font-semibold underline underline-offset-4 transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
