# ADR-007: Load Detail UI — Unified Modal vs Separate Dialogs

## Status
Accepted

## Context
Actualmente los detalles de carga se muestran en dos lugares: (1) el diálogo `LoadDocsDialog` para documentos, y (2) la tabla misma para los campos principales. El dispatcher necesita ver toda la información de una carga en un solo lugar sin abrir múltiples diálogos.

## Decision
Unificar en un solo `LoadDetailModal` con 3 tabs internos. Se usa shadcn/ui `Dialog` con `Tabs` internos.

## Consequences
- **Pros**: Una sola entrada visual, estado centralizado, menos componentes en la página, experiencia consistente.
- **Cons**: El modal es más pesado que los diálogos separados, pero esto es aceptable porque solo un modal está abierto a la vez.
- **Alternativa considerada**: Sheet lateral (Drawer) — se descartó porque los 3 tabs necesitan más espacio horizontal que vertical.
