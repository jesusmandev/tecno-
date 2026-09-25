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
