# Capability: Reports

> Reportes financieros agrupados por dispatcher, carrier y camión con filtros de fecha y exportación.

---

### Requirement: Generar reporte financiero

Un usuario autorizado debe poder generar reportes de rendimiento agrupados.

#### Scenario: Reporte por dispatcher
GIVEN un usuario autenticado con rol de admin, back_office o sales
Y está en la página de reports
WHAND selecciona el rango de fechas (semana, mes, año, todo)
THEN el sistema genera un reporte agrupado por dispatcher
Y muestra: nombre del dispatcher, cantidad de cargas, Gross Revenue, Net Profit, Margen

#### Scenario: Reporte por carrier
GIVEN un usuario en la página de reports
WHAND selecciona agrupar por carrier
THEN el sistema genera un reporte agrupado por carrier
Y muestra: nombre del carrier, cantidad de cargas, Gross Revenue, Net Profit, Margen

#### Scenario: Reporte por camión
GIVEN un usuario en la página de reports
WHAND selecciona agrupar por truck
THEN el sistema genera un reporte agrupado por camión
Y muestra: unit_number, cantidad de cargas, Gross Revenue, Net Profit, Margen

---

### Requirement: Filtrar reportes por fecha

Los reportes deben poder filtrarse por diferentes rangos de tiempo.

#### Scenario: Filtro por semana actual
GIVEN un usuario en la página de reports
WHAND selecciona "Esta semana" en el filtro de fechas
THEN el sistema calcula el rango de la semana actual (lunes a domingo)
Y aplica el filtro `TIMESTAMPTZ` considerando el timezone del cliente
Y muestra solo cargas dentro de ese rango

#### Scenario: Filtro por mes
GIVEN un usuario en la página de reports
WHAND selecciona "Este mes" en el filtro de fechas
THEN el sistema filtra desde el primer día del mes hasta hoy
Y muestra solo cargas dentro de ese rango

---

### Requirement: Exportar reportes

Los reportes generados deben poder exportarse o imprimirse.

#### Scenario: Exportar a CSV
GIVEN un reporte generado en pantalla
WHAND el usuario hace clic en "Exportar CSV"
THEN el sistema genera un archivo CSV con los datos visibles
Y descarga el archivo al navegador

#### Scenario: Imprimir reporte
GIVEN un reporte generado en pantalla
WHAND el usuario hace clic en "Imprimir"
THEN el sistema genera una vista de impresión estilizada
Y abre el diálogo de impresión del navegador

---

### Requirement: Totales consolidados

El reporte debe mostrar totales consolidados al final.

#### Scenario: Ver totales
GIVEN un reporte agrupado por dispatcher
WHAND se muestran los resultados
THEN al final de la tabla aparece una fila de totales con:
  - Suma total de cargas
  - Suma total de Gross Revenue
  - Suma total de Net Profit
  - Margen promedio ponderado
