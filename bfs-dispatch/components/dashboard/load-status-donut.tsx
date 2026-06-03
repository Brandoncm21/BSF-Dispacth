"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { LoadStatusDistribution } from "@/lib/actions";

type Props = { data: LoadStatusDistribution[] };

export function LoadStatusDonut({ data }: Props) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <div className="h-[300px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => {
                const v = Number(value || 0);
                return [`${v} (${((v / total) * 100).toFixed(1)}%)`, "Cargas"];
              }}
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(240 5% 84%)",
                borderRadius: "8px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value) => (
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
          Sin cargas en el período
        </div>
      )}
    </div>
  );
}
