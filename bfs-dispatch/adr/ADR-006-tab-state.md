# ADR-006: Tab State Management — Local useState vs URL Search Params

## Status
Accepted

## Context
La página de cargas necesita alternar entre vista "Lista" (tabla existente) y "Mapa" (TrackingMapPins). La elección del mecanismo de estado afecta la navegación, deep-linking, y el comportamiento de renderizado.

## Decision
Usar `useState<"lista" | "mapa">("lista")` local en el componente de la página de cargas. No se persiste en la URL.

## Consequences
- **Pros**: Sin cambiar la URL (no hay re-render de server components), fácil de implementar, el mapa carga lazy vía `dynamic()`. 
- **Cons**: No hay deep-linking al tab Mapa, se pierde el estado al recargar la página.
- **Razonamiento**: El mapa no necesita ser compartido vía URL. Es una preferencia temporal del usuario. Si se necesita deep-linking en el futuro, se puede migrar a `searchParams` sin romper nada.
