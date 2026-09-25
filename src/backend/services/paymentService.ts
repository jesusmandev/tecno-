import { getSupabaseAdmin } from "@/lib/supabase";
import { localStore } from "../db/localStore";
import type { 
  PaymentRecord, 
  CreatePaymentInput, 
  PaymentStats, 
  PaymentStatus, 
  PaymentMethod 
} from "../types";

// Generador de número de orden seguro y legible: TP-XXXXXX
export function generateOrderNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `TP-${randomDigits}`;
}

export const paymentService = {
  /**
   * Registra un nuevo pago en el sistema
   */
  async createPayment(input: CreatePaymentInput): Promise<{
    success: boolean;
    payment: PaymentRecord;
    source: "supabase" | "local_store";
    error?: string;
  }> {
    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber();
    const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newPayment: PaymentRecord = {
      id,
      order_number: orderNumber,
      customer_name: input.customer_name.trim(),
      customer_email: input.customer_email?.trim() || "",
      customer_phone: input.customer_phone.trim(),
      customer_id_number: input.customer_id_number?.trim() || "",
      department: input.department?.trim() || "Córdoba",
      city: input.city?.trim() || "Montería",
      shipping_address: input.shipping_address.trim(),
      address_notes: input.address_notes?.trim() || "",
      payment_method: input.payment_method,
      payment_method_detail: input.payment_method_detail || {},
      items: input.items || [],
      items_count: input.items.reduce((acc, item) => acc + (item.quantity || 1), 0),
      subtotal: Number(input.subtotal) || 0,
      shipping_cost: Number(input.shipping_cost) || 0,
      total: Number(input.total) || 0,
      currency: "COP",
      status: input.payment_method === "cash_on_delivery" ? "processing" : "approved",
      notes: input.notes || "",
      ip_address: input.ip_address || "",
      user_agent: input.user_agent || "",
      created_at: now,
      updated_at: now,
    };

    // Intentar guardar en Supabase
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("payments")
        .insert([newPayment])
        .select()
        .single();

      if (!error && data) {
        // También guardamos copia local como respaldo
        localStore.addPayment(newPayment);
        return {
          success: true,
          payment: data as PaymentRecord,
          source: "supabase",
        };
      }

      console.warn("Supabase insert falló, usando localStore fallback:", error?.message);
    } catch (err: unknown) {
      console.warn("Supabase no disponible, usando localStore:", err);
    }

    // Fallback: guardar en localStore
    const saved = localStore.addPayment(newPayment);
    return {
      success: true,
      payment: saved,
      source: "local_store",
    };
  },

  /**
   * Obtiene la lista de pagos con filtros opcionales
   */
  async getPayments(filters?: {
    status?: string;
    method?: string;
    search?: string;
    limit?: number;
  }): Promise<{
    payments: PaymentRecord[];
    total: number;
    source: "supabase" | "local_store";
  }> {
    let payments: PaymentRecord[] = [];
    let source: "supabase" | "local_store" = "supabase";

    try {
      const admin = getSupabaseAdmin();
      let query = admin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.method && filters.method !== "all") {
        query = query.eq("payment_method", filters.method);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        payments = data as PaymentRecord[];
      } else {
        source = "local_store";
        payments = localStore.getPayments();
      }
    } catch {
      source = "local_store";
      payments = localStore.getPayments();
    }

    // Filtrado en memoria si vino de local_store o si hay búsqueda textual
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.order_number.toLowerCase().includes(q) ||
          p.customer_name.toLowerCase().includes(q) ||
          p.customer_phone.includes(q) ||
          p.city.toLowerCase().includes(q)
      );
    }

    if (source === "local_store") {
      if (filters?.status && filters.status !== "all") {
        payments = payments.filter((p) => p.status === filters.status);
      }
      if (filters?.method && filters.method !== "all") {
        payments = payments.filter((p) => p.payment_method === filters.method);
      }
      if (filters?.limit) {
        payments = payments.slice(0, filters.limit);
      }
    }

    return {
      payments,
      total: payments.length,
      source,
    };
  },

  /**
   * Busca un pago por ID o número de orden
   */
  async getPaymentById(idOrOrder: string): Promise<PaymentRecord | null> {
    try {
      const admin = getSupabaseAdmin();
      const { data } = await admin
        .from("payments")
        .select("*")
        .or(`id.eq.${idOrOrder},order_number.eq.${idOrOrder}`)
        .maybeSingle();

      if (data) return data as PaymentRecord;
    } catch {
      // Ignorar error y buscar en localStore
    }

    const localList = localStore.getPayments();
    return (
      localList.find(
        (p) => p.id === idOrOrder || p.order_number === idOrOrder
      ) || null
    );
  },

  /**
   * Actualiza el estado de un pago (ej. approved -> shipped)
   */
  async updateStatus(
    idOrOrder: string,
    status: PaymentStatus
  ): Promise<{ success: boolean; payment: PaymentRecord | null }> {
    try {
      const admin = getSupabaseAdmin();
      const { data } = await admin
        .from("payments")
        .update({ status, updated_at: new Date().toISOString() })
        .or(`id.eq.${idOrOrder},order_number.eq.${idOrOrder}`)
        .select()
        .maybeSingle();

      if (data) {
        localStore.updatePaymentStatus(idOrOrder, status);
        return { success: true, payment: data as PaymentRecord };
      }
    } catch {
      // Continuar con fallback
    }

    const updated = localStore.updatePaymentStatus(idOrOrder, status);
    return { success: !!updated, payment: updated };
  },

  /**
   * Calcula estadísticas y métricas financieras de los pagos
   */
  async getStats(): Promise<PaymentStats> {
    const { payments } = await this.getPayments();

    const todayStr = new Date().toISOString().slice(0, 10);

    const byStatus: Record<PaymentStatus, number> = {
      pending: 0,
      approved: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    const byMethod: Record<PaymentMethod, number> = {
      card: 0,
      nequi: 0,
      pse: 0,
      cash_on_delivery: 0,
    };

    let totalRevenue = 0;
    let todayPaymentsCount = 0;
    let todayRevenue = 0;

    for (const p of payments) {
      if (p.status !== "cancelled") {
        totalRevenue += p.total || 0;
      }

      if (byStatus[p.status] !== undefined) {
        byStatus[p.status]++;
      }

      if (byMethod[p.payment_method] !== undefined) {
        byMethod[p.payment_method]++;
      }

      const paymentDate = (p.created_at || "").slice(0, 10);
      if (paymentDate === todayStr) {
        todayPaymentsCount++;
        if (p.status !== "cancelled") {
          todayRevenue += p.total || 0;
        }
      }
    }

    const totalPayments = payments.length;
    const averageTicket =
      totalPayments > 0 ? Math.round(totalRevenue / totalPayments) : 0;

    return {
      totalPayments,
      totalRevenue,
      averageTicket,
      todayPaymentsCount,
      todayRevenue,
      byStatus,
      byMethod,
    };
  },
};
