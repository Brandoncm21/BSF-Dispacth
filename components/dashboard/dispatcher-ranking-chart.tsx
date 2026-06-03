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
import type { DispatcherRanking } from "@/lib/actions";

type Props = { data: DispatcherRanking[] };

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1"];

const formatUSD = (v: unknown) => [`$${Number(v || 0).toLocaleString("en-US")}`, "USD"];

export function DispatcherRankingChart({ data }: Props) {
  const top = data.slice(0, 10);

  return (
    <div className="h-[300px]">
      {top.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: unknown) => `$${(Number(v || 0) / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="dispatcher_name" tick={{ fontSize: 11 }} width={130} />
            <Tooltip
              formatter={formatUSD}
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(240 5% 84%)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="net_profit" radius={[0, 4, 4, 0]}>
              {top.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
          Sin datos de dispatchers
        </div>
      )}
    </div>
  );
}
