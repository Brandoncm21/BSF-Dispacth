# Design: Load Detail Modal + Traceability Empty State + Actions Reorder

## C4 Context Diagram

```
[Dispatcher]
    |
    | (web browser)
    v
[BestFreight Web App (Next.js 16)]
    |
    |--- /traceability → Map container (always visible)
    |--- /loads → LoadsTable + LoadDetailModal
    |
    v
[Supabase (PostgreSQL)]
    |
    |--- loads (all fields + notes)
    |--- drivers (first_name, last_name)
    |--- carriers (company_name)
    |--- trucks (unit_number)
    |--- routes (origin, destination)
    |--- load_documents (RC/BOL)
    |--- driver_checkpoints (lat, lng, recorded_at, notes, status)
```

## Container Diagram

```
app/(dashboard)/traceability/page.tsx
    └── Map Container (always rendered)
        ├── [hay camiones en_ruta + checkpoints]
        │   └── TrackingMap (dynamic, ssr:false)
        └── [sin actividad]
            └── "Ningún camión en ruta" (height: 350px)

app/(dashboard)/loads/page.tsx
    ├── LoadsTable
    │   └── Actions: [Eye] [MapPin] [Edit2] [Trash2]
    └── LoadDetailModal (new)
        ├── TabBar: "Información General" | "Documentos Adjuntos" | "Mapa de Tracking"
        ├── Tab: Información General
        │   └── Grid of fields (read-only)
        ├── Tab: Documentos Adjuntos
        │   └── LoadDocsList + Upload controls
        └── Tab: Mapa de Tracking
            └── TrackingMap (dynamic, ssr:false)
                ├── Blue polyline (route)
                ├── Checkpoint markers (blue dots)
                └── Last checkpoint popup (highlighted)
```

## Decisiones Técnicas

### 1. Modal vs Sheet
Se usa `Dialog` (shadcn/ui) con tamaño `max-w-3xl` para dar espacio a los 3 tabs. El modal es más apropiado que un Sheet lateral para esta cantidad de contenido.

### 2. Estado de tabs
`useState<"general" | "docs" | "tracking">("general")` — local en el componente modal.

### 3. Fetch de checkpoints
Se usa `getCheckpointHistory(loadId)` (server action existente) dentro de un `useEffect` que se ejecuta solo cuando la tab "Mapa de Tracking" está activa, para evitar consultas innecesarias.

### 4. Documentos
Se reutiliza la lógica de `LoadDocsDialog` (getLoadDocuments, uploadLoadDocument, getDocumentSignedUrl) directamente dentro del tab.

### 5. Mapa lazy
Se importa `TrackingMap` con `dynamic(() => import(...), { ssr: false })` y se le pasan `checkpoints` + `originLng/originLat/destLng/destLat` si están disponibles.

## Stack Tecnológico
- shadcn/ui `Dialog` + `Tabs` components
- Mapbox GL JS para el mapa de tracking
- Lucide `Eye` icon para el botón Detalles
- Server actions existentes para datos de carga, documentos y checkpoints
