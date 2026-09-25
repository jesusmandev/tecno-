"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/data/mockProducts";
import type { PaymentRecord } from "@/backend/types";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const boldStatus = searchParams.get("bold-tx-status") || searchParams.get("status");

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/backend/payments/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment) {
            setPayment(data.payment);
          }
        }
      } catch (err) {
        console.error("Error cargando orden:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Si Bold devolvió un parámetro de estado o lo tomamos de la orden
  const isApproved =
    boldStatus?.toLowerCase() === "approved" ||
    boldStatus?.toLowerCase() === "successful" ||
    payment?.status === "approved";

  const isRejected =
    boldStatus?.toLowerCase() === "rejected" ||
    boldStatus?.toLowerCase() === "failed" ||
    payment?.status === "rejected" ||
    payment?.status === "cancelled";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-black tracking-wider text-white hover:opacity-90 transition-opacity"
          >
            <span className="bg-gradient-to-r from-red-500 to-rose-600 px-2 py-0.5 rounded text-white text-lg">
              TECNO+
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-400">
              Colombia
            </span>
          </Link>
        </div>

        {/* Status Card */}
        <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Background Glow */}
          <div
            className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
              isApproved
                ? "bg-emerald-500"
                : isRejected
                ? "bg-rose-500"
                : "bg-amber-500"
            }`}
          />

          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-neutral-400 text-sm">
                Consultando el estado de tu pago en Bold...
              </p>
            </div>
          ) : isApproved ? (
            /* =================== APROBADO =================== */
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
                Pago Aprobado con Bold
              </span>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto mb-6">
                Tu pago ha sido procesado de manera segura por la pasarela oficial de Bold.co.
              </p>

              {/* Order Number Badge */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 inline-flex flex-col items-center">
                <span className="text-xs text-neutral-400 uppercase tracking-widest font-mono">
                  Número de Pedido
                </span>
                <span className="text-2xl font-mono font-black text-white mt-1 tracking-wider">
                  {orderId || payment?.order_number || "TP-CONFIRMADO"}
                </span>
              </div>

              {/* Order Details */}
              {payment && (
                <div className="text-left bg-black/40 border border-white/5 rounded-2xl p-5 mb-8 space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Cliente:</span>
                    <span className="font-semibold text-white">{payment.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Destino:</span>
                    <span className="text-white">
                      {payment.shipping_address}, {payment.city}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Total Pagado:</span>
                    <span className="font-bold text-emerald-400 text-base">
                      {formatPrice(payment.total)} COP
                    </span>
                  </div>

                  {payment.items && payment.items.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <span className="text-xs text-neutral-400 block mb-2 font-medium">
                        Productos adquiridos:
                      </span>
                      <ul className="space-y-1">
                        {payment.items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between text-xs text-neutral-300"
                          >
                            <span>
                              {it.quantity}x {it.title}
                            </span>
                            <span className="text-neutral-400">
                              {formatPrice(it.price * it.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isRejected ? (
            /* =================== RECHAZADO =================== */
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-500/15 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-400">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <span className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
                Transacción no completada
              </span>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                El pago no fue procesado
              </h1>
              <p className="text-neutral-400 text-sm max-w-md mx-auto mb-6">
                Tu entidad bancaria o Bold no autorizó la transacción. Puedes intentarlo nuevamente con otro medio de pago (Nequi, PSE o Tarjeta).
              </p>

              {orderId && (
                <div className="text-xs text-neutral-500 mb-6 font-mono">
                  Referencia de intento: {orderId}
                </div>
              )}
            </div>
          ) : (
            /* =================== PENDIENTE =================== */
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
                En Proceso de Validación
              </span>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Pago en verificación
              </h1>
              <p className="text-neutral-400 text-sm max-w-md mx-auto mb-6">
                Bold o tu banco está confirmando la transacción (habitual en pagos por PSE o Nequi). Te notificaremos una vez sea validada.
              </p>

              {orderId && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 inline-block font-mono text-sm mb-6">
                  Pedido: {orderId}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-white/10">
            {orderId && (
              <a
                href={`https://wa.me/573000000000?text=${encodeURIComponent(
                  `Hola Tecno+, acabo de realizar el pedido ${orderId} a través de Bold. ¿Me confirman el despacho por favor?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                </svg>
                Confirmar por WhatsApp
              </a>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium text-sm transition-all"
            >
              Volver a la Tienda
            </Link>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Pagos protegidos y respaldados por la tecnología de Bold.co Colombia</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
