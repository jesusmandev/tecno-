import { NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/backend/services/paymentService";
import type { PaymentStatus } from "@/backend/types";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: Record<string, unknown> = {};

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Firma opcional enviada por Bold
    const boldSignature = request.headers.get("x-bold-signature");
    const apiKey =
      process.env.BOLD_API_KEY || "KLnzKJLobCmzOJbWqHM02hdwrS7I9NAStL5FzSZH7Og";

    if (boldSignature && apiKey) {
      // Bold firma: HMAC-SHA256 del cuerpo en Base64 con la API Key
      const base64Body = Buffer.from(rawBody).toString("base64");
      const computedSig = crypto
        .createHmac("sha256", apiKey)
        .update(base64Body)
        .digest("hex");

      if (computedSig !== boldSignature) {
        console.warn("Firma de webhook Bold no coincide, procesando con cautela...");
      }
    }

    // Extraer datos del evento
    const eventType = (payload.type as string) || (payload.event as string) || "";
    const data = (payload.data as Record<string, unknown>) || {};
    const orderId =
      (data.order_id as string) ||
      (payload.order_id as string) ||
      (data.metadata_reference_code as string) ||
      "";

    console.log(`[Webhook Bold] Evento recibido: ${eventType} para orden: ${orderId}`);

    if (!orderId) {
      return NextResponse.json(
        { message: "Webhook recibido sin order_id" },
        { status: 200 }
      );
    }

    let newStatus: PaymentStatus | null = null;

    if (
      eventType === "SALE_APPROVED" ||
      eventType === "PAYMENT_APPROVED" ||
      data.status === "APPROVED"
    ) {
      newStatus = "approved";
    } else if (
      eventType === "SALE_REJECTED" ||
      eventType === "PAYMENT_REJECTED" ||
      data.status === "REJECTED"
    ) {
      newStatus = "rejected";
    } else if (
      eventType === "SALE_FAILED" ||
      eventType === "PAYMENT_FAILED" ||
      eventType === "VOID_APPROVED" ||
      data.status === "FAILED"
    ) {
      newStatus = "cancelled";
    }

    if (newStatus) {
      await paymentService.updateStatus(orderId, newStatus);
      console.log(`[Webhook Bold] Orden ${orderId} actualizada a: ${newStatus}`);
    }

    return NextResponse.json({
      received: true,
      order_id: orderId,
      status: newStatus,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error procesando webhook Bold";
    console.error("Error en POST /api/bold/webhook:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
