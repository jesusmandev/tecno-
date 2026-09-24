"use client";

import { useCart } from "@/context/CartContext";
import { mockProducts } from "@/data/mockProducts";

export default function GamerBuyButton() {
  const { openCheckout } = useCart();

  const handleBuy = () => {
    const product = mockProducts.find((p) => p.id === "game-stick-pro-4k");

    if (product) {
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
    }
  };

  return (
    <button
      type="button"
      onClick={handleBuy}
      className="tp-btn primary border-0 cursor-pointer shadow-md hover:shadow-lg transition-transform active:scale-95"
    >
      Comprar consola →
    </button>
  );
}
