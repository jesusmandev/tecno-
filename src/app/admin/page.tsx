"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { PaymentRecord, DashboardSummary, PaymentStatus, PageVisitRecord } from "@/backend/types";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados del Dashboard
  const [activeTab, setActiveTab] = useState<"payments" | "visits" | "supabase">("payments");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Filtros de pagos
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // Estado de sincronización
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Cargar contraseña guardada en sesión
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("tp_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Función para obtener todos los datos
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch("/api/backend/stats"),
        fetch("/api/backend/payments"),
      ]);

      const statsData = await statsRes.json();
      const paymentsData = await paymentsRes.json();

      if (statsData.success && statsData.summary) {
        setSummary(statsData.summary);
      }
      if (paymentsData.success && paymentsData.payments) {
        setPayments(paymentsData.payments);
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      // Auto-refresco cada 25 segundos para monitoreo en vivo
      const interval = setInterval(loadDashboardData, 25000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadDashboardData]);

  // Manejar Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    // Valida contra la contraseña por defecto de .env.local
    if (passwordInput === "tecnomasadmin2026") {
      setIsAuthenticated(true);
      sessionStorage.setItem("tp_admin_auth", "true");
    } else {
      setAuthError("Contraseña incorrecta. Por favor verifica.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("tp_admin_auth");
    setPasswordInput("");
  };

  // Cambiar estado de un pago
  const handleStatusChange = async (paymentId: string, newStatus: PaymentStatus) => {
    try {
      const res = await fetch(`/api/backend/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
        );
        if (selectedPayment?.id === paymentId) {
          setSelectedPayment((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  // Sincronizar hacia Supabase
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/backend/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: "tecnomasadmin2026" }),
      });
      const data = await res.json();
      setSyncResult({
        success: data.success,
        message: data.message || (data.success ? "Sincronizado" : data.error),
      });
      loadDashboardData();
    } catch {
      setSyncResult({
        success: false,
        message: "No se pudo conectar con el endpoint de sincronización.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Exportar a Excel (.xlsx)
  const handleExportExcel = () => {
    if (!payments.length) return;

    const dataToExport = payments.map((p) => ({
      "N° Pedido": p.order_number,
      "Fecha": new Date(p.created_at).toLocaleString("es-CO"),
      "Cliente": p.customer_name,
      "Teléfono": p.customer_phone,
      "Cédula/NIT": p.customer_id_number || "N/A",
      "Email": p.customer_email || "N/A",
      "Ciudad": p.city,
      "Departamento": p.department,
      "Dirección": p.shipping_address,
      "Método de Pago": p.payment_method.toUpperCase(),
      "Total (COP)": p.total,
      "Estado": p.status.toUpperCase(),
      "Artículos": p.items.map((i) => `${i.title} (x${i.quantity})`).join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos y Pedidos");
    XLSX.writeFile(
      workbook,
      `TecnoMas_Pagos_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Copiar SQL
  const handleCopySql = () => {
    const sqlText = `-- TABLA: payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50) NOT NULL,
    customer_id_number VARCHAR(50),
    department VARCHAR(100) DEFAULT 'Córdoba',
    city VARCHAR(100) DEFAULT 'Montería',
    shipping_address TEXT NOT NULL,
    address_notes TEXT,
    payment_method VARCHAR(50) NOT NULL,
    payment_method_detail JSONB DEFAULT '{}'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    items_count INT DEFAULT 1,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'COP',
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLA: page_visits
CREATE TABLE IF NOT EXISTS public.page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    device_type VARCHAR(20) DEFAULT 'desktop',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_insert_policy ON public.payments FOR INSERT TO public, anon, authenticated WITH CHECK (true);
CREATE POLICY page_visits_insert_policy ON public.page_visits FOR INSERT TO public, anon, authenticated WITH CHECK (true);
CREATE POLICY payments_admin_policy ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY page_visits_admin_policy ON public.page_visits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY payments_select_policy ON public.payments FOR SELECT TO public, anon, authenticated USING (true);
CREATE POLICY page_visits_select_policy ON public.page_visits FOR SELECT TO public, anon, authenticated USING (true);`;

    navigator.clipboard.writeText(sqlText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // Filtrado de pagos
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        searchQuery === "" ||
        p.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer_phone.includes(searchQuery) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchMethod = methodFilter === "all" || p.payment_method === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, searchQuery, statusFilter, methodFilter]);

  // Formato de moneda COP
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ==========================================
  // PANTALLA DE ACCESO (LOGIN)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#16181f]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-red-400 text-white shadow-lg shadow-red-500/30">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              Backend Tecno+
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Panel Administrativo de Pagos, Pedidos y Analítica de Visitas
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-300">
                Contraseña de Administrador
              </label>
              <input
                type="password"
                placeholder="Ingresa la contraseña..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
                autoFocus
              />
              {authError && (
                <p className="mt-2 text-xs font-medium text-rose-400">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 active:scale-[0.99] shadow-lg shadow-red-600/30"
            >
              <span>Acceder al Panel</span>
              <span>→</span>
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-neutral-400 hover:text-white transition"
              >
                ← Volver a la Tienda Tecno+
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0d0e12] text-neutral-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#16181f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white font-black text-sm shadow-md shadow-red-600/20">
              T+
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-tight">
                Tecno+ Backend
              </h1>
              <p className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Base de Datos y Analítica Activa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 transition"
              title="Actualizar datos"
            >
              <svg
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refrescar</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 transition"
            >
              <span>Ver Tienda</span>
              <span>↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/40 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* ==============================================================
            METRIC KPI CARDS (PAGOS, INGRESOS, PERSONAS ENTRANDO, CONVERSIÓN)
            ============================================================== */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Pagos */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1b1d26] to-[#14161f] p-5 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Total Pagos Registrados</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                💳
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {summary?.payments.totalPayments ?? payments.length}
              </span>
              <span className="text-xs text-neutral-400">pedidos</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="text-emerald-400 font-semibold">
                +{summary?.payments.todayPaymentsCount ?? 0} hoy
              </span>
              <span>·</span>
              <span>Aprobados: {summary?.payments.byStatus.approved ?? 0}</span>
            </div>
          </div>

          {/* Card 2: Ingresos Totales */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1b1d26] to-[#14161f] p-5 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Ingresos Totales (COP)</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                💰
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-emerald-400 sm:text-3xl">
                {formatMoney(summary?.payments.totalRevenue ?? 0)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-400">
              Ticket promedio: {formatMoney(summary?.payments.averageTicket ?? 0)}
            </div>
          </div>

          {/* Card 3: Personas que entran a la página */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1b1d26] to-[#14161f] p-5 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Personas en la Página</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                👥
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {summary?.visits.uniqueVisitors ?? 0}
              </span>
              <span className="text-xs text-neutral-400">personas únicas</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="text-purple-300 font-semibold">
                {summary?.visits.totalVisits ?? 0} vistas totales
              </span>
              <span>·</span>
              <span>+{summary?.visits.todayVisits ?? 0} hoy</span>
            </div>
          </div>

          {/* Card 4: Tasa de Conversión */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1b1d26] to-[#14161f] p-5 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Tasa de Conversión</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                🎯
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-400">
                {summary?.conversionRate ?? 0}%
              </span>
              <span className="text-xs text-neutral-400">compradores</span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-400">
              Móviles: {summary?.visits.byDevice.mobile ?? 0} · PC: {summary?.visits.byDevice.desktop ?? 0}
            </div>
          </div>
        </section>

        {/* ==============================================================
            NAVIGATION TABS (PAGOS, VISITAS, BASE DE DATOS)
            ============================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex gap-2 rounded-xl bg-neutral-900/60 p-1 border border-white/5">
            <button
              onClick={() => setActiveTab("payments")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "payments"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              💳 Historial de Pagos ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab("visits")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "visits"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              👥 Analítica de Personas / Visitas
            </button>
            <button
              onClick={() => setActiveTab("supabase")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "supabase"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              ⚡ Configuración de Base de Datos
            </button>
          </div>

          {activeTab === "payments" && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Excel (.xlsx)</span>
            </button>
          )}
        </div>

        {/* ==============================================================
            TAB 1: REGISTRO DE PAGOS Y PEDIDOS
            ============================================================== */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por orden, cliente, teléfono, ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/80 px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 outline-none focus:border-red-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="approved">Aprobado</option>
                  <option value="processing">En preparación</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 outline-none focus:border-red-500"
                >
                  <option value="all">Todos los métodos</option>
                  <option value="card">Tarjeta Débito/Crédito</option>
                  <option value="nequi">Nequi / Daviplata</option>
                  <option value="pse">PSE</option>
                  <option value="cash_on_delivery">Contra Entrega</option>
                </select>
              </div>
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#16181f] shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/5 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">N° Orden</th>
                    <th className="px-4 py-3.5">Cliente</th>
                    <th className="px-4 py-3.5">Teléfono / WhatsApp</th>
                    <th className="px-4 py-3.5">Ciudad</th>
                    <th className="px-4 py-3.5">Método</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5">Fecha</th>
                    <th className="px-4 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500">
                        No se encontraron pagos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-white/[0.02] transition cursor-pointer"
                        onClick={() => setSelectedPayment(p)}
                      >
                        <td className="px-4 py-3.5 font-mono font-bold text-red-400">
                          {p.order_number}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{p.customer_name}</div>
                          {p.customer_email && (
                            <div className="text-[10px] text-neutral-500">{p.customer_email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-neutral-300">
                          {p.customer_phone}
                        </td>
                        <td className="px-4 py-3.5 text-neutral-300">
                          {p.city}, {p.department}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                            {p.payment_method === "card" && "💳 Tarjeta"}
                            {p.payment_method === "nequi" && "🟣 Nequi"}
                            {p.payment_method === "pse" && "🏦 PSE"}
                            {p.payment_method === "cash_on_delivery" && "📦 Contra Entrega"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          {formatMoney(p.total)}
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.status}
                            onChange={(e) =>
                              handleStatusChange(p.id, e.target.value as PaymentStatus)
                            }
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold outline-none border ${
                              p.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : p.status === "processing"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : p.status === "shipped"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : p.status === "delivered"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : "bg-neutral-800 text-neutral-400 border-neutral-700"
                            }`}
                          >
                            <option value="approved">Aprobado</option>
                            <option value="processing">En preparación</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-400 text-[11px]">
                          {new Date(p.created_at).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 2: ANALÍTICA DE PERSONAS QUE ENTRAN A LA PÁGINA
            ============================================================== */}
        {activeTab === "visits" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Páginas más visitadas */}
              <div className="rounded-2xl border border-white/10 bg-[#16181f] p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <span>🔥 Páginas Más Vistas por las Personas</span>
                </h3>
                <div className="space-y-3">
                  {summary?.visits.topPages.length ? (
                    summary.visits.topPages.map((page, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-neutral-300 truncate max-w-[260px]">
                          {page.path}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-neutral-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-red-500 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (page.count / (summary?.visits.totalVisits || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-white">{page.count} visitas</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500">Sin datos registrados aún.</p>
                  )}
                </div>
              </div>

              {/* Dispositivos de los visitantes */}
              <div className="rounded-2xl border border-white/10 bg-[#16181f] p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <span>📱 Dispositivos de los Usuarios</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">📱 Celulares (Móvil)</span>
                      <span className="font-bold text-white">
                        {summary?.visits.byDevice.mobile ?? 0} usuarios
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{
                          width: `${
                            summary?.visits.totalVisits
                              ? ((summary.visits.byDevice.mobile / summary.visits.totalVisits) *
                                  100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">💻 Computadores (Escritorio)</span>
                      <span className="font-bold text-white">
                        {summary?.visits.byDevice.desktop ?? 0} usuarios
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${
                            summary?.visits.totalVisits
                              ? ((summary.visits.byDevice.desktop / summary.visits.totalVisits) *
                                  100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial en Vivo de Entradas a la Página */}
            <div className="rounded-2xl border border-white/10 bg-[#16181f] p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Registro en Vivo de Personas Entrando</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-neutral-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2">Visitante</th>
                      <th className="py-2">Ruta / Página</th>
                      <th className="py-2">Dispositivo</th>
                      <th className="py-2">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {summary?.visits.recentVisits.map((v: PageVisitRecord) => (
                      <tr key={v.id} className="hover:bg-white/[0.02]">
                        <td className="py-2 font-mono text-[11px] text-neutral-400">
                          {v.visitor_id.slice(0, 14)}...
                        </td>
                        <td className="py-2 font-mono text-white">{v.page_path}</td>
                        <td className="py-2 text-neutral-300">
                          {v.device_type === "mobile" ? "📱 Móvil" : "💻 Desktop"}
                        </td>
                        <td className="py-2 text-neutral-500 text-[11px]">
                          {new Date(v.created_at).toLocaleTimeString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: CONFIGURACIÓN DE BASE DE DATOS (SUPABASE)
            ============================================================== */}
        {activeTab === "supabase" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#16181f] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>⚡ Base de Datos Supabase (PostgreSQL)</span>
                  </h3>
                  <p className="mt-1 text-xs text-neutral-400">
                    URL configurada: <code className="text-red-400">https://loytxdzobuqpemjxhnza.supabase.co</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition shadow-lg shadow-red-600/30"
                  >
                    <span>{sqlCopied ? "✓ ¡SQL Copiado!" : "Copiar SQL para Supabase"}</span>
                  </button>

                  <button
                    onClick={handleSyncSupabase}
                    disabled={isSyncing}
                    className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 transition"
                  >
                    <span>{isSyncing ? "Sincronizando..." : "Sincronizar Datos"}</span>
                  </button>
                </div>
              </div>

              {syncResult && (
                <div
                  className={`mt-4 rounded-xl p-3 text-xs font-medium border ${
                    syncResult.success
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {syncResult.message}
                </div>
              )}

              <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900/90 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Script SQL para ejecutar en el SQL Editor de Supabase
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Crea tablas payments, page_visits y políticas RLS
                  </span>
                </div>
                <pre className="max-h-60 overflow-y-auto font-mono text-[11px] text-neutral-300 leading-relaxed">
{`-- Ejecuta esto en tu Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50) NOT NULL,
    customer_id_number VARCHAR(50),
    department VARCHAR(100) DEFAULT 'Córdoba',
    city VARCHAR(100) DEFAULT 'Montería',
    shipping_address TEXT NOT NULL,
    address_notes TEXT,
    payment_method VARCHAR(50) NOT NULL,
    payment_method_detail JSONB DEFAULT '{}'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    referrer TEXT,
    device_type VARCHAR(20) DEFAULT 'desktop',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            MODAL DE DETALLE DEL PAGO / PEDIDO SELECCIONADO
            ============================================================== */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#16181f] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-red-400 font-mono">
                    {selectedPayment.order_number}
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Detalle del Pedido de {selectedPayment.customer_name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-full bg-white/10 p-2 text-neutral-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Información del Cliente y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-neutral-900/80 p-3 space-y-1">
                  <div className="text-[11px] font-bold text-neutral-400">Cliente</div>
                  <div className="font-semibold text-white">{selectedPayment.customer_name}</div>
                  <div>📞 {selectedPayment.customer_phone}</div>
                  {selectedPayment.customer_id_number && (
                    <div>🆔 Cédula: {selectedPayment.customer_id_number}</div>
                  )}
                  {selectedPayment.customer_email && (
                    <div>✉️ {selectedPayment.customer_email}</div>
                  )}
                </div>

                <div className="rounded-xl bg-neutral-900/80 p-3 space-y-1">
                  <div className="text-[11px] font-bold text-neutral-400">Entrega</div>
                  <div className="font-semibold text-white">
                    {selectedPayment.city}, {selectedPayment.department}
                  </div>
                  <div>📍 {selectedPayment.shipping_address}</div>
                  {selectedPayment.address_notes && (
                    <div className="text-neutral-400 italic">
                      Nota: {selectedPayment.address_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Artículos Comprados */}
              <div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Artículos ({selectedPayment.items.length})
                </div>
                <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-neutral-900/60 p-3">
                  {selectedPayment.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <div className="font-semibold text-white">{item.title}</div>
                        {item.variantTitle && (
                          <div className="text-[10px] text-neutral-500">
                            {item.variantTitle}
                          </div>
                        )}
                        <div className="text-[11px] text-neutral-400">
                          Cantidad: {item.quantity} × {formatMoney(item.price)}
                        </div>
                      </div>
                      <div className="font-bold text-white">
                        {formatMoney(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Pago */}
              <div className="flex items-center justify-between rounded-xl bg-red-950/20 border border-red-500/20 p-4">
                <div>
                  <div className="text-xs text-neutral-400">Método de Pago</div>
                  <div className="font-bold text-white uppercase text-xs">
                    {selectedPayment.payment_method}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Total Pagado</div>
                  <div className="text-xl font-black text-red-400">
                    {formatMoney(selectedPayment.total)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
