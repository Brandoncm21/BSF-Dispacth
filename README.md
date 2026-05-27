Stack Tecnológico
Categoría	Tecnología
Frontend	Next.js 16 (App Router), React 19, TypeScript
Estilos	Tailwind CSS v4, Radix UI
Backend	Supabase (PostgreSQL, Auth, Edge Functions, Storage)
Validación	Zod v4
Testing	Vitest v4
Gráficos	Recharts
Despliegue	Vercel (recomendado)
Módulos Actuales
Módulo	Ruta	Descripción
Login	/login	Autenticación con Supabase Auth
Dashboard	/dashboard	Panel principal con métricas y KPIs
Drivers	/drivers	Gestión de conductores
Carriers	/carriers	Gestión de transportistas
Brokers	/brokers	Gestión de corredores
Loads	/loads	Gestión de cargas
Trucks	/dashboard/trucks	Gestión de flota vehicular
Reports	/reports	Reportes de ventas
Traceability	/traceability	Rastreo de entregas
HR	/dashboard/human-resources	Gestión de empleados
Sistema de Roles (RBAC)
Rol	Descripción	Permisos
Admin	Administrador	Acceso total
Back Office	Oficina	Gestión de datos, reportes
Dispatcher	Despachador	Asignación de cargas, tracking
Logistics	Logística	Rutas, optimización
Sales	Ventas	Clientes, cotizaciones
Getting Started
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm run start

# Linting
npm run lint

# Testing
npm run test
Base de Datos
supabase/schema.sql — Schema base (tablas, seed data, vistas)
supabase/migration.sql — ALTER TABLEs, políticas RLS
supabase/rbac-migration.sql — Sistema de roles
supabase/rls-cleanup-migration.sql — Políticas de seguridad
supabase/storage-policies-migration.sql — Bucket de storage
supabase/create-route-function-migration.sql — Funciones SQL
supabase/indexes-timestamptz-migration.sql — Índices de rendimiento
supabase/view-update-migration.sql — Vistas actualizadas
Convenciones
Idioma UI: Español (labels, botones, mensajes)
Soft deletes: status_id = 2 en lugar de hard delete
Paginación: 16 registros/página en todas las listas
dispatch_fee: Calculado server-side como dispatch_fee_pct * rate / 100
load_number: Generado atómicamente con PostgreSQL sequence
Roadmap de Desarrollo
Fase 1: Estabilización Web (Q3 2026)
 Corrección de bugs en todos los formularios
 Filtros avanzados en tablas
 Exportación a CSV/PDF
 Dashboard de métricas mejoradas
Fase 2: Aplicación Móvil (Q4 2026)
 Expo/React Native app para camioneros
 PWA para carriers
 Geolocalización en tiempo real
 Chat integrado driver-dispatcher
 Notificaciones push
Fase 3: Automatización con IA (Q1 2027)
 Chatbot para cotización automática de cargas
 Predicción de tiempos de entrega (ML)
 Asignación automática de trucks a loads
 Detección de fraude en documentaciones
Fase 4: Integraciones (Q2 2027)
 Integración Google Maps / Mapbox
 API de clima para rutas
 Webhooks para updates de status
 Integración con ELD (Electronic Logging Devices)
 Integración con APIs de brokers populares
Fase 5: Reportes Avanzados (Q3 2027)
 Dashboard de analytics
 Reportes de rentabilidad por carrier
 Análisis de eficiencia de rutas
 Forecasting de demanda
Fase 6: Escalabilidad (Q4 2027)
 Multi-tenant support
 API pública para integraciones de terceros
 White-label solution
 App para clientes (shippers)
Arquitectura
app/
├── (auth)/login/          # Sin sidebar/header
├── (dashboard)/
│   ├── layout.tsx         # Shell con sidebar + header
│   ├── dashboard/         # Panel principal
│   ├── drivers/          # Conductores
│   ├── carriers/         # Transportistas
│   ├── brokers/          # Corredores
│   ├── loads/            # Cargas
│   ├── reports/          # Reportes
│   ├── traceability/    # Rastreo
│   └── dashboard/
│       ├── trucks/       # Flota
│       └── human-resources/ # RRHH

lib/
├── actions/              # Server actions
│   ├── core.ts           # Supabase client
│   ├── loads.ts         # CRUD cargas
│   ├── catalog.ts       # Catálogos
│   ├── routes.ts        # Rutas
│   ├── documents.ts     # Documentos
│   ├── sales.ts         # Analytics
│   └── fleet.ts         # Trucks, brokers
├── supabase-server.ts    # Server component client
├── supabase-browser.ts   # Browser client
└── errors.ts            # Error handling
