-- ==============================================================================
-- TECNO+ COLOMBIA: SCRIPT SQL MAESTRO UNIFICADO (SUPABASE / POSTGRESQL)
-- Incluye: Autenticación Google, Perfiles, Catálogo, Inventario, Pagos, Órdenes,
-- Reseñas, Analítica de Visitas y Políticas de Seguridad RLS Blindadas.
-- 
-- Ejecuta este código completo en el "SQL Editor" de tu proyecto en Supabase.
-- ==============================================================================

-- 1. EXTENSIONES DE POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA DE PERFILES DE CLIENTES (customer_profiles)
--    Se llena automáticamente cuando una persona inicia sesión con Google.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    document_id TEXT,
    shipping_address TEXT,
    city TEXT DEFAULT 'Montería',
    department TEXT DEFAULT 'Córdoba',
    address_notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRIGGER AUTOMÁTICO: Crear/actualizar perfil cuando el usuario inicia sesión con Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 3. CATÁLOGO DE PRODUCTOS E INVENTARIO EN TIEMPO REAL
-- ==============================================================================

-- Categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Productos
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- e.g., 'iphone-17-pro-max-256gb'
    code VARCHAR(50) UNIQUE, -- SKU / Código
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    description_html TEXT,
    vendor VARCHAR(100) DEFAULT 'Tecno+',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100),
    price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    compare_at_price NUMERIC(14, 2),
    cost_price NUMERIC(14, 2),
    currency VARCHAR(10) DEFAULT 'COP',
    badge VARCHAR(50),
    badge_style VARCHAR(20) DEFAULT 'dark',
    featured_image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    whatsapp_text TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Variantes de Productos (Color, Almacenamiento, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    color VARCHAR(50),
    storage VARCHAR(50),
    price NUMERIC(14, 2) NOT NULL,
    compare_at_price NUMERIC(14, 2),
    stock INT DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Control de Stock en Inventario
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id TEXT REFERENCES public.product_variants(id) ON DELETE CASCADE,
    current_stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT DEFAULT 2,
    location VARCHAR(100) DEFAULT 'Bodega Principal Montería',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_product_variant_inv UNIQUE (product_id, variant_id)
);

-- Movimientos de Inventario (Entradas, Ventas, Ajustes)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id TEXT REFERENCES public.product_variants(id) ON DELETE SET NULL,
    movement_type VARCHAR(30) NOT NULL, -- 'restock', 'sale', 'reservation', 'adjustment'
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 4. REGISTRO DE PAGOS Y ÓRDENES (payments & orders)
-- ==============================================================================

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    items_count INT DEFAULT 0,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'COP',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Órdenes Estructuradas
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50) NOT NULL,
    customer_id_number VARCHAR(50),
    department VARCHAR(100) DEFAULT 'Córdoba',
    city VARCHAR(100) DEFAULT 'Montería',
    shipping_address TEXT NOT NULL,
    address_notes TEXT,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_status VARCHAR(50) NOT NULL DEFAULT 'preparing',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL,
    coupon_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Detalle de Ítems por Orden
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id TEXT REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_title VARCHAR(255) NOT NULL,
    variant_title VARCHAR(150),
    unit_price NUMERIC(14, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(14, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 5. RESEÑAS, VISITAS, LISTA DE DESEOS Y CUPONES
-- ==============================================================================

-- Reseñas de Clientes (reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) DEFAULT 'Montería, Córdoba',
    rating INT NOT NULL CHECK (rating >= 0 AND rating <= 5),
    date VARCHAR(50) DEFAULT 'Hace unos momentos',
    product VARCHAR(255) DEFAULT 'Celulares & Tecnología',
    title TEXT,
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT true,
    recommended BOOLEAN DEFAULT true,
    likes INT DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Registro de Visitas y Tráfico en Vivo (page_visits)
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

-- Lista de Deseos (wishlists)
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

-- Cupones de Descuento (coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(14, 2) NOT NULL,
    min_order_amount NUMERIC(14, 2) DEFAULT 0,
    max_uses INT DEFAULT 100,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 6. ÍNDICES DE OPTIMIZACIÓN
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_order_number ON public.payments(order_number);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_created ON public.page_visits(created_at DESC);


-- ==============================================================================
-- 7. POLÍTICAS DE SEGURIDAD POR FILAS (RLS) BLINDADAS
-- ==============================================================================
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 7.1 customer_profiles
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.customer_profiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.customer_profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar su perfil" ON public.customer_profiles;
CREATE POLICY "Los usuarios pueden insertar su perfil"
  ON public.customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 7.2 payments (SEGURIDAD DE DATOS SENSIBLES)
DROP POLICY IF EXISTS "Permitir crear pedidos a todos" ON public.payments;
CREATE POLICY "Permitir crear pedidos a todos"
  ON public.payments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios ven sus propios pedidos" ON public.payments;
CREATE POLICY "Usuarios ven sus propios pedidos"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 7.3 Catálogo (Lectura pública activa)
DROP POLICY IF EXISTS "Catálogo visible a todos" ON public.products;
CREATE POLICY "Catálogo visible a todos" ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Categorías visibles a todos" ON public.categories;
CREATE POLICY "Categorías visibles a todos" ON public.categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Reseñas visibles a todos" ON public.reviews;
CREATE POLICY "Reseñas visibles a todos" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insertar reseñas" ON public.reviews;
CREATE POLICY "Permitir insertar reseñas" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir registrar visitas" ON public.page_visits;
CREATE POLICY "Permitir registrar visitas" ON public.page_visits FOR INSERT WITH CHECK (true);

-- 7.4 Wishlist privada por usuario
DROP POLICY IF EXISTS "Wishlist privada" ON public.wishlists;
CREATE POLICY "Wishlist privada" ON public.wishlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7.5 Acceso total para Service Role (Panel Admin / Backend)
CREATE POLICY customer_profiles_admin ON public.customer_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY payments_admin ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY orders_admin ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY products_admin ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY categories_admin ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY inventory_admin ON public.inventory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY reviews_admin ON public.reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY visits_admin ON public.page_visits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fin del script maestro unificado
