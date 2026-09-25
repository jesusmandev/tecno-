"use client";

import Link from "next/link";
import { formatPrice, type Product } from "@/data/mockProducts";
import ProductImageContainer from "./ProductImageContainer";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  buttonTheme?: "red" | "black";
}

export default function ProductCard({
  product,
  buttonTheme = "red",
}: ProductCardProps) {
  const { openCheckout } = useCart();
  const hasDiscount =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    openCheckout({
      product,
      variant: product.variants[0] || {
        id: `var-${product.id}`,
        title: "Estándar",
        availableForSale: true,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
      },
      quantity: 1,
    });
  };

  return (
    <article className="tp-card" id={`product-${product.id}`}>
      {/* Top badges */}
      <div className="tp-card-top">
        {product.badge ? (
          <span
            className={`tp-badge ${
              product.badgeStyle === "light" ? "light" : ""
            }`}
          >
            {product.badge}
          </span>
        ) : (
          <span />
        )}
        <span className="tp-check">✓</span>
      </div>

      {/* Picture container (Modular for future 3D viewer) */}
      <Link href={`/productos/${product.id}`} className="tp-pic">
        <ProductImageContainer
          src={product.featuredImage.url}
          alt={product.featuredImage.altText}
        />
      </Link>

      {/* Brand */}
      <small>TECNO+</small>

      {/* Title */}
      <Link href={`/productos/${product.id}`}>
        <h3 className="hover:text-[var(--red)] transition-colors">
          {product.title}
        </h3>
      </Link>

      {/* Short Description */}
      <p>{product.description}</p>

      {/* Prices */}
      <div className="tp-prices">
        {hasDiscount && <del>{formatPrice(product.compareAtPrice!)}</del>}
        <b>{formatPrice(product.price)}</b>
      </div>

      {/* Buy Action with Direct Checkout Drawer */}
      <button
        onClick={handleBuy}
        className={`tp-buy-btn ${buttonTheme === "black" ? "black" : ""}`}
      >
        Comprar <span>→</span>
      </button>
    </article>
  );
}
