import { NextResponse } from "next/server";
import { productService } from "@/backend/services/productService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const id = searchParams.get("id");

    if (id) {
      const product = await productService.getProductById(id);
      if (!product) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    const result = await productService.getProducts({ category, search, limit });

    return NextResponse.json({
      success: true,
      products: result.products,
      total: result.total,
      source: result.source,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener productos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
