"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { ArrowUp } from "lucide-react";

/* Load Bebas Neue from Google Fonts */
const bebasNeueStyle = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`;

/* ─────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────── */
type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

function useParticles(count = 14): Particle[] {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1.5,
      duration: Math.random() * 5 + 4,
      delay: Math.random() * 4,
    }))
  );
  return particles;
}

/* ─────────────────────────────────────────────
   ANIMATED LINK (underline + x shift)
───────────────────────────────────────────── */
function AnimatedLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="relative inline-flex text-gray-400 text-[15px] font-medium group w-fit cursor-pointer no-underline"
      whileHover={{ x: 5, color: "#e02424" }}
      transition={{ duration: 0.2 }}
    >
      {children}
      <motion.span
        className="absolute bottom-0 left-0 h-[1.5px] bg-[#e02424] w-full origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ display: "block" }}
      />
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   RIPPLE BUTTON (Tecno+ Red Gradient)
───────────────────────────────────────────── */
type Ripple = { id: number; x: number; y: number };

function RippleButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      700
    );
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-[14px] no-underline w-fit"
      style={{
        background:
          "linear-gradient(135deg, #e02424 0%, #b91c1c 50%, #e02424 100%)",
        backgroundSize: "200% 200%",
        boxShadow: "0 0 24px rgba(224,36,36,0.35)",
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 40px rgba(224,36,36,0.6)",
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      {/* Shimmer sweep */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
      />
      {children}
      {/* Ripples */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x, top: r.y, x: "-50%", y: "-50%" }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   SOCIAL ICON
───────────────────────────────────────────── */
function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center w-11 h-11 rounded-full text-gray-400 no-underline cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      whileHover={{
        scale: 1.15,
        rotate: 5,
        color: "#e02424",
        boxShadow: "0 0 22px rgba(224,36,36,0.5)",
        background: "rgba(224,36,36,0.12)",
        borderColor: "rgba(224,36,36,0.35)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   COPYRIGHT FADE BY CHARACTER
───────────────────────────────────────────── */
function CharFade({
  text,
  inView,
  baseDelay = 0,
}: {
  text: string;
  inView: boolean;
  baseDelay?: number;
}) {
  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.04, delay: baseDelay + i * 0.02 }}
        >
          {char === " " ? "\u00a0" : char}
        </motion.span>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   STAGGER VARIANTS
───────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ─────────────────────────────────────────────
   SCROLL-TO-TOP BUTTON (Positioned cleanly above WhatsApp float)
───────────────────────────────────────────── */
function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollTop}
          aria-label="Volver arriba"
          className="fixed bottom-24 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full text-white cursor-pointer border-none outline-none"
          style={{
            background: "rgba(224,36,36,0.95)",
            boxShadow: "0 4px 20px rgba(224,36,36,0.45)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{
            scale: 1.15,
            rotate: 180,
            boxShadow: "0 0 35px rgba(224,36,36,0.75)",
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 350, damping: 18 }}
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   MAIN TECNO+ FOOTER
───────────────────────────────────────────── */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, margin: "-80px 0px" });
  const particles = useParticles(14);

  /* Animated divider line */
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, margin: "-40px 0px" });

  const navLinks = [
    { href: "/#celulares", label: "Dispositivos destacados" },
    { href: "/catalogo", label: "Catálogo completo (+500)" },
    { href: "/#gaming", label: "Mundo Gamer & Gadgets" },
    { href: "/#combos", label: "Combos especiales" },
    { href: "/#opiniones", label: "Opiniones y valoraciones" },
    { href: "/#beneficios", label: "Envíos & Garantía" },
  ];

  const socialLinks = [
    {
      label: "WhatsApp",
      href: "https://wa.me/573043547935",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      label: "TikTok",
      href: "https://tiktok.com",
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.86a8.28 8.28 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.27z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: "https://facebook.com",
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <ScrollTopButton />

      {/* Curved Top Wave Separator */}
      <div
        className="w-full overflow-hidden leading-none"
        style={{ marginBottom: "-2px" }}
      >
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="w-full h-[60px] block"
          fill="none"
        >
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z"
            fill="#050505"
          />
        </svg>
      </div>

      <footer
        ref={footerRef}
        className="relative w-full overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(to bottom, #050505 0%, #0d0607 55%, #120406 100%)",
        }}
      >
        {/* ── Noise texture overlay ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.025]"
          style={{ zIndex: 1 }}
        >
          <filter id="footer-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#footer-noise)" />
        </svg>

        {/* ── Radial glow center (Tecno+ Red) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "0%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "750px",
            height: "400px",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(224,36,36,0.12) 0%, transparent 72%)",
            zIndex: 1,
          }}
        />

        {/* ── Floating particles ── */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 1 }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, -22, 0],
                opacity: [0.15, 0.45, 0.15],
              }}
              transition={{
                repeat: Infinity,
                duration: p.duration,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* ── Main animated entrance ── */}
        <motion.div
          initial={{ opacity: 0, y: 120, filter: "blur(20px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ position: "relative", zIndex: 2 }}
        >
          {/* ── Animated top divider line ── */}
          <div ref={lineRef} className="relative overflow-hidden h-[1px] mx-0">
            <motion.div
              className="h-full"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(224,36,36,0.6) 30%, rgba(224,36,36,0.3) 70%, transparent)",
                transformOrigin: "left",
              }}
              initial={{ scaleX: 0 }}
              animate={lineInView ? { scaleX: 1 } : {}}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1] as const,
                delay: 0.2,
              }}
            />
          </div>

          {/* ── Content ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="w-full mx-auto"
            style={{
              maxWidth: "1360px",
              padding: "70px clamp(20px, 5vw, 80px) 44px",
            }}
          >
            {/* ── Marquee TECNO+ ── */}
            <style>{bebasNeueStyle}</style>
            <div className="w-full overflow-hidden mb-16 select-none">
              <motion.div
                style={{
                  display: "flex",
                  whiteSpace: "nowrap",
                }}
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 20,
                  ease: "linear",
                }}
              >
                {/* Seamless loop */}
                {[...Array(2)].map((_, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "clamp(75px, 11vw, 150px)",
                      letterSpacing: "0.04em",
                      color: "rgba(255,255,255,0.06)",
                      lineHeight: 1,
                      paddingRight: "0.6em",
                      display: "inline-block",
                    }}
                  >
                    {Array.from({ length: 5 }).map((__, j) => (
                      <React.Fragment key={j}>
                        TECNO+
                        <span
                          style={{
                            color: "rgba(224,36,36,0.25)",
                            marginRight: "0.4em",
                            marginLeft: "0.4em",
                          }}
                        >
                          ·
                        </span>
                        TECNOMASCOLOMBIA
                        <span
                          style={{
                            color: "rgba(224,36,36,0.25)",
                            marginRight: "0.4em",
                            marginLeft: "0.4em",
                          }}
                        >
                          ·
                        </span>
                        MONTERÍA
                        <span
                          style={{
                            color: "rgba(224,36,36,0.25)",
                            marginRight: "0.4em",
                            marginLeft: "0.4em",
                          }}
                        >
                          ·
                        </span>
                      </React.Fragment>
                    ))}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] gap-12 lg:gap-16 mb-16">
              {/* Brand Info */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/logo/logotecno.png"
                    alt="Tecno+ Logo"
                    width={38}
                    height={38}
                    className="tp-logo-icon object-contain"
                    unoptimized
                  />
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    TECNO<span className="text-[var(--red)]">+</span>
                  </span>
                </div>

                <p className="text-gray-400 text-[15px] leading-relaxed max-w-[460px]">
                  Tu tienda de tecnología seleccionada en Montería, Córdoba.
                  Celulares de última generación, consolas gaming, combos
                  ahorradores y gadgets con despacho express a toda Colombia.
                </p>

                {/* Ripple CTA Button */}
                <div className="mt-1">
                  <RippleButton href="https://wa.me/573043547935?text=Hola%20Tecno%2B%2C%20quiero%20asesor%C3%ADa%20personalizada">
                    <span>Hablar con un asesor</span>
                    <span>→</span>
                  </RippleButton>
                </div>

                {/* Social icons */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-3 mt-2"
                >
                  {socialLinks.map((s, i) => (
                    <SocialIcon key={i} href={s.href} label={s.label}>
                      {s.icon}
                    </SocialIcon>
                  ))}
                </motion.div>
              </motion.div>

              {/* Navigation Links */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-5"
              >
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.2em]">
                  Explorar Tienda
                </h4>
                <ul className="flex flex-col gap-3.5 list-none p-0 m-0">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <AnimatedLink href={link.href}>{link.label}</AnimatedLink>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Contact & Location info */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-5"
              >
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.2em]">
                  Atención & Envíos
                </h4>
                <ul className="flex flex-col gap-4 list-none p-0 m-0">
                  <li>
                    <AnimatedLink href="https://wa.me/573043547935" external>
                      <span className="flex items-center gap-3">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        +57 304 354 7935
                      </span>
                    </AnimatedLink>
                  </li>
                  <li className="text-gray-400 text-[15px] flex items-center gap-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#e02424] flex-shrink-0"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Montería, Córdoba · Colombia</span>
                  </li>
                  <li className="text-gray-400 text-[15px] flex items-center gap-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#e02424] flex-shrink-0"
                    >
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span>Envíos directos a todo el país</span>
                  </li>
                  <li className="text-gray-400 text-[15px] flex items-center gap-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#e02424] flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Lun - Sáb: 8:00 AM - 7:00 PM</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Bottom bar with character fade copyright */}
            <motion.div
              variants={itemVariants}
              className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-gray-500 text-sm font-medium tracking-wide text-center sm:text-left">
                <CharFade
                  text={`© ${currentYear} Tecno+. Todos los derechos reservados.`}
                  inView={inView}
                  baseDelay={0.5}
                />
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Compra 100% segura</span>
                <span>·</span>
                <span>Garantía directa</span>
                <span>·</span>
                <span className="text-[var(--red)] font-semibold">Montería</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </footer>
    </>
  );
}
