import fs from "fs";
import path from "path";
import type { PaymentRecord, PageVisitRecord } from "../types";

const DATA_DIR = path.join(process.cwd(), "src", "backend", "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface LocalStoreData {
  payments: PaymentRecord[];
  visits: PageVisitRecord[];
  lastUpdated: string;
}

// Datos semilla iniciales para que el panel no empiece en cero
const INITIAL_DATA: LocalStoreData = {
  payments: [
    {
      id: "pay-seed-001",
      order_number: "TP-729410",
      customer_name: "Carlos Mendoza",
      customer_email: "carlos.mendoza@gmail.com",
      customer_phone: "3012345678",
      customer_id_number: "1067894523",
      department: "Córdoba",
      city: "Montería",
      shipping_address: "Calle 29 #14-25 Barrio El Recreo",
      address_notes: "Casa de dos pisos rejas blancas",
      payment_method: "nequi",
      payment_method_detail: { phone: "3012345678" },
      items: [
        {
          id: "prod-1",
          title: "iPhone 15 Pro Max 256GB Titanio Natural",
          price: 4299900,
          quantity: 1,
          variantTitle: "256GB / Titanio",
        },
      ],
      items_count: 1,
      subtotal: 4299900,
      shipping_cost: 0,
      total: 4299900,
      currency: "COP",
      status: "approved",
      notes: "Pago recibido por Nequi",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "pay-seed-002",
      order_number: "TP-839211",
      customer_name: "Valentina Gómez",
      customer_email: "valen.gomez@hotmail.com",
      customer_phone: "3159876543",
      customer_id_number: "1102837492",
      department: "Córdoba",
      city: "Cereté",
      shipping_address: "Carrera 12 #8-40 Centro",
      payment_method: "cash_on_delivery",
      items: [
        {
          id: "prod-2",
          title: "Combo Gamer Tecno+ Redragon Pro + Mousepad",
          price: 289900,
          quantity: 1,
          variantTitle: "RGB Black",
        },
      ],
      items_count: 1,
      subtotal: 289900,
      shipping_cost: 0,
      total: 289900,
      currency: "COP",
      status: "processing",
      notes: "Contra entrega en Cereté",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ],
  visits: [
    {
      id: "vis-seed-001",
      visitor_id: "vis_demo_1",
      session_id: "sess_demo_1",
      page_path: "/",
      device_type: "mobile",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "vis-seed-002",
      visitor_id: "vis_demo_2",
      session_id: "sess_demo_2",
      page_path: "/catalogo",
      device_type: "desktop",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "vis-seed-003",
      visitor_id: "vis_demo_3",
      session_id: "sess_demo_3",
      page_path: "/productos/iphone-15-pro-max",
      device_type: "mobile",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ],
  lastUpdated: new Date().toISOString(),
};

function ensureStoreExists(): LocalStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_DATA, null, 2), "utf-8");
      return INITIAL_DATA;
    }
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading local backend store:", error);
    return INITIAL_DATA;
  }
}

function saveStore(data: LocalStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving local backend store:", error);
  }
}

export const localStore = {
  getPayments(): PaymentRecord[] {
    const data = ensureStoreExists();
    return data.payments || [];
  },

  addPayment(payment: PaymentRecord): PaymentRecord {
    const data = ensureStoreExists();
    data.payments = [payment, ...(data.payments || [])];
    saveStore(data);
    return payment;
  },

  updatePaymentStatus(idOrOrder: string, status: PaymentRecord["status"]): PaymentRecord | null {
    const data = ensureStoreExists();
    const index = data.payments.findIndex(
      (p) => p.id === idOrOrder || p.order_number === idOrOrder
    );
    if (index === -1) return null;
    data.payments[index].status = status;
    data.payments[index].updated_at = new Date().toISOString();
    saveStore(data);
    return data.payments[index];
  },

  getVisits(): PageVisitRecord[] {
    const data = ensureStoreExists();
    return data.visits || [];
  },

  addVisit(visit: PageVisitRecord): PageVisitRecord {
    const data = ensureStoreExists();
    // Limitar histórico local a 2000 visitas para optimizar almacenamiento
    const visits = [visit, ...(data.visits || [])].slice(0, 2000);
    data.visits = visits;
    saveStore(data);
    return visit;
  },

  getAll(): LocalStoreData {
    return ensureStoreExists();
  },
};
