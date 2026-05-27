"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Package, Printer, ShieldAlert, Loader2, X } from "lucide-react";
import { useUserRole } from "@/hooks/use-has-access";
import { getExecutiveAnalytics } from "@/lib/actions";
import type { ExecutiveAnalytics, PresetType } from "@/lib/actions";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ExecutiveComparisonChart } from "@/components/dashboard/executive-comparison-chart";
import { PeriodSelector } from "@/components/dashboard/period-selector";

const PRESET_LABELS: Record<string, string> = {
  this_week: "Semanal",
  last_week: "Semanal",
  last_4_weeks: "4 Semanas",
  this_month: "Mensual",
  last_month: "Mensual",
  last_3_months: "3 Meses",
  this_quarter: "Trimestral",
  last_quarter: "Trimestral",
  last_2_quarters: "2 Trimestres",
  this_semester: "Semestral",
  last_semester: "Semestral",
  this_year: "Anual",
  last_year: "Anual",
};

const PRESET_ORDER: PresetType[] = [
  "this_week",
  "this_month",
  "this_quarter",
  "this_semester",
  "this_year",
];

export function ExecutiveContent() {
  const searchParams = useSearchParams();
  const isDenied = searchParams.get("denied") === "1";
  const { role, loading: roleLoading } = useUserRole();

  const isAllowed = role === "admin" || role === "back_office" || role === "sales";

  const tzOffsetRef = useRef(new Date().getTimezoneOffset());
  const [preset, setPreset] = useState<PresetType>("this_month");
  const [data, setData] = useState<ExecutiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAllowed) return;
    setLoading(true);
    setError(null);
    getExecutiveAnalytics(preset, tzOffsetRef.current)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar datos"))
      .finally(() => setLoading(false));
  }, [preset, isAllowed]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Acceso Denegado: No tienes permisos para acceder a este módulo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      {isDenied && (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Acceso Denegado: No tienes permisos para acceder a ese módulo.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div className="print-header" style={{ display: "none" }}>
        <div>
          <strong>BFS Solutions</strong> — Informe Estadístico de Rendimiento Ejecutivo
        </div>
        <div className="text-sm">{dateStr}</div>
      </div>

      <div className="flex items-start justify-between mb-8 no-print">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Analítica Ejecutiva
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Rendimiento financiero de alto nivel — {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={preset} onChange={(v) => setPreset(v as PresetType)} />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Generar Reporte PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : !data ? null : (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <KPICard
              title="Venta Bruta Total"
              value={`$${data.kpis.grossRevenue.toLocaleString("en-US")}`}
              change={data.kpis.revenueChange}
              changeLabel={`vs ${data.previousPeriod?.label || "período anterior"}`}
              sparklineData={data.sparklines.revenue}
              color="#3b82f6"
              gradientId="revGrad"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <KPICard
              title="Ganancia Neta"
              value={`$${data.kpis.netProfit.toLocaleString("en-US")}`}
              change={data.kpis.profitChange}
              changeLabel={`vs ${data.previousPeriod?.label || "período anterior"}`}
              sparklineData={data.sparklines.profit}
              color="#10b981"
              gradientId="profitGrad"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KPICard
              title="Volumen de Operación"
              value={data.kpis.totalLoads.toLocaleString()}
              change={
                data.previousPeriod && data.previousPeriod.totalLoads > 0
                  ? ((data.kpis.totalLoads - data.previousPeriod.totalLoads) / data.previousPeriod.totalLoads) * 100
                  : null
              }
              changeLabel={`vs ${data.previousPeriod?.label || "período anterior"}`}
              sparklineData={data.sparklines.loads}
              color="#8b5cf6"
              gradientId="loadsGrad"
              icon={<Package className="h-5 w-5" />}
            />
          </div>

          {data.comparison && data.comparison.length > 0 && (
            <Card className="print-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue vs Profit</CardTitle>
                    <CardDescription>
                      Comparación por {PRESET_LABELS[preset] || "período"}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-zinc-500">
                    Margen: <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {data.kpis.margin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ExecutiveComparisonChart data={data.comparison} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
