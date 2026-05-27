"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { SparklinePoint } from "@/lib/actions/executive-analytics";

type Props = {
  title: string;
  value: string;
  change: number | null;
  changeLabel?: string;
  sparklineData: SparklinePoint[];
  color?: string;
  gradientId?: string;
  icon?: React.ReactNode;
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  sparklineData,
  color = "#3b82f6",
  gradientId = "kpiGrad",
  icon,
}: Props) {
  const isPositive = change !== null && change >= 0;
  const isNegative = change !== null && change < 0;

  return (
    <Card className="print-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{value}</p>
          </div>
          {icon && (
            <div className="text-zinc-400">{icon}</div>
          )}
        </div>

        {change !== null && (
          <div className="flex items-center gap-1.5 mb-3">
            <span
              className={`inline-flex items-center gap-0.5 text-sm font-semibold ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isNegative
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-500"
              }`}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-xs text-zinc-400">{changeLabel}</span>
            )}
          </div>
        )}

        <div className="h-[60px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={`url(#${gradientId})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
