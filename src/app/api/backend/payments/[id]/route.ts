import { NextResponse } from "next/server";
import { paymentService } from "@/backend/services/paymentService";
import type { PaymentStatus } from "@/backend/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Obtener un pago específico por ID o order_number
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      return NextResponse.json(
        { error: "Pago o pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al consultar pago";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: Actualizar el estado de un pago (ej. 'pending' -> 'approved' -> 'shipped')
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    const validStatuses: PaymentStatus[] = [
      "pending",
      "approved",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Estado inválido. Estados permitidos: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await paymentService.updateStatus(id, status);

    if (!result.success || !result.payment) {
      return NextResponse.json(
        { error: "No se pudo actualizar el pago especificado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Estado actualizado a '${status}' con éxito.`,
      payment: result.payment,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al actualizar estado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
