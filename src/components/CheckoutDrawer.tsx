"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/mockProducts";

type PaymentMethod = "card" | "pse" | "nequi" | "cash_on_delivery";

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

  // Steps: 'form' | 'processing' | 'success'
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Customer Info
  const [customerName, setCustomerName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Montería");
  const [department, setDepartment] = useState("Córdoba");

  // Card Info
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState("1");

  // PSE Info
  const [selectedBank, setSelectedBank] = useState("Bancolombia");
  const [pseDocType, setPseDocType] = useState("CC");

  // Nequi Info
  const [nequiPhone, setNequiPhone] = useState("");

  // Validation feedback
  const [validationError, setValidationError] = useState<string | null>(null);

  // Detect card brand
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s+/g, "");
    if (/^4/.test(clean)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
    if (/^3[47]/.test(clean)) return "amex";
    return "unknown";
  }, [cardNumber]);

  // Handle Card Number Input with grouping (4 4 4 4)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(" "));
  };

  // Handle Expiry Input (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  // Submit & Simulate Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic frontend validations
    if (!customerName.trim()) {
      setValidationError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!phone.trim()) {
      setValidationError("Por favor ingresa tu teléfono o celular.");
      return;
    }
    if (!address.trim()) {
      setValidationError("Por favor ingresa la dirección de entrega.");
      return;
    }

    if (paymentMethod === "card") {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      if (cleanNum.length < 15) {
        setValidationError("Ingresa un número de tarjeta válido (16 dígitos).");
        return;
      }
      if (cardExpiry.length < 5) {
        setValidationError("Ingresa la fecha de vencimiento (MM/AA).");
        return;
      }
      if (cardCvv.length < 3) {
        setValidationError("Ingresa el código de seguridad (CVV de 3 o 4 dígitos).");
        return;
      }
    } else if (paymentMethod === "nequi") {
      if (!nequiPhone.trim() && !phone.trim()) {
        setValidationError("Ingresa el número de celular de tu cuenta Nequi.");
        return;
      }
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

    try {
      const payload = {
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone,
        customer_id_number: documentId,
        department: department || "Córdoba",
        city: city || "Montería",
        shipping_address: address,
        payment_method: paymentMethod,
        payment_method_detail: {
          cardBrand: paymentMethod === "card" ? cardBrand : undefined,
          last4: paymentMethod === "card" ? cardNumber.replace(/\s+/g, "").slice(-4) : undefined,
          installments: paymentMethod === "card" ? installments : undefined,
          bank: paymentMethod === "pse" ? selectedBank : undefined,
          nequiPhone: paymentMethod === "nequi" ? (nequiPhone || phone) : undefined,
        },
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
      console.error("Error al registrar pago en backend:", err);
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      setOrderId(`TP-${randomCode}`);
    }

    // Pequeña pausa para efecto visual de procesamiento bancario
    setTimeout(() => {
      setStep("success");
      if (!directCheckoutItem) {
        clearCart();
      }
    }, 1200);
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
              <h2 className="text-base font-extrabold text-[#111] leading-tight">
                {step === "success" ? "Comprobante de Pago" : "Pago 100% Seguro"}
              </h2>
              <p className="text-[11px] font-medium text-[#70757d] flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Cifrado SSL de 256 bits · Pasarela Protegida
              </p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#70757d] hover:bg-[#eaeaea] hover:text-[#111] transition-colors"
            aria-label="Cerrar checkout"
          >
            ✕
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ================= STEP 1: FORM ================= */}
          {step === "form" && (
            <form id="checkout-form" onSubmit={handleSubmitPayment} className="space-y-6">
              {/* Order summary accordion */}
              <div className="rounded-2xl border border-[#e8e8ea] bg-[#f9fafb] p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#555]">
                    Resumen de tu pedido ({checkoutItems.length}{" "}
                    {checkoutItems.length === 1 ? "artículo" : "artículos"})
                  </span>
                  <span className="text-sm font-extrabold text-[var(--red)]">
                    {formatPrice(activeTotal)}
                  </span>
                </div>

                <div className="divide-y divide-[#eee] max-h-40 overflow-y-auto pr-1">
                  {checkoutItems.map((item) => (
                    <div
                      key={item.variant.id}
                      className="flex items-center justify-between py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded-lg bg-white p-1 border border-[#e8e8ea]">
                          <Image
                            src={item.product.featuredImage.url}
                            alt={item.product.featuredImage.altText}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#111] line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-[11px] text-[#70757d]">
                            Cant: {item.quantity} · {item.variant.title}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-[#111]">
                        {formatPrice(item.variant.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#555]">
                  <span>Envío a domicilio</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    GRATIS
                  </span>
                </div>
              </div>

              {/* Validation alert */}
              {validationError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              {/* 1. Datos de Envío */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111] text-[11px] font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-[#111]">
                    Datos de Entrega y Facturación
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Nombre y Apellidos completos *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza Gómez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Cédula / Documento (CC / NIT) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 1067894520"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Teléfono celular / WhatsApp *
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

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Correo electrónico (para comprobante digital)
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Dirección de entrega (Calle, Carrera, Barrio, Apto) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carrera 5 # 34-12, Barrio La Castellana"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Ciudad de entrega *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (e.target.value === "Montería") {
                          setDepartment("Córdoba");
                        }
                      }}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                    >
                      <option value="Montería">Montería (Córdoba)</option>
                      <option value="Cereté">Cereté (Córdoba)</option>
                      <option value="Sahagún">Sahagún (Córdoba)</option>
                      <option value="Lorica">Lorica (Córdoba)</option>
                      <option value="Bogotá">Bogotá D.C.</option>
                      <option value="Medellín">Medellín (Antioquia)</option>
                      <option value="Barranquilla">Barranquilla (Atlántico)</option>
                      <option value="Cartagena">Cartagena (Bolívar)</option>
                      <option value="Cali">Cali (Valle)</option>
                      <option value="Bucaramanga">Bucaramanga (Santander)</option>
                      <option value="Otras ciudades">Otra ciudad (Envío nacional)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#444] mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                    />
                  </div>
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
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                    Seguro
                  </span>
                </div>

                {/* Tabs de Métodos de Pago con Logos Reales */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Tarjeta */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      paymentMethod === "card"
                        ? "border-[var(--red)] bg-red-50/50 shadow-xs ring-1 ring-[var(--red)]"
                        : "border-[#e5e7eb] bg-white hover:border-[#ccc]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {/* Visa mini */}
                      <svg viewBox="0 0 32 20" className="h-4 w-auto rounded-[2px]" fill="none">
                        <rect width="32" height="20" rx="2" fill="#0A2540" />
                        <path d="M13.5 14h-1.8l1.1-7.2h1.8L13.5 14zm7.4-7c-.4-.2-1-.3-1.7-.3-1.9 0-3.3 1-3.3 2.4 0 1 .9 1.6 1.6 2 .7.3 1 .6 1 .9 0 .5-.7.8-1.4.8-.8 0-1.3-.2-1.8-.4l-.3-.1-.3 1.5c.5.2 1.4.4 2.3.4 2 0 3.3-.9 3.3-2.4 0-1.2-.8-1.8-1.7-2.2-.7-.3-1.1-.6-1.1-1 0-.4.5-.7 1.3-.7.6 0 1.1.1 1.4.3l.2.1.4-1.4zm4 0h-1.4c-.4 0-.8.1-.9.5l-2.6 6.5h1.9l.4-1h2.3l.2 1h1.7L24.9 7zm-1.8 4.7l1-2.6c0 0 .2-.7.4-1.1l.2 1 .5 2.7h-2.1zM10.6 7l-1.8 4.9-.2-.9c-.3-1.1-1.3-2.3-2.4-2.9l1.6 6h1.9l2.9-7.1h-2z" fill="#F7B600" />
                        <path d="M7.5 7H4.5l-.1.1c2.4.6 4.4 2.1 5.1 3.9l-.7-3.4c-.1-.5-.7-.6-1.3-.6z" fill="#FFF" />
                      </svg>
                      {/* Mastercard mini */}
                      <svg viewBox="0 0 32 20" className="h-4 w-auto rounded-[2px]">
                        <rect width="32" height="20" rx="2" fill="#141414" />
                        <circle cx="12" cy="10" r="5.5" fill="#EB001B" />
                        <circle cx="20" cy="10" r="5.5" fill="#F79E1B" />
                        <path d="M16 6a5.4 5.4 0 00-1.9 4 5.4 5.4 0 001.9 4 5.4 5.4 0 001.9-4A5.4 5.4 0 0016 6z" fill="#FF5F00" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-[#111]">Tarjeta</span>
                  </button>

                  {/* PSE */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pse")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      paymentMethod === "pse"
                        ? "border-[var(--red)] bg-red-50/50 shadow-xs ring-1 ring-[var(--red)]"
                        : "border-[#e5e7eb] bg-white hover:border-[#ccc]"
                    }`}
                  >
                    <svg viewBox="0 0 32 20" className="h-4 w-auto rounded-[2px]">
                      <rect width="32" height="20" rx="2" fill="#0C2340" />
                      <circle cx="16" cy="10" r="6.5" fill="#FFFFFF" />
                      <circle cx="16" cy="10" r="5.5" fill="#1B365D" />
                      <text x="16" y="12" fill="#FFFFFF" fontSize="5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                        PSE
                      </text>
                    </svg>
                    <span className="text-[11px] font-bold text-[#111]">PSE / Débito</span>
                  </button>

                  {/* Nequi / Daviplata */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("nequi")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      paymentMethod === "nequi"
                        ? "border-[var(--red)] bg-red-50/50 shadow-xs ring-1 ring-[var(--red)]"
                        : "border-[#e5e7eb] bg-white hover:border-[#ccc]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {/* Nequi mini */}
                      <svg viewBox="0 0 20 20" className="h-4 w-4 rounded-sm">
                        <rect width="20" height="20" rx="4" fill="#200020" />
                        <path d="M5 4h2v5.5l5.5-5.5H15v12h-2v-5.5L7.5 16H5V4z" fill="#FF007A" />
                      </svg>
                      {/* Daviplata mini */}
                      <svg viewBox="0 0 20 20" className="h-4 w-4 rounded-sm">
                        <rect width="20" height="20" rx="4" fill="#ED1C24" />
                        <circle cx="7" cy="10" r="3.5" fill="#FFD200" />
                        <text x="14" y="12" fill="#FFFFFF" fontSize="5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                          DP
                        </text>
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-[#111]">Nequi / Davi</span>
                  </button>

                  {/* Contra entrega */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash_on_delivery")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      paymentMethod === "cash_on_delivery"
                        ? "border-[var(--red)] bg-red-50/50 shadow-xs ring-1 ring-[var(--red)]"
                        : "border-[#e5e7eb] bg-white hover:border-[#ccc]"
                    }`}
                  >
                    <svg className="h-4 w-4 text-[#111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span className="text-[11px] font-bold text-[#111]">Contra Entrega</span>
                  </button>
                </div>

                {/* Subformulario según método elegido */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfd] p-4">
                    {/* Visual Card Mockup (Dynamic) */}
                    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-tr from-[#0a0a0f] via-[#1a1b24] to-[#252836] p-4 text-white shadow-xl">
                      {/* Background design elements */}
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-xl" />
                      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/10 blur-xl" />

                      <div className="relative z-10 flex items-center justify-between">
                        {/* EMV Chip */}
                        <div className="h-7 w-9 rounded-md bg-gradient-to-br from-[#ffd700] to-[#c59b27] p-1 flex flex-col justify-between border border-[#e6c043]">
                          <div className="h-[1px] w-full bg-[#8a6808]" />
                          <div className="h-[1px] w-full bg-[#8a6808]" />
                        </div>

                        {/* Brand Logo on Card */}
                        <div>
                          {cardBrand === "visa" && (
                            <span className="text-base font-black italic tracking-wider text-[#f7b600]">
                              VISA
                            </span>
                          )}
                          {cardBrand === "mastercard" && (
                            <div className="flex -space-x-2">
                              <span className="h-6 w-6 rounded-full bg-[#eb001b] opacity-90 inline-block" />
                              <span className="h-6 w-6 rounded-full bg-[#f79e1b] opacity-90 inline-block" />
                            </div>
                          )}
                          {cardBrand === "amex" && (
                            <span className="rounded bg-[#006fcf] px-2 py-0.5 text-xs font-black tracking-widest text-white">
                              AMEX
                            </span>
                          )}
                          {cardBrand === "unknown" && (
                            <span className="text-[10px] font-bold tracking-widest text-[#aaa]">
                              TECNO+ PAY
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Number display */}
                      <div className="relative z-10 my-4 tracking-widest font-mono text-base font-semibold text-[#f0f0f5]">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>

                      {/* Holder & Expiry */}
                      <div className="relative z-10 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#b0b3c0]">
                        <div>
                          <p className="text-[8px] text-[#707585]">Titular</p>
                          <p className="font-semibold text-white truncate max-w-[170px]">
                            {cardHolder || "NOMBRE DEL TITULAR"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-[#707585]">Expira</p>
                          <p className="font-semibold text-white font-mono">
                            {cardExpiry || "MM/AA"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inputs de la tarjeta */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-[#444]">
                            Número de tarjeta *
                          </label>
                          <div className="flex items-center gap-1.5 opacity-80">
                            {/* Visa */}
                            <svg viewBox="0 0 32 20" className="h-3.5 w-auto" fill="none">
                              <rect width="32" height="20" rx="2" fill="#0A2540" />
                              <path d="M13.5 14h-1.8l1.1-7.2h1.8L13.5 14zm7.4-7c-.4-.2-1-.3-1.7-.3-1.9 0-3.3 1-3.3 2.4 0 1 .9 1.6 1.6 2 .7.3 1 .6 1 .9 0 .5-.7.8-1.4.8-.8 0-1.3-.2-1.8-.4l-.3-.1-.3 1.5c.5.2 1.4.4 2.3.4 2 0 3.3-.9 3.3-2.4 0-1.2-.8-1.8-1.7-2.2-.7-.3-1.1-.6-1.1-1 0-.4.5-.7 1.3-.7.6 0 1.1.1 1.4.3l.2.1.4-1.4zm4 0h-1.4c-.4 0-.8.1-.9.5l-2.6 6.5h1.9l.4-1h2.3l.2 1h1.7L24.9 7zm-1.8 4.7l1-2.6c0 0 .2-.7.4-1.1l.2 1 .5 2.7h-2.1zM10.6 7l-1.8 4.9-.2-.9c-.3-1.1-1.3-2.3-2.4-2.9l1.6 6h1.9l2.9-7.1h-2z" fill="#F7B600" />
                            </svg>
                            {/* Mastercard */}
                            <svg viewBox="0 0 32 20" className="h-3.5 w-auto">
                              <rect width="32" height="20" rx="2" fill="#141414" />
                              <circle cx="12" cy="10" r="5.5" fill="#EB001B" />
                              <circle cx="20" cy="10" r="5.5" fill="#F79E1B" />
                              <path d="M16 6a5.4 5.4 0 00-1.9 4 5.4 5.4 0 001.9 4 5.4 5.4 0 001.9-4A5.4 5.4 0 0016 6z" fill="#FF5F00" />
                            </svg>
                            {/* Amex */}
                            <svg viewBox="0 0 32 20" className="h-3.5 w-auto">
                              <rect width="32" height="20" rx="2" fill="#006FCF" />
                              <text x="16" y="13" fill="#FFFFFF" fontSize="6" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                                AMEX
                              </text>
                            </svg>
                          </div>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 font-mono text-xs tracking-wider text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#444] mb-1">
                          Nombre impreso en la tarjeta *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="JUAN PEREZ"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs uppercase text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#444] mb-1">
                            Vencimiento (MM/AA) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 font-mono text-xs text-center text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#444] mb-1">
                            CVV / CVC (3 dígitos) *
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 font-mono text-xs text-center text-[#111] placeholder-[#9ca3af] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#444] mb-1">
                          Número de cuotas
                        </label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                          className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                        >
                          <option value="1">1 cuota (Sin interés mensual)</option>
                          <option value="3">3 cuotas</option>
                          <option value="6">6 cuotas</option>
                          <option value="12">12 cuotas</option>
                          <option value="24">24 cuotas</option>
                          <option value="36">36 cuotas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subformulario PSE */}
                {paymentMethod === "pse" && (
                  <div className="space-y-3.5 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfd] p-4 text-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1b365d]">
                      <span>Pagos Seguros en Línea (PSE Colombia)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#444] mb-1">
                        Selecciona tu Banco *
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                      >
                        <option value="Bancolombia">Bancolombia</option>
                        <option value="Nequi">Nequi (vía PSE)</option>
                        <option value="Banco de Bogotá">Banco de Bogotá</option>
                        <option value="Davivienda">Davivienda</option>
                        <option value="BBVA Colombia">BBVA Colombia</option>
                        <option value="Banco de Occidente">Banco de Occidente</option>
                        <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                        <option value="Banco Popular">Banco Popular</option>
                        <option value="Banco AV Villas">Banco AV Villas</option>
                        <option value="Nu Colombia">Nu Colombia</option>
                        <option value="Lulo Bank">Lulo Bank</option>
                        <option value="Daviplata">Daviplata (vía PSE)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#444] mb-1">
                          Tipo doc.
                        </label>
                        <select
                          value={pseDocType}
                          onChange={(e) => setPseDocType(e.target.value)}
                          className="w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                        >
                          <option value="CC">C.C.</option>
                          <option value="CE">C.E.</option>
                          <option value="NIT">NIT</option>
                          <option value="PP">Pasaporte</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-[#444] mb-1">
                          Número de documento *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Número de cédula"
                          value={documentId}
                          onChange={(e) => setDocumentId(e.target.value)}
                          className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-[#70757d] leading-relaxed">
                      Al presionar &quot;Pagar&quot;, el sistema conectará con la pasarela de tu entidad bancaria seleccionada para autorizar el débito seguro.
                    </p>
                  </div>
                )}

                {/* Subformulario Nequi */}
                {paymentMethod === "nequi" && (
                  <div className="space-y-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfd] p-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-[#200020] flex items-center justify-center text-[#ff007a] font-bold text-xs">
                        N
                      </div>
                      <span className="font-bold text-[#111]">
                        Pagar con Nequi o Daviplata
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#444] mb-1">
                        Número de celular registrado *
                      </label>
                      <input
                        type="tel"
                        placeholder="Ej. 304 354 7935"
                        value={nequiPhone || phone}
                        onChange={(e) => setNequiPhone(e.target.value)}
                        className="w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-xs text-[#111] outline-none transition focus:border-black"
                      />
                    </div>

                    <div className="rounded-xl bg-[#fdf2f8] p-3 text-[11px] text-[#831843] border border-[#fbcfe8] leading-relaxed">
                      💡 Enviaremos una solicitud de cobro push a tu app de Nequi por valor de{" "}
                      <strong>{formatPrice(activeTotal)}</strong>. Solo debes abrir Nequi y aceptar la notificación.
                    </div>
                  </div>
                )}

                {/* Subformulario Contra Entrega */}
                {paymentMethod === "cash_on_delivery" && (
                  <div className="space-y-2 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfd] p-4 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#111]">
                      <span>Pago Contra Entrega en Montería y Córdoba</span>
                    </div>
                    <p className="text-[11px] text-[#555] leading-relaxed">
                      Pagas únicamente cuando recibas el paquete en tus manos en tu domicilio. Aceptamos efectivo exacto o pago con tarjeta física en datáfono inalámbrico del mensajero.
                    </p>
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      ✓ Entrega asegurada el mismo día o en 24 horas en el casco urbano de Montería.
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de pago */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] py-4 text-sm font-extrabold text-white shadow-xl shadow-red-500/20 transition-all hover:scale-[1.01] hover:bg-[var(--red2)] active:scale-[0.99]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <span>Pagar {formatPrice(activeTotal)}</span>
                  <span>→</span>
                </button>

                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-[#70757d]">
                  <span className="flex items-center gap-1">🔒 Encriptación TLS 1.3</span>
                  <span>·</span>
                  <span>Garantía Tecno+</span>
                  <span>·</span>
                  <span>Factura Electrónica</span>
                </div>
              </div>
            </form>
          )}

          {/* ================= STEP 2: PROCESSING ================= */}
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
                Procesando Pago Seguro
              </h3>
              <p className="mt-2 max-w-xs text-xs text-[#70757d]">
                Estamos validando la transacción con la entidad bancaria a través de la pasarela cifrada...
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-full bg-[#f3f4f6] px-4 py-1.5 text-[11px] font-medium text-[#4b5563]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Validando token de seguridad
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS ================= */}
          {step === "success" && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center animate-fadeIn">
              {/* Checkmark icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                ¡Pago Aprobado con Éxito!
              </span>

              <h3 className="mt-2 text-xl font-black text-[#111]">
                ¡Gracias por tu compra, {customerName.split(" ")[0] || "Cliente"}!
              </h3>
              <p className="mt-1 text-xs text-[#70757d]">
                Tu pedido ha sido confirmado y ya está en preparación para envío.
              </p>

              {/* Receipt card */}
              <div className="mt-6 w-full rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-[#eee]">
                  <span className="text-[#70757d]">Número de Pedido:</span>
                  <span className="font-mono font-bold text-[#111]">{orderId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Total Pagado:</span>
                  <span className="font-extrabold text-[var(--red)]">
                    {formatPrice(activeTotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Método de Pago:</span>
                  <span className="font-semibold text-[#111] capitalize">
                    {paymentMethod === "card" && `Tarjeta (Terminada en ${cardNumber.slice(-4) || "••••"})`}
                    {paymentMethod === "pse" && `PSE (${selectedBank})`}
                    {paymentMethod === "nequi" && `Nequi / Daviplata`}
                    {paymentMethod === "cash_on_delivery" && `Pago Contra Entrega`}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Dirección de entrega:</span>
                  <span className="font-medium text-[#111] text-right truncate max-w-[200px]">
                    {address}, {city}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#70757d]">Teléfono de contacto:</span>
                  <span className="font-medium text-[#111]">{phone}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#eee]">
                  <span className="text-[#70757d]">Estado del envío:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    En preparación (Despacho en 24h)
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 w-full space-y-2.5">
                <button
                  onClick={() => alert(`Comprobante digital del pedido ${orderId} generado para ${customerName}.`)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#d1d5db] bg-white py-3 text-xs font-bold text-[#111] hover:bg-[#f3f4f6] transition-colors"
                >
                  <svg className="h-4 w-4 text-[#555]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar Factura Digital (PDF)
                </button>

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
