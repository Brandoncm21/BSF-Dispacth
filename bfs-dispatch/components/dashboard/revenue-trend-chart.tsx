"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RevenueTrend } from "@/lib/actions";

type Props = { data: RevenueTrend[] };

const formatUSD = (v: unknown) => [`$${Number(v || 0).toLocaleString("en-US")}`, "USD"];

export function RevenueTrendChart({ data }: Props) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const d = new Date(v + "T00:00:00");
              return d.toLocaleDateString("es-CR", { month: "short", day: "numeric" });
            }}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: unknown) => `$${(Number(v || 0) / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={formatUSD}
            labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("es-CR")}
            contentStyle={{
              backgroundColor: "hsl(0 0% 100%)",
              border: "1px solid hsl(240 5% 84%)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="gross_revenue"
            stroke="#3b82f6"
            fill="url(#revGrad)"
            name="Gross Revenue"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="net_profit"
            stroke="#10b981"
            fill="url(#profitGrad)"
            name="Net Profit"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
