import { NextResponse } from "next/server";
import { statsService } from "@/backend/services/statsService";

export async function GET() {
  try {
    const summary = await statsService.getDashboardSummary();
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener resumen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
