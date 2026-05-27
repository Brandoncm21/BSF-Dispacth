"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ComparisonRow } from "@/lib/actions/executive-analytics";

type Props = {
  data: ComparisonRow[];
};

const formatUSD = (v: unknown) => [`$${Number(v || 0).toLocaleString("en-US")}`, "USD"];

export function ExecutiveComparisonChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-400 text-sm">
        Sin datos para el período seleccionado
      </div>
    );
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={0} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval={Math.max(0, Math.floor(data.length / 12) - 1)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: unknown) => `$${(Number(v || 0) / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={formatUSD}
            contentStyle={{
              backgroundColor: "hsl(0 0% 100%)",
              border: "1px solid hsl(240 5% 84%)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar
            dataKey="gross_revenue"
            fill="#3b82f6"
            name="Gross Revenue"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="net_profit"
            fill="#10b981"
            name="Net Profit"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
