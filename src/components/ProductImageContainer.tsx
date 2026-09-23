// =============================================
// components/ProductImageContainer.tsx
// Componente MODULAR para la imagen del producto.
// Diseñado para ser reemplazado fácilmente por un
// visor 3D, canvas WebGL, o modelo interactivo (Three.js).
// =============================================

import Image from "next/image";

interface ProductImageContainerProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  isDetail?: boolean;
}

/**
 * Contenedor de imagen del producto modular.
 *
 * NOTA DE ARQUITECTURA:
 * Separado para permitir swap futuro por Three.js / React Three Fiber / GLTF.
 */
export default function ProductImageContainer({
  src,
  alt,
  priority = false,
  className = "",
  isDetail = false,
}: ProductImageContainerProps) {
  if (isDetail) {
    return (
      <div
        className={`relative w-full aspect-square max-h-[500px] flex items-center justify-center p-6 bg-[#f6f6f7] rounded-[24px] overflow-hidden ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4 transition-transform duration-500 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={240}
        height={220}
        priority={priority}
        className="max-w-[92%] h-[220px] object-contain transition-transform duration-350"
      />
    </div>
  );
}
