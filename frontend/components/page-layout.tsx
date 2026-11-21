import React from "react";
import { TopNav } from "@/components/top-nav";
import { Footer } from "@/components/footer";
import { VideoBackground } from "@/components/video-background";

interface PageLayoutProps {
  children: React.ReactNode;
  variant?: "landing" | "app" | "auth";
  showNav?: boolean;
  showFooter?: boolean;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  className?: string;
}

export function PageLayout({
  children,
  variant = "landing",
  showNav = true,
  showFooter = true,
  user,
  className = "",
}: PageLayoutProps) {
  const isVideoAtmosphere = variant === "landing" || variant === "auth";

  return (
    <div
      className={`min-h-screen relative flex flex-col ${
        isVideoAtmosphere ? "bg-black" : "app-bg"
      } ${className}`}
    >
      {/* Atmosphere Background */}
      {isVideoAtmosphere && <VideoBackground />}

      {/* Top Navigation */}
      {showNav && (
        <TopNav
          variant={variant === "app" ? "app" : "landing"}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${showNav ? "pt-16" : ""}`}>
        {children}
      </main>

      {/* Footer on Landing & Auth */}
      {showFooter && isVideoAtmosphere && (
        <Footer isFixed={variant === "auth"} />
      )}
    </div>
  );
}
