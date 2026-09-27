-- ==============================================================================
-- TECNO+ COLOMBIA: SCRIPT SQL PARA BASE DE DATOS SUPABASE
-- Ejecuta este código en el "SQL Editor" de tu proyecto de Supabase
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE CLIENTES (customer_profiles)
-- Guarda la información de cada persona automáticamente cuando inicia sesión con Google
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

-- 3. TABLA DE PAGOS Y PEDIDOS (payments)
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

-- 4. TRIGGER AUTOMÁTICO: Crear perfil de cliente cuando alguien inicia sesión con Google
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

-- Recrear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. HABILITAR SEGURIDAD POR FILAS (RLS)
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas para customer_profiles
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

-- Políticas para payments
DROP POLICY IF EXISTS "Permitir crear pedidos a todos" ON public.payments;
CREATE POLICY "Permitir crear pedidos a todos"
  ON public.payments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios ven sus propios pedidos" ON public.payments;
CREATE POLICY "Usuarios ven sus propios pedidos"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Fin del script
