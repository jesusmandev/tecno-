import { NextResponse } from "next/server";
import { visitService } from "@/backend/services/visitService";
import type { CreateVisitInput } from "@/backend/types";

// POST: Registrar entrada / visita de una persona a la página
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { visitor_id, session_id, page_path, referrer, device_type } = body;

    if (!visitor_id || !session_id) {
      return NextResponse.json(
        { error: "visitor_id y session_id son obligatorios" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "";

    const input: CreateVisitInput = {
      visitor_id,
      session_id,
      page_path: page_path || "/",
      referrer: referrer || "",
      user_agent: userAgent,
      device_type,
      ip_address: ipAddress,
    };

    const result = await visitService.recordVisit(input);

    return NextResponse.json({
      success: true,
      visit: result.visit,
      source: result.source,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al registrar visita";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: Consultar analítica de visitas (cuántas personas han entrado, hoy, dispositivos, etc.)
export async function GET() {
  try {
    const stats = await visitService.getStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener analítica";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
