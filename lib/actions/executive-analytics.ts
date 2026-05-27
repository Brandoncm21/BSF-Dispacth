"use server";

import { getSupabaseServerClient } from "./core";

export type PresetType =
  | "this_week" | "last_week" | "last_4_weeks"
  | "this_month" | "last_month" | "last_3_months"
  | "this_quarter" | "last_quarter" | "last_2_quarters"
  | "this_semester" | "last_semester"
  | "this_year" | "last_year";

export type ExecutiveKPIs = {
  grossRevenue: number;
  netProfit: number;
  totalLoads: number;
  margin: number;
  revenueChange: number | null;
  profitChange: number | null;
};

export type ComparisonRow = {
  label: string;
  gross_revenue: number;
  net_profit: number;
  load_count: number;
};

export type SparklinePoint = {
  date: string;
  value: number;
};

export type ExecutiveAnalytics = {
  preset: string;
  kpis: ExecutiveKPIs;
  comparison: ComparisonRow[];
  sparklines: {
    revenue: SparklinePoint[];
    profit: SparklinePoint[];
    loads: SparklinePoint[];
  };
  previousPeriod: {
    label: string;
    grossRevenue: number;
    netProfit: number;
    totalLoads: number;
  } | null;
};

const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function fmtTS(y: number, mo: number, d: number, h: number, min: number, s: number, tz: string) {
  return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}${tz}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - ys.getTime()) / 86400000) + 1) / 7);
}

interface PeriodInfo {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  label: string;
  prevLabel: string;
  bucket: "daily" | "weekly" | "monthly";
}

