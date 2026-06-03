"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { TruckProfitRanking } from "@/lib/actions";

type Props = {
  data: TruckProfitRanking[];
};

export function TruckProfitChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="text-sm text-zinc-400 py-8 text-center">Sin datos del período</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="unit_number" type="category" tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
        />
        <Bar dataKey="net_profit" fill="#10b981" name="Net Profit" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
