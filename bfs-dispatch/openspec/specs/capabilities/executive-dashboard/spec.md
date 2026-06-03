# Capability: Executive Dashboard

> Dashboard ejecutivo con KPIs comparativos, sparklines y análisis de períodos.

---

### Requirement: Ver KPIs comparativos

El sistema debe mostrar tarjetas KPI con comparación respecto al período anterior.

#### Scenario: KPIs con comparación
GIVEN un usuario autenticado con rol de admin, back_office o sales
Y está en el dashboard ejecutivo
WHAND selecciona un período (ej: "Este mes")
THEN se muestran tarjetas KPI con:
  - Valor actual del período seleccionado
  - Cambio porcentual vs período anterior
  - Sparkline (mini gráfico de área de 60px) con la tendencia
Y los KPIs incluyen: Venta Bruta, Ganancia Neta, Volumen de Operación (cargas)

---

### Requirement: Selector de período

El sistema debe permitir seleccionar entre múltiples períodos predefinidos.

#### Scenario: 13 presets de período
GIVEN un usuario en el dashboard ejecutivo
WHAND abre el selector de período
THEN se muestran opciones agrupadas:
  - Fechas Rápidas: Hoy, Esta semana, Semana pasada, Este mes, Mes pasado
  - Trimestres: Q1, Q2, Q3, Q4 (año actual y anterior)
  - Semestres: S1, S2
  - Anual: Este año, Año pasado

---

### Requirement: Gráfico comparativo Revenue vs Profit

El sistema debe mostrar un gráfico de barras comparando ingresos y ganancias.

#### Scenario: Barras comparativas
GIVEN un período seleccionado
WHAND el dashboard carga
THEN se muestra un gráfico de barras con dos series:
  - Revenue (azul)
  - Profit (verde)
Y las barras están agrupadas por sub-período (días, semanas o meses según el rango)

---

### Requirement: Comparación vs período anterior (YoY)

Para períodos trimestrales, semestrales y anuales, el sistema debe mostrar comparación año sobre año.

#### Scenario: Comparación YoY trimestral
GIVEN un usuario selecciona "Q2 Este año"
WHAND se genera el dashboard
THEN se muestra una comparación con Q2 del año anterior
Y se calcula la variación porcentual de cada KPI

---

### Requirement: Exportar a PDF

El dashboard ejecutivo debe poder imprimirse o exportarse como PDF.

#### Scenario: Impresión/PDF
GIVEN un usuario en el dashboard ejecutivo
WHAND hace clic en el botón de imprimir
THEN el sistema aplica CSS de impresión optimizado para papel carta (US Letter)
Y abre el diálogo de impresión del navegador
Y los gráficos y tablas se ajustan al formato de impresión
