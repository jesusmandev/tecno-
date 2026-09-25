import { getSupabaseAdmin } from "@/lib/supabase";
import { localStore } from "../db/localStore";
import type { PageVisitRecord, CreateVisitInput, VisitStats } from "../types";

export const visitService = {
  /**
   * Registra una visita / entrada de una persona a una página
   */
  async recordVisit(input: CreateVisitInput): Promise<{
    success: boolean;
    visit: PageVisitRecord;
    source: "supabase" | "local_store";
  }> {
    const now = new Date().toISOString();
    const id = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Detectar dispositivo simple según User-Agent si no se pasó
    let deviceType: "mobile" | "desktop" | "tablet" = input.device_type || "desktop";
    if (!input.device_type && input.user_agent) {
      const ua = input.user_agent.toLowerCase();
      if (/tablet|ipad/i.test(ua)) {
        deviceType = "tablet";
      } else if (/mobile|iphone|android|phone/i.test(ua)) {
        deviceType = "mobile";
      }
    }

    const newVisit: PageVisitRecord = {
      id,
      visitor_id: input.visitor_id,
      session_id: input.session_id,
      page_path: input.page_path || "/",
      referrer: input.referrer || "",
      user_agent: input.user_agent || "",
      device_type: deviceType,
      created_at: now,
    };

    // Intentar guardar en Supabase
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("page_visits")
        .insert([newVisit])
        .select()
        .single();

      if (!error && data) {
        localStore.addVisit(newVisit);
        return {
          success: true,
          visit: data as PageVisitRecord,
          source: "supabase",
        };
      }
    } catch {
      // Ignorar error y usar fallback local
    }

    const saved = localStore.addVisit(newVisit);
    return {
      success: true,
      visit: saved,
      source: "local_store",
    };
  },

  /**
   * Obtiene estadísticas de personas que entran a la página
   */
  async getStats(): Promise<VisitStats> {
    let visits: PageVisitRecord[] = [];

    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("page_visits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!error && data && data.length > 0) {
        visits = data as PageVisitRecord[];
      } else {
        visits = localStore.getVisits();
      }
    } catch {
      visits = localStore.getVisits();
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const uniqueVisitorSet = new Set<string>();
    const todayUniqueSet = new Set<string>();
    let todayVisits = 0;

    const byDevice = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    };

    const pageCountMap = new Map<string, number>();

    for (const v of visits) {
      if (v.visitor_id) {
        uniqueVisitorSet.add(v.visitor_id);
      }

      const visitDate = (v.created_at || "").slice(0, 10);
      if (visitDate === todayStr) {
        todayVisits++;
        if (v.visitor_id) {
          todayUniqueSet.add(v.visitor_id);
        }
      }

      if (v.device_type === "mobile") byDevice.mobile++;
      else if (v.device_type === "tablet") byDevice.tablet++;
      else byDevice.desktop++;

      const path = v.page_path || "/";
      pageCountMap.set(path, (pageCountMap.get(path) || 0) + 1);
    }

    const topPages = Array.from(pageCountMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalVisits: visits.length,
      uniqueVisitors: uniqueVisitorSet.size,
      todayVisits,
      todayUniqueVisitors: todayUniqueSet.size,
      byDevice,
      topPages,
      recentVisits: visits.slice(0, 15),
    };
  },
};
