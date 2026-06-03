# ADR-008: Checkpoint History Fetch Strategy — Lazy vs Eager

## Status
Accepted

## Context
El tab "Mapa de Tracking" en el `LoadDetailModal` necesita cargar el historial de checkpoints de una carga específica. Hay dos estrategias: cargar los datos al abrir el modal (eager) o cargarlos solo cuando el usuario hace clic en el tab (lazy).

## Decision
Carga lazy: el fetch de `getCheckpointHistory(loadId)` se ejecuta solo cuando el tab "Mapa de Tracking" está activo.

## Consequences
- **Pros**: No se consumen recursos de red ni DB si el usuario nunca ve el mapa. El modal se abre instantáneamente.
- **Cons**: Pequeña demora al cambiar al tab del mapa mientras se cargan los datos. Se mitiga con un spinner/loading state.
- **Implementación**: `useEffect` con dependencia `[activeTab, loadId]` que llama al fetch solo cuando `activeTab === "tracking"`.
