"use client";

import { useState, useEffect } from "react";
import { getSalesAnalytics, SalesByMonth, SalesByBroker, SalesByState } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export function SalesAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [salesByMonth, setSalesByMonth] = useState<SalesByMonth[]>([]);
  const [salesByBroker, setSalesByBroker] = useState<SalesByBroker[]>([]);
  const [salesByOriginState, setSalesByOriginState] = useState<SalesByState[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const data = await getSalesAnalytics();
      setSalesByMonth(data.salesByMonth);
      setSalesByBroker(data.salesByBroker);
      setSalesByOriginState(data.salesByOriginState);
    } catch (e) {
      setError("Error cargando analítica");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalProfit = salesByMonth.reduce((sum, m) => sum + m.total_profit, 0);
  const totalRevenue = salesByMonth.reduce((sum, m) => sum + m.total_revenue, 0);
  const totalLoads = salesByMonth.reduce((sum, m) => sum + m.load_count, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-zinc-500">Ingresos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
            <p className="text-xs text-zinc-500">Profit acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cargas</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoads}</div>
            <p className="text-xs text-zinc-500">Total de ventas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-zinc-500">Profit / Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Month */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Ventas por Mes</CardTitle>
            <CardDescription>Revenue y ganancia mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
                    contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(240 5% 84%)" }}
                  />
                  <Legend />
                  <Bar dataKey="total_revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Broker - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Broker</CardTitle>
            <CardDescription>Distribución de revenue por broker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {salesByBroker.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByBroker}
                      dataKey="total_revenue"
                      nameKey="broker_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {salesByBroker.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  Sin datos de brokers
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top States by Profit */}
        <Card>
          <CardHeader>
            <CardTitle>Estados Más Rentables</CardTitle>
            <CardDescription>Top estados por ganancia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesByOriginState.slice(0, 5).map((state, index) => (
                <div key={state.state_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{state.state_name}</p>
                      <p className="text-xs text-zinc-500">{state.load_count} cargas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${state.total_profit.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">profit</p>
                  </div>
                </div>
              ))}
              {salesByOriginState.length === 0 && (
                <p className="text-center text-zinc-400 py-8">Sin datos de estados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
