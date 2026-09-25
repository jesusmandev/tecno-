import { NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/backend/services/paymentService";
import type { CreatePaymentInput } from "@/backend/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_id_number,
      department,
      city,
      shipping_address,
      address_notes,
      items,
      total,
      notes,
    } = body;

    if (!customer_name?.trim()) {
      return NextResponse.json(
        { error: "El nombre completo del cliente es requerido." },
        { status: 400 }
      );
    }

    if (!customer_phone?.trim()) {
      return NextResponse.json(
        { error: "El telefono / WhatsApp es requerido." },
        { status: 400 }
      );
    }

    if (!shipping_address?.trim()) {
      return NextResponse.json(
        { error: "La direccion de entrega es requerida." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito de compras esta vacio." },
        { status: 400 }
      );
    }

    const orderTotal = Math.round(Number(total) || 0);
    if (orderTotal <= 0) {
      return NextResponse.json(
        { error: "El total a pagar debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "";

    const paymentInput: CreatePaymentInput = {
      customer_name: customer_name.trim(),
      customer_email: customer_email?.trim() || "",
      customer_phone: customer_phone.trim(),
      customer_id_number: customer_id_number?.trim() || "",
      department: department?.trim() || "Cordoba",
      city: city?.trim() || "Monteria",
      shipping_address: shipping_address.trim(),
      address_notes: address_notes?.trim() || "",
      payment_method: "bold",
      items,
      subtotal: orderTotal,
      shipping_cost: 0,
      total: orderTotal,
      notes: notes || "Orden generada para procesar con Bold.co",
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    const result = await paymentService.createPayment(paymentInput);
    // El orderId con guiones (-) SI es valido segun la doc oficial de Bold
    const orderNumber = result.payment.order_number;

    const apiKey =
      process.env.BOLD_API_KEY ||
      process.env.NEXT_PUBLIC_BOLD_API_KEY ||
      "KLnzKJLobCmzOJbWqHM02hdwrS7I9NAStL5FzSZH7Og";
    const secretKey =
      process.env.BOLD_SECRET_KEY || "SlYtZtTycdHTsAo8OA8TPA";

    // Firma SHA-256 segun doc Bold: {orderId}{amount}{currency}{secretKey}
    const currency = "COP";
    const amountInt = Math.round(orderTotal);
    const rawSignature = `${orderNumber}${amountInt}${currency}${secretKey}`;
    const integritySignature = crypto
      .createHash("sha256")
      .update(rawSignature)
      .digest("hex");

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const redirectionUrl = `${siteUrl}/pago/resultado`;

    const description = `Tecno+ Pedido ${orderNumber}`.substring(0, 100);

    const customerData = JSON.stringify({
      email: customer_email?.trim() || "",
      fullName: customer_name.trim(),
      phone: customer_phone.trim(),
      dialCode: "+57",
      documentNumber: customer_id_number?.trim() || "",
      documentType: "CC",
    });

    const billingAddress = JSON.stringify({
      address: shipping_address.trim(),
      city: city?.trim() || "Monteria",
      state: department?.trim() || "Cordoba",
      country: "CO",
    });

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      payment_id: result.payment.id,
      api_key: apiKey,
      order_id: orderNumber,
      amount: String(amountInt),
      currency,
      integrity_signature: integritySignature,
      description,
      redirection_url: redirectionUrl,
      customer_data: customerData,
      billing_address: billingAddress,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error al iniciar checkout Bold";
    console.error("Error en POST /api/bold/checkout:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
