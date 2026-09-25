-- =========================================================================
-- TECNO+ - ESQUEMA DE BASE DE DATOS COMPLETO (SUPABASE / POSTGRESQL)
-- Tablas para Registro de Pagos, Pedidos y Métricas de Visitas / Tráfico
-- =========================================================================

-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TABLA: payments (Registro de Pagos y Pedidos)
-- =========================================================================
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

-- Índices para optimización de pagos
CREATE INDEX IF NOT EXISTS idx_payments_order_number ON public.payments(order_number);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_customer_phone ON public.payments(customer_phone);

-- =========================================================================
-- 2. TABLA: page_visits (Registro de Visitas / Tráfico de Personas)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    device_type VARCHAR(20) DEFAULT 'desktop',
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimización de analíticas
CREATE INDEX IF NOT EXISTS idx_page_visits_visitor_id ON public.page_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON public.page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_path ON public.page_visits(page_path);

-- =========================================================================
-- 3. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- =========================================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- 3.1 Políticas de Inserción Pública (Checkout y Contador de visitas)
DROP POLICY IF EXISTS payments_insert_policy ON public.payments;
CREATE POLICY payments_insert_policy 
ON public.payments 
FOR INSERT 
TO public, anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS page_visits_insert_policy ON public.page_visits;
CREATE POLICY page_visits_insert_policy 
ON public.page_visits 
FOR INSERT 
TO public, anon, authenticated 
WITH CHECK (true);

-- 3.2 Políticas de Administración (Acceso total para service_role / Backend)
DROP POLICY IF EXISTS payments_admin_policy ON public.payments;
CREATE POLICY payments_admin_policy 
ON public.payments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS page_visits_admin_policy ON public.page_visits;
CREATE POLICY page_visits_admin_policy 
ON public.page_visits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 3.3 Políticas de Lectura Pública
DROP POLICY IF EXISTS payments_select_policy ON public.payments;
CREATE POLICY payments_select_policy 
ON public.payments 
FOR SELECT 
TO public, anon, authenticated 
USING (true);

DROP POLICY IF EXISTS page_visits_select_policy ON public.page_visits;
CREATE POLICY page_visits_select_policy 
ON public.page_visits 
FOR SELECT 
TO public, anon, authenticated 
USING (true);

-- =========================================================================
-- 4. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- =========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
';

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- =========================================================================
-- 5. DATOS DE EJEMPLO / INICIALES
-- =========================================================================
INSERT INTO public.payments (
    order_number, 
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_id_number, 
    department, 
    city, 
    shipping_address, 
    payment_method, 
    items, 
    items_count,
    subtotal, 
    shipping_cost, 
    total, 
    status,
    notes
)
SELECT 
    'TP-729410', 
    'Carlos Mendoza', 
    'carlos.mendoza@gmail.com', 
    '3012345678', 
    '1067894523', 
    'Córdoba', 
    'Montería', 
    'Calle 29 #14-25 Barrio El Recreo', 
    'nequi', 
    '[{"id": "prod-1", "title": "iPhone 15 Pro Max 256GB Titanio Natural", "price": 4299900, "quantity": 1}]'::jsonb, 
    1,
    4299900, 
    0, 
    4299900, 
    'approved',
    'Cliente preferencial. Pago confirmado por notificación Nequi.'
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE order_number = 'TP-729410'
);

INSERT INTO public.payments (
    order_number, 
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_id_number, 
    department, 
    city, 
    shipping_address, 
    payment_method, 
    items, 
    items_count,
    subtotal, 
    shipping_cost, 
    total, 
    status,
    notes
)
SELECT 
    'TP-839211', 
    'Valentina Gómez', 
    'valen.gomez@hotmail.com', 
    '3159876543', 
    '1102837492', 
    'Córdoba', 
    'Cereté', 
    'Carrera 12 #8-40 Centro', 
    'cash_on_delivery', 
    '[{"id": "prod-2", "title": "Combo Gamer Tecno+ Redragon Pro + Mousepad", "price": 289900, "quantity": 1}]'::jsonb, 
    1,
    289900, 
    0, 
    289900, 
    'processing',
    'Entrega contra entrega programada en Cereté.'
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE order_number = 'TP-839211'
);
