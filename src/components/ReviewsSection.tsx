"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

export interface ReviewItem {
  id: string;
  name: string;
  city: string;
  rating: number; // 0 to 5
  date: string;
  product: string;
  title: string;
  comment: string;
  verified: boolean;
  recommended: boolean;
  likes: number;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Andrés Felipe Ruiz M.",
    city: "Montería (La Castellana)",
    rating: 5,
    date: "Hace 2 días",
    product: "iPhone 17 Pro Max 256GB",
    title: "¡Entrega el mismo día en Montería!",
    comment:
      "¡Impresionante la rapidez de entrega! Lo pedí en la mañana y en la tarde ya lo tenía en mis manos en Montería. Equipo 100% original, sellado en caja y con su garantía oficial. La compra con tarjeta fue súper fluida.",
    verified: true,
    recommended: true,
    likes: 18,
  },
  {
    id: "rev-2",
    name: "Valentina Jaramillo P.",
    city: "Cereté, Córdoba",
    rating: 5,
    date: "Hace 4 días",
    product: "Lenovo IdeaPad Slim 3 15IRH10",
    title: "Excelente portátil para la universidad",
    comment:
      "Compré el portátil Lenovo con pantalla táctil y procesador Intel Core i5 de 13va con 16GB RAM. La pantalla es hermosa, nítida y responde al tacto al instante. Llegó a Cereté en menos de 24 horas y con un embalaje impecable.",
    verified: true,
    recommended: true,
    likes: 12,
  },
  {
    id: "rev-3",
    name: "Juan Camilo Durango",
    city: "Montería (El Recreo)",
    rating: 5,
    date: "Hace 1 semana",
    product: "Combo Apple Lovers",
    title: "El ahorro en los combos es real",
    comment:
      "Aproveché el combo especial que incluye los AirPods y el case MagSafe. Me ahorré una buena plata en comparación con otras tiendas. Me encanta que ahora se pueda pagar directamente por tarjeta o PSE en la web.",
    verified: true,
    recommended: true,
    likes: 24,
  },
  {
    id: "rev-4",
    name: "María Alejandra Vélez S.",
    city: "Sahagún, Córdoba",
    rating: 5,
    date: "Hace 1 semana",
    product: "iPhone 16 Pro Max 256GB",
    title: "Color Titanio Desierto espectacular",
    comment:
      "Tenía algo de desconfianza al pedir por internet desde Sahagún, pero la compra fue transparente y segura. El iPhone llegó sellado con factura legal y el nuevo botón de control de cámara es una maravilla. Muy agradecida.",
    verified: true,
    recommended: true,
    likes: 15,
  },
  {
    id: "rev-5",
    name: "Carlos Mario Petro E.",
    city: "Lorica, Córdoba",
    rating: 4,
    date: "Hace 2 semanas",
    product: "Redmi Note 15 Pro",
    title: "La cámara de 200MP es de otro nivel",
    comment:
      "La calidad de las fotos y la fluidez de la pantalla de 120Hz compiten con cualquier gama alta. La batería dura más de un día completo. Le doy 4 estrellas solo porque la transportadora tardó un día más por lluvia.",
    verified: true,
    recommended: true,
    likes: 9,
  },
  {
    id: "rev-6",
    name: "Camila Sofía Hoyos",
    city: "Montería (Pasatiempo)",
    rating: 5,
    date: "Hace 3 semanas",
    product: "TvBox G7 Edición Araña",
    title: "Entretenimiento puro para la familia",
    comment:
      "Mis hijos están felices con todos los juegos retro que trae y para ver series en 4K va súper fluido. Fácil de conectar al televisor y excelente asesoría. Además el pago contra entrega en Montería me dio total tranquilidad.",
    verified: true,
    recommended: true,
    likes: 17,
  },
];

const POPULAR_PRODUCTS = [
  "iPhone 17 Pro Max 256GB",
  "iPhone 16 Pro Max 256GB",
  "Lenovo IdeaPad Slim 3 15IRH10",
  "Redmi Note 15 Pro",
  "Combo Apple Lovers",
  "Combo Tech Xiaomi",
  "TvBox G7 Edición Araña",
  "Game Stick Pro 4K M15",
  "Redmi Watch 5 Active",
  "AirPods Max 1.1",
  "Otro producto de la tienda",
];

