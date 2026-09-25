"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { mockProducts, formatPrice, type Product } from "@/data/mockProducts";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "iPhone 17 Pro Max",
  "iPhone 16 Pro Max",
  "Samsung Galaxy S26 Ultra",
  "Lenovo IdeaPad Slim 3",
  "Redmi Note 15 Pro",
  "TvBox G7",
  "Gaming",
];

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Reset state when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery("");
      setSelectedIndex(-1);
      setSpeechError(null);
    }
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter products in real time
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return mockProducts.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchVendor = p.vendor.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchVendor || matchTags;
    });
  }, [query]);

  // Navigate to product and close modal
  const handleSelectProduct = useCallback(
    (product: Product) => {
      onClose();
      router.push(`/productos/${product.id}`);
    },
    [onClose, router]
  );

  // Focus input when opened & handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectProduct(results[selectedIndex]);
        } else if (results.length > 0) {
          handleSelectProduct(results[0]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelectProduct]);

  const handleLucky = () => {
    if (mockProducts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * mockProducts.length);
    handleSelectProduct(mockProducts[randomIndex]);
  };

  // Google Voice Search simulation / Web Speech API
  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;

    // Check for webkitSpeechRecognition or SpeechRecognition
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        stop: () => void;
        onstart: () => void;
        onresult: (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void;
        onerror: (e: unknown) => void;
        onend: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        stop: () => void;
        onstart: () => void;
        onresult: (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void;
        onerror: (e: unknown) => void;
        onend: () => void;
      };
    };

    const SpeechRec =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechError("La búsqueda por voz no es compatible con este navegador.");
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "es-CO";
      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setSpeechError("No se pudo escuchar. Intenta de nuevo.");
        setTimeout(() => setSpeechError(null), 3000);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError("Error al iniciar micrófono.");
      setTimeout(() => setSpeechError(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto bg-black/60 px-4 pt-16 sm:pt-24 pb-12 backdrop-blur-sm transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda de productos estilo Google"
    >
      {/* Search Modal Card */}
      <div
        ref={modalRef}
        className="w-full max-w-2xl transform rounded-3xl bg-white p-4 sm:p-6 shadow-2xl transition-all border border-[#dfe1e5]"
      >
        {/* Top Header: Logo & Close Button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#202124]">
              TECNO<span className="text-[var(--red)]">+</span>
            </span>
            <span className="rounded-md bg-[#f1f3f4] px-2 py-0.5 text-[11px] font-semibold text-[#5f6368]">
              Búsqueda Inteligente
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors"
            title="Cerrar (Esc)"
            aria-label="Cerrar búsqueda"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Google-Style Pill Search Box */}
        <div
          className={`relative flex items-center rounded-full border border-[#dfe1e5] bg-white px-4 py-3 shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-all hover:shadow-[0_2px_8px_rgba(32,33,36,0.35)] focus-within:shadow-[0_2px_12px_rgba(32,33,36,0.3)] ${
            isListening ? "ring-2 ring-[#ea4335]" : ""
          }`}
        >
          {/* Magnifying Glass Icon (Google style) */}
          <div className="mr-3 text-[#9aa0a6] flex-shrink-0">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder={
              isListening
                ? "Escuchando... Di lo que buscas"
                : "Buscar celulares, consolas, combos, accesorios..."
            }
            className="w-full bg-transparent text-base text-[#202124] placeholder-[#70757a] outline-none"
          />

          {/* Clear Button (if query not empty) */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[#70757a] hover:bg-[#f1f3f4] hover:text-[#202124]"
              title="Borrar texto"
            >
              ✕
            </button>
          )}

          {/* Divider */}
          <div className="mx-2.5 h-6 w-[1px] bg-[#dfe1e5] flex-shrink-0" />

          {/* Google Multi-colored Microphone */}
          <button
            onClick={handleVoiceSearch}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
              isListening ? "animate-pulse bg-red-50" : ""
            }`}
            title="Búsqueda por voz"
            aria-label="Búsqueda por voz"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285f4"
                d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
              />
              <path
                fill="#34a853"
                d="M11 18.92V22h2v-3.08c3.39-.49 6-3.4 6-6.92h-2c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.52 2.61 6.43 6 6.92z"
              />
              <path
                fill="#fbbc05"
                d="M12 17c1.38 0 2.63-.56 3.54-1.46l-1.41-1.41C13.59 14.67 12.84 15 12 15s-1.59-.33-2.12-.88L8.46 15.54C9.37 16.44 10.62 17 12 17z"
              />
              <path
                fill="#ea4335"
                d="M7 11H5c0 1.93.78 3.68 2.05 4.95l1.41-1.41C7.57 13.65 7 12.4 7 11z"
              />
            </svg>
          </button>

          {/* Google Lens Camera Icon */}
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#70757a] ml-1"
            title="Búsqueda visual"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 3H5C3.89543 3 3 3.89543 3 5V7"
                stroke="#4285F4"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
                stroke="#EA4335"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M21 17V19C21 20.1046 20.1046 21 19 21H17"
                stroke="#34A853"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M3 17V19C3 20.1046 3.89543 21 5 21H7"
                stroke="#FBBC05"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="3" fill="#4285F4" />
              <circle cx="16" cy="8" r="0.9" fill="#EA4335" />
            </svg>
          </div>
        </div>

        {/* Voice Search Feedback / Error message */}
        {speechError && (
          <div className="mt-2 text-center text-xs text-red-600 font-medium animate-fadeIn">
            {speechError}
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-[#ea4335] animate-pulse">
            <span className="h-2 w-2 rounded-full bg-[#ea4335]" />
            Micrófono activo. Escuchando...
          </div>
        )}

        {/* RESULTS SECTION */}
        {query.trim() !== "" ? (
          <div className="mt-4 border-t border-[#f1f3f4] pt-3">
            <div className="mb-2 flex items-center justify-between px-2 text-xs text-[#70757a]">
              <span>
                {results.length === 0
                  ? "Sin resultados"
                  : `${results.length} ${
                      results.length === 1 ? "resultado" : "resultados"
                    } para "${query}"`}
              </span>
              <span className="hidden sm:inline">Usa ↑ ↓ para navegar, Enter para abrir</span>
            </div>

            {results.length > 0 ? (
              <ul className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
                {results.map((product, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <li
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#f1f3f4] text-[#202124]"
                          : "hover:bg-[#f8f9fa] text-[#3c4043]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[#f8f9fa] border border-[#e8e8ea] p-0.5">
                          <Image
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>

                        {/* Title & Category */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#202124] group-hover:text-[var(--red)] transition-colors">
                              {product.title}
                            </span>
                            <span className="rounded bg-[#e8f0fe] px-1.5 py-0.5 text-[10px] font-medium text-[#1a73e8] uppercase">
                              {product.category}
                            </span>
                          </div>
                          <p className="truncate text-xs text-[#70757a]">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center gap-2 flex-shrink-0 text-right">
                        <span className="text-sm font-bold text-[#202124]">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-[#70757a] group-hover:text-[var(--red)] transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f9fa] text-[#9aa0a6]">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#202124]">
                  No encontramos resultados para &quot;{query}&quot;
                </p>
                <p className="mt-1 text-xs text-[#70757a]">
                  Revisa la ortografía o intenta con palabras clave más generales.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {POPULAR_SEARCHES.slice(0, 4).map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-full border border-[#dfe1e5] bg-[#f8f9fa] px-3 py-1 text-xs text-[#3c4043] hover:border-[#dadce0] hover:bg-[#f1f3f4]"
                    >
                      Buscar &quot;{term}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* INITIAL EMPTY STATE: Google Buttons & Popular Searches */
          <div className="mt-5 space-y-4">
            {/* Google-style Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (POPULAR_SEARCHES[0]) setQuery(POPULAR_SEARCHES[0]);
                }}
                className="rounded-md border border-[#f8f9fa] bg-[#f8f9fa] px-4 py-2 text-xs sm:text-sm font-medium text-[#3c4043] hover:border-[#dadce0] hover:bg-[#f1f3f4] hover:shadow-xs transition-all"
              >
                Buscar en Tecno+
              </button>
              <button
                onClick={handleLucky}
                className="rounded-md border border-[#f8f9fa] bg-[#f8f9fa] px-4 py-2 text-xs sm:text-sm font-medium text-[#3c4043] hover:border-[#dadce0] hover:bg-[#f1f3f4] hover:shadow-xs transition-all"
              >
                Me siento con suerte 🎲
              </button>
            </div>

            {/* Popular Searches Chips */}
            <div className="border-t border-[#f1f3f4] pt-4">
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#70757a]">
                <svg className="h-3.5 w-3.5 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Búsquedas populares en Montería:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#dfe1e5] bg-white px-3.5 py-1.5 text-xs text-[#3c4043] hover:border-[#bdc1c6] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <span className="text-[#9aa0a6]">🔍</span>
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer shortcuts */}
        <div className="mt-4 flex items-center justify-between border-t border-[#f1f3f4] pt-3 text-[11px] text-[#70757a]">
          <span>Tienda oficial Tecno+ · Montería</span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-[#dfe1e5] bg-[#f8f9fa] px-1.5 py-0.5 font-mono text-[10px] text-[#5f6368]">
              ESC
            </kbd>{" "}
            para cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
