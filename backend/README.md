# 🛠️ Backend Tecno+ - Base de Datos, Pagos y Analíticas

Este módulo contiene la arquitectura completa del backend para registrar **pagos**, **pedidos**, **métricas de ingresos** y el **registro de personas/visitas que entran a la tienda**.

---

## 📁 Estructura del Backend

```
backend/
├── database/
│   └── schema.sql          # Script SQL completo para Supabase (PostgreSQL)
└── README.md               # Esta documentación

src/
├── backend/
│   ├── types.ts            # Tipos de TypeScript (Payment, PageVisit, Stats, etc.)
│   ├── db/
│   │   ├── supabase.ts     # Cliente con rol de administrador y público
│   │   └── localStore.ts   # Almacenamiento local persistente con fallback automático
│   └── services/
│       ├── paymentService.ts   # Lógica de creación, listado, estados y conteo de pagos
│       ├── visitService.ts     # Lógica de tracking de personas y analíticas de tráfico
│       └── statsService.ts     # Métricas unificadas (tasa de conversión, totales)
└── app/
    ├── api/
    │   └── backend/
    │       ├── payments/       # Endpoint POST (registrar pago) y GET (historial y filtros)
    │       ├── payments/[id]/  # Endpoint GET (detalle) y PATCH (cambiar estado)
    │       ├── visits/         # Endpoint POST (registrar entrada a la página) y GET (métricas)
    │       ├── stats/          # Resumen consolidado para dashboard
    │       └── sync/           # Sincronización entre store local y Supabase
    └── admin/                  # Panel Administrador en vivo con métricas y gestión
```

---

## 🚀 Cómo conectar la Base de Datos con Supabase

1. Abre tu panel de [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra a tu proyecto `loytxdzobuqpemjxhnza`.
3. Ve a la sección **SQL Editor** en el menú izquierdo.
4. Abre o copia el archivo `backend/database/schema.sql`.
5. Pégalo en el editor y presiona **Run** (Ejecutar).

> 💡 **Nota Importante:** El sistema cuenta con **Fallback inteligente**. Incluso si la tabla aún no se ha creado en Supabase o no hay internet, el backend guarda inmediatamente los pagos y las visitas en un almacén persistente seguro para que **nunca se pierda ninguna venta ni estadística**.

---

## 🔌 Endpoints de la API

### 1. Pagos y Pedidos
- **`POST /api/backend/payments`**: Registra un nuevo pago/pedido tras completar el checkout.
- **`GET /api/backend/payments`**: Obtiene la lista de pagos, estadísticas de dinero recaudado y filtros por estado.
- **`GET /api/backend/payments/:id`**: Consulta el detalle completo de un pago por su ID o número de orden `TP-XXXXXX`.
- **`PATCH /api/backend/payments/:id`**: Actualiza el estado del pedido (`pending`, `approved`, `processing`, `shipped`, `delivered`, `cancelled`).

### 2. Personas que entran a la página (Tráfico y Analítica)
- **`POST /api/backend/visits`**: Registra una visita/entrada con ID anónimo de visitante, ruta visitada (`/`, `/catalogo`, `/productos/...`), tipo de dispositivo (móvil o PC).
- **`GET /api/backend/visits`**: Devuelve cuántas personas han entrado a la tienda, visitas únicas, visitas hoy, desglose por celular vs computador y páginas más populares.

### 3. Dashboard Consolidado
- **`GET /api/backend/stats`**: Retorna el resumen ejecutivo de pagos + visitas en un solo llamado:
  - Total de pagos
  - Ingresos totales en pesos colombianos ($ COP)
  - Personas que entraron a la tienda (Visitantes únicos)
  - Tasa de conversión (% de personas que compran)
  - Métricas de hoy

---

## 🔐 Panel de Control Administrador

Puedes ingresar directamente desde tu navegador en:
👉 **`http://localhost:3000/admin`**

Contraseña por defecto: **`tecnomasadmin2026`** (configurable en `.env.local`).
