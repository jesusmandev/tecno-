import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { localStore } from "@/backend/db/localStore";

// POST: Sincronizar datos locales acumulados hacia Supabase
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
    const data = localStore.getAll();

    let paymentsSynced = 0;
    let visitsSynced = 0;
    const errors: string[] = [];

    // Sincronizar pagos
    if (data.payments && data.payments.length > 0) {
      const { error: payError } = await admin
        .from("payments")
        .upsert(data.payments, { onConflict: "order_number" });

      if (payError) {
        errors.push(`Pagos: ${payError.message}`);
      } else {
        paymentsSynced = data.payments.length;
      }
    }

    // Sincronizar visitas
    if (data.visits && data.visits.length > 0) {
      const { error: visError } = await admin
        .from("page_visits")
        .upsert(data.visits, { onConflict: "id" });

      if (visError) {
        errors.push(`Visitas: ${visError.message}`);
      } else {
        visitsSynced = data.visits.length;
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message:
        errors.length === 0
          ? `Sincronización completada: ${paymentsSynced} pagos y ${visitsSynced} visitas en Supabase.`
          : `Sincronización parcial con avisos: ${errors.join(" | ")}`,
      paymentsSynced,
      visitsSynced,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error durante sincronización";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
