"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const supabase = createSupabaseBrowserClient();
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { SalesAnalyticsDashboard } from "@/components/sales-analytics";

type CarrierInfo = { company_name: string; owner_name?: string | null } | null;
type DriverInfo = { first_name: string; last_name: string } | null;

type LoadData = {
  load_id: number;
  load_number: string | null;
  load_data: string | null;
  weight_lbs: number | null;
  rate: number | null;
  dispatch_fee: number | null;
  load_status: string | null;
  paid_status: string | null;
  created_at?: string;
  carriers: CarrierInfo;
  drivers: DriverInfo;
  routes: { miles: number | null } | null;
  cargo_types: { cargo_type_name: string } | null;
};

type CarrierRPM = {
  carrier_name: string;
  total_loads: number;
  total_miles: number;
  total_revenue: number;
  avg_rpm: number;
};

export default function ReportsPage() {
  const [loads, setLoads] = useState<LoadData[]>([]);
  const [carrierRPM, setCarrierRPM] = useState<CarrierRPM[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ week: string; loads: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  function processWeeklyData(loadsData: LoadData[]) {
    const weeks: Record<string, { loads: number; revenue: number }> = {};
    loadsData.forEach((load) => {
      if (!load.created_at) return;
      const weekNum = Math.ceil((new Date(load.created_at).getDate()) / 7);
      const week = `Semana ${weekNum}`;
      if (!weeks[week]) weeks[week] = { loads: 0, revenue: 0 };
      weeks[week].loads += 1;
      weeks[week].revenue += load.rate || 0;
    });
    setWeeklyData(
      Object.entries(weeks).map(([week, data]) => ({ week, ...data }))
    );
  }

  function processCarrierRPM(loadsData: LoadData[]) {
    const carriers: Record<string, { name: string; loads: number; miles: number; revenue: number }> = {};
    loadsData.forEach((load) => {
      const name = load.carriers ? load.carriers.company_name : "Unknown";
      if (!carriers[name]) carriers[name] = { name, loads: 0, miles: 0, revenue: 0 };
      carriers[name].loads += 1;
      carriers[name].miles += load.routes?.miles || 0;
      carriers[name].revenue += load.rate || 0;
    });
    const result = Object.values(carriers)
      .map((c) => ({
        carrier_name: c.name,
        total_loads: c.loads,
        total_miles: c.miles,
        total_revenue: c.revenue,
        avg_rpm: c.miles > 0 ? c.revenue / c.miles : 0,
      }))
      .sort((a, b) => b.avg_rpm - a.avg_rpm);
    setCarrierRPM(result);
  }

  async function fetchData() {
    setLoading(true);
    const startDate = `${monthFilter}-01`;
    const lastDay = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).getDate();
    const endDate = `${monthFilter}-${String(lastDay).padStart(2, "0")}`;

    const { data: loadsData, error: loadsError } = await supabase
      .from("loads")
      .select(`
        load_id, load_number, load_data, weight_lbs, rate, dispatch_fee, load_status, paid_status, created_at,
        carriers(company_name, owner_name),
        drivers(first_name, last_name),
        routes(miles),
        cargo_types(cargo_type_name)
      `)
      .gte("booked_at", startDate)
      .lte("booked_at", endDate);

    if (loadsError) {
      setError(loadsError.message);
    } else {
      setLoads(loadsData as unknown as LoadData[]);
      processWeeklyData(loadsData as unknown as LoadData[]);
      processCarrierRPM(loadsData as unknown as LoadData[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchData();
  }, [monthFilter]);

  function exportCSV() {
    const headers = ["Load#", "Carrier", "Driver", "Cargo", "Miles", "Rate", "Dispatch Fee", "$/Mile", "Status"];
    const rows = loads.map((l) => [
      l.load_number || "",
      l.carriers ? l.carriers.company_name : "",
      l.drivers ? `${l.drivers.first_name} ${l.drivers.last_name}` : "",
      l.cargo_types?.cargo_type_name || "",
      l.routes?.miles || 0,
      l.rate || 0,
      l.dispatch_fee || 0,
      l.routes?.miles ? ((l.rate || 0) / l.routes.miles).toFixed(2) : 0,
      l.load_status || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loads-${monthFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalLoads = loads.length;
  const totalRevenue = loads.reduce((sum, l) => sum + (l.rate || 0), 0);
  const totalDispatchFees = loads.reduce((sum, l) => sum + (l.dispatch_fee || 0), 0);
  const totalMiles = loads.reduce((sum, l) => sum + (l.routes?.miles || 0), 0);
  const avgRPM = totalMiles > 0 ? totalRevenue / totalMiles : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Reportes</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Análisis y métricas del mes
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
          <Button onClick={exportCSV} disabled={loads.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* Sales Analytics Dashboard */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dashboard de Ventas</h2>
        <SalesAnalyticsDashboard />
      </div>

      {/* Monthly Load Reports */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Reporte Mensual de Cargas</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cargas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLoads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dispatch Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalDispatchFees.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">RPM Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${avgRPM.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Cargas por Semana</CardTitle>
                <CardDescription>Distribución semanal del mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="loads" fill="#18181b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue por Semana</CardTitle>
                <CardDescription>Ingresos semanales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#18181b" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>RPM por Carrier</CardTitle>
              <CardDescription>Ranking de rentabilidad por carrier (ordenado por RPM)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-900">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Carrier</th>
                      <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Cargas</th>
                      <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Miles</th>
                      <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Revenue</th>
                      <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">RPM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {carrierRPM.map((c, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                          {c.carrier_name}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                          {c.total_loads}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                          {c.total_miles.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                          ${c.total_revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={c.avg_rpm >= 2 ? "default" : c.avg_rpm >= 1.5 ? "secondary" : "destructive"}>
                            ${c.avg_rpm.toFixed(2)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {carrierRPM.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-zinc-500">
                          Sin datos para este mes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
