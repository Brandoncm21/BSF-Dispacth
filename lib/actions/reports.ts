"use server";

import { getSupabaseServerClient } from "./core";

export type ReportRow = {
  load_id: number;
  load_number: string | null;
  gross_revenue: number | null;
  net_profit: number | null;
  dispatch_fee_pct: number | null;
  load_status: string | null;
  paid_status: string | null;
  booked_at: string | null;
  dispatcher_id: number | null;
  dispatcher_name: string;
  carrier_id: number | null;
  carrier_name: string;
  truck_id: number | null;
  unit_number: string | null;
  vehicle_type: string | null;
  origin_state_name: string;
  destination_state_name: string;
};

export type GroupedReport = {
  entity_id: number | string;
  entity_name: string;
  load_count: number;
  gross_revenue: number;
  net_profit: number;
};

function getDateRange(range: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  switch (range) {
    case "week": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo.toISOString().slice(0, 10), to };
    }
    case "month": {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: firstOfMonth.toISOString().slice(0, 10), to };
    }
    case "year": {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return { from: firstOfYear.toISOString().slice(0, 10), to };
    }
    default:
      return { from: "2000-01-01", to };
  }
}

export async function getReportsData(
  range: string = "month"
): Promise<{
  byDispatcher: GroupedReport[];
  byCarrier: GroupedReport[];
  byTruck: GroupedReport[];
}> {
  const supabase = await getSupabaseServerClient();
  const { from, to } = getDateRange(range);

  const { data, error } = await supabase
    .from("v_sales_performance_extended")
    .select("*")
    .gte("effective_date::date", from)
    .lte("effective_date::date", to);

  if (error) {
    console.error("[getReportsData]", error.message);
    throw error;
  }

  const rows = (data || []) as ReportRow[];

  const dispatcherMap = new Map<number, GroupedReport>();
  const carrierMap = new Map<number, GroupedReport>();
  const truckMap = new Map<number, GroupedReport>();

  for (const row of rows) {
    if (row.dispatcher_id != null) {
      const existing = dispatcherMap.get(row.dispatcher_id) || {
        entity_id: row.dispatcher_id,
        entity_name: row.dispatcher_name,
        load_count: 0,
        gross_revenue: 0,
        net_profit: 0,
      };
      existing.load_count += 1;
      existing.gross_revenue += Number(row.gross_revenue) || 0;
      existing.net_profit += Number(row.net_profit) || 0;
      dispatcherMap.set(row.dispatcher_id, existing);
    }

    if (row.carrier_id != null) {
      const existing = carrierMap.get(row.carrier_id) || {
        entity_id: row.carrier_id,
        entity_name: row.carrier_name,
        load_count: 0,
        gross_revenue: 0,
        net_profit: 0,
      };
      existing.load_count += 1;
      existing.gross_revenue += Number(row.gross_revenue) || 0;
      existing.net_profit += Number(row.net_profit) || 0;
      carrierMap.set(row.carrier_id, existing);
    }

    if (row.truck_id != null) {
      const existing = truckMap.get(row.truck_id) || {
        entity_id: row.truck_id,
        entity_name: `${row.unit_number || "N/A"} - ${row.vehicle_type || ""}`,
        load_count: 0,
        gross_revenue: 0,
        net_profit: 0,
      };
      existing.load_count += 1;
      existing.gross_revenue += Number(row.gross_revenue) || 0;
      existing.net_profit += Number(row.net_profit) || 0;
      truckMap.set(row.truck_id, existing);
    }
  }

  const sortByProfit = (a: GroupedReport, b: GroupedReport) => b.net_profit - a.net_profit;

  return {
    byDispatcher: Array.from(dispatcherMap.values()).sort(sortByProfit),
    byCarrier: Array.from(carrierMap.values()).sort(sortByProfit),
    byTruck: Array.from(truckMap.values()).sort(sortByProfit),
  };
}
