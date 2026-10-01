# Preguntas requeridas

## Qué problema decidiste resolver, y para quién

Decidí abordar el problema principal que tenía cada miembro del equipo:

- **Para Carolina**: Su problema es que no tiene certeza de cuándo se quedará sin dinero. Para resolver esto se creó un gráfico de flujo de caja que muestra el saldo actual disponible en banco (saldo base) y el saldo proyectado si se recupera un porcentaje de las facturas vencidas (configurable). Esto le permite a Carolina visualizar los ingresos y egresos día a día e identificar con exactitud la fecha de quiebre de caja.

- **Para Marta**: Su problema es la gestión de cobro ante un volumen masivo de facturas vencidas. Para solucionarlo, diseñé una tabla priorizada que permite ordenar las facturas según monto, fecha de vencimiento o "score de prioridad" (calculado a partir del monto adeudado, los días de mora y si el documento está en disputa). Además, se incorporó un filtro de Pareto para aislar el 20% de las facturas que concentran el 80% de la deuda total. Todo esto le brinda a Marta la información necesaria para saber a quién contactar primero.

  Otro problema de Marta es el tiempo que pierde redactando correos desde cero. Para esto se implementó un asistente para cada factura que genera borradores automáticos para correo o WhatsApp utilizando IA, haciendo su flujo de trabajo mucho más ágil.

- **Para Rodrigo**: Su problema es la preocupación de deteriorar la relación con clientes estratégicos si se les cobra de manera inadecuada. Para mitigar esto, calibré las instrucciones de la IA para que adapte el tono según el perfil del cliente: si es un cliente VIP o de alto límite de crédito, utiliza un tono formal y empático con contexto de la situación; en caso contrario, propone un recordatorio directo y comercial.

- **Para Juan**: Su problema es la falta de una API para sincronizar los datos diarios. Para resolverlo, se agregó un módulo que permite la carga por drag-and-drop de los archivos CSV emitidos por el ERP, integrando ambos sistemas de forma intuitiva. Asimismo, el código base está documentado y estructurado siguiendo principios de *clean code*. También se creó usando la arquitectura de monolíto ya que se asume que no se tendrá mucho uso (pocos usuarios) y disminuye la complejidad técnica (evita problemas de Cors y mantener 2 repositorios). Todo esto hace que la plataforma sea más fácil de mantener.

Dada la sensibilidad de los datos financieros que maneja la plataforma, incorporé un control de acceso con autenticación para que únicamente los colaboradores autorizados del equipo puedan ingresar.

## Qué decidiste no hacer, y por qué

- **Diseño responsivo para móviles**: No se priorizó una interfaz adaptada a pantallas pequeñas, ya que se asume que una plataforma de análisis financiero y cobranzas B2B se utiliza casi exclusivamente en computadoras de escritorio. Si bien es accesible desde navegadores móviles, la experiencia visual no está optimizada para ese formato.
- **Validación exhaustiva de esquemas en los CSVs**: No se añadieron validadores estrictos de esquema en la carga de archivos (de igual manera se tiene un pequeño filtro para aceptar sólo archivos con .csv), asumiendo que los archivos exportados desde el ERP de Nortia mantienen una estructura de columnas y formatos estándar y predecibles.

## Los supuestos que tomaste

- La plataforma se utilizará en equipos de escritorio y no en dispositivos móviles.
- Los archivos CSV provistos por el ERP respetan siempre la estructura de columnas acordada.
- No se incorporarán nuevos roles jerárquicos por ahora (otros colaboradores con los mismos perfiles sí podrán operar el sistema).
- La información contenida en los CSVs es íntegra y consistente (sin duplicados no intencionados).
- Habrá una baja concurrencia simultánea (uso interno restringido al equipo clave).
- No se contemplan ataques de denegación de servicio distribuidos (DDoS).
- El equipo cuenta con una conexión a internet estable.

## Cómo correrlo localmente y cómo está desplegado

