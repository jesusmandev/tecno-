// =============================================
// data/mockProducts.ts
// Catálogo Tecno+ con datos estructurados para
// fácil migración a Shopify Storefront API.
// =============================================

export interface ProductImage {
  url: string;
  altText: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: number;
  compareAtPrice: number | null;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  category: "celulares" | "gaming" | "combos";
  badge?: string;
  badgeStyle?: "dark" | "light";
  whatsappText: string;
  tags: string[];
  price: number;
  compareAtPrice: number | null;
  currencyCode: string;
  featuredImage: ProductImage;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ComboItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
  whatsappText: string;
}

// =============================================
// CATÁLOGO DE PRODUCTOS TECNO+ (COP)
// =============================================

export const mockProducts: Product[] = [
  // --- CELULARES ---
  {
    id: "iphone-17-pro-max",
    title: "iPhone 17 Pro Max",
    handle: "iphone-17-pro-max",
    description: "256GB · Chip A19 Pro",
    descriptionHtml:
      "<p>El smartphone más potente de Apple con procesador <strong>A19 Pro</strong>, pantalla Super Retina XDR y acabado en titanio aeroespacial.</p><ul><li>256GB de almacenamiento ultrarrápido</li><li>Chip A19 Pro con Neural Engine mejorado</li><li>Cámara con zoom óptico avanzado</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Apple",
    productType: "Celulares",
    category: "celulares",
    badge: "Top ventas",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar iPhone 17 Pro Max",
    tags: ["apple", "iphone", "celular", "gama-alta"],
    price: 4_990_000,
    compareAtPrice: 5_970_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/iphone17promax.jpg",
      altText: "iPhone 17 Pro Max",
    },
    images: [
      {
        url: "/products/iphone17promax.jpg",
        altText: "iPhone 17 Pro Max",
      },
    ],
    variants: [
      {
        id: "var-ip17pm-256",
        title: "256GB - Titanio Natural",
        availableForSale: true,
        price: 4_990_000,
        compareAtPrice: 5_970_000,
      },
      {
        id: "var-ip17pm-512",
        title: "512GB - Titanio Negro",
        availableForSale: true,
        price: 5_590_000,
        compareAtPrice: 6_490_000,
      },
    ],
  },
  {
    id: "iphone-16-pro-max",
    title: "iPhone 16 Pro Max",
    handle: "iphone-16-pro-max",
    description: "256GB · Chip A18 Pro",
    descriptionHtml:
      "<p>El smartphone insignia de Apple con procesador <strong>A18 Pro</strong>, pantalla Super Retina XDR de 6.9 pulgadas y diseño en titanio grado 5 con el nuevo botón de Control de Cámara.</p><ul><li>256GB de almacenamiento de alta velocidad</li><li>Chip A18 Pro con GPU de 6 núcleos y Apple Intelligence</li><li>Cámara Fusion de 48MP con teleobjetivo 5x</li><li>Botón de Control de Cámara táctil y háptico</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Apple",
    productType: "Celulares",
    category: "celulares",
    badge: "Más pedido",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar el iPhone 16 Pro Max",
    tags: ["apple", "iphone", "iphone-16", "pro-max", "celular", "gama-alta"],
    price: 4_450_000,
    compareAtPrice: 5_200_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/phone16promax.jpg",
      altText: "iPhone 16 Pro Max",
    },
    images: [
      {
        url: "/products/phone16promax.jpg",
        altText: "iPhone 16 Pro Max",
      },
    ],
    variants: [
      {
        id: "var-ip16pm-256",
        title: "256GB - Titanio Desierto",
        availableForSale: true,
        price: 4_450_000,
        compareAtPrice: 5_200_000,
      },
      {
        id: "var-ip16pm-512",
        title: "512GB - Titanio Negro",
        availableForSale: true,
        price: 5_050_000,
        compareAtPrice: 5_900_000,
      },
    ],
  },
  {
    id: "lenovo-ideapad-slim-3",
    title: "Lenovo IdeaPad Slim 3 15IRH10",
    handle: "lenovo-ideapad-slim-3",
    description: '15.3" WUXGA Táctil · Core i5-13420H · 16GB RAM · 512GB SSD',
    descriptionHtml:
      "<p>Portátil ultraliviano y de alto rendimiento <strong>Lenovo IdeaPad Slim 3 15IRH10</strong> (Referencia: 83K100WKLM). Equipado con procesador Intel Core de 13.ª generación, pantalla táctil antirreflejo y memoria DDR5 de alta velocidad para máxima productividad.</p><ul><li><strong>Procesador:</strong> Intel Core i5-13420H (8 núcleos: 4P + 4E / 12 hilos, hasta 4.6GHz, 12MB Cache)</li><li><strong>Memoria RAM:</strong> 16GB DDR5-4800 (8GB soldada + 8GB SODIMM)</li><li><strong>Almacenamiento:</strong> 512GB SSD M.2 2242 PCIe 4.0x4 NVMe</li><li><strong>Pantalla:</strong> 15.3\" WUXGA (1920x1200) IPS, 300 nits, Antirreflejo, 45% NTSC, 60Hz, <strong>Táctil</strong></li><li><strong>Sistema Operativo:</strong> FreeDOS</li><li><strong>Puertos:</strong> 2x USB-A (5Gbps), 1x USB-C (5Gbps, Power Delivery 45-65W, DisplayPort 1.2), 1x HDMI 1.4</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Lenovo",
    productType: "Laptops",
    category: "celulares",
    badge: "Pantalla Táctil",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar el portátil Lenovo IdeaPad Slim 3 (Ref: 83K100WKLM)",
    tags: ["lenovo", "ideapad", "laptop", "computador", "portatil", "intel", "core-i5", "tactil", "16gb"],
    price: 2_490_000,
    compareAtPrice: 3_190_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/lenovo.png",
      altText: "Lenovo IdeaPad Slim 3 15IRH10",
    },
    images: [
      {
        url: "/products/lenovo.png",
        altText: "Lenovo IdeaPad Slim 3 15IRH10",
      },
    ],
    variants: [
      {
        id: "var-lenovo-slim3-512",
        title: "16GB RAM / 512GB SSD - Arctic Grey",
        availableForSale: true,
        price: 2_490_000,
        compareAtPrice: 3_190_000,

      },
    ],
  },
  {
    id: "samsung-galaxy-s26-ultra",
    title: "Samsung Galaxy S26 Ultra",
    handle: "samsung-galaxy-s26-ultra",
    description: "256GB + 12GB RAM · Galaxy AI · S-Pen",
    descriptionHtml:
      "<p>El smartphone más potente y avanzado de Samsung con la máxima evolución de <strong>Galaxy AI</strong>, cámara cuádruple de 200MP y chasis en titanio aeroespacial con S-Pen integrado.</p><ul><li><strong>Almacenamiento y RAM:</strong> 256GB UFS 4.1 de ultra velocidad + 12GB RAM LPDDR5X</li><li><strong>Cámara Cuádruple Pro de 200MP:</strong> Sensor de 200MP con OIS mejorado, Teleobjetivo de 50MP con Space Zoom 100x y Ultra Gran Angular de 50MP</li><li><strong>Pantalla:</strong> 6.8\" Dynamic AMOLED 2X QHD+ (3120 x 1440), 120Hz adaptativo, 2.600 nits con cristal Corning Gorilla Armor antirreflejo</li><li><strong>S-Pen Integrado:</strong> Máxima precisión para notas, dibujo y control remoto gestual Air Actions</li><li><strong>Galaxy AI:</strong> Circle to Search con Google, Traducción simultánea en tiempo real de llamadas, Asistente de Notas y edición fotográfica generativa</li><li><strong>Batería y Carga:</strong> 5.000 mAh con carga súper rápida de 45W e inalámbrica Qi2</li><li><strong>Seguridad y Resistencia:</strong> Marco de titanio reforzado y certificación IP68 contra agua y polvo</li><li>Garantía oficial directa con Tecno+</li></ul>",
    vendor: "Samsung",
    productType: "Celulares",
    category: "celulares",
    badge: "Galaxy AI",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar el Samsung Galaxy S26 Ultra 256GB",
    tags: ["samsung", "galaxy", "s26", "ultra", "s26-ultra", "celular", "galaxy-ai", "200mp", "s-pen"],
    price: 3_450_000,
    compareAtPrice: 4_190_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/samsung s26 ultra.jpg",
      altText: "Samsung Galaxy S26 Ultra 256GB",
    },
    images: [
      {
        url: "/products/samsung s26 ultra.jpg",
        altText: "Samsung Galaxy S26 Ultra 256GB",
      },
    ],
    variants: [
      {
        id: "var-s26u-256-black",
        title: "256GB / 12GB RAM - Titanium Black",
        availableForSale: true,
        price: 3_450_000,
        compareAtPrice: 4_190_000,
      },
      {
        id: "var-s26u-256-gray",
        title: "256GB / 12GB RAM - Titanium Gray",
        availableForSale: true,
        price: 3_450_000,
        compareAtPrice: 4_190_000,
      },
    ],
  },
  {
    id: "redmi-note-15-pro",
    title: "Redmi Note 15 Pro",
    handle: "redmi-note-15-pro",
    description: "256GB + 12GB RAM · Cámara 200MP",
    descriptionHtml:
      "<p>La mejor relación calidad-precio. Impresionante cámara de <strong>200MP</strong> y pantalla AMOLED curva de gran fluidez.</p><ul><li>256GB de memoria interna + 12GB RAM</li><li>Sensor principal de 200MP con OIS</li><li>Batería de 5000 mAh con turbo charge</li><li>Pantalla AMOLED 120Hz</li></ul>",
    vendor: "Xiaomi",
    productType: "Celulares",
    category: "gaming",
    badge: "200MP",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar Redmi Note 15 Pro",
    tags: ["xiaomi", "redmi", "celular", "200mp"],
    price: 1_250_000,
    compareAtPrice: 1_300_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/reminote15pro.jpg",
      altText: "Redmi Note 15 Pro",
    },
    images: [
      {
        url: "/products/reminote15pro.jpg",
        altText: "Redmi Note 15 Pro",
      },
    ],
    variants: [
      {
        id: "var-redmi15pro-256",
        title: "256GB / 12GB RAM - Azul Glaciar",
        availableForSale: true,
        price: 1_250_000,
        compareAtPrice: 1_300_000,
      },
    ],
  },

  // --- CATÁLOGO GADGETS & DISPOSITIVOS TOP ---
  {
    id: "lenovo-ideapad-slim-3-cat",
    title: "Lenovo IdeaPad Slim 3 15IRH10",
    handle: "lenovo-ideapad-slim-3",
    description: '15.3" WUXGA Táctil · Core i5-13420H · 16GB RAM · 512GB SSD',
    descriptionHtml:
      "<p>Portátil ultraliviano y de alto rendimiento <strong>Lenovo IdeaPad Slim 3 15IRH10</strong> (Referencia: 83K100WKLM). Equipado con procesador Intel Core de 13.ª generación, pantalla táctil antirreflejo y memoria DDR5 de alta velocidad para máxima productividad.</p><ul><li><strong>Procesador:</strong> Intel Core i5-13420H (8 núcleos: 4P + 4E / 12 hilos, hasta 4.6GHz, 12MB Cache)</li><li><strong>Memoria RAM:</strong> 16GB DDR5-4800 (8GB soldada + 8GB SODIMM)</li><li><strong>Almacenamiento:</strong> 512GB SSD M.2 2242 PCIe 4.0x4 NVMe</li><li><strong>Pantalla:</strong> 15.3\" WUXGA (1920x1200) IPS, 300 nits, Antirreflejo, 45% NTSC, 60Hz, <strong>Táctil</strong></li><li><strong>Sistema Operativo:</strong> FreeDOS</li><li><strong>Puertos:</strong> 2x USB-A (5Gbps), 1x USB-C (5Gbps, Power Delivery 45-65W, DisplayPort 1.2), 1x HDMI 1.4</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Lenovo",
    productType: "Laptops",
    category: "gaming",
    badge: "Pantalla Táctil",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar el portátil Lenovo IdeaPad Slim 3 (Ref: 83K100WKLM)",
    tags: ["lenovo", "ideapad", "laptop", "computador", "portatil", "intel", "core-i5", "tactil", "16gb"],
    price: 2_490_000,
    compareAtPrice: 3_190_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/lenovo.png",
      altText: "Lenovo IdeaPad Slim 3 15IRH10",
    },
    images: [
      {
        url: "/products/lenovo.png",
        altText: "Lenovo IdeaPad Slim 3 15IRH10",
      },
    ],
    variants: [
      {
        id: "var-lenovo-slim3-512-cat",
        title: "16GB RAM / 512GB SSD - Arctic Grey",
        availableForSale: true,
        price: 2_490_000,
        compareAtPrice: 3_190_000,
      },
    ],
  },
  {
    id: "iphone-16-pro-max-catalog",
    title: "iPhone 16 Pro Max",
    handle: "iphone-16-pro-max-titanio",
    description: "256GB · Chip A18 Pro · Titanio",
    descriptionHtml:
      "<p>El smartphone insignia de Apple con procesador <strong>A18 Pro</strong>, pantalla Super Retina XDR de 6.9 pulgadas y diseño en titanio grado 5 con el nuevo botón de Control de Cámara táctil.</p><ul><li>256GB de almacenamiento ultrarrápido</li><li>Chip A18 Pro con GPU de 6 núcleos y Apple Intelligence</li><li>Cámara Fusion de 48MP con teleobjetivo 5x</li><li>Botón de Control de Cámara táctil y háptico</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Apple",
    productType: "Celulares",
    category: "gaming",
    badge: "Más pedido",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar el iPhone 16 Pro Max por $4.450.000 COP",
    tags: ["apple", "iphone", "iphone-16", "celular", "gama-alta"],
    price: 4_450_000,
    compareAtPrice: 5_200_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/iphone-16-pro-max.jpg",
      altText: "iPhone 16 Pro Max",
    },
    images: [
      {
        url: "/products/iphone-16-pro-max.jpg",
        altText: "iPhone 16 Pro Max",
      },
    ],
    variants: [
      {
        id: "var-ip16pm-cat-256",
        title: "256GB - Titanio Desierto",
        availableForSale: true,
        price: 4_450_000,
        compareAtPrice: 5_200_000,
      },
    ],
  },
  {
    id: "samsung-galaxy-tab-s9",
    title: "Samsung Galaxy Tab S9 Ultra",
    handle: "samsung-galaxy-tab-s9-ultra",
    description: "14.6\" Dynamic AMOLED 2X · 256GB + S-Pen",
    descriptionHtml:
      "<p>La tablet insignia definitiva para trabajo profesional y gaming intensivo con pantalla <strong>Dynamic AMOLED 2X de 14.6 pulgadas</strong> a 120Hz y procesador Snapdragon 8 Gen 2.</p><ul><li>Pantalla Dynamic AMOLED 2X de 14.6\" con Vision Booster</li><li>256GB de memoria de alta velocidad + 12GB RAM</li><li>S-Pen de latencia ultra baja incluido en caja</li><li>Resistencia al agua y polvo IP68</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Samsung",
    productType: "Tablets",
    category: "gaming",
    badge: "Gama Alta",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar la Samsung Galaxy Tab S9 Ultra por $2.850.000 COP",
    tags: ["samsung", "tablet", "galaxy-tab", "spen", "oled", "gama-alta"],
    price: 2_850_000,
    compareAtPrice: 3_450_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/galaxy_tab_s9.jpg",
      altText: "Samsung Galaxy Tab S9 Ultra",
    },
    images: [
      {
        url: "/products/galaxy_tab_s9.jpg",
        altText: "Samsung Galaxy Tab S9 Ultra",
      },
    ],
    variants: [
      {
        id: "var-gtabs9-256",
        title: "256GB / 12GB RAM - Gris Grafito",
        availableForSale: true,
        price: 2_850_000,
        compareAtPrice: 3_450_000,
      },
    ],
  },
  {
    id: "apple-watch-ultra-2",
    title: "Apple Watch Ultra 2 Titanium",
    handle: "apple-watch-ultra-2-titanium",
    description: "49mm · Titanio Aeroespacial · GPS + Celular",
    descriptionHtml:
      "<p>El smartwatch más resistente y capaz de Apple, con caja de titanio aeroespacial de 49mm, pantalla de 3000 nits legible bajo sol directo y batería de hasta 72 horas en modo ahorro.</p><ul><li>Caja de titanio aeroespacial de 49mm con cristal de zafiro</li><li>Pantalla Retina siempre activa de 3000 nits</li><li>GPS de doble frecuencia de máxima precisión</li><li>Sensores avanzados de salud, temperatura y oxígeno</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Apple",
    productType: "Smartwatches",
    category: "gaming",
    badge: "Titanio",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar el Apple Watch Ultra 2 por $890.000 COP",
    tags: ["apple", "watch", "ultra", "titanio", "smartwatch", "fitness"],
    price: 890_000,
    compareAtPrice: 1_150_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/apple_watch_ultra.jpg",
      altText: "Apple Watch Ultra 2 Titanium",
    },
    images: [
      {
        url: "/products/apple_watch_ultra.jpg",
        altText: "Apple Watch Ultra 2 Titanium",
      },
    ],
    variants: [
      {
        id: "var-awu2-orange",
        title: "49mm Titanio - Correa Ocean Naranja",
        availableForSale: true,
        price: 890_000,
        compareAtPrice: 1_150_000,
      },
    ],
  },
  {
    id: "galaxy-buds-pro",
    title: "Galaxy Buds Pro Inalámbricos",
    handle: "galaxy-buds-pro-inalambricos",
    description: "Cancelación Activa de Ruido (ANC) · Audio 360",
    descriptionHtml:
      "<p>Audífonos inalámbricos de fidelidad estudio con <strong>Cancelación Activa de Ruido Inteligente</strong>, sonido inmersivo 360 con seguimiento de cabeza y llamadas ultranítidas.</p><ul><li>Cancelación Activa de Ruido inteligente con modo ambiente</li><li>Altavoces de 2 vías con sonido sintonizado profesional</li><li>Resistencia al agua certificada IPX7</li><li>Estuche de carga inalámbrica rápida Qi</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Samsung",
    productType: "Audio",
    category: "gaming",
    badge: "Top Sonido",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar los Galaxy Buds Pro por $420.000 COP",
    tags: ["samsung", "buds", "audio", "auriculares", "anc", "bluetooth"],
    price: 420_000,
    compareAtPrice: 520_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/galaxy_buds_pro.jpg",
      altText: "Galaxy Buds Pro Inalámbricos",
    },
    images: [
      {
        url: "/products/galaxy_buds_pro.jpg",
        altText: "Galaxy Buds Pro Inalámbricos",
      },
    ],
    variants: [
      {
        id: "var-gbudspro-white",
        title: "Blanco Glaciar - Audio 360",
        availableForSale: true,
        price: 420_000,
        compareAtPrice: 520_000,
      },
    ],
  },
  {
    id: "parlantes-premium-30w",
    title: "Parlantes Premium 30W RGB",
    handle: "parlantes-premium-30w",
    description: "Recargables · Iluminación LED RGB",
    descriptionHtml:
      "<p>Potente parlante de 30W con bajos profundos, batería recargable de larga duración y luces dinámicas RGB.</p><ul><li>30W de potencia real</li><li>Batería recargable para más de 8 horas</li><li>Luces LED RGB con modos dinámicos</li><li>Conectividad Bluetooth 5.3</li></ul>",
    vendor: "Tecno+",
    productType: "Audio",
    category: "gaming",
    badge: "Top Sonido",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar Parlantes Premium 30W por $260.000 COP",
    tags: ["parlantes", "audio", "bluetooth", "rgb"],
    price: 260_000,
    compareAtPrice: 320_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/parlante_rgb.jpg",
      altText: "Parlantes Premium 30W RGB",
    },
    images: [
      {
        url: "/products/parlante_rgb.jpg",
        altText: "Parlantes Premium 30W RGB",
      },
    ],
    variants: [
      {
        id: "var-parlante30w",
        title: "Negro RGB",
        availableForSale: true,
        price: 260_000,
        compareAtPrice: 320_000,
      },
    ],
  },
  {
    id: "redmi-watch-5-active",
    title: "Redmi Watch 5 Active",
    handle: "redmi-watch-5-active",
    description: "Pantalla 2.0” · 18 días de batería",
    descriptionHtml:
      '<p>Smartwatch con pantalla de <strong>2.0 pulgadas</strong> ultranítida, llamadas Bluetooth con cancelación de ruido y autonomía de hasta 18 días.</p><ul><li>Pantalla ultra grande de 2.0 pulgadas</li><li>Hasta 18 días de batería por carga</li><li>Monitoreo continuo de salud y deporte</li><li>Llamadas Bluetooth con altavoz integrado</li></ul>',
    vendor: "Xiaomi",
    productType: "Smartwatches",
    category: "gaming",
    badge: "Tecnología",
    badgeStyle: "light",
    whatsappText: "Hola Tecno+, quiero comprar Redmi Watch 5 Active",
    tags: ["smartwatch", "xiaomi", "reloj", "salud"],
    price: 189_900,
    compareAtPrice: 240_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/redmi_watch5_studio.jpg",
      altText: "Redmi Watch 5 Active",
    },
    images: [
      {
        url: "/products/redmi_watch5_studio.jpg",
        altText: "Redmi Watch 5 Active",
      },
    ],
    variants: [
      {
        id: "var-rw5active",
        title: "Negro Espacial",
        availableForSale: true,
        price: 189_900,
        compareAtPrice: 240_000,
      },
    ],
  },
  {
    id: "tvbox-g7",
    title: "TvBox G7 Edición Araña",
    handle: "tvbox-g7-edicion-arana",
    description: "28.000 juegos + TV Box 4K",
    descriptionHtml:
      "<p>Transforma tu televisor en una potente consola retro y centro multimedia con resolución 4K y más de 28.000 títulos clásicos.</p><ul><li>Más de 28.000 juegos preinstalados</li><li>Salida HDMI con soporte 4K</li><li>Mandos inalámbricos incluidos</li><li>Acceso a apps de streaming</li></ul>",
    vendor: "Tecno+",
    productType: "Gadgets",
    category: "gaming",
    badge: "Tecnología",
    badgeStyle: "light",
    whatsappText: "Hola Tecno+, quiero comprar TvBox G7 Edición Araña",
    tags: ["tvbox", "gaming", "retro", "4k"],
    price: 180_000,
    compareAtPrice: 220_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/tvbox_g7_studio.jpg",
      altText: "TvBox G7 Edición Araña",
    },
    images: [
      {
        url: "/products/tvbox_g7_studio.jpg",
        altText: "TvBox G7 Edición Araña",
      },
    ],
    variants: [
      {
        id: "var-tvboxg7",
        title: "Edición Araña 4K",
        availableForSale: true,
        price: 180_000,
        compareAtPrice: 220_000,
      },
    ],
  },
  {
    id: "game-stick-pro-4k",
    title: "Game Stick Pro 4K M15",
    handle: "game-stick-pro-4k-m15",
    description: "2 mandos 2.4G · Plug & Play",
    descriptionHtml:
      "<p>Conéctalo directo a la entrada HDMI de tu TV o monitor y empieza a jugar de inmediato con sus dos mandos 2.4G sin retrasos.</p><ul><li>Diseño portable Plug & Play</li><li>2 mandos inalámbricos incluidos</li><li>Emuladores múltiples incorporados</li><li>Salida HDMI ultra nítida</li></ul>",
    vendor: "Tecno+",
    productType: "Gaming",
    category: "gaming",
    badge: "Tecnología",
    badgeStyle: "light",
    whatsappText: "Hola Tecno+, quiero comprar Game Stick Pro 4K M15",
    tags: ["gamestick", "gaming", "retro", "mandos"],
    price: 180_000,
    compareAtPrice: 210_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/gamestick_studio.jpg",
      altText: "Game Stick Pro 4K M15",
    },
    images: [
      {
        url: "/products/gamestick_studio.jpg",
        altText: "Game Stick Pro 4K M15",
      },
    ],
    variants: [
      {
        id: "var-gamestickm15",
        title: "Estándar 4K",
        availableForSale: true,
        price: 180_000,
        compareAtPrice: 210_000,
      },
    ],
  },
  {
    id: "airpods-max-1-1",
    title: "AirPods Max 1.1",
    handle: "airpods-max-1-1",
    description: "Audio espacial · Conexión Bluetooth",
    descriptionHtml:
      "<p>Diadema inalámbrica con almohadillas acolchadas, sonido envolvente y acabado premium.</p><ul><li>Conectividad Bluetooth de largo alcance</li><li>Cancelación pasiva de ruido</li><li>Almohadillas ergonómicas ultra suaves</li><li>Garantía directa con Tecno+</li></ul>",
    vendor: "Apple Style",
    productType: "Audio",
    category: "gaming",
    badge: "Favorito",
    badgeStyle: "dark",
    whatsappText: "Hola Tecno+, quiero comprar AirPods Max 1.1 por $85.000 COP",
    tags: ["airpods", "audio", "diadema", "bluetooth"],
    price: 85_000,
    compareAtPrice: 120_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/headphones.jpg",
      altText: "AirPods Max 1.1",
    },
    images: [
      {
        url: "/products/headphones.jpg",
        altText: "AirPods Max 1.1",
      },
    ],
    variants: [
      {
        id: "var-apmax-black",
        title: "Negro Espacial",
        availableForSale: true,
        price: 85_000,
        compareAtPrice: 120_000,
      },
    ],
  },
  {
    id: "cable-usbc-lightning",
    title: "Cable USB-C a Lightning",
    handle: "cable-usbc-lightning",
    description: "1 metro · Carga rápida",
    descriptionHtml:
      "<p>Cable de carga y transferencia de datos ultrarrápido compatible con iPhone, iPad y accesorios Apple.</p><ul><li>1 metro de longitud de alta resistencia</li><li>Soporta carga rápida PD</li><li>Conectores reforzados antiroturas</li><li>Garantía Tecno+</li></ul>",
    vendor: "Tecno+",
    productType: "Accesorios",
    category: "gaming",
    badge: "Tecnología",
    badgeStyle: "light",
    whatsappText: "Hola Tecno+, quiero comprar Cable USB-C a Lightning",
    tags: ["cable", "lightning", "usbc", "accesorios"],
    price: 75_000,
    compareAtPrice: 95_000,
    currencyCode: "COP",
    featuredImage: {
      url: "/products/cable_usbc_studio.jpg",
      altText: "Cable USB-C a Lightning",
    },
    images: [
      {
        url: "/products/cable_usbc_studio.jpg",
        altText: "Cable USB-C a Lightning",
      },
    ],
    variants: [
      {
        id: "var-cableusbc",
        title: "1 Metro - Blanco",
        availableForSale: true,
        price: 75_000,
        compareAtPrice: 95_000,
      },
    ],
  },
];

