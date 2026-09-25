import { NextResponse } from "next/server";
import { paymentService } from "@/backend/services/paymentService";
import type { CreatePaymentInput } from "@/backend/types";

// POST: Registrar un nuevo pago / orden
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_phone,
      shipping_address,
      payment_method,
      items,
      total,
    } = body;

    // Validaciones básicas de campos obligatorios
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json(
        { error: "El nombre completo del cliente es requerido." },
        { status: 400 }
      );
    }

    if (!customer_phone || !customer_phone.trim()) {
      return NextResponse.json(
        { error: "El teléfono / WhatsApp de contacto es requerido." },
        { status: 400 }
      );
    }

    if (!shipping_address || !shipping_address.trim()) {
      return NextResponse.json(
        { error: "La dirección de entrega es requerida." },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: "El método de pago es requerido." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito de compras no puede estar vacío." },
        { status: 400 }
      );
    }

    // Extraer IP y User-Agent de cabeceras
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "";

    const paymentInput: CreatePaymentInput = {
      customer_name,
      customer_email: body.customer_email,
      customer_phone,
      customer_id_number: body.customer_id_number,
      department: body.department || "Córdoba",
      city: body.city || "Montería",
      shipping_address,
      address_notes: body.address_notes,
      payment_method,
      payment_method_detail: body.payment_method_detail,
      items,
      subtotal: body.subtotal || total,
      shipping_cost: body.shipping_cost || 0,
      total: total || 0,
      notes: body.notes,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    const result = await paymentService.createPayment(paymentInput);

    return NextResponse.json({
      success: true,
      message: "Pago registrado exitosamente en la base de datos.",
      order_number: result.payment.order_number,
      payment: result.payment,
      source: result.source,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al procesar el pago";
    console.error("Error en POST /api/backend/payments:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: Consultar listado de pagos y métricas financieras
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const method = searchParams.get("method") || "all";
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const [paymentsResult, stats] = await Promise.all([
      paymentService.getPayments({ status, method, search, limit }),
      paymentService.getStats(),
    ]);

    return NextResponse.json({
      success: true,
      payments: paymentsResult.payments,
      total: paymentsResult.total,
      stats,
      source: paymentsResult.source,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener pagos";
    console.error("Error en GET /api/backend/payments:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
