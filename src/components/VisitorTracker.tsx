"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Evitar registrar en la misma ruta repetidamente en re-renders inmediatos
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    // Obtener o crear ID de visitante único (persistente)
    let visitorId = "";
    try {
      visitorId = localStorage.getItem("tp_visitor_id") || "";
      if (!visitorId) {
        visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("tp_visitor_id", visitorId);
      }
    } catch {
      visitorId = `vis_anon_${Date.now()}`;
    }

    // Obtener o crear ID de sesión (expira al cerrar pestaña)
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem("tp_session_id") || "";
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("tp_session_id", sessionId);
      }
    } catch {
      sessionId = `sess_anon_${Date.now()}`;
    }

    // Detectar tipo de dispositivo
    let deviceType: "mobile" | "desktop" | "tablet" = "desktop";
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/ipad|tablet/i.test(ua)) {
        deviceType = "tablet";
      } else if (/mobile|iphone|android|phone/i.test(ua)) {
        deviceType = "mobile";
      }
    }

    // Enviar evento de analítica al backend de forma no bloqueante
    try {
      fetch("/api/backend/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          visitor_id: visitorId,
          session_id: sessionId,
          page_path: pathname || "/",
          referrer: typeof document !== "undefined" ? document.referrer : "",
          device_type: deviceType,
        }),
      }).catch(() => {
        // Silenciar errores en cliente para no afectar experiencia de usuario
      });
    } catch {
      // Ignorar
    }
  }, [pathname]);

  return null;
}