// =============================================
// COMBOS ESPECIALES
// =============================================

export const mockCombos: ComboItem[] = [
  {
    id: "combo-forro-vidrio-samsung-s25-ultra",
    title: "Forro Rígido + Vidrio Pantalla Para Samsung Galaxy S25 Ultra",
    subtitle: "6 CUOTAS DE $7.483 COP",
    description: "Incluye un estuche rígido transparente en TPU resistente a golpes y un vidrio templado funcional con la huella.",
    price: 44_900,
    compareAtPrice: null,
    imageUrl: "/products/combos/combo-forro-vidrio-samsung.png",
    whatsappText: "Hola Tecno+, quiero el Forro Rígido + Vidrio Pantalla Para Samsung Galaxy S25 Ultra",
  },
  {
    id: "combo-redmi-15c-vidrio-forro",
    title: "Combo Celular Redmi 15C 128GB + Vidrio Templado y Forro",
    subtitle: "6 CUOTAS DE $96.666 COP",
    description: "Celular Xiaomi Redmi 15C (128 GB) nuevo en caja sellada + Vidrio templado 9D de alta definición + Forro protector antigolpes.",
    price: 580_000,
    compareAtPrice: 650_000,
    imageUrl: "/products/combos/combo-forro-vidrio-redmi15c.jpg",
    whatsappText: "Hola Tecno+, quiero el Combo Celular Redmi 15C 128GB + Vidrio Templado y Forro ($580.000 COP)",
  },
  {
    id: "combo-samsung-a07-vidrio-forro",
    title: "Combo Celular Samsung Galaxy A07 64GB + Vidrio Templado y Forro",
    subtitle: "6 CUOTAS DE $70.000 COP",
    description: "Celular Samsung Galaxy A07 (64 GB) nuevo en caja sellada + Vidrio templado premium de borde a borde + Forro antichoque de alta resistencia.",
    price: 420_000,
    compareAtPrice: 490_000,
    imageUrl: "/products/combos/combo-forro-vidrio-samsung-a07.jpg",
    whatsappText: "Hola Tecno+, quiero el Combo Celular Samsung Galaxy A07 64GB + Vidrio Templado y Forro ($420.000 COP)",
  },
];

