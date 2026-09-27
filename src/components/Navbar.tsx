"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatPrice } from "@/data/mockProducts";
import SearchBar from "./SearchBar";
import CheckoutDrawer from "./CheckoutDrawer";
import { preload3DModels } from "@/lib/preload3D";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { id: "celulares", label: "Celulares", href: "/#celulares" },
  { id: "catalogo", label: "Catálogo", href: "/catalogo", preload: true },
  { id: "combos", label: "Combos", href: "/#combos" },
  { id: "opiniones", label: "Opiniones", href: "/#opiniones" },
  { id: "gaming", label: "Gaming", href: "/#gaming" },
  { id: "beneficios", label: "Beneficios", href: "/#beneficios" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, profile, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  const {
    totalQuantity,
    toggleCart,
    cartOpen,
    closeCart,
    items,
    formattedTotal,
    removeItem,
    updateQuantity,
    openCheckout,
  } = useCart();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derive active tab: If on /catalogo, it's always "catalogo"
  const currentActive = pathname === "/catalogo" ? "catalogo" : activeSection;

  // Detect which section is active on homepage scroll
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = ["celulares", "combos", "opiniones", "gaming", "beneficios"];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(id);
            return;
          }
        }
      }

      if (window.scrollY < 150) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);



  return (
    <>
      {/* Top Announcement Bar with Infinite Marquee */}
      <div className="tp-announcement" aria-label="Información de envíos y garantías">
        <div className="tp-announcement-track">
          {[1, 2].map((half) => (
            <div key={half} className="flex items-center shrink-0">
              <span className="tp-announcement-item">
                Envío gratis a todo Colombia
              </span>
              <span className="text-[var(--red)] mx-3.5 font-bold">·</span>
              <span className="tp-announcement-item">
                Compra segura
              </span>
              <span className="text-[var(--red)] mx-3.5 font-bold">·</span>
              <span className="tp-announcement-item">
                Montería, Córdoba
              </span>
              <span className="text-[var(--red)] mx-3.5 font-bold">·</span>
              <span className="tp-announcement-item">
                Garantía oficial Tecno+
              </span>
              <span className="text-[var(--red)] mx-3.5 font-bold">·</span>
              <span className="tp-announcement-item">
                Pagos en línea con PSE, Tarjetas y Nequi
              </span>
              <span className="text-[var(--red)] mx-3.5 font-bold">·</span>
              <span className="tp-announcement-item">
                Envíos 24-48h a toda Colombia
              </span>
              <span className="text-[var(--red)] mx-3.5 font-bold">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="tp-header">
        <div className="tp-container tp-nav">
          {/* Logo */}
          <Link href="/" className="tp-logo" aria-label="Tecno+">
            <Image
              src="/logo/logotecno.png"
              alt="Tecno+ Logo"
              width={34}
              height={34}
              className="tp-logo-icon"
              priority
              unoptimized
            />
            <span className="tp-logo-text">
              TECN<span className="tp-logo-o" aria-hidden="true" />
              <span className="tp-logo-plus">+</span>
            </span>
          </Link>

          {/* Navigation Links with Active Section Highlight */}
          <nav className="tp-nav-links">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveSection(item.id)}
                onMouseEnter={item.preload ? () => preload3DModels("high") : undefined}
                className={currentActive === item.id ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="tp-actions">
            {/* Search Button */}
            <button
              id="search-toggle-btn"
              className="tp-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar productos estilo Google"
              title="Buscar productos (Ctrl+K)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-[#333]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            {/* User Account / Google Login Button */}
            <div className="relative">
              {authLoading ? (
                <div className="h-8 w-8 rounded-full bg-neutral-200 animate-pulse" />
              ) : user ? (
                <div>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white p-1 pr-2.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 hover:shadow"
                    aria-label="Menú de usuario"
                  >
                    {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                      <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url}
                        alt="Avatar"
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--red)] text-[11px] font-bold text-white">
                        {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline max-w-[90px] truncate text-[12px]">
                      {(profile?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Mi Cuenta").split(" ")[0]}
                    </span>
                    <svg
                      className={`h-3 w-3 text-neutral-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-black/10 bg-white p-3 shadow-xl space-y-2">
                        <div className="border-b border-black/5 pb-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <span>●</span> Cuenta Google Conectada
                          </div>
                          <p className="font-bold text-neutral-900 text-xs truncate">
                            {profile?.full_name || user.email}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                        </div>

                        {profile?.shipping_address && (
                          <div className="rounded-lg bg-neutral-50 p-2 text-[11px] text-neutral-600 space-y-0.5">
                            <span className="font-semibold text-neutral-700 block text-[10px] uppercase">
                              Dirección de entrega:
                            </span>
                            <p className="truncate">📍 {profile.shipping_address}</p>
                            <p className="text-neutral-400 text-[10px]">
                              {profile.city || "Montería"}, {profile.department || "Córdoba"}
                            </p>
                          </div>
                        )}

                        <div className="pt-1">
                          <button
                            onClick={() => {
                              signOut();
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 hover:shadow"
                  title="Iniciar sesión con Google para autocompletar tus datos"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Ingresar</span>
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button
              id="cart-toggle-btn"
              onClick={toggleCart}
              className="tp-cart-btn"
              aria-label="Abrir carrito"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span>Carrito</span>
              {totalQuantity > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--red)] px-1.5 text-[11px] font-bold text-white">
                  {totalQuantity}
                </span>
              )}
            </button>

            {/* WhatsApp Link */}
            <a
              className="tp-wa-btn"
              href="https://wa.me/573043547935"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* ========== CART DRAWER ========== */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
          cartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out border-l border-[#e8e8ea] ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e8ea] px-6 py-4">
          <h2 className="text-lg font-bold text-[#111]">
            Tu Carrito{" "}
            {totalQuantity > 0 && (
              <span className="text-sm font-normal text-[#70757d]">
                ({totalQuantity} {totalQuantity === 1 ? "artículo" : "artículos"})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#70757d] hover:bg-[#f6f6f7] hover:text-[#111] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f6f6f7]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-8 w-8 text-[#999]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <p className="text-base font-bold text-[#111]">
                Tu carrito está vacío
              </p>
              <p className="mt-1 text-xs text-[#70757d]">
                Explora nuestros productos y agrega tus favoritos.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item: CartItem) => (
                <li
                  key={item.variant.id}
                  className="flex gap-4 rounded-2xl border border-[#e8e8ea] bg-[#f6f6f7] p-3 transition-colors"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white p-1">
                    <Image
                      src={item.product.featuredImage.url}
                      alt={item.product.featuredImage.altText}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#111] leading-snug">
                        {item.product.title}
                      </h3>
                      {item.variant.title !== "Default Title" && (
                        <p className="mt-0.5 text-xs text-[#70757d]">
                          {item.variant.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-[var(--red)]">
                        {formatPrice(item.variant.price * item.quantity)}
                      </span>
                      <div className="flex items-center gap-1 border border-[#e8e8ea] bg-white rounded-lg p-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.variant.id, item.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center text-xs text-[#70757d] hover:text-[#111]"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-xs font-semibold text-[#111]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variant.id, item.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center text-xs text-[#70757d] hover:text-[#111]"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.variant.id)}
                          className="ml-1 flex h-6 w-6 items-center justify-center text-xs text-red-500 hover:text-red-700"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with WhatsApp checkout */}
        {items.length > 0 && (
          <div className="border-t border-[#e8e8ea] bg-[#fafafa] px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#70757d] font-medium">Subtotal</span>
              <span className="text-xl font-extrabold text-[#111]">
                {formattedTotal}
              </span>
            </div>
            <p className="mb-4 text-xs text-[#70757d]">
              Envío gratis en Montería y despachos rápidos a toda Colombia.
            </p>
            <button
              id="checkout-btn"
              onClick={() => {
                closeCart();
                openCheckout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[var(--red2)]"
            >
              Comprar / Pagar <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* ========== GOOGLE-STYLE SEARCH MODAL ========== */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ========== SLIDE-OVER CHECKOUT DRAWER ========== */}
      <CheckoutDrawer />
    </>
  );
}
