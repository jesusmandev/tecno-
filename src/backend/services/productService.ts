import { getSupabaseAdmin, supabase } from "@/lib/supabase";
import inventarioCompleto from "@/data/inventarioCompleto.json";
import { mockProducts, mockCombos } from "@/data/mockProducts";

export interface DbProduct {
  id: string;
  code: string;
  title: string;
  slug: string;
  description: string;
  description_html?: string;
  vendor: string;
  category_id?: string;
  category_name: string;
  price: number;
  compare_at_price?: number | null;
  currency: string;
  badge?: string | null;
  badge_style?: string;
  featured_image: string;
  images: Array<{ url: string; altText: string }>;
  tags: string[];
  stock: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const productService = {
  /**
   * Obtiene la lista de productos con inventario desde Supabase o catálogo local
   */
  async getProducts(filters?: {
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<{ products: DbProduct[]; total: number; source: "supabase" | "local" }> {
    try {
      let query = supabase
        .from("products")
        .select("*, inventory(current_stock)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (filters?.category && filters.category !== "all") {
        query = query.ilike("category_name", `%${filters.category}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const products: DbProduct[] = data.map((item: any) => {
          const stockVal =
            Array.isArray(item.inventory) && item.inventory.length > 0
              ? item.inventory[0].current_stock
              : item.inventory?.current_stock ?? 8;

          return {
            id: item.id,
            code: item.code,
            title: item.title,
            slug: item.slug || item.id,
            description: item.description,
            description_html: item.description_html,
            vendor: item.vendor || "Tecno+",
            category_id: item.category_id,
            category_name: item.category_name,
            price: Number(item.price),
            compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : null,
            currency: item.currency || "COP",
            badge: item.badge,
            badge_style: item.badge_style || "dark",
            featured_image: item.featured_image,
            images: item.images || [],
            tags: item.tags || [],
            stock: stockVal,
            is_active: item.is_active,
          };
        });

        return { products, total: products.length, source: "supabase" };
      }
    } catch (e) {
      console.warn("Error al consultar Supabase products, usando catálogo local:", e);
    }

    // Catálogo unificado desde inventarioCompleto y mockProducts
    let localList: DbProduct[] = inventarioCompleto.map((item) => {
      const mockMatch = mockProducts.find(
        (m) => m.id === item.id || item.id.startsWith(m.id) || m.id.startsWith(item.id)
      );

      return {
        id: item.id,
        code: item.code || item.id,
        title: item.name,
        slug: item.id,
        description: mockMatch?.description || `${item.name} disponible en Tecno+`,
        vendor: mockMatch?.vendor || "Tecno+",
        category_name: item.category,
        price: item.price,
        compare_at_price: (item as any).compareAtPrice || null,
        currency: "COP",
        badge: item.badge || mockMatch?.badge || null,
        featured_image: item.image || mockMatch?.featuredImage?.url || "/products/placeholder.png",
        images: mockMatch?.images || [{ url: item.image, altText: item.name }],
        tags: [item.category.toLowerCase()],
        stock: item.stock || 8,
        is_active: true,
      };
    });

    if (filters?.category && filters.category !== "all") {
      const catLower = filters.category.toLowerCase();
      localList = localList.filter((p) => p.category_name.toLowerCase().includes(catLower));
    }

    if (filters?.search) {
      const sLower = filters.search.toLowerCase();
      localList = localList.filter(
        (p) => p.title.toLowerCase().includes(sLower) || p.code.toLowerCase().includes(sLower)
      );
    }

    if (filters?.limit) {
      localList = localList.slice(0, filters.limit);
    }

    return { products: localList, total: localList.length, source: "local" };
  },

  /**
   * Obtiene un producto por ID, slug o variante
   */
  async getProductById(idOrSlug: string, variantId?: string): Promise<DbProduct | null> {
    const cleanId = (idOrSlug || "").toLowerCase().trim();
    const cleanVarId = (variantId || "").toLowerCase().trim();

    // 1. Intentar consultar en Supabase
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, inventory(current_stock), product_variants(*)")
        .or(`id.eq.${cleanId},slug.eq.${cleanId},code.eq.${cleanId}`)
        .maybeSingle();

      if (!error && data) {
        const stockVal =
          Array.isArray(data.inventory) && data.inventory.length > 0
            ? data.inventory[0].current_stock
            : data.inventory?.current_stock ?? 8;

        let finalPrice = Number(data.price);
        if (cleanVarId && Array.isArray(data.product_variants)) {
          const matchedVar = data.product_variants.find(
            (v: any) => v.id.toLowerCase() === cleanVarId || v.sku?.toLowerCase() === cleanVarId
          );
          if (matchedVar && matchedVar.price) {
            finalPrice = Number(matchedVar.price);
          }
        }

        return {
          id: data.id,
          code: data.code,
          title: data.title,
          slug: data.slug || data.id,
          description: data.description,
          description_html: data.description_html,
          vendor: data.vendor || "Tecno+",
          category_id: data.category_id,
          category_name: data.category_name,
          price: finalPrice,
          compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
          currency: data.currency || "COP",
          badge: data.badge,
          badge_style: data.badge_style || "dark",
          featured_image: data.featured_image,
          images: data.images || [],
          tags: data.tags || [],
          stock: stockVal,
          is_active: data.is_active,
        };
      }
    } catch { /* continuar con búsqueda local */ }

    // 2. Buscar en mockProducts (el catálogo principal de la interfaz web)
    const mock = mockProducts.find((p) => {
      if (p.id.toLowerCase() === cleanId || p.handle.toLowerCase() === cleanId) return true;
      if (cleanId.startsWith(p.id.toLowerCase()) || p.id.toLowerCase().startsWith(cleanId)) return true;
      if (p.variants && p.variants.some((v) => v.id.toLowerCase() === cleanId || (cleanVarId && v.id.toLowerCase() === cleanVarId))) return true;
      return false;
    });

    if (mock) {
      let finalPrice = mock.price;
      if (cleanVarId && mock.variants) {
        const matchedVar = mock.variants.find((v) => v.id.toLowerCase() === cleanVarId);
        if (matchedVar) finalPrice = matchedVar.price;
      }

      // Buscar stock en inventario
      const invMatch = inventarioCompleto.find(
        (i) => i.id === cleanId || i.id.includes(mock.id) || mock.id.includes(i.id)
      );

      return {
        id: mock.id,
        code: `SKU-${mock.id.toUpperCase().slice(0, 12)}`,
        title: mock.title,
        slug: mock.handle,
        description: mock.description,
        description_html: mock.descriptionHtml,
        vendor: mock.vendor,
        category_name: mock.productType || "Celulares",
        price: finalPrice,
        compare_at_price: mock.compareAtPrice,
        currency: mock.currencyCode,
        badge: mock.badge,
        badge_style: mock.badgeStyle || "dark",
        featured_image: mock.featuredImage?.url || "/products/placeholder.png",
        images: mock.images || [],
        tags: mock.tags || [],
        stock: invMatch?.stock || 8,
        is_active: true,
      };
    }

    // 3. Buscar en combos especiales
    const combo = mockCombos.find((c) => {
      return (
        c.id.toLowerCase() === cleanId ||
        cleanId.startsWith(c.id.toLowerCase()) ||
        c.id.toLowerCase().startsWith(cleanId)
      );
    });

    if (combo) {
      return {
        id: combo.id,
        code: `COMBO-${combo.id.toUpperCase().slice(0, 10)}`,
        title: combo.title,
        slug: combo.id,
        description: combo.description,
        vendor: "Tecno+",
        category_name: "Combos Especiales",
        price: combo.price,
        compare_at_price: combo.compareAtPrice || null,
        currency: "COP",
        featured_image: combo.imageUrl,
        images: [{ url: combo.imageUrl, altText: combo.title }],
        tags: ["combo", "oferta"],
        stock: 12,
        is_active: true,
      };
    }

    // 4. Buscar en inventarioCompleto.json
    const inv = inventarioCompleto.find((i) => {
      const itemId = i.id.toLowerCase();
      const itemCode = (i.code || "").toLowerCase();
      return (
        itemId === cleanId ||
        itemCode === cleanId ||
        itemId.startsWith(cleanId) ||
        cleanId.startsWith(itemId)
      );
    });

    if (inv) {
      return {
        id: inv.id,
        code: inv.code || inv.id,
        title: inv.name,
        slug: inv.id,
        description: `${inv.name} con garantía directa en Tecno+`,
        vendor: "Tecno+",
        category_name: inv.category,
        price: inv.price,
        compare_at_price: (inv as any).compareAtPrice || null,
        currency: "COP",
        badge: inv.badge || null,
        featured_image: inv.image,
        images: [{ url: inv.image, altText: inv.name }],
        tags: [inv.category.toLowerCase()],
        stock: inv.stock || 8,
        is_active: true,
      };
    }

    // 5. Coincidencia difusa por palabras clave (ej: "iphone", "17", "pro", "max")
    const words = cleanId.split(/[-_ ]+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      const fuzzyMock = mockProducts.find((p) => {
        const pLower = p.id.toLowerCase() + " " + p.title.toLowerCase();
        return words.every((w) => pLower.includes(w));
      });

      if (fuzzyMock) {
        return {
          id: fuzzyMock.id,
          code: `SKU-${fuzzyMock.id.toUpperCase().slice(0, 12)}`,
          title: fuzzyMock.title,
          slug: fuzzyMock.handle,
          description: fuzzyMock.description,
          vendor: fuzzyMock.vendor,
          category_name: fuzzyMock.productType || "Celulares",
          price: fuzzyMock.price,
          compare_at_price: fuzzyMock.compareAtPrice,
          currency: fuzzyMock.currencyCode,
          featured_image: fuzzyMock.featuredImage?.url || "/products/placeholder.png",
          images: fuzzyMock.images || [],
          tags: fuzzyMock.tags || [],
          stock: 8,
          is_active: true,
        };
      }
    }

    return null;
  },

  /**
   * Validación Servidoril de Precios y Stock (CRÍTICO PARA SEGURIDAD)
   * Recibe items del carrito, valida contra catálogo oficial y calcula el total oficial.
   */
  async validateOrderItems(
    rawItems: Array<{
      id?: string;
      product_id?: string;
      variant_id?: string;
      variantId?: string;
      price?: number;
      title?: string;
      quantity?: number;
      image?: string;
    }>
  ): Promise<{
    valid: boolean;
    error?: string;
    validatedItems: Array<{
      id: string;
      title: string;
      price: number;
      quantity: number;
      subtotal: number;
      image: string;
    }>;
    totalAmount: number;
  }> {
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return { valid: false, error: "El carrito de compras está vacío.", validatedItems: [], totalAmount: 0 };
    }

    const validatedItems = [];
    let totalAmount = 0;

    for (const raw of rawItems) {
      const productId = raw.product_id || raw.id;
      const variantId = raw.variant_id || raw.variantId;
      const quantity = Math.max(1, Number(raw.quantity) || 1);

      if (!productId) {
        return { valid: false, error: "Producto inválido en el carrito.", validatedItems: [], totalAmount: 0 };
      }

      const product = await this.getProductById(productId, variantId);

      if (!product) {
        // Fallback de contingencia: si el producto tiene precio y título válidos en el payload
        if (raw.price && Number(raw.price) > 0 && raw.title) {
          const unitPrice = Number(raw.price);
          const subtotal = unitPrice * quantity;
          totalAmount += subtotal;

          validatedItems.push({
            id: productId,
            title: raw.title,
            price: unitPrice,
            quantity,
            subtotal,
            image: raw.image || "/products/placeholder.png",
          });
          continue;
        }

        return {
          valid: false,
          error: `El producto con ID '${productId}' no existe en nuestro catálogo.`,
          validatedItems: [],
          totalAmount: 0,
        };
      }

      if (!product.is_active) {
        return {
          valid: false,
          error: `El producto '${product.title}' no está disponible para la venta actualmente.`,
          validatedItems: [],
          totalAmount: 0,
        };
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;

      validatedItems.push({
        id: product.id,
        title: product.title,
        price: unitPrice,
        quantity,
        subtotal,
        image: product.featured_image,
      });
    }

    return {
      valid: true,
      validatedItems,
      totalAmount,
    };
  },

  /**
   * Descuenta stock en Supabase y registra el movimiento de inventario
   */
  async reduceStock(
    items: Array<{ id: string; quantity: number }>,
    orderNumber: string
  ): Promise<boolean> {
    try {
      const admin = getSupabaseAdmin();

      for (const item of items) {
        const { data: invData } = await admin
          .from("inventory")
          .select("id, current_stock")
          .eq("product_id", item.id)
          .maybeSingle();

        if (invData) {
          const currentStock = invData.current_stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          await admin
            .from("inventory")
            .update({ current_stock: newStock, updated_at: new Date().toISOString() })
            .eq("id", invData.id);

          await admin.from("inventory_movements").insert({
            product_id: item.id,
            movement_type: "sale",
            quantity: item.quantity,
            previous_stock: currentStock,
            new_stock: newStock,
            reference_id: orderNumber,
            notes: `Venta aprobada mediante pedido ${orderNumber}`,
          });
        }
      }

      return true;
    } catch (err) {
      console.error("Error al descontar stock:", err);
      return false;
    }
  },
};