// =============================================
// HERO & BANNER HIGHLIGHTS
// =============================================

export const heroProduct = {
  title: "iPhone 17 Pro Max",
  imageUrl: "/products/iphone17promax.jpg",
};

export const gamerFeature = {
  eyebrow: "MUNDO GAMER",
  title: "Juega donde quieras.",
  description:
    "Consolas retro, TV Box y accesorios para convertir cualquier pantalla en tu centro de entretenimiento.",
  price: "$180.000 COP",
  images: [
    "/game/8387D90E-BC01-4E57-8D38-682507F7BB47.png",
    "/game/BA9C7E78-E34B-46CE-83D6-15CCBC0A35B4.png",
    "/game/75E85BF7-87F5-4552-AD34-A1B8DA66A2D9.png",
  ],
  alt: "Consola Retro Game Stick Pro 4K",
  whatsappText: "Hola Tecno+, quiero la Consola Retro Game Stick por $180.000 COP",
};

// =============================================
// HELPERS
// =============================================

/**
 * Busca un producto por su ID o handle.
 */
export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id || p.handle === id);
}

/**
 * Filtra productos por categoría.
 */
export function getProductsByCategory(category: Product["category"]): Product[] {
  return mockProducts.filter((p) => p.category === category);
}

/**
 * Formatea un precio en COP al estilo colombiano ($4.990.000).
 */
export function formatPrice(amount: number, currency: string = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
