---
id: tracking-enhancement
title: Tracking Enhancement — Fuel Config, Loads Map, PWA Mobile
created_at: 2026-06-02
status: proposed
change_type: enhancement
depends_on: tracking-system
---

# Propuesta: Tracking Enhancement

## Resumen

Mejorar el sistema de tracking actual con tres capacidades clave: configuración de combustible en camiones, mapa interactivo de cargas con pines geolocalizados, y soporte PWA mobile-first para una experiencia de aplicación web instalable.

## Capacidades

### A. Truck Fuel Configuration
Permitir configurar el tipo de combustible (`fuel_type`: diesel/gasolina) y el costo por milla (`fuel_cost_per_mile`) directamente desde el formulario de camiones. Mostrar esta información en las vistas de tabla y tarjetas de la página de Trucks.

### B. Loads Interactive Tracking Map
Agregar un sistema de tabs "Lista" / "Mapa" en la página de Cargas (`/loads`). El tab Mapa renderiza marcadores interactivos (pins) sobre un mapa Mapbox para cada carga activa (`booked`, `picked_up`) que tenga checkpoints registrados. Cada pin debe mostrar un popup interactivo con:
- Número de carga (load#)
- Estado actual de la carga
- Últimas notas del checkpoint
- Nombre del conductor
- Botón para reportar posición

Los pins se actualizan en tiempo real vía Realtime y se colorean según la recencia del último reporte (verde < 2h, ámbar < 12h, rojo > 12h).

### C. PWA Mobile-First
Configurar Progressive Web App completa: manifest.json con iconos, theme-color, service worker básico para caché offline parcial. Optimizar responsive para móviles:
- CheckpointForm: inputs apilados verticalmente en pantallas pequeñas, botón "Detectar" prominente
- Customer Portal (`/track/[token]`): mapa full-width, fuente ajustada, padding reducido
- NotificationBell: dropdown con ancho máximo adaptativo
- Meta tags para "Agregar a pantalla de inicio" en iOS y Android

## Justificación

- Fuel config cierra el ciclo de la estimación de costos iniciado en el change `tracking-system`
- Mapa interactivo en Loads reduce la fricción del dispatcher al no tener que ir a Traceability para ver ubicaciones
- PWA elimina la necesidad de una app nativa para el uso frecuente en campo por parte de conductores
