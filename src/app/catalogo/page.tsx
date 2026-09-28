"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import inventarioData from "@/data/inventarioCompleto.json";
import { formatPrice } from "@/data/mockProducts";
import { useCart } from "@/context/CartContext";
import PhoneBanner3D from "@/components/PhoneBanner3D";
import { tokenizeQuery, normalizeText, matchesAllTokens } from "@/lib/searchUtils";

interface InventarioItem {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  images?: string[];
  description?: string;
  jaltechCode?: string;
  jaltechUrl?: string;
  compareAtPrice?: number | null;
  badge?: string;
}

const CATEGORIES = [
  "Todos",
  "Celulares",
  "Combos",
  "Sonido y Audio",
  "Audífonos y Diademas",
  "Gaming y TV Box",
  "Smartwatch y Relojes",
  "Cargadores y Energía",
  "Cables y Conectividad",
  "Cómputo y Accesorios",
  "POS y Oficina",
  "Accesorios y Varios",
];

const ITEMS_PER_PAGE = 24;

function getFallbackImage(category: string, name: string): string {
  const c = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // 1. CARGADORES, FUENTES, ADAPTADORES Y BATERÍAS (Prioridad máxima por marca y modelo específico)
  if (
    c.includes("cargador") ||
    c.includes("energ") ||
    n.startsWith("carg") ||
    n.includes("cargador") ||
    n.includes("cargadores") ||
    n.includes("carg.") ||
    n.includes("carg ") ||
    n.includes("carg-") ||
    n.includes("fuente") ||
    n.includes("adaptador corriente") ||
    n.includes("adaptador de corriente") ||
    n.includes("power bank") ||
    n.includes("bateria")
  ) {
    if (n.includes("lenovo")) {
      return "/products/chargers/lenovo_slimtip.jpg";
    }
    if (n.includes("hp")) {
      if (n.includes("azul") || n.includes("3.33a") || n.includes("2.31a") || n.includes("h07p")) {
        return "/products/chargers/hp_punta_azul.jpg";
      }
      return "/products/chargers/hp_estandar.jpg";
    }
    if (n.includes("dell")) {
      return "/products/chargers/dell_pa12.webp";
    }
    if (n.includes("asus")) {
      return "/products/chargers/asus_19v.jpg";
    }
    if (n.includes("acer") || n.includes("hacer")) {
      return "/products/chargers/acer_19v.png";
    }
    if (n.includes("apple") || n.includes("macbook") || n.includes("iphone") || n.includes("iph")) {
      if (n.includes("16.5v") || n.includes("14.5v") || n.includes("tipo-l") || n.includes("tipo l")) {
        return "/products/chargers/apple_magsafe1.jpg";
      }
      if (n.includes("14.85v") || n.includes("magsafe 2") || n.includes("magsafe2")) {
        return "/products/chargers/apple_magsafe2.jpg";
      }
      if (n.includes("tipo c") || n.includes("61w") || n.includes("ap08p")) {
        return "/products/chargers/apple_usbc_61w.jpg";
      }
      return "/products/chargers/apple_usbc_20w.jpg";
    }
    if (n.includes("samsung")) {
      if (n.includes("monitor") || n.includes("14v") || n.includes("2.1a")) {
        return "/products/chargers/lg_monitor_5a.jpg";
      }
      if (n.includes("19v") || n.includes("3.16a")) {
        return "/products/chargers/samsung_laptop.jpg";
      }
      return "/products/chargers/samsung_25w.png";
    }
    if (n.includes("toshiba") || n.includes("sony")) {
      return "/products/chargers/toshiba_19v.jpg";
    }
    if (n.includes("monitor") || n.includes("lg")) {
      if (n.includes("3a")) {
        return "/products/chargers/lg_monitor_3a.jpg";
      }
      return "/products/chargers/lg_monitor_5a.jpg";
    }
    if (n.includes("motorola")) {
      return "/products/chargers/motorola_turbopower.png";
    }
    if (n.includes("xiaomi")) {
      return "/products/chargers/xiaomi_67w.jpg";
    }
    if (
      n.includes("laptop") ||
      n.includes("portatil") ||
      n.includes("19v") ||
      n.includes("20v") ||
      n.includes("65w") ||
      n.includes("45w") ||
      n.includes("90w")
    ) {
      return "/products/chargers/lenovo_slimtip.jpg";
    }
    return "/products/chargers/apple_usbc_20w.jpg";
  }

  // 2. CABLES Y CONECTIVIDAD
  if (c.includes("cable") || n.includes("cable") || n.includes("otg") || n.includes("hdmi")) {
    return "/products/cable_usbc.png";
  }

  // 3. FORROS, VIDRIOS, FUNDAS Y CARCASAS
  if (
    n.includes("forro") ||
    n.includes("vidrio") ||
    n.includes("funda") ||
    n.includes("case") ||
    n.includes("carcasa") ||
    n.includes("estuche")
  ) {
    return "/products/combos/combo-forro-vidrio-samsung.png";
  }

  // 4. AUDÍFONOS Y DIADEMAS
  if (
    c.includes("audio") ||
    c.includes("aud") ||
    c.includes("diadema") ||
    n.includes("audifono") ||
    n.includes("diadema") ||
    n.includes("auricular") ||
    n.includes("airpod") ||
    n.includes("parlante") ||
    n.includes("cabina")
  ) {
    return "/products/headphones.png";
  }

  // 5. RELOJES Y SMARTWATCHES
  if (c.includes("reloj") || c.includes("smartwatch") || n.includes("reloj") || n.includes("watch")) {
    return "/products/redmi_watch5.png";
  }

  // 6. GAMING Y CONSOLAS
  if (c.includes("gaming") || n.includes("juego") || n.includes("consola") || n.includes("stick") || n.includes("tvbox")) {
    return "/products/gamestick_4k.png";
  }

  // 7. COMPUTADORES Y PORTÁTILES
  if (c.includes("computo") || n.includes("portatil") || n.includes("laptop") || n.includes("computador")) {
    return "/products/lenovo.png";
  }

  // 8. CELULARES (Sólo si es explícitamente celular o smartphone)
  if (c.includes("celular") || n.includes("celular") || n.includes("smartphone")) {
    return "/products/samsung_s24_ultra.png";
  }

  return "/products/cargador_laptop_generico.jpg";
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--red)] border-t-transparent" />
            <p className="text-sm font-semibold">Cargando catálogo oficial...</p>
          </div>
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const { openCheckout } = useCart();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || searchParams.get("search") || "";
  const urlCategory = searchParams.get("categoria") || "";

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedProduct, setSelectedProduct] = useState<InventarioItem | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Sincronizar búsqueda desde URL (ej. /catalogo?q=cargador)
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setSelectedCategory("Todos");
    } else if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlQuery, urlCategory]);

  const items = inventarioData as InventarioItem[];

  // Lista de imágenes disponibles para el producto seleccionado en el modal
  const productImages = useMemo(() => {
    if (!selectedProduct) return [];
    if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      return selectedProduct.images;
    }
    const fallback = selectedProduct.image || getFallbackImage(selectedProduct.category, selectedProduct.name);
    return [fallback];
  }, [selectedProduct]);

  // Búsqueda inteligente por palabras clave (tokens), sin tildes, en nombre, código, descripción y categoría
  const { filteredProducts, globalMatchCount } = useMemo(() => {
    const q = searchQuery.trim();
    const tokens = tokenizeQuery(q);

    // 1. Filtrar globalmente por todos los tokens
    const globalMatches = items.filter((item) => {
      if (tokens.length === 0) return true;
      const haystack = normalizeText(
        `${item.name} ${item.code} ${item.category} ${item.description || ""} ${item.jaltechCode || ""}`
      );
      return matchesAllTokens(haystack, tokens);
    });

    // 2. Filtrar por categoría seleccionada
    const filtered = globalMatches.filter((item) => {
      return selectedCategory === "Todos" || item.category === selectedCategory;
    });

    // 3. Ordenar
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      filteredProducts: filtered,
      globalMatchCount: globalMatches.length,
    };
  }, [items, selectedCategory, searchQuery, sortBy]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] pt-8 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="tp-container mb-8">
        <div className="flex items-center gap-2 text-sm text-[#70757d] mb-4">
          <Link href="/" className="hover:text-[#111] transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#111]">Catálogo Completo</span>
        </div>

        <div className="rounded-3xl bg-[#111111] text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 min-h-[340px]">
          {/* Left: Text Information */}
          <div className="relative z-10 max-w-xl flex-1">
            <span className="inline-block rounded-full bg-[var(--red)] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white mb-3">
              Inventario Oficial 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Catálogo
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed">
              Explora más de 500 referencias de celulares, audio, gaming, cómputo y accesorios con precios oficiales actualizados. Compra online rápida y 100% segura con tarjeta o PSE.
            </p>
          </div>

          {/* Right: 3D Draco GLB Model Viewer (iPhone 17 Pro Max auto-rotating) */}
          <div className="relative z-10 w-full md:w-[360px] lg:w-[420px] h-[260px] sm:h-[300px] md:h-[340px] flex items-center justify-center">
            <PhoneBanner3D className="w-full h-full" />
          </div>

          {/* Decorative background glow */}
          <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-[var(--red)] opacity-25 blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 bottom-0 -mb-20 h-64 w-64 rounded-full bg-white opacity-5 blur-2xl pointer-events-none" />
        </div>
      </div>

      <div className="tp-container">
        {/* Search & Sort Controls Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-[#e8e8ea]">
          {/* Search box */}
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9aa0a6]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              placeholder="Buscar por nombre (ej. Diadema, Parlante, Cargador...) o código..."
              className="w-full rounded-full border border-[#dfe1e5] bg-[#f8f9fa] py-2.5 pl-11 pr-4 text-sm text-[#111] placeholder-[#70757a] outline-none focus:border-[var(--red)] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-[#70757a] hover:bg-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-[#70757d]">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-[#dfe1e5] bg-white px-3 py-2 text-xs font-medium text-[#111] outline-none cursor-pointer focus:border-[var(--red)]"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "Todos"
                ? items.length
                : items.filter((p) => p.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[var(--red)] text-white shadow-md shadow-red-500/20"
                    : "bg-white text-[#555] hover:bg-gray-100 border border-[#e8e8ea]"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-[#777]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="mb-4 flex items-center justify-between text-xs text-[#70757d]">
          <span>
            Mostrando <b>{visibleProducts.length}</b> de <b>{filteredProducts.length}</b> productos
            {selectedCategory !== "Todos" && ` en ${selectedCategory}`}
          </span>
          <span>Precios en pesos colombianos (COP)</span>
        </div>

        {/* Products Grid */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedProduct(item);
                  setModalImageIndex(0);
                }}
                className="group flex flex-col justify-between rounded-2xl border border-[#e8e8ea] bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-xl hover:border-red-300 hover:-translate-y-1 cursor-pointer relative"
              >
                {/* Header Tag & Code */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[var(--red)] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-600">
                      Cód: {item.code}
                    </span>
                  </div>

                  {/* Product Image Container */}
                  <div className="relative w-full aspect-square bg-[#fbfbfc] rounded-xl overflow-hidden mb-3.5 flex items-center justify-center p-3 border border-gray-100 group-hover:border-red-100 transition-colors">
                    {item.badge && (
                      <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase px-2.5 py-0.5 shadow-sm tracking-wider animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || getFallbackImage(item.category, item.name)}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-contain transition-transform duration-350 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = "true";
                          target.src = getFallbackImage(item.category, item.name);
                        }
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#111] leading-snug line-clamp-2 group-hover:text-[var(--red)] transition-colors min-h-[2.5rem]">
                    {item.name}
                  </h3>

                  {/* Indicador de toque */}
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-neutral-400 group-hover:text-[var(--red)] transition-colors">
                    <span>👁️</span>
                    <span>Toca para ver descripción completa</span>
                  </div>
                </div>

                {/* Bottom: Price & WhatsApp Action */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="mb-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#70757d] block">Precio de venta:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-[#111]">
                          {formatPrice(item.price)}
                        </span>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <del className="text-xs text-gray-400 font-semibold line-through">
                            {formatPrice(item.compareAtPrice)}
                          </del>
                        )}
                      </div>
                    </div>
                    {item.stock > 0 && (
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {item.stock} disponibles
                      </span>
                    )}
                  </div>

                  {/* Order Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCheckout({
                        product: {
                          id: item.id,
                          title: item.name,
                          handle: item.id,
                          description: item.description || item.category,
                          descriptionHtml: `<p>${item.description || item.name}</p>`,
                          vendor: "Tecno+",
                          productType: item.category,
                          category: "gaming",
                          whatsappText: "",
                          tags: [item.category.toLowerCase()],
                          price: item.price,
                          compareAtPrice: item.compareAtPrice ?? null,
                          currencyCode: "COP",
                          featuredImage: {
                            url: (item.images && item.images[0]) || item.image || getFallbackImage(item.category, item.name),
                            altText: item.name,
                          },
                          images: Array.isArray(item.images) && item.images.length > 0
                            ? item.images.map((url, i) => ({ url, altText: `${item.name} - ${i + 1}` }))
                            : [
                                {
                                  url: item.image || getFallbackImage(item.category, item.name),
                                  altText: item.name,
                                },
                              ],
                          variants: [
                            {
                              id: `var-${item.id}`,
                              title: "Estándar",
                              availableForSale: true,
                              price: item.price,
                              compareAtPrice: item.compareAtPrice ?? null,
                            },
                          ],
                        },
                        variant: {
                          id: `var-${item.id}`,
                          title: "Estándar",
                          availableForSale: true,
                          price: item.price,
                          compareAtPrice: item.compareAtPrice ?? null,
                        },
                        quantity: 1,
                      });
                    }}
                    className="tp-catalog-card-btn"
                  >
                    <span>{item.badge === "Preventa" ? "Apartar Preventa" : "Comprar"}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="rounded-3xl border border-[#e8e8ea] bg-white p-12 text-center my-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              🔍
            </div>
            <h3 className="text-lg font-bold text-[#111]">
              No se encontraron productos
            </h3>
            <p className="mt-1 text-sm text-[#70757d]">
              No encontramos coincidencias para &quot;{searchQuery}&quot; en la categoría seleccionada.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Todos");
              }}
              className="mt-5 rounded-full bg-[#111] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--red)]"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredProducts.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              className="rounded-full border border-[#111] bg-white px-8 py-3.5 text-sm font-bold text-[#111] shadow-sm transition-all hover:bg-[#111] hover:text-white hover:shadow-md"
            >
              Cargar más productos (+{Math.min(ITEMS_PER_PAGE, filteredProducts.length - visibleCount)})
            </button>
          </div>
        )}
      </div>

      {/* ================= MODAL DE DETALLE Y DESCRIPCIÓN AL TOCAR EL PRODUCTO ================= */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl transition-all border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition"
              aria-label="Cerrar"
            >
              ✕
            </button>

            {/* Badges de Categoría y Código */}
            <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
              <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-[var(--red)] uppercase tracking-wider">
                {selectedProduct.category}
              </span>
              <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs font-semibold text-gray-700">
                Cód: {selectedProduct.code}
              </span>
              {selectedProduct.badge && (
                <span className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-white uppercase tracking-wider">
                  {selectedProduct.badge}
                </span>
              )}
            </div>

            {/* Imagen Principal Grande con soporte multi-ángulo / galería */}
            <div className="relative w-full h-64 sm:h-80 bg-[#fbfbfc] rounded-2xl overflow-hidden mb-3 flex items-center justify-center p-4 border border-gray-100 group/img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={modalImageIndex}
                src={productImages[modalImageIndex] || selectedProduct.image || getFallbackImage(selectedProduct.category, selectedProduct.name)}
                alt={`${selectedProduct.name} - Vista ${modalImageIndex + 1}`}
                className="max-h-full max-w-full object-contain transition-all duration-300"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = getFallbackImage(selectedProduct.category, selectedProduct.name);
                  }
                }}
              />

              {/* Botones de navegación Prev / Next si hay más de 1 imagen */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md text-gray-700 hover:bg-white hover:text-black transition"
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md text-gray-700 hover:bg-white hover:text-black transition"
                    aria-label="Siguiente imagen"
                  >
                    ›
                  </button>

                  {/* Contador de imágenes */}
                  <span className="absolute bottom-2.5 right-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-white tracking-wider backdrop-blur-xs">
                    {modalImageIndex + 1} / {productImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Tira de Miniaturas (thumbnails) si hay más de 1 imagen */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
                {productImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setModalImageIndex(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#fbfbfc] ${
                      idx === modalImageIndex
                        ? "border-[var(--red)] shadow-md ring-2 ring-red-100"
                        : "border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`${selectedProduct.name} - miniatura ${idx + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Título */}
            <h2 className="text-lg sm:text-xl font-black text-[#111] leading-snug mb-3">
              {selectedProduct.name}
            </h2>

            {/* Precio y Disponibilidad */}
            <div className="flex items-baseline justify-between py-3 border-y border-gray-100 mb-4">
              <div>
                <span className="text-[11px] text-gray-500 block font-medium">Precio exclusivo:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--red)]">
                    {formatPrice(selectedProduct.price)}
                  </span>
                  {selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price && (
                    <del className="text-xs text-gray-400 font-semibold line-through">
                      {formatPrice(selectedProduct.compareAtPrice)}
                    </del>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedProduct.stock > 0
                    ? `${selectedProduct.stock} disponibles en bodega`
                    : "Disponible para encargo"}
                </span>
              </div>
            </div>

            {/* Descripción y Especificaciones */}
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[var(--red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Descripción y Especificaciones Técnicas
              </h3>
              <div className="rounded-2xl bg-gray-50 p-4 text-xs text-gray-700 leading-relaxed max-h-64 overflow-y-auto border border-gray-200/80">
                {selectedProduct.description ? (
                  <div className="whitespace-pre-line text-neutral-800 space-y-1">
                    {selectedProduct.description}
                  </div>
                ) : (
                  <div className="space-y-2 text-gray-600">
                    <p className="font-semibold text-gray-900">
                      {selectedProduct.name}
                    </p>
                    <p>
                      Accesorio y producto original garantizado de la categoría <strong>{selectedProduct.category}</strong> disponible en tienda Tecno+.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 pt-1">
                      <li>Garantía oficial directa de 3 meses en Tecno+.</li>
                      <li>Entrega y despacho inmediato a todo el país.</li>
                      <li>Alta durabilidad, rendimiento y compatibilidad probada.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  openCheckout({
                    product: {
                      id: prod.id,
                      title: prod.name,
                      handle: prod.id,
                      description: prod.description || prod.category,
                      descriptionHtml: `<p>${prod.description || prod.name}</p>`,
                      vendor: "Tecno+",
                      productType: prod.category,
                      category: "gaming",
                      whatsappText: "",
                      tags: [prod.category.toLowerCase()],
                      price: prod.price,
                      compareAtPrice: prod.compareAtPrice ?? null,
                      currencyCode: "COP",
                      featuredImage: {
                        url: (prod.images && prod.images[0]) || prod.image || getFallbackImage(prod.category, prod.name),
                        altText: prod.name,
                      },
                      images: Array.isArray(prod.images) && prod.images.length > 0
                        ? prod.images.map((url, i) => ({ url, altText: `${prod.name} - ${i + 1}` }))
                        : [
                            {
                              url: prod.image || getFallbackImage(prod.category, prod.name),
                              altText: prod.name,
                            },
                          ],
                      variants: [
                        {
                          id: `var-${prod.id}`,
                          title: "Estándar",
                          availableForSale: true,
                          price: prod.price,
                          compareAtPrice: prod.compareAtPrice ?? null,
                        },
                      ],
                    },
                    variant: {
                      id: `var-${prod.id}`,
                      title: "Estándar",
                      availableForSale: true,
                      price: prod.price,
                      compareAtPrice: prod.compareAtPrice ?? null,
                    },
                    quantity: 1,
                  });
                }}
                className="w-full rounded-2xl bg-[var(--red)] py-3.5 text-xs font-bold text-white hover:bg-black transition shadow-lg shadow-red-500/20"
              >
                Comprar Ahora
              </button>

              <a
                href={`https://wa.me/573043547935?text=${encodeURIComponent(
                  `Hola Tecno+, me interesa el producto "${selectedProduct.name}" (Cód: ${selectedProduct.code}) por valor de ${formatPrice(selectedProduct.price)}. ¿Tienen disponibilidad inmediata?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                Pedir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
