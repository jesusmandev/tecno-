import inventarioCompleto from "@/data/inventarioCompleto.json";
import { mockProducts, formatPrice } from "@/data/mockProducts";

export interface UnifiedSearchItem {
  id: string;
  title: string;
  description: string;
  code: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
  url: string;
  badge?: string;
  stock?: number;
  source: "catalog" | "inventory";
  _normalizedSearchText: string;
}

/**
 * Normaliza un texto eliminando tildes/acentos, caracteres especiales y pasando a minúsculas.
 * Ej: "PORTÁTIL LENOVO IdeaPad" -> "portatil lenovo ideapad"
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Divide la consulta del usuario en palabras clave individuales (tokens).
 */
export function tokenizeQuery(query: string): string[] {
  const norm = normalizeText(query);
  if (!norm) return [];
  return norm.split(" ").filter((t) => t.length > 0);
}

/**
 * Mapeo de términos y sinónimos comunes para mejorar la búsqueda inteligente
 */
const SYNONYMS: Record<string, string[]> = {
  celular: ["smartphone", "telefono", "movil"],
  celulares: ["smartphone", "smartphones", "telefonos"],
  audifono: ["diadema", "auricular", "headphone", "airpod"],
  audifonos: ["diademas", "auriculares", "headphones", "airpods"],
  cargador: ["adaptador", "fuente", "carg"],
  cargadores: ["adaptadores", "fuentes"],
  pantalla: ["vidrio", "display", "cristal"],
  vidrio: ["vidrios", "cristal", "templado", "protector"],
  forro: ["funda", "case", "estuche"],
  reloj: ["smartwatch", "watch"],
  computador: ["portatil", "laptop", "pc"],
  computadores: ["portatiles", "laptops"],
};

/**
 * Determina si un texto normalizado coincide con todos los tokens de búsqueda.
 */
export function matchesAllTokens(haystack: string, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return true;
  for (const token of queryTokens) {
    if (!haystack.includes(token)) {
      // Verificar sinónimos si el token exacto no coincide
      const syns = SYNONYMS[token];
      if (syns && syns.some((syn) => haystack.includes(syn))) {
        continue;
      }
      return false;
    }
  }
  return true;
}

/**
 * Calcula un puntaje de relevancia para ordenar los resultados de más a menos relevante.
 */
export function calculateRelevance(
  item: UnifiedSearchItem,
  queryTokens: string[],
  normalizedQuery: string
): number {
  let score = 0;
  const normTitle = normalizeText(item.title);
  const normCode = normalizeText(item.code);
  const normCategory = normalizeText(item.category);

  // 1. Coincidencia exacta de código (+1000)
  if (normCode === normalizedQuery) {
    score += 1000;
  } else if (normCode.includes(normalizedQuery)) {
    score += 400;
  }

  // 2. Coincidencia exacta o inicial en título
  if (normTitle === normalizedQuery) {
    score += 800;
  } else if (normTitle.startsWith(normalizedQuery)) {
    score += 500;
  } else if (normTitle.includes(normalizedQuery)) {
    score += 300;
  }

  // 3. Tokens en título (+60 por token)
  for (const token of queryTokens) {
    if (normTitle.includes(token)) {
      score += 60;
      // Bonus si una palabra comienza con el token
      if (normTitle.split(" ").some((w) => w.startsWith(token))) {
        score += 30;
      }
    }
    if (normCategory.includes(token)) {
      score += 25;
    }
    if (item._normalizedSearchText.includes(token)) {
      score += 10;
    }
  }

  // 4. Disponibilidad en bodega
  if ((item.stock ?? 1) > 0) {
    score += 15;
  }

  return score;
}

// Cache de productos unificados para no re-indexar en cada tecla
let cachedUnifiedProducts: UnifiedSearchItem[] | null = null;

/**
 * Obtiene la lista completa y unificada de productos (Catálogo Principal + Inventario Completo de 589 referencias)
 */
export function getAllSearchableProducts(): UnifiedSearchItem[] {
  if (cachedUnifiedProducts) {
    return cachedUnifiedProducts;
  }

  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const list: UnifiedSearchItem[] = [];

  // 1. Agregar productos principales de mockProducts
  for (const p of mockProducts) {
    seenIds.add(p.id);
    if (p.handle) seenIds.add(p.handle);
    const code = p.variants[0]?.id || p.id;
    seenCodes.add(code.toUpperCase());

    const searchableParts = [
      p.title,
      p.id,
      p.handle,
      p.category,
      p.productType,
      p.vendor,
      p.description,
      ...(p.tags || []),
    ];

    list.push({
      id: p.id,
      title: p.title,
      description: p.description,
      code: p.tags[0] || p.id,
      category: p.productType || p.category,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      imageUrl: p.featuredImage.url,
      url: `/productos/${p.id}`,
      badge: p.badge,
      stock: 10,
      source: "catalog",
      _normalizedSearchText: normalizeText(searchableParts.join(" ")),
    });
  }

  // 2. Agregar todas las referencias de inventarioCompleto
  for (const inv of inventarioCompleto as any[]) {
    const invId = inv.id || inv.code;
    const invCode = (inv.code || "").toUpperCase();

    // Evitar duplicar si ya fue incluido por mockProducts
    if (seenIds.has(invId) || (invCode && seenCodes.has(invCode))) {
      continue;
    }

    seenIds.add(invId);
    if (invCode) seenCodes.add(invCode);

    const searchableParts = [
      inv.name,
      inv.code,
      inv.category,
      inv.description,
      inv.jaltechCode,
    ];

    const img = (inv.images && inv.images[0]) || inv.image || "/products/cargador_laptop_generico.jpg";

    list.push({
      id: inv.id,
      title: inv.name,
      description: inv.description || `${inv.category} original disponible en Tecno+`,
      code: inv.code,
      category: inv.category,
      price: inv.price,
      compareAtPrice: inv.compareAtPrice,
      imageUrl: img,
      url: `/productos/${inv.id}`,
      badge: inv.badge,
      stock: inv.stock ?? 1,
      source: "inventory",
      _normalizedSearchText: normalizeText(searchableParts.join(" ")),
    });
  }

  cachedUnifiedProducts = list;
  return list;
}

/**
 * Ejecuta una búsqueda global y devuelve los productos ordenados por relevancia.
 */
export function searchProducts(query: string, limit: number = 30): UnifiedSearchItem[] {
  const q = query.trim();
  if (!q) return [];

  const tokens = tokenizeQuery(q);
  const normalizedQuery = normalizeText(q);
  const allProducts = getAllSearchableProducts();

  const matching: { item: UnifiedSearchItem; score: number }[] = [];

  for (const item of allProducts) {
    if (matchesAllTokens(item._normalizedSearchText, tokens)) {
      const score = calculateRelevance(item, tokens, normalizedQuery);
      matching.push({ item, score });
    }
  }

  // Ordenar de mayor a menor relevancia
  matching.sort((a, b) => b.score - a.score);

  return matching.slice(0, limit).map((m) => m.item);
}
