import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import inventarioCompleto from "@/data/inventarioCompleto.json";
import { mockProducts } from "@/data/mockProducts";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { adminPassword } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword || !adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // 1. Extraer y crear categorías únicas
    const rawCategories = Array.from(
      new Set(inventarioCompleto.map((item) => item.category))
    );

    const categoriesMap: Record<string, string> = {};

    for (const catName of rawCategories) {
      const slug = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data: catData, error: catError } = await admin
        .from("categories")
        .upsert(
          {
            name: catName,
            slug,
            description: `Categoría principal ${catName}`,
            is_active: true,
          },
          { onConflict: "name" }
        )
        .select("id, name")
        .single();

      if (catData) {
        categoriesMap[catName] = catData.id;
      } else if (catError) {
        console.warn(`Aviso al insertar categoría ${catName}:`, catError.message);
      }
    }

    // 2. Insertar Productos e Inventario desde inventarioCompleto.json
    let insertedProductsCount = 0;
    let insertedInventoryCount = 0;
    let insertedVariantsCount = 0;

    for (const item of inventarioCompleto) {
      const categoryId = categoriesMap[item.category] || null;

      // Buscar si el producto existe en mockProducts para enriquecer imágenes y descripción
      const mockMatch = mockProducts.find(
        (mp) => mp.id === item.id || mp.handle === item.id
      );

      const productPayload = {
        id: item.id,
        code: item.code || `SKU-${item.id.toUpperCase().slice(0, 10)}`,
        title: item.name,
        slug: item.id,
        description: mockMatch?.description || `${item.name} disponible en Tecno+`,
        description_html:
          mockMatch?.descriptionHtml || `<p>${item.name} con garantía oficial.</p>`,
        vendor: mockMatch?.vendor || "Tecno+",
        category_id: categoryId,
        category_name: item.category,
        price: Number(item.price) || 0,
        compare_at_price: item.compareAtPrice ? Number(item.compareAtPrice) : null,
        currency: "COP",
        badge: item.badge || mockMatch?.badge || null,
        badge_style: mockMatch?.badgeStyle || "dark",
        featured_image: item.image || mockMatch?.featuredImage?.url || "/products/placeholder.png",
        images: mockMatch?.images || [{ url: item.image, altText: item.name }],
        tags: mockMatch?.tags || [item.category.toLowerCase()],
        whatsapp_text: `Hola Tecno+, quiero consultar sobre ${item.name}`,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { error: prodError } = await admin
        .from("products")
        .upsert(productPayload, { onConflict: "id" });

      if (!prodError) {
        insertedProductsCount++;

        // Crear variantes si existen en mockProducts
        if (mockMatch?.variants && mockMatch.variants.length > 0) {
          for (const v of mockMatch.variants) {
            const variantPayload = {
              id: v.id,
              product_id: item.id,
              sku: `${productPayload.code}-${v.id.slice(0, 6)}`,
              title: v.title,
              price: v.price,
              compare_at_price: v.compareAtPrice,
              stock: Math.max(1, Math.floor((item.stock || 5) / mockMatch.variants.length)),
              is_available: v.availableForSale,
            };

            await admin.from("product_variants").upsert(variantPayload, { onConflict: "id" });
            insertedVariantsCount++;
          }
        }

        // Crear registro en tabla inventory
        const invPayload = {
          product_id: item.id,
          variant_id: null,
          current_stock: Number(item.stock) || 0,
          reserved_stock: 0,
          min_stock_alert: 2,
          location: "Bodega Principal Montería",
          updated_at: new Date().toISOString(),
        };

        const { error: invError } = await admin
          .from("inventory")
          .upsert(invPayload, { onConflict: "product_id,variant_id" });

        if (!invError) {
          insertedInventoryCount++;
        }
      } else {
        console.warn(`Error al insertar producto ${item.id}:`, prodError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sembrado de catálogo completado con éxito.`,
      categoriesCount: Object.keys(categoriesMap).length,
      insertedProductsCount,
      insertedVariantsCount,
      insertedInventoryCount,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al sembrar catálogo";
    console.error("Error en POST /api/backend/seed-catalog:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
