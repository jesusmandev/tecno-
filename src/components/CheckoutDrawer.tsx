"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/mockProducts";

type PaymentMethod = "bold" | "cash_on_delivery";

export default function CheckoutDrawer() {
  const {
    checkoutOpen,
    closeCheckout,
    items,
    totalPrice,
    directCheckoutItem,
    clearCart,
  } = useCart();

  // Active items being purchased
  const checkoutItems = useMemo(() => {
    if (directCheckoutItem) return [directCheckoutItem];
    return items;
  }, [directCheckoutItem, items]);

  const activeTotal = useMemo(() => {
    if (directCheckoutItem) {
      return directCheckoutItem.variant.price * directCheckoutItem.quantity;
    }
    return totalPrice;
  }, [directCheckoutItem, totalPrice]);

  // Steps: 'form' | 'bold_ready' | 'processing' | 'success'
  const [step, setStep] = useState<"form" | "bold_ready" | "processing" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bold");
  const boldContainerRef = useRef<HTMLDivElement>(null);

  // Customer Info
  const [customerName, setCustomerName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Montería");
  const [department, setDepartment] = useState("Córdoba");

  // Validation & status
  const [validationError, setValidationError] = useState<string | null>(null);

  // Datos que devuelve la API de Bold, usados por el useEffect para inyectar el botón
  const [boldCheckoutData, setBoldCheckoutData] = useState<Record<string, string> | null>(null);

  // useEffect: se ejecuta DESPUÉS de que React renderiza bold_ready y monta el div ref.
  // Aquí inyectamos el script data-bold-button y recargamos boldPaymentButton.js
  // para que escanee el DOM y dibuje el botón.
  useEffect(() => {
    if (step !== "bold_ready" || !boldCheckoutData || !boldContainerRef.current) return;

    const container = boldContainerRef.current;
    container.innerHTML = "";

    // 1. Crear el script con los atributos data-* oficiales de Bold
    const script = document.createElement("script");
    script.setAttribute("data-bold-button", "dark-L");
    script.setAttribute("data-api-key", boldCheckoutData.api_key);
    script.setAttribute("data-order-id", boldCheckoutData.order_id);
    script.setAttribute("data-amount", boldCheckoutData.amount);
    script.setAttribute("data-currency", boldCheckoutData.currency);
    script.setAttribute("data-integrity-signature", boldCheckoutData.integrity_signature);
    script.setAttribute("data-description", boldCheckoutData.description);
    script.setAttribute("data-redirection-url", boldCheckoutData.redirection_url);
    script.setAttribute("data-render-mode", "embedded");
    if (boldCheckoutData.customer_data) {
      script.setAttribute("data-customer-data", boldCheckoutData.customer_data);
    }
    if (boldCheckoutData.billing_address) {
      script.setAttribute("data-billing-address", boldCheckoutData.billing_address);
    }
    container.appendChild(script);

    // 2. Remover la instancia anterior de boldPaymentButton.js y recargarla.
    //    La doc de Bold para React/SPA indica que la librería debe cargarse en el <head>
    //    DESPUÉS de que el script data-bold-button ya esté en el DOM.
    const existingLib = document.querySelector('script[src*="boldPaymentButton"]');
    if (existingLib) existingLib.remove();

    const lib = document.createElement("script");
    lib.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    lib.async = true;
    document.head.appendChild(lib);
  }, [step, boldCheckoutData]);

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic frontend validations
    if (!customerName.trim()) {
      setValidationError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!phone.trim()) {
      setValidationError("Por favor ingresa tu número de WhatsApp o teléfono.");
      return;
    }
    if (!address.trim()) {
      setValidationError("Por favor ingresa la dirección exacta de entrega.");
      return;
    }

    // Enter processing state
    setStep("processing");

    // Preparar items del pedido
    const mappedItems = checkoutItems.map((item) => ({
      id: item.product.id,
      title: item.product.title,
      price: item.variant.price,
      quantity: item.quantity,
      variantTitle: item.variant.title,
      image: item.product.featuredImage?.url,
    }));

    if (paymentMethod === "bold") {
      try {
        const payload = {
          customer_name: customerName,
          customer_email: email,
          customer_phone: phone,
          customer_id_number: documentId,
          department: department || "Córdoba",
          city: city || "Montería",
          shipping_address: address,
          items: mappedItems,
          total: activeTotal,
        };

        const res = await fetch("/api/bold/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "No se pudo iniciar el checkout de Bold.");
        }

        setOrderId(data.order_number);
        setBoldCheckoutData(data);   // el useEffect lo toma desde aquí
        setStep("bold_ready");
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al procesar con Bold";
        setValidationError(msg);
        setStep("form");
        return;
      }
    } else {
      // Pago Contra Entrega
      try {
        const payload = {
          customer_name: customerName,
          customer_email: email,
          customer_phone: phone,
          customer_id_number: documentId,
          department: department || "Córdoba",
          city: city || "Montería",
          shipping_address: address,
          payment_method: "cash_on_delivery",
          items: mappedItems,
          subtotal: activeTotal,
          shipping_cost: 0,
          total: activeTotal,
        };

        const res = await fetch("/api/backend/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success && data.order_number) {
          setOrderId(data.order_number);
        } else {
          const randomCode = Math.floor(100000 + Math.random() * 900000);
          setOrderId(`TP-${randomCode}`);
        }
      } catch (err) {
        console.error("Error registrando pedido contra entrega:", err);
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        setOrderId(`TP-${randomCode}`);
      }

      setTimeout(() => {
        setStep("success");
        if (!directCheckoutItem) {
          clearCart();
        }
      }, 1000);
    }
  };

  const handleFinish = () => {
    setStep("form");
    setValidationError(null);
    closeCheckout();
  };

  if (!checkoutOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleFinish}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:border-l sm:border-[#e8e8ea]">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-[#e8e8ea] px-6 py-4.5 bg-[#fafafa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-xs">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-[#111]">
                  Finalizar Compra
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Pasarela Bold Activa
                </span>
              </div>
              <p className="text-[11px] text-[#70757d]">
                Paga de forma rápida y segura en Tecno+
              </p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#70757d] hover:bg-[#eee] hover:text-[#111] transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ================= CONTENT CONTAINER ================= */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ================= STEP 1: FORM ================= */}
          {step === "form" && (
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              {/* Order Summary Dropdown/Card */}
              <div className="rounded-2xl border border-[#e8e8ea] bg-[#fafafa] p-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
                  <span className="font-bold text-[#111] flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-[var(--red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Resumen del Pedido ({checkoutItems.length} {checkoutItems.length === 1 ? "artículo" : "artículos"})
                  </span>
                  <span className="font-extrabold text-[var(--red)] text-sm">
                    {formatPrice(activeTotal)}
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
                  {checkoutItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-[11px] text-[#444]">
                      <div className="flex items-center gap-2 truncate">
                        {item.product.featuredImage?.url && (
                          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-[#eee] bg-white">
                            <Image
                              src={item.product.featuredImage.url}
                              alt={item.product.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="truncate">
                          <strong>{item.quantity}x</strong> {item.product.title}
                          {item.variant.title && item.variant.title !== "Default Title" && (
                            <span className="text-[#888]"> ({item.variant.title})</span>
                          )}
                        </span>
                      </div>
                      <span className="flex-shrink-0 font-semibold text-[#111]">
                        {formatPrice(item.variant.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#eee] flex items-center justify-between text-[11px]">
                  <span className="text-[#70757d]">Envío a Montería / Colombia:</span>
                  <span className="font-bold text-emerald-600 uppercase tracking-wide">
                    ¡Gratis!
                  </span>
                </div>
              </div>

              {/* Validation Error banner */}
              {validationError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="#fff" strokeWidth="2" />
                    <circle cx="12" cy="16" r="1" fill="#fff" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              {/* 1. Datos de Contacto y Envío */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111] text-[11px] font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-[#111]">
                    Datos de Entrega y Contacto
                  </h3>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#444] mb-1">
                    Nombre y Apellidos completos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      WhatsApp / Celular *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 300 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Correo Electrónico (Para factura)
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Cédula / NIT (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Número de identificación"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Ciudad de entrega *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                    >
                      <option value="Montería">Montería (Córdoba)</option>
                      <option value="Cereté">Cereté (Córdoba)</option>
                      <option value="Sahagún">Sahagún (Córdoba)</option>
                      <option value="Lorica">Lorica (Córdoba)</option>
                      <option value="Planeta Rica">Planeta Rica (Córdoba)</option>
                      <option value="Bogotá">Bogotá D.C.</option>
                      <option value="Medellín">Medellín (Antioquia)</option>
                      <option value="Barranquilla">Barranquilla (Atlántico)</option>
                      <option value="Cartagena">Cartagena (Bolívar)</option>
                      <option value="Cali">Cali (Valle)</option>
                      <option value="Bucaramanga">Bucaramanga (Santander)</option>
                      <option value="Otras ciudades">Otra ciudad (Envío nacional)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#444] mb-1">
                    Dirección exacta y barrio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Calle 29 #14-25, Barrio El Recreo, Apto 302"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* 2. Método de Pago */}
              <div className="space-y-3 pt-2 border-t border-[#e8e8ea]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111] text-[11px] font-bold text-white">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-[#111]">
                      Método de Pago
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                    Seguridad Cifrada TLS
                  </span>
                </div>

                {/* Opciones de Pago */}
                <div className="space-y-3">
                  {/* Opción Bold (Principal) */}
                  <div
                    onClick={() => setPaymentMethod("bold")}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      paymentMethod === "bold"
                        ? "border-[#111] bg-[#f9fafb] shadow-md ring-2 ring-black"
                        : "border-[#e5e7eb] bg-white hover:border-[#aaa]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-black text-white">
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#111]">
                              Pasarela Oficial Bold.co
                            </span>
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              Recomendado
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7280] mt-0.5">
                            Tarjetas de Crédito / Débito, PSE, Nequi y Botón Bancolombia
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Badges de métodos aceptados */}
                    <div className="mt-3.5 pt-3 border-t border-[#e5e7eb] flex flex-wrap items-center gap-2">
                      {/* Visa */}
                      <span className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-2 py-1 shadow-2xs">
                        <svg viewBox="0 0 32 20" className="h-3.5 w-auto" fill="none">
                          <rect width="32" height="20" rx="2" fill="#0A2540" />
                          <path d="M13.5 14h-1.8l1.1-7.2h1.8L13.5 14zm7.4-7c-.4-.2-1-.3-1.7-.3-1.9 0-3.3 1-3.3 2.4 0 1 .9 1.6 1.6 2 .7.3 1 .6 1 .9 0 .5-.7.8-1.4.8-.8 0-1.3-.2-1.8-.4l-.3-.1-.3 1.5c.5.2 1.4.4 2.3.4 2 0 3.3-.9 3.3-2.4 0-1.2-.8-1.8-1.7-2.2-.7-.3-1.1-.6-1.1-1 0-.4.5-.7 1.3-.7.6 0 1.1.1 1.4.3l.2.1.4-1.4zm4 0h-1.4c-.4 0-.8.1-.9.5l-2.6 6.5h1.9l.4-1h2.3l.2 1h1.7L24.9 7zm-1.8 4.7l1-2.6c0 0 .2-.7.4-1.1l.2 1 .5 2.7h-2.1zM10.6 7l-1.8 4.9-.2-.9c-.3-1.1-1.3-2.3-2.4-2.9l1.6 6h1.9l2.9-7.1h-2z" fill="#F7B600" />
                          <path d="M7.5 7H4.5l-.1.1c2.4.6 4.4 2.1 5.1 3.9l-.7-3.4c-.1-.5-.7-.6-1.3-.6z" fill="#FFF" />
                        </svg>
                      </span>

                      {/* Mastercard */}
                      <span className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-2 py-1 shadow-2xs">
                        <svg viewBox="0 0 32 20" className="h-3.5 w-auto">
                          <rect width="32" height="20" rx="2" fill="#141414" />
                          <circle cx="12" cy="10" r="5.5" fill="#EB001B" />
                          <circle cx="20" cy="10" r="5.5" fill="#F79E1B" />
                          <path d="M16 6a5.4 5.4 0 00-1.9 4 5.4 5.4 0 001.9 4 5.4 5.4 0 001.9-4A5.4 5.4 0 0016 6z" fill="#FF5F00" />
                        </svg>
                      </span>

                      {/* PSE */}
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 shadow-2xs text-[10px] font-bold text-[#1b365d]">
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
                          <circle cx="10" cy="10" r="9" fill="#1B365D" />
                          <text x="10" y="13" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                            PSE
                          </text>
                        </svg>
                        <span>PSE</span>
                      </span>

                      {/* Nequi */}
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 shadow-2xs text-[10px] font-bold text-[#200020]">
                        <span className="h-3 w-3 rounded-xs bg-[#ff007a] inline-block" />
                        <span>Nequi</span>
                      </span>

                      {/* Bancolombia */}
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 shadow-2xs text-[10px] font-bold text-[#111]">
                        <span className="h-3 w-3 rounded-full bg-[#fdd835] inline-block" />
                        <span>Bancolombia</span>
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl bg-blue-50/70 p-2.5 text-[11px] text-blue-900 border border-blue-100 flex items-center gap-2">
                      <svg className="h-4 w-4 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        Al presionar el botón inferior se abrirá de inmediato la pasarela oficial de Bold para autorizar tu pago sin salir del sitio.
                      </span>
                    </div>
                  </div>

                  {/* Opción Contra Entrega */}
                  <div
                    onClick={() => setPaymentMethod("cash_on_delivery")}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      paymentMethod === "cash_on_delivery"
                        ? "border-[#111] bg-[#f9fafb] shadow-md ring-2 ring-black"
                        : "border-[#e5e7eb] bg-white hover:border-[#aaa]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          paymentMethod === "cash_on_delivery"
                            ? "border-black bg-black text-white"
                            : "border-[#ccc] bg-white"
                        }`}
                      >
                        {paymentMethod === "cash_on_delivery" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#111]">
                          Pago Contra Entrega (Efectivo o Datáfono)
                        </span>
                        <p className="text-[11px] text-[#6b7280]">
                          Pagas al recibir tu paquete en Montería y municipios cercanos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de pago */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] py-4 text-sm font-black text-white shadow-xl shadow-red-500/25 transition-all hover:scale-[1.01] hover:bg-[var(--red2)] active:scale-[0.99]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <span>
                    {paymentMethod === "bold"
                      ? `Pagar con Bold ${formatPrice(activeTotal)}`
                      : `Confirmar Pedido Contra Entrega`}
                  </span>
                  <span>→</span>
                </button>

                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-[#70757d]">
                  <span className="flex items-center gap-1">🔒 Pasarela Bold.co</span>
                  <span>·</span>
                  <span>Protección al Comprador</span>
                  <span>·</span>
                  <span>Despacho Inmediato</span>
                </div>
              </div>
            </form>
          )}

          {step === "processing" && (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full border-4 border-[#eee] border-t-[var(--red)] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-7 w-7 text-[#111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-extrabold text-[#111]">
                Conectando con la Pasarela Bold...
              </h3>
              <p className="mt-2 max-w-xs text-xs text-[#70757d]">
                Estamos generando tu orden segura con firma criptográfica SHA-256 para Bold.co.
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-full bg-[#f3f4f6] px-4 py-1.5 text-[11px] font-medium text-[#4b5563]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Iniciando pasarela de pagos
              </div>
            </div>
          )}

          {/* ================= STEP: BOLD READY ================= */}
          {step === "bold_ready" && (
            <div className="flex flex-col items-center py-8 text-center gap-5">
              {/* Header */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black shadow-lg">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-black text-[#111]">¡Tu orden está lista!</h3>
                <p className="mt-1 text-xs text-[#70757d] max-w-xs">
                  Haz clic en el botón de Bold para completar tu pago de forma segura.
                </p>
              </div>

              {/* Order summary pill */}
              <div className="w-full rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Pedido:</span>
                  <span className="font-mono font-bold text-[#111]">{orderId}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#eee] pt-2">
                  <span className="text-[#70757d]">Total a pagar:</span>
                  <span className="font-extrabold text-[var(--red)] text-sm">{formatPrice(activeTotal)}</span>
                </div>
              </div>

              {/* Bold button container — la librería boldPaymentButton.js renderiza aquí */}
              <div
                ref={boldContainerRef}
                className="w-full flex justify-center min-h-[56px]"
                id="bold-button-container"
              />

              <button
                onClick={() => { setStep("form"); setValidationError(null); }}
                className="text-xs text-[#70757d] underline underline-offset-2 hover:text-[#111] transition-colors"
              >
                ← Volver y editar pedido
              </button>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS (CONTRA ENTREGA) ================= */}
          {step === "success" && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center animate-fadeIn">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                ¡Pedido Confirmado!
              </span>

              <h3 className="mt-2 text-xl font-black text-[#111]">
                ¡Gracias por tu compra, {customerName.split(" ")[0] || "Cliente"}!
              </h3>
              <p className="mt-1 text-xs text-[#70757d]">
                Tu pedido ha sido registrado como Contra Entrega y ya está en preparación para despacho.
              </p>

              {/* Receipt card */}
              <div className="mt-6 w-full rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-[#eee]">
                  <span className="text-[#70757d]">Número de Pedido:</span>
                  <span className="font-mono font-bold text-[#111]">{orderId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Total a Pagar al Recibir:</span>
                  <span className="font-extrabold text-[var(--red)]">
                    {formatPrice(activeTotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Método:</span>
                  <span className="font-semibold text-[#111]">
                    Pago Contra Entrega
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Dirección de entrega:</span>
                  <span className="font-medium text-[#111] text-right truncate max-w-[200px]">
                    {address}, {city}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">WhatsApp:</span>
                  <span className="font-medium text-[#111]">{phone}</span>
                </div>
              </div>

              <div className="mt-6 w-full space-y-2.5">
                <a
                  href={`https://wa.me/573043547935?text=${encodeURIComponent(
                    `Hola Tecno+, acabo de hacer el pedido ${orderId} contra entrega por valor de ${formatPrice(activeTotal)}. ¿Me confirman el despacho por favor?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white transition-colors"
                >
                  Confirmar Despacho por WhatsApp
                </a>

                <button
                  onClick={handleFinish}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111] py-3 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  Seguir Comprando en Tecno+
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
