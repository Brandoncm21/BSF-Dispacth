# BFS Dispatch — Architecture Decision Records (ADR) Index

> Índice de decisiones arquitectónicas aceptadas y vigentes.

---

## ADRs In Force

| ADR | Título | Estado | Descripción |
|-----|--------|--------|-------------|
| **ADR-0001** | Use Mapbox as Map Provider | `accepted` | Proveedor de mapas para tracking de flota y portal público. Free tier 50k loads/mes. |
| **ADR-0002** | Use Supabase Realtime for Notifications | `accepted` | WebSocket broadcast para notificaciones in-app y checkpoints en tiempo real. |
| **ADR-0003** | Use UUID v4 as Tracking Tokens | `accepted` | Tokens no adivinables para portal público de rastreo. Generados con `gen_random_uuid()`. |
| **ADR-0004** | Use Server Actions over Explicit API REST | `accepted` | Next.js Server Actions como capa de backend. Sin rutas `/api/*` explícitas. Type safety end-to-end. |
| **ADR-0005** | Use Soft Deletes with status_id | `accepted` | Eliminación lógica via `status_id` referenciando `record_status`. Consistente con esquema heredado. Permite recuperación. |
| **ADR-0006** | Use PostgreSQL Sequence + Trigger for load_number | `accepted` | Numeración atómica `LD-YYYY-NNNN` via `loads_seq` y trigger `BEFORE INSERT`. Sin race conditions. |

---

## ADR-0004: Use Server Actions over Explicit API REST

**Status**: accepted

**Context**: El proyecto requiere una capa de backend para CRUD y queries complejas. Las opciones incluían API REST tradicional (`app/api/*`), tRPC, GraphQL, o Server Actions de Next.js.

**Decision**: Usar Next.js Server Actions (`"use server"`) en `lib/actions/`.

**Consequences**:
- ✅ Menor boilerplate. No se necesitan handlers de request/response.
- ✅ Type safety end-to-end sin generación de SDKs.
- ✅ Las funciones de backend viven junto al código que las consume.
- ✅ No hay capa de routing de API separada para operaciones internas.
- ⚠️ Acoplamiento a Next.js App Router. Migrar a otra framework requeriría extraer a API REST.
- ⚠️ Difícil consumir desde clientes no-React (mobile nativo, scripts externos).

---

## ADR-0005: Use Soft Deletes with status_id

**Status**: accepted

**Context**: El sistema heredado de Oracle usaba eliminación lógica. Necesitamos consistencia y capacidad de recuperación de registros "eliminados".

**Decision**: Usar columna `status_id` referenciando `record_status` (1=Activo, 2=Inactivo) en lugar de DELETE físico.

**Consequences**:
- ✅ Consistencia con esquema heredado.
- ✅ Recuperación inmediata sin restore de backup.
- ✅ Las búsquedas paginadas (RPC `search_*`) filtran automáticamente `status_id = 1`.
- ⚠️ Tablas crecen indefinidamente. Considerar archiving si el volumen aumenta drásticamente.

---

## ADR-0006: Use PostgreSQL Sequence + Trigger for load_number

**Status**: accepted

**Context**: Las cargas necesitan un número legible y único. Las opciones eran: generación en aplicación (riesgo de race condition), UUID (no legible), MAX()+1 (no atómico), o secuencia PostgreSQL.

**Decision**: Usar `loads_seq` START 1 + trigger `BEFORE INSERT` que genera `LD-<YYYY>-<NNNN>` si `load_number` es NULL.

**Consequences**:
- ✅ Atómico, sin race conditions, sin locks de aplicación.
- ✅ Formato legible para operadores.
- ⚠️ Los números no se reutilizan (secuencia monótona). Aceptable para el dominio.

---

## Format

Los ADRs siguen el formato MADR-short:

```
# ADR-NNNN: Title

**Status**: accepted[, supersedes ADR-NNNN]
**Date**: YYYY-MM-DD

## Context

## Decision

## Consequences
```

**Iron Rule**: Los ADRs aceptados son inmutables. Para cambiar una decisión, se crea un nuevo ADR que la supere (`supersedes ADR-NNNN`). El ADR anterior permanece como registro histórico.
