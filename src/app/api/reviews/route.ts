import { NextResponse } from "next/server";
import { supabase, getSupabaseAdmin } from "@/lib/supabase";
import { REAL_CUSTOMER_REVIEWS, type ReviewItem } from "@/data/customerReviews";

// GET: Obtener todas las opiniones desde Supabase
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch warning:", error.message);
      // Retornar las opiniones locales si la tabla aún no se ha creado
      return NextResponse.json({
        reviews: REAL_CUSTOMER_REVIEWS,
        source: "fallback",
        error: error.message,
      });
    }

    // Si la tabla existe pero está vacía, podemos retornar las 84 iniciales
    if (!data || data.length === 0) {
      return NextResponse.json({
        reviews: REAL_CUSTOMER_REVIEWS,
        source: "fallback",
      });
    }

    return NextResponse.json({
      reviews: data,
      source: "supabase",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({
      reviews: REAL_CUSTOMER_REVIEWS,
      source: "fallback",
      error: message,
    });
  }
}

// POST: Publicar una nueva opinión en Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, city, rating, product, title, comment, recommended } = body;

    if (!name || !comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: "Nombre y comentario (mínimo 10 caracteres) son obligatorios." },
        { status: 400 }
      );
    }

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      city: city?.trim() || "Montería, Córdoba",
      rating: Math.max(0, Math.min(5, Number(rating) || 5)),
      date: "Hace unos momentos",
      product: product || "Celulares & Tecnología",
      title: title?.trim() || (rating >= 4 ? "¡Excelente experiencia!" : "Opinión del producto"),
      comment: comment.trim(),
      verified: true,
      recommended: recommended !== false,
      likes: 0,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert([newReview])
      .select()
      .single();

    if (error) {
      console.error("Error al insertar en Supabase:", error);
      return NextResponse.json(
        { error: error.message, review: newReview },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: data || newReview }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al procesar la opinión";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Borrar una opinión (SOLO ADMINISTRADOR)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json().catch(() => ({}));
    const adminPassword = body.adminPassword || searchParams.get("adminPassword");

    const expectedPassword = process.env.ADMIN_PASSWORD || "tecnomasadmin2026";

    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { error: "No autorizado. Clave de administrador incorrecta." },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del comentario a borrar." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient.from("reviews").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar la opinión";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Dar me gusta (Like)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, likes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("reviews")
      .update({ likes })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, likes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al registrar like";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
