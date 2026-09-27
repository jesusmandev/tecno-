import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      console.error("ADMIN_PASSWORD no está configurado en .env.local");
      return NextResponse.json(
        { error: "Error de configuración del servidor." },
        { status: 500 }
      );
    }

    if (password === expectedPassword) {
      // Generar token simple de sesión para el admin
      const token = Buffer.from(`admin-session-${Date.now()}-${expectedPassword}`).toString("base64");
      return NextResponse.json({
        success: true,
        message: "Autenticación exitosa",
        token,
      });
    }

    return NextResponse.json(
      { error: "Contraseña incorrecta. Verifica e intenta nuevamente." },
      { status: 401 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error de autenticación";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