function resolvePeriod(preset: PresetType, tz: string, local: Date): PeriodInfo {
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  const F = (Y: number, M: number, D: number) => fmtTS(Y, M, D, 0, 0, 0, tz);
  const E = (Y: number, M: number, D: number) => fmtTS(Y, M, D, 23, 59, 59, tz);

  const monday = (dt: Date) => {
    const r = new Date(dt);
    r.setUTCDate(r.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
    return r;
  };

  const addDays = (dt: Date, n: number) => {
    const r = new Date(dt);
    r.setUTCDate(r.getUTCDate() + n);
    return r;
  };

  switch (preset) {
    case "this_week": {
      const mon = monday(local);
      const sun = addDays(mon, 6);
      const pMon = addDays(mon, -7);
      const pSun = addDays(mon, -1);
      return {
        from: F(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()),
        to: E(sun.getUTCFullYear(), sun.getUTCMonth(), sun.getUTCDate()),
        prevFrom: F(pMon.getUTCFullYear(), pMon.getUTCMonth(), pMon.getUTCDate()),
        prevTo: E(pSun.getUTCFullYear(), pSun.getUTCMonth(), pSun.getUTCDate()),
        label: `Sem ${getISOWeek(mon)}`,
        prevLabel: `Sem ${getISOWeek(pMon)}`,
        bucket: "daily",
      };
    }
    case "last_week": {
      const thisMon = monday(local);
      const lastMon = addDays(thisMon, -7);
      const lastSun = addDays(lastMon, 6);
      const pMon = addDays(lastMon, -7);
      const pSun = addDays(lastMon, -1);
      return {
        from: F(lastMon.getUTCFullYear(), lastMon.getUTCMonth(), lastMon.getUTCDate()),
        to: E(lastSun.getUTCFullYear(), lastSun.getUTCMonth(), lastSun.getUTCDate()),
        prevFrom: F(pMon.getUTCFullYear(), pMon.getUTCMonth(), pMon.getUTCDate()),
        prevTo: E(pSun.getUTCFullYear(), pSun.getUTCMonth(), pSun.getUTCDate()),
        label: `Sem ${getISOWeek(lastMon)}`,
        prevLabel: `Sem ${getISOWeek(pMon)}`,
        bucket: "daily",
      };
    }
    case "last_4_weeks": {
      const start = addDays(local, -27);
      const pStart = addDays(start, -28);
      const pEnd = addDays(start, -1);
      return {
        from: F(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
        to: E(y, m, d),
        prevFrom: F(pStart.getUTCFullYear(), pStart.getUTCMonth(), pStart.getUTCDate()),
        prevTo: E(pEnd.getUTCFullYear(), pEnd.getUTCMonth(), pEnd.getUTCDate()),
        label: "Últimas 4 Sem",
        prevLabel: "Sem Previas",
        bucket: "daily",
      };
    }
    case "this_month": {
      const pY = m === 0 ? y - 1 : y;
      const pM = m === 0 ? 11 : m - 1;
      return {
        from: F(y, m, 1),
        to: E(y, m, d),
        prevFrom: F(pY, pM, 1),
        prevTo: E(pY, pM, daysInMonth(pY, pM)),
        label: `${MONTHS_SHORT[m]} ${y}`,
        prevLabel: `${MONTHS_SHORT[pM]} ${pY}`,
        bucket: "daily",
      };
    }
    case "last_month": {
      const tY = m === 0 ? y - 1 : y;
      const tM = m === 0 ? 11 : m - 1;
      const pY = tM === 0 ? tY - 1 : tY;
      const pM = tM === 0 ? 11 : tM - 1;
      return {
        from: F(tY, tM, 1),
        to: E(tY, tM, daysInMonth(tY, tM)),
        prevFrom: F(pY, pM, 1),
        prevTo: E(pY, pM, daysInMonth(pY, pM)),
        label: `${MONTHS_SHORT[tM]} ${tY}`,
        prevLabel: `${MONTHS_SHORT[pM]} ${pY}`,
        bucket: "daily",
      };
    }
    case "last_3_months": {
      const sM = m - 2;
      const sY = sM < 0 ? y - 1 : y;
      const adjM = ((sM % 12) + 12) % 12;
      const pS = new Date(local);
      pS.setUTCMonth(pS.getUTCMonth() - 6);
      const pE = new Date(local);
      pE.setUTCMonth(pE.getUTCMonth() - 3);
      pE.setUTCDate(0);
      return {
        from: F(sY, adjM, 1),
        to: E(y, m, d),
        prevFrom: F(pS.getUTCFullYear(), pS.getUTCMonth(), 1),
        prevTo: E(pE.getUTCFullYear(), pE.getUTCMonth(), pE.getUTCDate()),
        label: "Últimos 3 Meses",
        prevLabel: "Prev 3 Meses",
        bucket: "monthly",
      };
    }
    case "this_quarter": {
      const q = Math.floor(m / 3) * 3;
      const qNum = q / 3 + 1;
      const pY = y - 1;
      return {
        from: F(y, q, 1),
        to: E(y, q + 2, daysInMonth(y, q + 2)),
        prevFrom: F(pY, q, 1),
        prevTo: E(pY, q + 2, daysInMonth(pY, q + 2)),
        label: `Q${qNum} ${y}`,
        prevLabel: `Q${qNum} ${pY}`,
        bucket: "weekly",
      };
    }
    case "last_quarter": {
      const cq = Math.floor(m / 3) * 3;
      const lq = cq - 3;
      const lqY = lq < 0 ? y - 1 : y;
      const lqM = ((lq % 12) + 12) % 12;
      const lqNum = lqM / 3 + 1;
      const pY = lqY - 1;
      return {
        from: F(lqY, lqM, 1),
        to: E(lqY, lqM + 2, daysInMonth(lqY, lqM + 2)),
        prevFrom: F(pY, lqM, 1),
        prevTo: E(pY, lqM + 2, daysInMonth(pY, lqM + 2)),
        label: `Q${lqNum} ${lqY}`,
        prevLabel: `Q${lqNum} ${pY}`,
        bucket: "weekly",
      };
    }
    case "last_2_quarters": {
      const cq = Math.floor(m / 3) * 3;
      const sq = cq - 6;
      const sqY = sq < 0 ? y - 1 : y;
      const sqM = ((sq % 12) + 12) % 12;
      const pS = new Date(sqY, sqM, 1);
      pS.setFullYear(pS.getFullYear() - 1);
      const pE = new Date(y, m, d);
      pE.setFullYear(pE.getFullYear() - 1);
      return {
        from: F(sqY, sqM, 1),
        to: E(y, m, d),
        prevFrom: F(pS.getFullYear(), pS.getMonth(), 1),
        prevTo: E(pE.getFullYear(), pE.getMonth(), pE.getDate()),
        label: "Últimos 2 Trim",
        prevLabel: "Prev 2 Trim",
        bucket: "monthly",
      };
    }
    case "this_semester": {
      const h1 = m < 6;
      const sL = h1 ? "H1" : "H2";
      const pY = y - 1;
      return {
        from: F(y, h1 ? 0 : 6, 1),
        to: E(y, h1 ? 5 : 11, daysInMonth(y, h1 ? 5 : 11)),
        prevFrom: F(pY, h1 ? 0 : 6, 1),
        prevTo: E(pY, h1 ? 5 : 11, daysInMonth(pY, h1 ? 5 : 11)),
        label: `${sL} ${y}`,
        prevLabel: `${sL} ${pY}`,
        bucket: "monthly",
      };
    }
    case "last_semester": {
      const h1 = m < 6;
      const sY = h1 ? y - 1 : y;
      const sM = h1 ? 6 : 0;
      const sL = h1 ? "H2" : "H1";
      const pY = sY - 1;
      return {
        from: F(sY, sM, 1),
        to: E(sY, sM + 5, daysInMonth(sY, sM + 5)),
        prevFrom: F(pY, sM, 1),
        prevTo: E(pY, sM + 5, daysInMonth(pY, sM + 5)),
        label: `${sL} ${sY}`,
        prevLabel: `${sL} ${pY}`,
        bucket: "monthly",
      };
    }
    case "this_year": {
      return {
        from: F(y, 0, 1),
        to: E(y, 11, 31),
        prevFrom: F(y - 1, 0, 1),
        prevTo: E(y - 1, 11, 31),
        label: `${y}`,
        prevLabel: `${y - 1}`,
        bucket: "monthly",
      };
    }
    case "last_year": {
      return {
        from: F(y - 1, 0, 1),
        to: E(y - 1, 11, 31),
        prevFrom: F(y - 2, 0, 1),
        prevTo: E(y - 2, 11, 31),
        label: `${y - 1}`,
        prevLabel: `${y - 2}`,
        bucket: "monthly",
      };
    }
  }
}

function bucketLabel(d: string, bucket: "daily" | "weekly" | "monthly"): string {
  if (!d) return "Sin Fecha";
  const dt = new Date(d);
  if (bucket === "daily") {
    return dt.toLocaleDateString("es-CR", { month: "short", day: "numeric" });
  }
  if (bucket === "weekly") {
    const iso = getISOWeek(dt);
    return `Sem ${iso}`;
  }
  return `${MONTHS_SHORT[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

function bucketKey(d: string, bucket: "daily" | "weekly" | "monthly"): string {
  if (!d || d === "Sin Fecha") return "z_unknown";
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const day = dt.getUTCDate();
  if (bucket === "daily") return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (bucket === "weekly") {
    const iso = getISOWeek(dt);
    return `${y}-W${String(iso).padStart(2, "0")}`;
  }
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

function aggregateRows(rows: Record<string, unknown>[], bucket: "daily" | "weekly" | "monthly"): ComparisonRow[] {
  const map = new Map<string, { gross: number; profit: number; count: number }>();
  for (const row of rows) {
    const date = (row.effective_date as string) || "";
    const key = bucketKey(date, bucket);
    const curr = map.get(key) || { gross: 0, profit: 0, count: 0 };
    curr.gross += Number(row.gross_revenue) || 0;
    curr.profit += Number(row.net_profit) || 0;
    curr.count += 1;
    map.set(key, curr);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({
      label: bucketLabel(key, bucket),
      gross_revenue: v.gross,
      net_profit: v.profit,
      load_count: v.count,
    }))
    .sort((a, b) => {
      const ka = keySortKey(a.label, bucket);
      const kb = keySortKey(b.label, bucket);
      return ka - kb;
    });
}

function keySortKey(label: string, bucket: "daily" | "weekly" | "monthly"): number {
  return new Date(label + (bucket === "weekly" ? "" : bucket === "daily" ? "T00:00:00" : "-01T00:00:00")).getTime();
}

function sparklineFromComparison(data: ComparisonRow[], field: "gross_revenue" | "net_profit" | "load_count"): SparklinePoint[] {
  return data.map((r) => ({
    date: r.label,
    value: r[field],
  }));
}

export async function getExecutiveAnalytics(
  preset: PresetType,
  tzOffsetMinutes: number = 0
): Promise<ExecutiveAnalytics> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const local = new Date(now.getTime() - tzOffsetMinutes * 60000);

  const absOff = Math.abs(tzOffsetMinutes);
  const tzSign = tzOffsetMinutes <= 0 ? "+" : "-";
  const tz = `${tzSign}${String(Math.floor(absOff / 60)).padStart(2, "0")}:${String(absOff % 60).padStart(2, "0")}`;

  const period = resolvePeriod(preset, tz, local);

  const { data: current, error: err1 } = await supabase
    .from("v_sales_performance_extended")
    .select("*")
    .gte("effective_date", period.from)
    .lte("effective_date", period.to);

  if (err1) {
    console.error("[getExecutiveAnalytics] current:", err1.message);
    throw err1;
  }

  const { data: previous, error: err2 } = await supabase
    .from("v_sales_performance_extended")
    .select("*")
    .gte("effective_date", period.prevFrom)
    .lte("effective_date", period.prevTo);

  if (err2) {
    console.error("[getExecutiveAnalytics] prev:", err2.message);
    throw err2;
  }

  const curRows = (current || []) as Record<string, unknown>[];
  const prevRows = (previous || []) as Record<string, unknown>[];

  const comparison = aggregateRows(curRows, period.bucket);
  const revenueSparkline = sparklineFromComparison(comparison, "gross_revenue");
  const profitSparkline = sparklineFromComparison(comparison, "net_profit");
  const loadsSparkline = sparklineFromComparison(comparison, "load_count");

  const curGross = curRows.reduce((s, r) => s + (Number(r.gross_revenue) || 0), 0);
  const curProfit = curRows.reduce((s, r) => s + (Number(r.net_profit) || 0), 0);
  const curCount = curRows.length;

  const prevGross = prevRows.reduce((s, r) => s + (Number(r.gross_revenue) || 0), 0);
  const prevProfit = prevRows.reduce((s, r) => s + (Number(r.net_profit) || 0), 0);
  const prevCount = prevRows.length;

  const revenueChange = prevGross > 0 ? ((curGross - prevGross) / prevGross) * 100 : null;
  const profitChange = prevProfit > 0 ? ((curProfit - prevProfit) / prevProfit) * 100 : null;

  return {
    preset,
    kpis: {
      grossRevenue: curGross,
      netProfit: curProfit,
      totalLoads: curCount,
      margin: curGross > 0 ? (curProfit / curGross) * 100 : 0,
      revenueChange,
      profitChange,
    },
    comparison,
    sparklines: {
      revenue: revenueSparkline,
      profit: profitSparkline,
      loads: loadsSparkline,
    },
    previousPeriod: {
      label: period.prevLabel,
      grossRevenue: prevGross,
      netProfit: prevProfit,
      totalLoads: prevCount,
    },
  };
}
