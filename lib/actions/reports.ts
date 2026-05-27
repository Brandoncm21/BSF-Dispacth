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

function getDateRange(range: string, tzOffsetMinutes: number = 0): { from: string; to: string } {
  const now = new Date();
  const local = new Date(now.getTime() - tzOffsetMinutes * 60_000);

  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  const absOff = Math.abs(tzOffsetMinutes);
  const tzHours = Math.floor(absOff / 60);
  const tzMins = absOff % 60;
  const sign = tzOffsetMinutes <= 0 ? "+" : "-";
  const tz = `${sign}${String(tzHours).padStart(2, "0")}:${String(tzMins).padStart(2, "0")}`;

  const fmt = (year: number, month: number, day: number, hour: number, min: number, sec: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}${tz}`;

  switch (range) {
    case "week": {
      const weekAgo = new Date(local.getTime() - 7 * 86_400_000);
      return {
        from: fmt(weekAgo.getUTCFullYear(), weekAgo.getUTCMonth(), weekAgo.getUTCDate(), 0, 0, 0),
        to: fmt(y, m, d, 23, 59, 59),
      };
    }
    case "month": {
      return {
        from: fmt(y, m, 1, 0, 0, 0),
        to: fmt(y, m, d, 23, 59, 59),
      };
    }
    case "year": {
      return {
        from: fmt(y, 0, 1, 0, 0, 0),
        to: fmt(y, m, d, 23, 59, 59),
      };
    }
    default:
      return {
        from: "2000-01-01T00:00:00Z",
        to: fmt(y, m, d, 23, 59, 59),
      };
  }
}

export async function getReportsData(
  range: string = "month",
  tzOffsetMinutes: number = 0
): Promise<{
  byDispatcher: GroupedReport[];
  byCarrier: GroupedReport[];
  byTruck: GroupedReport[];
}> {
  const supabase = await getSupabaseServerClient();
  const { from, to } = getDateRange(range, tzOffsetMinutes);

  const { data, error } = await supabase
    .from("v_sales_performance_extended")
    .select("*")
    .gte("effective_date", from)
    .lte("effective_date", to);

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
