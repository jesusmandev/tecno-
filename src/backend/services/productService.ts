import { getSupabaseAdmin, supabase } from "@/lib/supabase";
import inventarioCompleto from "@/data/inventarioCompleto.json";

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
   * Obtiene la lista de productos con inventario desde Supabase
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
              : item.inventory?.current_stock ?? 5;

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
      console.warn("Error al consultar Supabase products, usando fallback local:", e);
    }

    // Fallback local desde inventarioCompleto.json
    let localList: DbProduct[] = inventarioCompleto.map((item) => ({
      id: item.id,
      code: item.code || item.id,
      title: item.name,
      slug: item.id,
      description: `${item.name} disponible en Tecno+`,
      vendor: "Tecno+",
      category_name: item.category,
      price: item.price,
      compare_at_price: (item as any).compareAtPrice || null,
      currency: "COP",
      badge: item.badge || null,
      featured_image: item.image,
      images: [{ url: item.image, altText: item.name }],
      tags: [item.category.toLowerCase()],
      stock: item.stock || 5,
      is_active: true,
    }));

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
   * Obtiene un producto por ID o slug
   */
  async getProductById(idOrSlug: string): Promise<DbProduct | null> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, inventory(current_stock)")
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (!error && data) {
        const stockVal =
          Array.isArray(data.inventory) && data.inventory.length > 0
            ? data.inventory[0].current_stock
            : data.inventory?.current_stock ?? 5;

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
          price: Number(data.price),
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
    } catch { /* ignore */ }

    // Fallback local
    const item = inventarioCompleto.find((i) => i.id === idOrSlug);
    if (!item) return null;

    return {
      id: item.id,
      code: item.code || item.id,
      title: item.name,
      slug: item.id,
      description: `${item.name} disponible en Tecno+`,
      vendor: "Tecno+",
      category_name: item.category,
      price: item.price,
      compare_at_price: (item as any).compareAtPrice || null,
      currency: "COP",
      badge: item.badge || null,
      featured_image: item.image,
      images: [{ url: item.image, altText: item.name }],
      tags: [item.category.toLowerCase()],
      stock: item.stock || 5,
      is_active: true,
    };
  },

  /**
   * Validación del Servidor de Precios y Stock (CRÍTICO PARA SEGURIDAD)
   * Recibe solo product_id y cantidad, verifica en BD y retorna el total real.
   */
  async validateOrderItems(
    rawItems: Array<{ id?: string; product_id?: string; variant_id?: string; quantity?: number }>
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
      const quantity = Math.max(1, Number(raw.quantity) || 1);

      if (!productId) {
        return { valid: false, error: "Producto inválido en el carrito.", validatedItems: [], totalAmount: 0 };
      }

      const product = await this.getProductById(productId);
      if (!product) {
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

      if (product.stock < quantity) {
        return {
          valid: false,
          error: `Stock insuficiente para '${product.title}'. Stock disponible: ${product.stock}, Solicitado: ${quantity}`,
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
