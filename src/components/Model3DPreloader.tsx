"use client";

import { useEffect } from "react";
import { preload3DModels } from "@/lib/preload3D";

export default function Model3DPreloader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Trigger preloading right after the main page is responsive
    if ("requestIdleCallback" in window) {
      const handle = (
        window as unknown as {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
          cancelIdleCallback: (id: number) => void;
        }
      ).requestIdleCallback(
        () => {
          preload3DModels("low");
        },
        { timeout: 1500 }
      );

      return () => {
        if ("cancelIdleCallback" in window) {
          (
            window as unknown as {
              cancelIdleCallback: (id: number) => void;
            }
          ).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(() => {
        preload3DModels("low");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
