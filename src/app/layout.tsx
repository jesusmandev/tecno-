import type { Metadata } from "next";
import Image from "next/image";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Model3DPreloader from "@/components/Model3DPreloader";
import VisitorTracker from "@/components/VisitorTracker";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tecno+",
  description:
    "Celulares, accesorios, gaming y gadgets seleccionados en Montería, Córdoba con envíos a toda Colombia.",
  icons: {
    icon: "/logo/logotecno.png",
    shortcut: "/logo/logotecno.png",
    apple: "/logo/logotecno.png",
  },
  keywords: [
    "Tecno+",
    "tecnología",
    "iPhone 17 Pro Max",
    "Redmi",
    "Samsung",
    "gaming",
    "Montería",
    "Colombia",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    title: "Tecno+",
    description:
      "Celulares, accesorios, gaming y gadgets seleccionados para que encuentres lo que necesitas sin complicaciones.",
    siteName: "Tecno+",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo/logotecno.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/logotecno.png" />

        {/* =============================================
            PRELOAD & PREFETCH 3D MODELS (CATALOG BANNER)
            Carga anticipada para evitar esperas en /catalogo
            ============================================= */}
        <link rel="prefetch" href="/draco/gltf/draco_decoder.wasm" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/draco/gltf/draco_wasm_wrapper.js" as="script" crossOrigin="anonymous" />
        <link rel="prefetch" href="/phoneglb/apple_iphone_17_pro_max-v1.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/phoneglb/apple_iphone_duo_fold_star_white_2026_animated-v1.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/phoneglb/phone18-v1.glb" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Bold.co Pasarela Oficial de Pagos */}
        <Script
          src="https://checkout.bold.co/library/boldPaymentButton.js"
          strategy="lazyOnload"
        />
        <Model3DPreloader />
        <SmoothScrollProvider>
          <CartProvider>
            <VisitorTracker />
            <Navbar />
            {children}

            {/* =============================================
                ANIMATED TECNO+ FOOTER
                ============================================= */}
            <Footer />

            {/* =============================================
                FLOATING WHATSAPP BUTTON
                ============================================= */}
            <a
              className="tp-float"
              href="https://wa.me/573043547935?text=Hola%20Tecno%2B%2C%20quiero%20asesor%C3%ADa%20para%20comprar%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp"
              title="Habla con nosotros en WhatsApp"
            >
              {/* WhatsApp Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </CartProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
