"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, DollarSign, TrendingUp, Truck, ShieldAlert, Loader2, X } from "lucide-react";
import { useUserRole } from "@/hooks/use-has-access";
import { getDashboardAnalytics } from "@/lib/actions";
import type { DashboardKPIs, RevenueTrend, DispatcherRanking, LoadStatusDistribution, CarrierPerformance } from "@/lib/actions";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { DispatcherRankingChart } from "@/components/dashboard/dispatcher-ranking-chart";
import { LoadStatusDonut } from "@/components/dashboard/load-status-donut";
import { CarrierPerformanceChart } from "@/components/dashboard/carrier-performance-chart";

export function DashboardContent() {
  const searchParams = useSearchParams();
  const isDenied = searchParams.get("denied") === "1";
  const { role, loading: roleLoading } = useUserRole();
  const isDispatcher = role === "dispatcher";
  const isBackOffice = role === "back_office";
  const showGlobal = role === "admin" || role === "back_office";

  const tzOffsetRef = useRef(new Date().getTimezoneOffset());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [dispatcherRanking, setDispatcherRanking] = useState<DispatcherRanking[]>([]);
  const [loadStatusDistribution, setLoadStatusDistribution] = useState<LoadStatusDistribution[]>([]);
  const [carrierPerformance, setCarrierPerformance] = useState<CarrierPerformance[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDashboardAnalytics(undefined, tzOffsetRef.current);
        setKpis(result.kpis);
        setRevenueTrend(result.revenueTrend);
        setDispatcherRanking(result.dispatcherRanking);
        setLoadStatusDistribution(result.loadStatusDistribution);
        setCarrierPerformance(result.carrierPerformance);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar dashboard");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {isDispatcher ? "Mis cargas del mes" : "Resumen general del sistema"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cargas del Mes</CardTitle>
            <Package className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalLoads ?? 0}</div>
            <CardDescription>Total registradas</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(kpis?.totalRevenue ?? 0).toLocaleString("en-US")}
            </div>
            <CardDescription>Venta bruta mensual</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(kpis?.totalProfit ?? 0).toLocaleString("en-US")}
            </div>
            <CardDescription>
              Margen: {(kpis?.margin ?? 0).toFixed(1)}%
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carriers Activos</CardTitle>
            <Truck className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalCarriers ?? 0}</div>
            <CardDescription>En el sistema</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de Revenue vs Profit</CardTitle>
            <CardDescription>Ingresos y ganancias del mes actual</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart data={revenueTrend} />
          </CardContent>
        </Card>

        {showGlobal && (
          <Card>
            <CardHeader>
              <CardTitle>Top Dispatchers por Profit</CardTitle>
              <CardDescription>Ranking del mes</CardDescription>
            </CardHeader>
            <CardContent>
              <DispatcherRankingChart data={dispatcherRanking} />
            </CardContent>
          </Card>
        )}

        <Card className={showGlobal ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Estado de Cargas</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadStatusDonut data={loadStatusDistribution} />
          </CardContent>
        </Card>

        {showGlobal && (
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Carrier</CardTitle>
              <CardDescription>Top carriers por revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <CarrierPerformanceChart data={carrierPerformance} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
