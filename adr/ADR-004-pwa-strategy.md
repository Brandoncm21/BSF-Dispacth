# ADR-004: PWA Strategy — Static Manifest vs next-pwa

## Status
Accepted

## Context
Se necesita soporte PWA para permitir "Agregar a pantalla de inicio" en dispositivos móviles. Next.js tiene el paquete `next-pwa` que automatiza la generación del service worker y manifest, pero tiene problemas de compatibilidad con Next.js 16 y Turbopack.

## Decision
Usar `manifest.json` estático en `public/` en lugar de `next-pwa`. El manifest se sirve como archivo estático, sin compilación. El service worker se omite en esta fase.

## Consequences
- **Pros**: Sin dependencia adicional, compatible con Turbopack, configurable manualmente, funciona inmediatamente en Lighthouse.
- **Cons**: Service worker offline no implementado, caché offline manual (se puede agregar con `serwist` en el futuro).
- **ICO Compliance**: El manifest incluye `display: "standalone"`, `start_url`, `theme_color`, y los iconos requeridos.
