// Tipos del Backend de Tecno+ (Pagos, Visitas y Analítica)

export type PaymentMethod = "bold" | "card" | "nequi" | "pse" | "cash_on_delivery";

export type PaymentStatus = 
  | "pending" 
  | "approved" 
  | "processing" 
  | "shipped" 
  | "delivered" 
  | "cancelled"
  | "rejected";

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variantTitle?: string;
}

export interface PaymentRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_id_number?: string;
  department: string;
  city: string;
  shipping_address: string;
  address_notes?: string;
  payment_method: PaymentMethod;
  payment_method_detail?: Record<string, unknown>;
  items: OrderItem[];
  items_count: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  status: PaymentStatus;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentInput {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_id_number?: string;
  department?: string;
  city?: string;
  shipping_address: string;
  address_notes?: string;
  payment_method: PaymentMethod;
  payment_method_detail?: Record<string, unknown>;
  items: OrderItem[];
  subtotal: number;
  shipping_cost?: number;
  total: number;
  notes?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface PageVisitRecord {
  id: string;
  visitor_id: string;
  session_id: string;
  page_path: string;
  referrer?: string;
  user_agent?: string;
  device_type: "mobile" | "desktop" | "tablet";
  ip_hash?: string;
  created_at: string;
}

export interface CreateVisitInput {
  visitor_id: string;
  session_id: string;
  page_path: string;
  referrer?: string;
  user_agent?: string;
  device_type?: "mobile" | "desktop" | "tablet";
  ip_address?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalRevenue: number;
  averageTicket: number;
  todayPaymentsCount: number;
  todayRevenue: number;
  byStatus: Record<PaymentStatus, number>;
  byMethod: Record<PaymentMethod, number>;
}

export interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  byDevice: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topPages: { path: string; count: number }[];
  recentVisits: PageVisitRecord[];
}

export interface DashboardSummary {
  payments: PaymentStats;
  visits: VisitStats;
  conversionRate: number; // Porcentaje de personas que compran
  dataSource: "supabase" | "local_store";
}
