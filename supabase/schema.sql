-- Schema para Nortia Supply Cashflow Management
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard)

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente TEXT PRIMARY KEY,
  razon_social TEXT NOT NULL,
  id_tributario TEXT,
  segmento TEXT,
  ciudad TEXT,
  contacto_nombre TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  dias_credito INT DEFAULT 30,
  ejecutivo_comercial TEXT,
  fecha_alta DATE,
  limite_credito BIGINT DEFAULT 0
);

-- 2. Tabla de Facturas y Notas de Crédito
CREATE TABLE IF NOT EXISTS facturas (
  id_documento TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('factura', 'nota_credito')),
  id_cliente TEXT NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  monto_neto BIGINT NOT NULL,
  impuesto BIGINT NOT NULL,
  monto_total BIGINT NOT NULL,
  documento_referencia TEXT,
  en_disputa BOOLEAN DEFAULT FALSE,
  observacion TEXT
);

-- 3. Tabla de Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id_pago TEXT PRIMARY KEY,
  id_cliente TEXT NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL,
  monto BIGINT NOT NULL,
  medio_pago TEXT,
  facturas_referencia TEXT
);

-- 4. Tabla de Obligaciones (Egresos)
CREATE TABLE IF NOT EXISTS obligaciones (
  id_obligacion TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  acreedor TEXT NOT NULL,
  descripcion TEXT,
  fecha_vencimiento DATE NOT NULL,
  monto BIGINT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('pagada', 'pendiente')),
  fecha_pago DATE
);

-- Índices estratégicos para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_facturas_vencimiento ON facturas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_facturas_tipo ON facturas(tipo);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_obligaciones_vencimiento ON obligaciones(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_obligaciones_estado ON obligaciones(estado);

-- Deshabilitar RLS para permitir lecturas y escrituras directas desde la app
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE facturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE obligaciones DISABLE ROW LEVEL SECURITY;

-- 5. Tabla de Solicitudes de Acceso
CREATE TABLE IF NOT EXISTS solicitudes_acceso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol_solicitado TEXT NOT NULL DEFAULT 'cobranzas',
  motivo TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  creado_el TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE solicitudes_acceso DISABLE ROW LEVEL SECURITY;

