"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { StateProfitData } from "@/lib/actions";

type Props = {
  data: StateProfitData[];
};

export function StateProfitChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="text-sm text-zinc-400 py-8 text-center">Sin datos del período</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="state" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="gross_revenue" fill="#3b82f6" name="Gross Revenue" radius={[4, 4, 0, 0]} />
        <Bar dataKey="net_profit" fill="#10b981" name="Net Profit" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
