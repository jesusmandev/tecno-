"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { REAL_CUSTOMER_REVIEWS, type ReviewItem } from "@/data/customerReviews";

export type { ReviewItem };

const INITIAL_REVIEWS: ReviewItem[] = REAL_CUSTOMER_REVIEWS;

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

// Helper para calcular hace cuánto tiempo se publicó la reseña (tiempo relativo dinámico y preciso)
function formatTimeAgo(dateString?: string, createdAt?: string, id?: string): string {
  let rawTimestamp = createdAt || (dateString && !isNaN(Date.parse(dateString)) ? dateString : null);

  // Si no hay timestamp directo pero el ID contiene la marca de tiempo (ej. rev-179025...)
  if (!rawTimestamp && id) {
    const match = id.match(/^rev-(\d{13})/);
    if (match) {
      const ms = parseInt(match[1], 10);
      if (!isNaN(ms) && ms > 1600000000000 && ms <= Date.now()) {
        rawTimestamp = new Date(ms).toISOString();
      }
    }
  }

  if (rawTimestamp) {
    const diffMs = Date.now() - new Date(rawTimestamp).getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));

    if (diffSec < 15) return "Hace unos segundos";
    if (diffSec < 60) return `Hace ${diffSec} seg`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `Hace ${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"}`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `Hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
    const diffYears = Math.floor(diffDays / 365);
    return `Hace ${diffYears} ${diffYears === 1 ? "año" : "años"}`;
  }

  // Si no tiene fecha ISO pero dice 'Hace unos momentos'
  if (!dateString || dateString.toLowerCase().includes("hace unos momentos") || dateString.toLowerCase().includes("hace un momento")) {
    return "Hace unos momentos";
  }

  return dateString;
}

// Helper para comprimir y recortar la imagen seleccionada desde el dispositivo
function compressImage(file: File, maxDim = 240, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality) || canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================
// TARJETA LIGERA DE OPINIÓN
// =============================================
function ReviewCard({
  review,
  isCenter,
  onLike,
  isLiked,
  isAdmin,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: {
  review: ReviewItem;
  isCenter: boolean;
  onLike: (id: string) => void;
  isLiked: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = review.comment.length > 130;
  const avatarGradient = AVATAR_GRADIENTS[(review.name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

  const fullDateTooltip = review.created_at
    ? new Date(review.created_at).toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : review.date;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
              className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-white text-sm font-bold overflow-hidden shadow-xs`}
            >
              {review.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={review.avatar_url}
                  alt={review.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                review.name.charAt(0)
              )}
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
          <span
            className="text-[11px] font-semibold text-neutral-400 whitespace-nowrap tabular-nums bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100"
            title={fullDateTooltip}
          >
            🕒 {formatTimeAgo(review.date, review.created_at, review.id)}
          </span>
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
        
        {isLong ? (
          <div>
            <p
              className={`text-xs sm:text-sm text-neutral-600 leading-relaxed transition-all duration-200 ${
                isExpanded
                  ? "max-h-[135px] sm:max-h-[130px] overflow-y-auto pr-1 select-text"
                  : "line-clamp-3 sm:line-clamp-4"
              }`}
            >
              {review.comment}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="mt-1 text-[11px] font-bold text-neutral-900 hover:text-black hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>{isExpanded ? "Ver menos" : "Ver más"}</span>
              <span className="text-[9px]">{isExpanded ? "▲" : "▼"}</span>
            </button>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-4">{review.comment}</p>
        )}
      </div>

      {/* INFERIOR */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 border border-neutral-200/60 px-3 py-1 text-[11px] max-w-[55%] sm:max-w-[62%]">
          <span className="text-xs">🏷️</span>
          <span className="truncate font-medium text-neutral-800">{review.product}</span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(review.id);
              }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 transition-colors cursor-pointer"
              title="Eliminar opinión permanentemente"
            >
              <span>🗑️</span>
              <span>Borrar</span>
            </button>
          )}

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
    </div>
  );
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("tecnoplus_customer_reviews_v3");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { /* ignore */ }
    }
    return INITIAL_REVIEWS;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Admin Mode States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("tecnoplus_admin_auth") === "true";
      } catch { /* ignore */ }
    }
    return false;
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInputPassword, setAdminInputPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Photo Selector from Device (Gallery / Files / Camera)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formAvatar, setFormAvatar] = useState<string>("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STORAGE_KEY = "tecnoplus_customer_reviews_v3";

  // Cargar de Supabase y cache local
  useEffect(() => {
    // Sincronizar en segundo plano con Supabase (asíncrono)
    async function fetchFromSupabase() {
      try {
        const res = await fetch("/api/reviews");
        const json = await res.json();
        if (json.reviews && Array.isArray(json.reviews) && json.reviews.length > 0) {
          setReviews(json.reviews);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.reviews));
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn("Modo local activo:", err);
      }
    }
    fetchFromSupabase();
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
      return;
    }

    try {
      setIsProcessingPhoto(true);
      const compressedDataUrl = await compressImage(file, 240, 0.85);
      setFormAvatar(compressedDataUrl);
      setFormError(null);
    } catch (err) {
      console.error("Error al procesar foto:", err);
      setFormError("No se pudo procesar la imagen seleccionada.");
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveReviews = (newReviews: ReviewItem[]) => {
    setReviews(newReviews);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newReviews)); } catch { /* ignore */ }
  };

  const filteredReviews = useMemo(() => {
    if (filterRating === "all") return reviews;
    return reviews.filter((r) => r.rating === filterRating);
  }, [reviews, filterRating]);

  const currentSlide = filteredReviews.length > 0 ? Math.min(activeSlide, filteredReviews.length - 1) : 0;

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (filteredReviews.length > 0 ? (prev + 1) % filteredReviews.length : 0));
  }, [filteredReviews.length]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => filteredReviews.length > 0 ? (prev - 1 + filteredReviews.length) % filteredReviews.length : 0);
  }, [filteredReviews.length]);

  // Ticker periódico para actualizar los tiempos relativos en vivo cada 10 segundos
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotación continua cada 3.8 segundos
  useEffect(() => {
    if (isPaused || filteredReviews.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, filteredReviews.length, nextSlide]);

  // Si se pausa (por tocar la tarjeta o botón), reanudar automáticamente tras 6 segundos de inactividad
  useEffect(() => {
    if (!isPaused) return;
    const resumeTimer = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
    return () => clearTimeout(resumeTimer);
  }, [isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const handleLike = async (id: string) => {
    if (likedReviews[id]) return;
    setLikedReviews((prev) => ({ ...prev, [id]: true }));
    const target = reviews.find((r) => r.id === id);
    const newLikes = (target?.likes || 0) + 1;
    saveReviews(reviews.map((r) => (r.id === id ? { ...r, likes: newLikes } : r)));

    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, likes: newLikes }),
      });
    } catch { /* ignore */ }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) { setFormError("Por favor ingresa tu nombre."); return; }
    if (!formComment.trim() || formComment.trim().length < 10) { setFormError("Por favor escribe un comentario de al menos 10 caracteres."); return; }

    setIsSubmitting(true);

    const nowIso = new Date().toISOString();

    const reviewPayload = {
      name: formName.trim(),
      city: formCity.trim() || "Montería, Córdoba",
      rating: formRating,
      product: formProduct,
      title: formTitle.trim() || (formRating >= 4 ? "¡Excelente experiencia!" : "Opinión del producto"),
      comment: formComment.trim(),
      recommended: formRecommended,
      avatar_url: formAvatar || undefined,
      created_at: nowIso,
    };

    const tempId = `rev-${Date.now()}`;
    const optimisticReview: ReviewItem = {
      id: tempId,
      name: reviewPayload.name,
      city: reviewPayload.city,
      rating: reviewPayload.rating,
      date: "Hace unos segundos",
      product: reviewPayload.product,
      title: reviewPayload.title,
      comment: reviewPayload.comment,
      verified: true,
      recommended: reviewPayload.recommended,
      likes: 0,
      avatar_url: formAvatar || undefined,
      created_at: nowIso,
    };

    saveReviews([optimisticReview, ...reviews]);
    setFormTitle(""); setFormComment(""); setFormRating(5); setFormAvatar("");
    setIsFormOpen(false); setActiveSlide(0); setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4500);

    // Enviar a Supabase para persistencia pública permanente
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload),
      });
      const data = await res.json();
      if (data.review) {
        setReviews((prev) => prev.map((r) => (r.id === tempId ? data.review : r)));
      }
    } catch (err) {
      console.error("Error guardando en Supabase:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funciones de Administrador
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = adminInputPassword.trim();
    if (cleanPass === "tecnomasadmin2026") {
      setIsAdmin(true);
      try { sessionStorage.setItem("tecnoplus_admin_auth", "true"); } catch { /* ignore */ }
      setShowAdminModal(false);
      setAdminError(null);
      setAdminInputPassword("");
    } else {
      setAdminError("Contraseña incorrecta. Intenta nuevamente.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    try { sessionStorage.removeItem("tecnoplus_admin_auth"); } catch { /* ignore */ }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("¿Deseas eliminar este comentario para siempre de la tienda y la base de datos?")) return;

    try {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: "tecnomasadmin2026" }),
      });

      if (res.ok) {
        const next = reviews.filter((r) => r.id !== id);
        saveReviews(next);
      } else {
        alert("No se pudo eliminar el comentario. Revisa los permisos.");
      }
    } catch {
      alert("Error de red al intentar borrar.");
    }
  };

  const handleSeedToSupabase = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/reviews/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: "tecnomasadmin2026" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage(`¡Éxito! ${data.message || "Se subieron las opiniones a Supabase."}`);
      } else {
        setSeedMessage(`Aviso: ${data.error || "Asegúrate de haber creado la tabla en SQL Editor."}`);
      }
    } catch {
      setSeedMessage("Error de conexión al sincronizar.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <section id="opiniones" className="tp-section relative overflow-hidden bg-[#fafbfe] py-20 sm:py-28 border-t border-b border-gray-100">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-blue-50/40 via-indigo-50/30 to-amber-50/20 blur-3xl pointer-events-none" />

      <div className="tp-container relative z-10">
        {/* BARRA DE MODO ADMIN SI ESTÁ ACTIVO */}
        {isAdmin && (
          <div className="mb-8 mx-auto max-w-3xl rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👑</span>
              <div>
                <p className="text-xs font-bold">Modo Administrador Activo</p>
                <p className="text-[11px] text-amber-800">Tienes permisos para borrar opiniones directamente de la base de datos.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedToSupabase}
                disabled={isSeeding}
                className="rounded-full bg-neutral-950 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSeeding ? "Sincronizando..." : "⚡ Subir las 84 a Supabase"}
              </button>
              <button
                onClick={handleAdminLogout}
                className="rounded-full border border-amber-400 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {seedMessage && (
          <div className="mb-6 max-w-xl mx-auto rounded-xl bg-blue-50 border border-blue-200 p-3 text-center text-xs font-semibold text-blue-900">
            {seedMessage}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200/80 px-4 py-1.5 shadow-xs mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-800">5.0 de 5 · +80 Opiniones Verificadas en Colombia</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-950 tracking-tight leading-tight">Lo que dicen nuestros clientes</h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-500 max-w-lg leading-relaxed font-normal">
            Experiencias de compradores en Montería y Colombia. Haz clic en cualquier tarjeta para enfocarla.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              id="open-review-form-btn"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-black active:scale-95 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{isFormOpen ? "Cerrar formulario" : "Dejar mi opinión (0 a 5★)"}</span>
            </button>

            <div className="flex items-center rounded-full bg-white border border-neutral-200/80 p-1 text-xs shadow-xs">
              <button
                onClick={() => { setFilterRating("all"); setActiveSlide(0); }}
                className={`rounded-full px-3.5 py-1 font-semibold transition-colors duration-200 cursor-pointer ${filterRating === "all" ? "bg-neutral-950 text-white" : "text-neutral-500 hover:text-neutral-900"}`}
              >
                Todas ({reviews.length})
              </button>
              {[5, 4].map((star) => (
                <button
                  key={star}
                  onClick={() => { setFilterRating(star); setActiveSlide(0); }}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition-colors duration-200 cursor-pointer ${filterRating === star ? "bg-neutral-950 text-white" : "text-neutral-500 hover:text-neutral-900"}`}
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
                <p className="text-[11px] text-emerald-700">Quedó guardada para todos los visitantes.</p>
              </div>
            </div>
            <button onClick={() => setSuccessToast(false)} className="text-emerald-700 text-xs font-bold px-2 py-1 cursor-pointer">✕</button>
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
              <button onClick={() => setIsFormOpen(false)} className="text-neutral-400 hover:text-neutral-900 text-xs font-semibold px-2 py-1 cursor-pointer">✕ Cerrar</button>
            </div>

            {/* SELECTOR DE FOTO DE PERFIL DESDE EL DISPOSITIVO (FOTOS O ARCHIVOS) */}
            <div className="mb-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-neutral-200 bg-white flex items-center justify-center shadow-xs">
                    {formAvatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={formAvatar}
                        alt="Foto de perfil seleccionada"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-neutral-300">👤</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white text-xs shadow-md hover:bg-black transition-colors cursor-pointer"
                    title="Subir foto desde tus archivos o galería"
                  >
                    📷
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-neutral-900">
                      {formAvatar ? "¡Foto seleccionada!" : "Foto de perfil (opcional)"}
                    </p>
                    {formAvatar && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Lista
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {formAvatar
                      ? "Aparecerá en tu tarjeta de opinión junto a tu nombre."
                      : "Puedes elegir una foto desde tu galería, archivos o cámara."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-neutral-300 px-3.5 py-2 text-xs font-bold text-neutral-800 shadow-xs hover:bg-neutral-50 hover:border-neutral-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>🖼️</span>
                  <span>{isProcessingPhoto ? "Cargando..." : formAvatar ? "Cambiar foto" : "Subir foto / archivo"}</span>
                </button>
                {formAvatar && (
                  <button
                    type="button"
                    onClick={() => setFormAvatar("")}
                    className="text-xs font-semibold text-red-600 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Quitar
                  </button>
                )}
              </div>
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
                        <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(null)} onClick={() => setFormRating(star)} className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer" aria-label={`${star} estrellas`}>
                          <span className={`text-2xl ${active ? "text-amber-400" : "text-neutral-200"}`}>★</span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setFormRating(0)} className={`text-xs px-3 py-1.5 rounded-xl border transition-colors duration-200 cursor-pointer ${formRating === 0 ? "border-red-500 bg-red-50 text-red-700 font-bold" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}>
                    Marcar 0 estrellas
                  </button>
                  <span className="text-xs font-semibold text-neutral-700">{RATING_LABELS[hoverRating !== null ? hoverRating : formRating]}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Tu nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Andrés Ruiz"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black"
                  />
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
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-full bg-neutral-950 px-6 py-2 text-xs font-bold text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= CARRUSEL 3D ================= */}
        {filteredReviews.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center my-6 max-w-md mx-auto">
            <p className="text-sm font-bold text-neutral-950">No hay opiniones con este filtro.</p>
            <button onClick={() => { setFilterRating("all"); setIsFormOpen(true); }} className="mt-3 rounded-full bg-neutral-950 px-5 py-2 text-xs font-bold text-white cursor-pointer">Escribir opinión</button>
          </div>
        ) : (
          <div
            className="relative w-full py-4 select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative mx-auto flex items-center justify-center min-h-[410px] sm:min-h-[390px] w-full max-w-5xl"
              style={{ perspective: "1200px" }}
            >
              {filteredReviews.map((rev, index) => {
                const count = filteredReviews.length;
                let diff = index - currentSlide;
                if (diff > count / 2) diff -= count;
                if (diff < -count / 2) diff += count;

                const isCenter = diff === 0;
                const isVisible = Math.abs(diff) <= 2;
                if (!isVisible) return null;

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
                    <ReviewCard
                      review={rev}
                      isCenter={isCenter}
                      onLike={handleLike}
                      isLiked={!!likedReviews[rev.id]}
                      isAdmin={isAdmin}
                      onDelete={handleDeleteReview}
                      onMouseEnter={isCenter ? () => setIsPaused(true) : undefined}
                      onMouseLeave={isCenter ? () => setIsPaused(false) : undefined}
                    />
                  </div>
                );
              })}
            </div>

            {/* Controles */}
            <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
              <button
                onClick={prevSlide}
                aria-label="Opinión anterior"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/80 text-neutral-700 hover:text-black hover:border-neutral-400 transition-colors active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>

              <button
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? "Reanudar giro automático" : "Pausar giro automático"}
                title={isPaused ? "Reanudar giro automático de comentarios" : "Pausar giro automático"}
                className={`flex h-9 px-3 items-center justify-center gap-2 rounded-full border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  !isPaused
                    ? "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    : "bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${!isPaused ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{!isPaused ? "Rotando auto" : "Pausado"}</span>
              </button>

              {filteredReviews.length <= 10 ? (
                <div className="flex items-center gap-1.5">
                  {filteredReviews.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)} aria-label={`Ir a opinión ${i + 1}`} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? "w-7 bg-neutral-900" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"}`} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center px-4 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-neutral-800 shadow-xs">
                  <span>{currentSlide + 1}</span>
                  <span className="mx-1 text-neutral-400">/</span>
                  <span>{filteredReviews.length}</span>
                </div>
              )}

              <button
                onClick={nextSlide}
                aria-label="Siguiente opinión"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/80 text-neutral-700 hover:text-black hover:border-neutral-400 transition-colors active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* BOTÓN DISCRETO DE ACCESO ADMINISTRADOR */}
        <div className="mt-12 flex justify-center">
          {!isAdmin ? (
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 font-medium flex items-center gap-1.5 transition-colors py-1 px-3 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <span>🔒</span>
              <span>Modo Administrador</span>
            </button>
          ) : (
            <button
              onClick={handleAdminLogout}
              className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1.5 transition-colors py-1 px-3 rounded-full bg-amber-50 border border-amber-200 cursor-pointer"
            >
              <span>👑</span>
              <span>Cerrar sesión de Administrador</span>
            </button>
          )}
        </div>

        {/* MODAL DE LOGIN ADMIN */}
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔐</span>
                  <h3 className="text-sm font-bold text-neutral-900">Acceso Administrador</h3>
                </div>
                <button
                  onClick={() => { setShowAdminModal(false); setAdminError(null); setAdminInputPassword(""); }}
                  className="text-neutral-400 hover:text-neutral-900 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-500 mb-4">
                Ingresa la contraseña de administrador para poder borrar comentarios y sincronizar con la base de datos.
              </p>

              {adminError && (
                <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-[11px] font-semibold text-red-600 border border-red-200">
                  {adminError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Contraseña de admin"
                    value={adminInputPassword}
                    onChange={(e) => setAdminInputPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAdminModal(false); setAdminError(null); setAdminInputPassword(""); }}
                    className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-neutral-950 px-5 py-1.5 text-xs font-bold text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    Ingresar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
