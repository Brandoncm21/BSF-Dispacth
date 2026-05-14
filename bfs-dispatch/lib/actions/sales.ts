"use server";

import { getSupabaseServerClient } from "./core";

export type SalesByMonth = {
  month: string;
  total_profit: number;
  total_revenue: number;
  load_count: number;
};

export type SalesByBroker = {
  broker_name: string;
  total_profit: number;
  total_revenue: number;
  load_count: number;
};

export type SalesByState = {
  state_name: string;
  total_profit: number;
  total_revenue: number;
  load_count: number;
};

export async function getSalesAnalytics(fromDate?: string, toDate?: string) {
  const supabase = await getSupabaseServerClient();

  const defaultFrom = new Date();
  defaultFrom.setFullYear(defaultFrom.getFullYear() - 12);
  const effectiveFrom = fromDate || defaultFrom.toISOString().slice(0, 10);

  let query = supabase
    .from("v_sales_performance")
    .select("sale_date, total_profit, total_amount, broker_name, origin_state_name, destination_state_name, load_number")
    .gte("sale_date", effectiveFrom);

  if (toDate) {
    query = query.lte("sale_date", toDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  const salesByMonth: Record<string, SalesByMonth> = {};
  const salesByBroker: Record<string, SalesByBroker> = {};
  const salesByOriginState: Record<string, SalesByState> = {};
  const salesByDestState: Record<string, SalesByState> = {};

  data.forEach((sale) => {
    const month = sale.sale_date ? sale.sale_date.slice(0, 7) : "Sin Fecha";

    if (!salesByMonth[month]) {
      salesByMonth[month] = { month, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByMonth[month].total_profit += Number(sale.total_profit) || 0;
    salesByMonth[month].total_revenue += Number(sale.total_amount) || 0;
    salesByMonth[month].load_count += 1;

    const broker = sale.broker_name || "Sin Broker";
    if (!salesByBroker[broker]) {
      salesByBroker[broker] = { broker_name: broker, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByBroker[broker].total_profit += Number(sale.total_profit) || 0;
    salesByBroker[broker].total_revenue += Number(sale.total_amount) || 0;
    salesByBroker[broker].load_count += 1;

    const originState = sale.origin_state_name || "N/A";
    if (!salesByOriginState[originState]) {
      salesByOriginState[originState] = { state_name: originState, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByOriginState[originState].total_profit += Number(sale.total_profit) || 0;
    salesByOriginState[originState].total_revenue += Number(sale.total_amount) || 0;
    salesByOriginState[originState].load_count += 1;

    const destState = sale.destination_state_name || "N/A";
    if (!salesByDestState[destState]) {
      salesByDestState[destState] = { state_name: destState, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByDestState[destState].total_profit += Number(sale.total_profit) || 0;
    salesByDestState[destState].total_revenue += Number(sale.total_amount) || 0;
    salesByDestState[destState].load_count += 1;
  });

  return {
    salesByMonth: Object.values(salesByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    salesByBroker: Object.values(salesByBroker).sort((a, b) => b.total_profit - a.total_profit),
    salesByOriginState: Object.values(salesByOriginState).sort((a, b) => b.total_profit - a.total_profit),
    salesByDestState: Object.values(salesByDestState).sort((a, b) => b.total_profit - a.total_profit),
  };
}
