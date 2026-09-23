"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import {
  getProductById,
  formatPrice,
  mockProducts,
} from "@/data/mockProducts";
import { useCart } from "@/context/CartContext";
import ProductImageContainer from "@/components/ProductImageContainer";

// =============================================
// PAGE COMPONENT
// =============================================

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail productId={product.id} />;
}

// =============================================
// PRODUCT DETAIL (Interactive client component)
// =============================================

function ProductDetail({ productId }: { productId: string }) {
  const product = getProductById(productId)!;
  const { addItem, openCheckout } = useCart();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const variants = product.variants;
  const selectedVariant = variants[selectedVariantIndex] || variants[0];
  const images = product.images;
  const hasMultipleVariants =
    variants.length > 1 || (variants[0] && variants[0].title !== "Default Title");

  const price = selectedVariant?.price ?? product.price;
  const comparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const hasDiscount = comparePrice !== null && comparePrice > price;

  const handleAdd = () => {
    if (!selectedVariant) return;
    addItem(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    openCheckout({
      product,
      variant: selectedVariant,
      quantity,
    });
  };

  return (
    <div className="tp-container py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-[#70757d]">
        <Link href="/" className="transition-colors hover:text-[#111]">
          Inicio
        </Link>
        <span>/</span>
        <Link
          href={`/#${product.category}`}
          className="transition-colors hover:text-[#111] capitalize"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="max-w-[200px] truncate text-[#111] font-semibold">
          {product.title}
        </span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        {/* ===== GALERÍA ===== */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-[24px] border border-[#e8e8ea] bg-[#f6f6f7] p-8 flex items-center justify-center min-h-[380px]">
            {hasDiscount && (
              <div className="absolute left-4 top-4 z-10 rounded-full bg-[var(--red)] px-3 py-1 text-xs font-bold text-white">
                -
                {Math.round(
                  ((comparePrice! - price) / comparePrice!) * 100
                )}
                %
              </div>
            )}

            <ProductImageContainer
              src={images[selectedImageIndex]?.url || product.featuredImage.url}
              alt={images[selectedImageIndex]?.altText || product.title}
              priority
              isDetail
            />
          </div>

          {/* Miniaturas si hay más de 1 imagen */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all p-2 bg-[#f6f6f7] ${
                    idx === selectedImageIndex
                      ? "border-[var(--red)] shadow-md"
                      : "border-[#e8e8ea] hover:border-[#aaa]"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.altText}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== DETALLES ===== */}
        <div className="flex flex-col">
          {/* Badge o Vendor */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider text-[var(--red)] uppercase">
              {product.vendor}
            </span>
            {product.badge && (
              <span className="tp-badge">{product.badge}</span>
            )}
          </div>

          {/* Título */}
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            {product.title}
          </h1>

          {/* Precio */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#111]">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <del className="text-lg text-[#999]">
                {formatPrice(comparePrice!)}
              </del>
            )}
          </div>

          {/* Resumen */}
          <p className="mt-4 text-sm text-[#70757d] leading-relaxed">
            {product.description}
          </p>

          <hr className="my-6 border-[#e8e8ea]" />

          {/* Selector de variantes si existen */}
          {hasMultipleVariants && (
            <div className="mb-6">
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#111]">
                Selecciona versión / capacidad:
              </h2>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant, idx) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantIndex(idx)}
                    disabled={!variant.availableForSale}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                      idx === selectedVariantIndex
                        ? "border-[var(--red)] bg-[var(--red)] text-white"
                        : variant.availableForSale
                        ? "border-[#e8e8ea] bg-white text-[#111] hover:border-[#111]"
                        : "cursor-not-allowed border-[#eee] text-[#ccc] line-through"
                    }`}
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de cantidad */}
          <div className="mb-6">
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#111]">
              Cantidad
            </h2>
            <div className="inline-flex items-center rounded-full border border-[#e8e8ea] bg-white p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-[#70757d] hover:bg-[#f6f6f7] hover:text-[#111]"
              >
                −
              </button>
              <span className="flex h-8 w-10 items-center justify-center text-sm font-bold text-[#111]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-[#70757d] hover:bg-[#f6f6f7] hover:text-[#111]"
              >
                +
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Comprar ahora (Directo a Checkout) */}
            <button
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--red)] py-4 text-sm font-bold text-white shadow-lg transition-transform hover:bg-[var(--red2)] hover:scale-[1.02]"
            >
              Comprar ahora <span>→</span>
            </button>

            {/* Agregar al carrito */}
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full border py-4 text-sm font-bold transition-all ${
                added
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-[#111] bg-white text-[#111] hover:bg-[#111] hover:text-white"
              }`}
            >
              {added ? "✓ ¡Agregado al carrito!" : "Agregar al Carrito"}
            </button>
          </div>

          {/* Garantías de confianza */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-[#e8e8ea] pt-6">
            <div className="p-2">
              <div className="font-bold text-xs text-[#111]">Envíos Colombia</div>
              <div className="text-[11px] text-[#70757d]">24 a 48 horas</div>
            </div>
            <div className="p-2">
              <div className="font-bold text-xs text-[#111]">Compra Segura</div>
              <div className="text-[11px] text-[#70757d]">Pagos confiables</div>
            </div>
            <div className="p-2">
              <div className="font-bold text-xs text-[#111]">Garantía</div>
              <div className="text-[11px] text-[#70757d]">Respaldo oficial</div>
            </div>
            <div className="p-2">
              <div className="font-bold text-xs text-[#111]">Atención Local</div>
              <div className="text-[11px] text-[#70757d]">Montería, Córdoba</div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción detallada HTML */}
      {product.descriptionHtml && (
        <div className="mt-14 rounded-[24px] border border-[#e8e8ea] bg-[#f6f6f7] p-8">
          <h2 className="mb-4 text-xl font-bold text-[#111]">
            Especificaciones y Características
          </h2>
          <div
            className="text-sm text-[#444] leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>p]:mb-3"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>
      )}
    </div>
  );
}
