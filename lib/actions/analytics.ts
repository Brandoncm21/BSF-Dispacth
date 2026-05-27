"use server";

import { getSupabaseServerClient } from "./core";

export type RevenueTrend = {
  date: string;
  gross_revenue: number;
  net_profit: number;
};

export type DispatcherRanking = {
  dispatcher_id: number;
  dispatcher_name: string;
  load_count: number;
  gross_revenue: number;
  net_profit: number;
};

export type LoadStatusDistribution = {
  name: string;
  value: number;
  color: string;
};

export type CarrierPerformance = {
  carrier_name: string;
  load_count: number;
  gross_revenue: number;
  net_profit: number;
};

export type DashboardKPIs = {
  totalLoads: number;
  totalRevenue: number;
  totalProfit: number;
  totalCarriers: number;
  totalDispatchers: number;
  margin: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#f59e0b" },
  booked: { label: "Reservado", color: "#3b82f6" },
  picked_up: { label: "En Tránsito", color: "#8b5cf6" },
  delivered: { label: "Entregado", color: "#10b981" },
  paid: { label: "Pagado", color: "#059669" },
};

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: firstOfMonth.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export async function getDashboardAnalytics(dispatcherId?: number) {
  const supabase = await getSupabaseServerClient();
  const { from, to } = getMonthRange();

  let query = supabase
    .from("v_sales_performance_extended")
    .select("*")
    .gte("effective_date::date", from)
    .lte("effective_date::date", to);

  if (dispatcherId) {
    query = query.eq("dispatcher_id", dispatcherId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getDashboardAnalytics]", error.message);
    throw error;
  }

  const rows = data || [];

  // === Revenue Trend (daily) ===
  const dailyMap = new Map<string, { gross_revenue: number; net_profit: number }>();
  for (const row of rows) {
    const date = row.effective_date ? row.effective_date.slice(0, 10) : "Sin Fecha";
    const curr = dailyMap.get(date) || { gross_revenue: 0, net_profit: 0 };
    curr.gross_revenue += Number(row.gross_revenue) || 0;
    curr.net_profit += Number(row.net_profit) || 0;
    dailyMap.set(date, curr);
  }
  const revenueTrend: RevenueTrend[] = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, gross_revenue: v.gross_revenue, net_profit: v.net_profit }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // === Dispatcher Ranking ===
  const dispMap = new Map<number, DispatcherRanking>();
  for (const row of rows) {
    if (row.dispatcher_id == null) continue;
    const curr = dispMap.get(row.dispatcher_id) || {
      dispatcher_id: row.dispatcher_id,
      dispatcher_name: row.dispatcher_name,
      load_count: 0,
      gross_revenue: 0,
      net_profit: 0,
    };
    curr.load_count += 1;
    curr.gross_revenue += Number(row.gross_revenue) || 0;
    curr.net_profit += Number(row.net_profit) || 0;
    dispMap.set(row.dispatcher_id, curr);
  }
  const dispatcherRanking: DispatcherRanking[] = Array.from(dispMap.values())
    .sort((a, b) => b.net_profit - a.net_profit);

  // === Load Status Distribution ===
  const statusMap = new Map<string, number>();
  for (const row of rows) {
    const status = row.load_status || "unknown";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }
  const loadStatusDistribution: LoadStatusDistribution[] = Array.from(statusMap.entries())
    .map(([key, value]) => ({
      name: STATUS_CONFIG[key]?.label || key.replace("_", " "),
      value,
      color: STATUS_CONFIG[key]?.color || "#a1a1aa",
    }))
    .sort((a, b) => b.value - a.value);

  // === Carrier Performance ===
  const carrierMap = new Map<string, CarrierPerformance>();
  for (const row of rows) {
    if (row.carrier_id == null) continue;
    const name = row.carrier_name || "N/A";
    const curr = carrierMap.get(name) || {
      carrier_name: name,
      load_count: 0,
      gross_revenue: 0,
      net_profit: 0,
    };
    curr.load_count += 1;
    curr.gross_revenue += Number(row.gross_revenue) || 0;
    curr.net_profit += Number(row.net_profit) || 0;
    carrierMap.set(name, curr);
  }
  const carrierPerformance: CarrierPerformance[] = Array.from(carrierMap.values())
    .sort((a, b) => b.gross_revenue - a.gross_revenue)
    .slice(0, 10);

  // === KPIs ===
  const totalRevenue = rows.reduce((s, r) => s + (Number(r.gross_revenue) || 0), 0);
  const totalProfit = rows.reduce((s, r) => s + (Number(r.net_profit) || 0), 0);

  const [{ count: totalLoads }, { count: totalCarriers }, { count: totalDispatchers }] = await Promise.all([
    supabase.from("loads").select("*", { count: "exact", head: true }),
    supabase.from("carriers").select("*", { count: "exact", head: true }).eq("status_id", 1),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status_id", 1),
  ]);

  return {
    revenueTrend,
    dispatcherRanking,
    loadStatusDistribution,
    carrierPerformance,
    kpis: {
      totalLoads: totalLoads || 0,
      totalRevenue,
      totalProfit,
      totalCarriers: totalCarriers || 0,
      totalDispatchers: totalDispatchers || 0,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    } satisfies DashboardKPIs,
  };
}
