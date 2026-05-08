# Reglas del Agente Global

## Flujo de Trabajo Git

Cuando hagas cambios en el código, SIEMPRE sigue este proceso:

1. **Verifica el estado de la rama** — Asegúrate de que la rama actual esté confirmada; si no, no continúes hasta que el usuario haya confirmado y subido los cambios.

2. **Crea una nueva rama antes de editar:**
   ```bash
   git checkout -b agent/<nombre-corto-de-tarea>
   ```

3. **Nunca confirmes directamente en `main` o `master`.**

4. **Usa mensajes de confirmación claros:**
   - `feat: ...` — nueva funcionalidad
   - `fix: ...` — corrección de bug
   - `refactor: ...` — refactorización sin cambio de comportamiento

5. **Después de terminar los cambios:**
   - Ejecuta las pruebas
   - Ejecuta los linters
   - Asegúrate de que el proyecto se compile (`npm run build`)

## Manejo de Sesiones

Después de cada ejecución o sesión del agente:

1. **Exporta la sesión para rastreabilidad:**
   ```bash
   opencode export
   ```

2. **Guarda un resumen en:**
   ```
   docs/agent-sessions/<fecha>-session.md
   ```

3. **Incluye:**
   - Objetivo de la sesión
   - Archivos cambiados
   - Comandos ejecutados

## Reglas Obligatorias

Estas reglas siempre deben ser seguidas:

- **NUNCA** hagas cambios a menos que la rama actual esté confirmada.
- **SIEMPRE** crea una rama git antes de editar el código.
- **NUNCA** modifiques ramas protegidas (`main`, `master`, `production`).
- **SIEMPRE** ejecuta las pruebas antes de confirmar.
- **SIEMPRE** exporta la sesión en cada ejecución completada del agente.

## Stack del Proyecto

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + TypeScript (App Router, Server Components) |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Auth | Supabase Auth (email/password) |
| Deploy | Vercel |

## Convenciones de Código

- Componentes: PascalCase (`CarriersPage.tsx`)
- Utilidades: camelCase (`supabase.ts`)
- Rutas: kebab-case (`/carriers`, `/load-board`)
- Tablas DB: snake_case (`record_status`, `load_documents`)
- Columnas DB: snake_case (`status_id`, `first_name`)

## Estructura de Ramas

```
main
├── agent/auth-setup
├── agent/carriers-crud
├── agent/load-board
├── agent/reports-dashboard
└── agent/document-upload
```
