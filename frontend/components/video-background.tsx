"use client";

import React, { useState, useEffect, useRef } from "react";

// Single constant for hero background video URL as required by design specification
export const HERO_VIDEO_URL =
  "https://cdn.sceneai.art/Hero%20Section%20Video/bea62976-0843-4cfc-9b03-209e2310838b.mp4";

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

export function VideoBackground({ children }: VideoBackgroundProps) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (videoRef.current) {
        if (e.matches) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden select-none pointer-events-none">
      {/* Video Element with Fallback */}
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      ) : null}

      {/* Fallback gradient if video fails or when loading */}
      <div
        className={`absolute inset-0 w-full h-full video-fallback-gradient transition-opacity duration-700 ${
          hasError ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Left-side soft black gradient overlay (80% opacity at left edge, fading to transparent at 70% width) */}
      <div className="absolute inset-0 w-full h-full video-overlay-gradient" />

      {/* Subtle top and bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {children}
    </div>
  );
}