const RATING_LABELS: Record<number, string> = {
  0: "0 estrellas - Muy insatisfecho",
  1: "1 estrella - Mal servicio",
  2: "2 estrellas - Regular",
  3: "3 estrellas - Bueno",
  4: "4 estrellas - Muy bueno",
  5: "5 estrellas - ¡Excelente servicio!",
};

const AVATAR_GRADIENTS = [
  "from-zinc-800 to-zinc-950",
  "from-blue-600 to-indigo-700",
  "from-amber-500 to-orange-600",
  "from-emerald-600 to-teal-700",
];

// =============================================
// TARJETA LIGERA (sin tilt 3D, sin backdrop-blur)
// =============================================
function ReviewCard({
  review,
  isCenter,
  onLike,
  isLiked,
}: {
  review: ReviewItem;
  isCenter: boolean;
  onLike: (id: string) => void;
  isLiked: boolean;
}) {
  const avatarGradient = AVATAR_GRADIENTS[(review.name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

  return (
    <div
      className={`relative flex flex-col justify-between w-full h-[370px] sm:h-[360px] rounded-[28px] p-7 sm:p-8 select-none ${
        isCenter
          ? "bg-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
          : "bg-white border border-neutral-200/50 shadow-sm"
      }`}
    >
      {/* Comillas decorativas */}
      <div className="pointer-events-none absolute right-7 top-5 text-6xl font-serif text-neutral-900/[0.04] select-none leading-none">
        &ldquo;
      </div>

      {/* SUPERIOR */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-white text-sm font-bold`}
            >
              {review.name.charAt(0)}
              {review.verified && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-black ring-2 ring-white"
                  title="Compra verificada"
                >
                  ✓
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900 truncate">{review.name}</p>
              <p className="text-xs text-neutral-400 truncate">📍 {review.city}</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-neutral-400 whitespace-nowrap">{review.date}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`text-base leading-none ${i < review.rating ? "text-amber-400" : "text-neutral-200"}`}>★</span>
            ))}
          </div>
          <span className="text-xs font-bold text-neutral-700 bg-neutral-100 rounded-md px-1.5 py-0.5">{review.rating}.0</span>
          {review.recommended && <span className="text-[11px] text-emerald-600 font-medium">• Recomienda</span>}
        </div>

        <h4 className="text-base sm:text-[17px] font-bold text-neutral-950 leading-snug mb-2 line-clamp-1 tracking-tight">{review.title}</h4>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-4">{review.comment}</p>
      </div>

      {/* INFERIOR */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 border border-neutral-200/60 px-3 py-1 text-[11px] max-w-[70%] sm:max-w-[75%]">
          <span className="text-xs">🏷️</span>
          <span className="truncate font-medium text-neutral-800">{review.product}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(review.id); }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
            isLiked
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200/60"
          }`}
          title="Marcar como útil"
        >
          <span className="text-xs">👍</span>
          <span className="font-bold">{review.likes}</span>
        </button>
      </div>
    </div>
  );
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef<number | null>(null);

  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Montería");
  const [formProduct, setFormProduct] = useState(POPULAR_PRODUCTS[0]);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formRecommended, setFormRecommended] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tecnoplus_customer_reviews");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setReviews(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const saveReviews = (newReviews: ReviewItem[]) => {
    setReviews(newReviews);
    try { localStorage.setItem("tecnoplus_customer_reviews", JSON.stringify(newReviews)); } catch { /* ignore */ }
  };

  const filteredReviews = useMemo(() => {
    if (filterRating === "all") return reviews;
    return reviews.filter((r) => r.rating === filterRating);
  }, [reviews, filterRating]);

  useEffect(() => {
    if (activeSlide >= filteredReviews.length) setActiveSlide(Math.max(0, filteredReviews.length - 1));
  }, [filteredReviews.length, activeSlide]);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (filteredReviews.length > 0 ? (prev + 1) % filteredReviews.length : 0));
  }, [filteredReviews.length]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => filteredReviews.length > 0 ? (prev - 1 + filteredReviews.length) % filteredReviews.length : 0);
  }, [filteredReviews.length]);

  useEffect(() => {
    if (isPaused || filteredReviews.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, filteredReviews.length, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const handleLike = (id: string) => {
    if (likedReviews[id]) return;
    setLikedReviews((prev) => ({ ...prev, [id]: true }));
    saveReviews(reviews.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r)));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) { setFormError("Por favor ingresa tu nombre."); return; }
    if (!formComment.trim() || formComment.trim().length < 10) { setFormError("Por favor escribe un comentario de al menos 10 caracteres."); return; }

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: formName.trim(),
      city: formCity.trim() || "Montería, Córdoba",
      rating: formRating,
      date: "Hace unos momentos",
      product: formProduct,
      title: formTitle.trim() || (formRating >= 4 ? "¡Excelente experiencia!" : "Opinión del producto"),
      comment: formComment.trim(),
      verified: true,
      recommended: formRecommended,
      likes: 0,
    };

    saveReviews([newReview, ...reviews]);
    setFormName(""); setFormTitle(""); setFormComment(""); setFormRating(5);
    setIsFormOpen(false); setActiveSlide(0); setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4500);
  };

  return (
    <section id="opiniones" className="tp-section relative overflow-hidden bg-[#fafbfe] py-20 sm:py-28 border-t border-b border-gray-100">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-blue-50/40 via-indigo-50/30 to-amber-50/20 blur-3xl pointer-events-none" />

      <div className="tp-container relative z-10">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200/80 px-4 py-1.5 shadow-xs mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-800">4.9 de 5 · Opiniones Verificadas en Colombia</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-950 tracking-tight leading-tight">Lo que dicen nuestros clientes</h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-500 max-w-lg leading-relaxed font-normal">
            Experiencias de compradores en Montería y Colombia. Haz clic en cualquier tarjeta para enfocarla.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              id="open-review-form-btn"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-black active:scale-95"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{isFormOpen ? "Cerrar formulario" : "Dejar mi opinión (0 a 5★)"}</span>
            </button>

            <div className="flex items-center rounded-full bg-white border border-neutral-200/80 p-1 text-xs shadow-xs">
              <button
                onClick={() => { setFilterRating("all"); setActiveSlide(0); }}
                className={`rounded-full px-3.5 py-1 font-semibold transition-colors duration-200 ${filterRating === "all" ? "bg-neutral-950 text-white" : "text-neutral-500 hover:text-neutral-900"}`}
              >
                Todas ({reviews.length})
              </button>
              {[5, 4].map((star) => (
                <button
                  key={star}
                  onClick={() => { setFilterRating(star); setActiveSlide(0); }}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition-colors duration-200 ${filterRating === star ? "bg-neutral-950 text-white" : "text-neutral-500 hover:text-neutral-900"}`}
                >
                  <span>{star}</span><span className="text-amber-400 text-xs">★</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TOAST */}
        {successToast && (
          <div className="mb-8 max-w-md mx-auto rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-900 shadow-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">✓</span>
              <div>
                <p className="text-xs font-bold">¡Tu opinión fue publicada!</p>
                <p className="text-[11px] text-emerald-700">Aparece en primer lugar en el carrusel.</p>
              </div>
            </div>
            <button onClick={() => setSuccessToast(false)} className="text-emerald-700 text-xs font-bold px-2 py-1">✕</button>
          </div>
        )}

        {/* FORMULARIO */}
        {isFormOpen && (
          <div className="mb-14 max-w-2xl mx-auto rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-950">Escribe tu opinión y calificación</h3>
                <p className="text-xs text-neutral-400">Comparte tu experiencia con la comunidad de Tecno+.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-neutral-400 hover:text-neutral-900 text-xs font-semibold px-2 py-1">✕ Cerrar</button>
            </div>

            {formError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{formError}</div>}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">Calificación (0 a 5 estrellas) *</label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-neutral-50 p-2 rounded-2xl border border-neutral-200/80">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating !== null ? hoverRating : formRating) >= star;
                      return (
                        <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(null)} onClick={() => setFormRating(star)} className="p-1 transition-transform hover:scale-125 focus:outline-none" aria-label={`${star} estrellas`}>
                          <span className={`text-2xl ${active ? "text-amber-400" : "text-neutral-200"}`}>★</span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setFormRating(0)} className={`text-xs px-3 py-1.5 rounded-xl border transition-colors duration-200 ${formRating === 0 ? "border-red-500 bg-red-50 text-red-700 font-bold" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}>
                    Marcar 0 estrellas
                  </button>
                  <span className="text-xs font-semibold text-neutral-700">{RATING_LABELS[hoverRating !== null ? hoverRating : formRating]}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Tu nombre *</label>
                  <input type="text" required placeholder="Ej. Andrés Ruiz" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Ciudad / Municipio *</label>
                  <input type="text" placeholder="Ej. Montería, Cereté..." value={formCity} onChange={(e) => setFormCity(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Producto comprado *</label>
                  <select value={formProduct} onChange={(e) => setFormProduct(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 outline-none transition-colors focus:border-black">
                    {POPULAR_PRODUCTS.map((prod) => <option key={prod} value={prod}>{prod}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Título de la opinión</label>
                  <input type="text" placeholder="Ej. ¡Excelente servicio!" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Tu comentario *</label>
                <textarea required rows={3} placeholder="Cuéntanos tu experiencia..." value={formComment} onChange={(e) => setFormComment(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black leading-relaxed" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="recommend-check" checked={formRecommended} onChange={(e) => setFormRecommended(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-black" />
                <label htmlFor="recommend-check" className="text-xs text-neutral-600 cursor-pointer">¿Recomiendas comprar en Tecno+ a otros clientes?</label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">Cancelar</button>
                <button type="submit" className="rounded-full bg-neutral-950 px-6 py-2 text-xs font-bold text-white hover:bg-black transition-colors">Publicar</button>
              </div>
            </form>
          </div>
        )}

        {/* ================= CARRUSEL 3D OPTIMIZADO (SIN BLUR) ================= */}
        {filteredReviews.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center my-6 max-w-md mx-auto">
            <p className="text-sm font-bold text-neutral-950">No hay opiniones con este filtro.</p>
            <button onClick={() => { setFilterRating("all"); setIsFormOpen(true); }} className="mt-3 rounded-full bg-neutral-950 px-5 py-2 text-xs font-bold text-white">Escribir opinión</button>
          </div>
        ) : (
          <div
            className="relative w-full py-4 select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative mx-auto flex items-center justify-center min-h-[410px] sm:min-h-[390px] w-full max-w-5xl"
              style={{ perspective: "1200px" }}
            >
              {filteredReviews.map((rev, index) => {
                const count = filteredReviews.length;
                let diff = index - activeSlide;
                if (diff > count / 2) diff -= count;
                if (diff < -count / 2) diff += count;

                const isCenter = diff === 0;
                const isVisible = Math.abs(diff) <= 2;
                if (!isVisible) return null;

                // Solo transform + opacity: propiedades 100% GPU (no causan repaint)
                let translateX = 0;
                let translateZ = 0;
                let rotateY = 0;
                let scale = 1;
                let opacity = 1;
                let zIndex = 10;

                if (isCenter) {
                  translateZ = 40;
                  opacity = 1;
                  zIndex = 30;
                } else if (Math.abs(diff) === 1) {
                  translateX = diff * 70;
                  translateZ = -60;
                  rotateY = diff * -18;
                  scale = 0.88;
                  opacity = 0.3;
                  zIndex = 20;
                } else {
                  translateX = diff > 0 ? 125 : -125;
                  translateZ = -150;
                  rotateY = diff > 0 ? -26 : 26;
                  scale = 0.72;
                  opacity = 0.08;
                  zIndex = 10;
                }

                return (
                  <div
                    key={rev.id}
                    onClick={() => !isCenter && setActiveSlide(index)}
                    className="absolute w-[86vw] max-w-[420px]"
                    style={{
                      transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity,
                      zIndex,
                      transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease",
                      willChange: "transform, opacity",
                      cursor: !isCenter ? "pointer" : "default",
                    }}
                  >
                    <ReviewCard review={rev} isCenter={isCenter} onLike={handleLike} isLiked={!!likedReviews[rev.id]} />
                  </div>
                );
              })}
            </div>

            {/* Controles */}
            <div className="mt-6 flex items-center justify-center gap-5 max-w-xs mx-auto">
              <button onClick={prevSlide} aria-label="Opinión anterior" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/80 text-neutral-700 hover:text-black hover:border-neutral-400 transition-colors active:scale-95">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className="flex items-center gap-1.5">
                {filteredReviews.map((_, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)} aria-label={`Ir a opinión ${i + 1}`} className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === i ? "w-7 bg-neutral-900" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"}`} />
                ))}
              </div>
              <button onClick={nextSlide} aria-label="Siguiente opinión" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/80 text-neutral-700 hover:text-black hover:border-neutral-400 transition-colors active:scale-95">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
