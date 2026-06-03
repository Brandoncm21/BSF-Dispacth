"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CarrierPerformance } from "@/lib/actions";

type Props = { data: CarrierPerformance[] };

const BAR_COLORS = ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#10b981", "#3b82f6", "#8b5cf6"];

const formatUSD = (v: unknown) => [`$${Number(v || 0).toLocaleString("en-US")}`, "USD"];

export function CarrierPerformanceChart({ data }: Props) {
  return (
    <div className="h-[300px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: unknown) => `$${(Number(v || 0) / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="carrier_name" tick={{ fontSize: 10 }} width={140} />
            <Tooltip
              formatter={formatUSD}
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(240 5% 84%)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="gross_revenue" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
          Sin carriers en el período
        </div>
      )}
    </div>
  );
}
