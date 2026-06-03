# Tasks: Load Detail Modal + Traceability Empty State + Actions Reorder

## 1. Traceability Empty State (1 task)

- [ ] 1.1 Remove conditional guard on map section; always render container with fixed height; show "Ningún camión en ruta" when no markers

## 2. LoadDetailModal — Component Shell (2 tasks)

- [ ] 2.1 Create `components/load-detail-modal.tsx` with Dialog shell, 3 tabs (General/Docs/Mapa), loading states
- [ ] 2.2 Integrate into `app/(dashboard)/loads/page.tsx` replacing LoadDocsDialog for detail opening

## 3. Tab 1 — Información General (1 task)

- [ ] 3.1 Render all load fields (load#, carrier, driver, truck, cargo, miles, rate, fee, $/mile, status, pickup, delivery, notes) in read-only grid

## 4. Tab 2 — Documentos Adjuntos (1 task)

- [ ] 4.1 Migrate LoadDocsDialog logic into tab: document list, download, upload controls

## 5. Tab 3 — Mapa de Tracking (2 tasks)

- [ ] 5.1 Lazy-fetch checkpoints via `getCheckpointHistory` when tab is active; render map with route polyline and markers
- [ ] 5.2 Highlight last checkpoint with popup showing status, notes, and timestamp

## 6. LoadsTable Reorder (2 tasks)

- [ ] 6.1 Replace FileText icon with Eye icon for "Detalles" button
- [ ] 6.2 Reorder actions to: Detalles → Reportar → Editar → Eliminar

## 7. Validation & Archive (1 task)

- [ ] 7.1 Run build (`npm run build`), commit, and archive via `openspec archive loads-detail-modal`

## Totals
- 7 grupos, 10 tareas
