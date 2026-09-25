import { paymentService } from "./paymentService";
import { visitService } from "./visitService";
import type { DashboardSummary } from "../types";

export const statsService = {
  /**
   * Obtiene resumen ejecutivo combinado de pagos y personas en la tienda
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const [payments, visits] = await Promise.all([
      paymentService.getStats(),
      visitService.getStats(),
    ]);

    // Tasa de conversión: (Pagos totales / Visitantes únicos) * 100
    let conversionRate = 0;
    if (visits.uniqueVisitors > 0) {
      conversionRate = Number(
        ((payments.totalPayments / visits.uniqueVisitors) * 100).toFixed(2)
      );
    }

    return {
      payments,
      visits,
      conversionRate,
      dataSource: "supabase",
    };
  },
};
