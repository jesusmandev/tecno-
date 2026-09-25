"use client";

import React, { ReactNode } from "react";
import { ReactLenis, type LenisProps } from "lenis/react";
// Mandatory Lenis stylesheet for proper overflow and scroll containment behavior
import "lenis/dist/lenis.css";

export interface SmoothScrollProviderProps {
  children: ReactNode;
  options?: LenisProps["options"];
}

/**
 * Global Smooth Scroll Provider using the unified `lenis` library (`lenis/react`).
 * Wraps the entire application with root-level smooth scrolling.
 *
 * @param children - Child components to render within the scroll container
 * @param options - Optional overrides for Lenis configuration
 */
export default function SmoothScrollProvider({
  children,
  options,
}: SmoothScrollProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        // Linear interpolation factor (0.1 delivers responsive yet buttery-smooth inertia)
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false,
        autoRaf: true,
        ...options,
      }}
    >
      {children}
    </ReactLenis>
  );
}