Las instrucciones para ejecutar el proyecto en local están detalladas en [Configuración y Ejecución Local](#configuración-y-ejecución-local).

La aplicación es un monolito moderno (Next.js App Router) desplegado en **Vercel** bajo su capa gratuita. La base de datos relacional y el servicio de autenticación están alojados en **Supabase**, utilizando igualmente su nivel gratuito.

## Cómo monitoreas la aplicación y qué pasa cuando algo falla

El monitoreo de la plataforma se realiza de forma combinada mediante **UptimeRobot** y **GitHub Actions con Telegram**. La aplicación expone un endpoint GET (`/api/healthz`) que efectúa un ping en tiempo real a la base de datos en Supabase y mide la latencia: responde `200 OK` si el sistema está operativo, `503 Service Unavailable` si la base de datos se degrada y `500` ante errores internos no controlados.

Tanto UptimeRobot como GitHub Actions consultan el endpoint cada 5 minutos. Si se detecta un código distinto a 200 o una caída total del servicio:
1. **UptimeRobot** despacha una alerta inmediata por correo electrónico a Gmail.
2. **GitHub Actions** ejecuta un bot dedicado que envía una notificación instantánea con los detalles del fallo a Telegram.

Se implementaron ambos canales para garantizar redundancia externa sin incurrir en costos de infraestructura.

## Por qué usaste la IA donde la usaste, y qué pasa si el modelo no responde

Se utilizó IA para la generación contextual de mensajes de cobranza, resolviendo de forma directa las fricciones operativas de Marta (evitar redactar manualmente) y las inquietudes comerciales de Rodrigo (cuidar las cuentas clave calibrando el tono).

Si el servicio de IA o la API externa no responde (o no se cuenta con una API key configurada), el sistema implementa un **mecanismo de fallback determinista a costo $0**: genera plantillas preconfiguradas y parametrizadas con los datos reales de la factura y del cliente, garantizando que el usuario nunca quede bloqueado.

## Qué harías con 2 semanas más

1. **Validación con usuarios reales**: Conduciría sesiones de prueba guiada con Carolina, Marta, Rodrigo y Juan para evaluar la usabilidad de cada módulo e identificar qué funciones resultan indispensables, cuáles son redundantes y qué automatizaciones adicionales se requieren.
2. **Seguridad y autenticación**: Añadiría autenticación de dos factores (2FA), soporte para Single Sign-On (SSO) y restricción de registro exclusivamente para correos con el dominio corporativo de la empresa.
3. **Robustecimiento del ingest de CSVs**: Incorporaría validación estricta de esquemas de datos, límites de tamaño por petición y sanitización de campos de texto para prevenir ataques de *CSV/Formula Injection* y *Stored XSS*.
4. **Pipeline de CI/CD y calidad**: Configuraría un pipeline de integración continua en GitHub Actions para ejecutar comprobaciones automatizadas de tipos (`tsc`), linters y pruebas del motor financiero antes de cada despliegue a producción.
5. **Integración automática del ERP con la plataforma**: Haría un script que permita actualizar los datos de la plataforma directamente desde el ERP de manera diaria, así se evita tener que subir los documentos manualmente.

## Cuánto tiempo te tomó y cómo usaste IA para programar

El desarrollo tomó aproximadamente **6 horas en total** (cerca de 4 horas dedicadas al modelado de datos, lógica financiera y desarrollo de interfaz, y unas 2 horas para documentación, pruebas y despliegue).

Utilicé IA como un copiloto de desarrollo para:
- Analizar rápidamente las dependencias e inconsistencias entre los archivos CSV del negocio.
- Estructurar los algoritmos de proyección diaria de flujo de caja y la matriz de priorización 80/20.
- Acelerar la configuración y vinculación de los servicios cloud externos (Supabase, Vercel, UptimeRobot, GitHub Actions y el bot de Telegram).

# A continuación se tiene la documentación para Juan



# Nortia Supply — Documentación de plataforma de Finanzas.

Sistema web para el diagnóstico de liquidez, proyección de flujo de caja y gestión priorizada de cobranzas B2B para **Nortia Supply**.

---

## Arquitectura y Estructura de Archivos

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

## Componentes Principales

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

## Configuración y Ejecución Local

### Prerrequisitos
- Node.js 18+
- Proyecto Supabase configurado (con las tablas creadas según `supabase/schema.sql`)

### Variables de Entorno (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GEMINI_API_KEY=tu-gemini-api-key
```

### Comandos de Desarrollo
```bash
npm install

npm run dev

# Ejecutar verificación de tipos TypeScript
npx tsc --noEmit

# Ejecutar check de lógica del motor financiero
node scripts/test-financial.js
```

---
