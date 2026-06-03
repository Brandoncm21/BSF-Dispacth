---
id: loads-detail-modal
title: Loads Detail Modal + Traceability Empty State + Actions Reorder
created_at: 2026-06-02
status: proposed
change_type: enhancement
depends_on: tracking-system, tracking-enhancement
---

# Propuesta: Loads Detail Modal + Traceability Empty State + Actions Reorder

## Resumen

Mejorar la UI de cargas y trazabilidad con un modal unificado de detalles de carga (3 tabs), un estado vacío estable en el mapa de trazabilidad, y un reordenamiento de acciones en la tabla de cargas.

## Capacidades

### A. Traceability Empty State
El mapa en `/traceability` siempre debe renderizar un contenedor visible para mantener la estructura de la UI estable. Si hay camiones `en_ruta` con checkpoints registrados, renderizar el mapa interactivo con marcadores. Si no hay actividad, mostrar el mensaje *"Ningún camión en ruta"* dentro del mismo contenedor.

### B. Load Detail Modal (3 Tabs)
Reemplazar el botón "Ver documentos" (📄) por un botón maestro "Detalles" (👁️) en la tabla de cargas. Al hacer clic, se abre un modal lateral o diálogo unificado con tres pestañas:

1. **Información General** — Muestra todos los campos de la carga (load#, carrier, driver, truck, cargo, miles, rate, dispatch fee, $/mile, status, pickup/delivery dates) más un campo de notas adicionales.
2. **Documentos Adjuntos** — Muestra los documentos RC/BOL asociados a la carga, con opciones de descarga y subida. Migra la lógica existente de `LoadDocsDialog`.
3. **Mapa de Tracking** — Renderiza un mapa Mapbox con la ruta completa de checkpoints de esa carga específica: línea azul conectando checkpoints, marcadores individuales, y la posición actual resaltada con un popup informativo.

### C. Loads Actions Reorder
En la tabla de cargas, reorganizar los botones de acciones en el orden exacto:

**[👁️ Detalles] [📍 Reportar] [✏️ Editar] [🗑️ Eliminar]**

El botón "Reportar Ubicación" (📍) solo debe mostrarse para cargas activas (`booked`/`picked_up`) con `driver_id` asignado.

## Justificación

- El modal unificado elimina la navegación entre diálogos separados (antes docs era un modal aparte)
- El mapa de tracking por carga permite al dispatcher ver el progreso sin salir de la página de cargas
- El estado vacío en trazabilidad evita saltos visuales al cargar la página
- El reordenamiento de acciones agrupa las funciones más usadas primero
