import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { REAL_CUSTOMER_REVIEWS } from "@/data/customerReviews";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const adminPassword = body.adminPassword || searchParams.get("adminPassword");

    const expectedPassword = process.env.ADMIN_PASSWORD || "tecnomasadmin2026";
    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Insertar en lotes de 20
    const chunkSize = 20;
    let insertedCount = 0;

    for (let i = 0; i < REAL_CUSTOMER_REVIEWS.length; i += chunkSize) {
      const chunk = REAL_CUSTOMER_REVIEWS.slice(i, i + chunkSize);
      const { error } = await admin.from("reviews").upsert(chunk, { onConflict: "id" });
      if (error) {
        return NextResponse.json({ error: error.message, atIndex: i }, { status: 500 });
      }
      insertedCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      message: `Se insertaron exitosamente ${insertedCount} opiniones en Supabase.`,
      count: insertedCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al sincronizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
