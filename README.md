# Nortia Supply — Plataforma de Gestión Financiera y Cobranzas

Sistema web para el diagnóstico de liquidez, proyección de flujo de caja y gestión priorizada de cobranzas B2B para **Nortia Supply**.

---

## 🏗️ Arquitectura y Estructura de Archivos

El proyecto sigue una arquitectura Next.js (App Router) minimalista y directa, sin capas de abstracción innecesarias:

```text
├── scripts/
│   └── test-financial.js        # Check automatizado de integridad del motor financiero
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── requests/    # GET/POST/PATCH/DELETE para solicitudes de acceso
│   │   │   │   └── users/       # GET/DELETE para administración de usuarios activos
│   │   │   ├── ai/draft/        # POST: Generación asistida de mensajes de cobranza (Gemini / Fallback)
│   │   │   ├── collections/     # GET: Cálculo de cola de cobranza, aging y matriz 80/20
│   │   │   ├── forecast/        # GET: Proyección diaria de flujo de caja, runway y fecha de quiebre
│   │   │   ├── healthz/         # GET: Health check del sistema y latencia de base de datos
│   │   │   └── ingest/          # POST: Carga web de archivos CSV (clientes, facturas, pagos, obligaciones)
│   │   ├── globals.css          # Estilos globales y utilidades Tailwind
│   │   ├── layout.tsx           # Layout raíz de Next.js
│   │   └── page.tsx             # Página principal: ruteo de tabs, sesión y renderizado
│   ├── components/
│   │   ├── AccountManagerModal.tsx  # Modal de administración de cuentas y aprobación de solicitudes
│   │   ├── AiMessageModal.tsx       # Modal de redacción contextual de mensajes vía WhatsApp / Email
│   │   ├── CashflowForecast.tsx     # Módulo Finanzas: gráfico de liquidez, simulador y compromisos
│   │   ├── CollectionsQueue.tsx     # Módulo Cobranzas: cola priorizada 80/20 con score (1-100)
│   │   ├── CsvUploader.tsx          # Módulo ERP: carga drag-and-drop de archivos CSV diarios
│   │   ├── LoginForm.tsx            # Formulario de inicio de sesión y solicitud de acceso
│   │   └── SkeletonLoaders.tsx      # Skeletons animados para estados de carga (Finanzas, Cobranzas, Auth)
│   └── lib/
│       ├── financial.ts             # Motor de cálculo financiero, conciliación de facturas y scoring
│       ├── supabase.ts              # Cliente Supabase servidor (Service Role / Admin)
│       └── supabaseClient.ts        # Cliente Supabase navegador (Auth / Sesión localStorage)
├── supabase/
│   └── schema.sql                   # Definición de tablas, índices y RLS en PostgreSQL
└── LEEME.md                         # Especificaciones de negocio y datos al corte (2026-09-27)
```

---

## 🧩 Componentes Principales

1. **`CashflowForecast.tsx` (Pestaña "Finanzas")**:
   - Diagnóstico ejecutivo de liquidez (detección del quiebre al 29-oct-2026 con 32 días de runway).
   - Métricas clave: saldo en banco, cuentas por cobrar, obligaciones y brecha estructural.
   - Gráfico temporal de saldo proyectado a 30, 60 y 90 días (`recharts`).
   - Simulador de sensibilidad de cobranza para evaluar el impacto en el runway al recuperar cartera vencida.
   - Desglose de obligaciones por categoría y próximos hitos críticos de egresos.

2. **`CollectionsQueue.tsx` (Pestaña "Cobranzas")**:
   - Cola de cobranza priorizada mediante **Score de Importancia (1–100)** basado en monto pendiente y días de mora.
   - Matriz 80/20 (Pareto) para enfocar esfuerzos en las cuentas de mayor impacto financiero.
   - Brackets de antigüedad (*Aging*: 1-30d, 31-60d, 61-90d, +90d).
   - Reglas comerciales: protección de cuentas VIP y señalización de facturas en disputa.
   - Acceso directo a llamadas telefónicas, correo y asistente de redacción con IA.

3. **`AiMessageModal.tsx`**:
   - Redacción contextual de mensajes de cobro por WhatsApp o Email calibrados según el perfil del deudor.
   - Conexión con modelo ultrarrápido y económico de Google Gemini (`gemini-3.5-flash-lite`), con fallback determinista de costo $0 en caso de no contar con API key.

4. **`CsvUploader.tsx` (Pestaña "Carga de CSVs")**:
   - Carga idempotente de archivos diarios generados por el ERP (`clientes.csv`, `facturas.csv`, `pagos.csv`, `obligaciones.csv`).
   - Soporte para drag & drop y reporte de registros procesados.

5. **`LoginForm.tsx` & `AccountManagerModal.tsx`**:
   - Flujo de autenticación con Supabase Auth.
   - Creación de cuentas restringida: los colaboradores envían una solicitud con contraseña personalizada y un administrador las aprueba o rechaza.

---

## ⚙️ Configuración y Ejecución Local

### Prerrequisitos
- Node.js 18+
- Proyecto Supabase configurado (con las tablas creadas según `supabase/schema.sql`)

### Variables de Entorno (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GEMINI_API_KEY=tu-gemini-api-key # Opcional: activa IA en vivo para mensajes
```

### Comandos de Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:3000)
npm run dev

# Ejecutar verificación de tipos TypeScript
npx tsc --noEmit

# Ejecutar check de lógica del motor financiero
node scripts/test-financial.js
```

---

## 🛡️ Principios de Desarrollo (Ponytail)
- **Claridad de Dominio**: Archivos con nombres autoexplicativos que reflejan su función en el negocio.
- **Eficiencia**: Código directo sin sobre-abstracciones ni dependencias innecesarias.
- **Robustez**: Validación en fronteras de datos, tipos estrictos y comprobaciones ejecutables sin frameworks externos pesados.