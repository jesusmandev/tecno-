import Image from "next/image";
import Link from "next/link";
import {
  mockProducts,
  mockCombos,
  gamerFeature,
  getProductsByCategory,
  formatPrice,
} from "@/data/mockProducts";
import ProductCard from "@/components/ProductCard";
import GamerCarousel from "@/components/GamerCarousel";
import ReviewsSection from "@/components/ReviewsSection";

export default function HomePage() {
  const celulares = getProductsByCategory("celulares");
  const gadgets = getProductsByCategory("gaming");

  return (
    <main>
      {/* =============================================
          1. HERO SECTION (FULL SCREEN APPLE STYLE)
          ============================================= */}
      <section className="tp-hero">
        {/* Full Screen HD Background Image */}
        <div className="tp-hero-bg">
          <Image
            src="/homepague/fondotecnopage.jpg"
            alt="Tecno+ Tecnología Apple Style"
            fill
            priority
            unoptimized
            className="tp-hero-bg-img"
            sizes="100vw"
          />
          <div className="tp-hero-bg-overlay" />
          <div className="tp-hero-bg-bottom-fade" />
        </div>

        {/* Hero Content */}
        <div className="tp-container relative z-10 w-full">
          <div className="tp-hero-content">
            <span className="tp-eyebrow">TECNO+</span>
            <h1>
              La tecnología que quieres <span>más cerca de ti.</span>
            </h1>
            <div className="tp-hero-actions">
              <a className="tp-btn primary" href="#celulares">
                Ver productos
              </a>
              <a
                className="tp-btn secondary"
                href="https://wa.me/573043547935?text=Hola%20Tecno%2B%2C%20quiero%20asesor%C3%ADa%20para%20elegir%20un%20producto"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hablar con un asesor
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          2. TRUST BAR (BENEFICIOS)
          ============================================= */}
      <div className="tp-container">
        <div className="tp-trust" id="beneficios">
          <div>
            <b>Envíos a Colombia</b>
            <span>Despachos de 24–48 horas</span>
          </div>
          <div>
            <b>Compra segura</b>
            <span>Medios de pago disponibles</span>
          </div>
          <div>
            <b>Garantía</b>
            <span>Respaldo para tus equipos</span>
          </div>
          <div>
            <b>Asesoría local</b>
            <span>Estamos en Montería</span>
          </div>
        </div>
      </div>

      {/* =============================================
          3. DISPOSITIVOS DESTACADOS
          ============================================= */}
      <section id="celulares" className="tp-section">
        <div className="tp-container">
          <div className="tp-head">
            <div>
              <h2>Dispositivos destacados</h2>
            </div>
            <p>
              Equipos nuevos y listos para acompañarte todos los días. Compra
              100% segura con tarjeta, PSE o transferencia.
            </p>
          </div>
          <div className="tp-grid">
            {celulares.map((product) => (
              <ProductCard key={product.id} product={product} buttonTheme="red" />
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          4. MUNDO GAMER FEATURE BANNER
          ============================================= */}
      <section className="tp-dark-bg tp-section">
        <div className="tp-container">
          <div className="tp-feature">
            <div className="tp-feature-copy">
              <span className="tp-eyebrow" style={{ color: "#e02424" }}>
                {gamerFeature.eyebrow}
              </span>
              <h2>{gamerFeature.title}</h2>
              <p>{gamerFeature.description}</p>
              <strong>{gamerFeature.price}</strong>
              <div>
                <a
                  className="tp-btn primary"
                  href={`https://wa.me/573043547935?text=${encodeURIComponent(
                    gamerFeature.whatsappText
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Comprar consola →
                </a>
              </div>
            </div>
            <div className="tp-feature-img">
              <GamerCarousel
                images={gamerFeature.images}
                alt={gamerFeature.alt}
                intervalMs={6000}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          5. CATÁLOGO DE GADGETS & ACCESORIOS (8 PRODUCTOS)
          ============================================= */}
      <section id="gaming" className="tp-section">
        <div className="tp-container">
          <div className="tp-head">
            <div>
              <span className="tp-eyebrow">CATÁLOGO</span>
              <h2>Pequeños upgrades. Gran diferencia.</h2>
            </div>
            <p>
              Computadores, teléfonos, audio y tecnología de alto nivel para hacer tu día más cómodo y
              productivo.
            </p>
          </div>
          <div className="tp-grid">
            {gadgets.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                buttonTheme="black"
              />
            ))}
          </div>

          {/* Botón para ver todo el catálogo completo por secciones */}
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <Link
              href="/catalogo"
              className="tp-catalog-cta-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
              <span>Ver catálogo completo por secciones (+500 productos)</span>
              <span>→</span>
            </Link>
            <p className="mt-3 text-xs text-[#70757d]">
              Audífonos, parlantes, cargadores, cables, cómputo y más en Montería.
            </p>
          </div>
        </div>
      </section>

      {/* =============================================
          6. COMBOS TECNO+
          ============================================= */}
      <section id="combos" className="tp-dark-bg tp-section">
        <div className="tp-container">
          <div className="tp-head">
            <div>
              <span className="tp-eyebrow">AHORRA MÁS</span>
              <h2>Combos Tecno+</h2>
            </div>
            <p>
              Paquetes seleccionados para llevar más tecnología por un solo
              precio.
            </p>
          </div>
          <div className="tp-combos">
            {mockCombos.map((combo) => (
              <article key={combo.id} className="tp-combo">
                <div>
                  <small>{combo.subtitle}</small>
                  <h3>{combo.title}</h3>
                  <p>{combo.description}</p>
                  <strong>{formatPrice(combo.price)}</strong>
                  <a
                    className="tp-buy-btn"
                    href={`https://wa.me/573126468514?text=${encodeURIComponent(
                      combo.whatsappText
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Quiero este combo <span>→</span>
                  </a>
                </div>
                <div className="tp-combo-img">
                  <Image
                    src={combo.imageUrl}
                    alt={combo.title}
                    width={260}
                    height={200}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          7. OPINIONES Y VALORACIONES DE CLIENTES (RESEÑAS)
          ============================================= */}
      <ReviewsSection />
    </main>
  );
}
