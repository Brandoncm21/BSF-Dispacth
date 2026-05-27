"use client";

import type { GroupedReport } from "@/lib/actions";

type Props = {
  data: GroupedReport[];
  nameColumn: string;
};

export function ReportDataTable({ data, nameColumn }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Sin datos para el período seleccionado
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">{nameColumn}</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Cargas</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Gross Revenue</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Net Profit</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Margen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {data.map((row, i) => (
            <tr key={String(row.entity_id)} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                <span className="text-xs text-zinc-400 mr-1">#{i + 1}</span>
                {row.entity_name}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                {row.load_count}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                ${row.gross_revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                ${row.net_profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.gross_revenue > 0 && row.net_profit / row.gross_revenue > 0.3
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : row.net_profit > 0
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {row.gross_revenue > 0
                    ? `${((row.net_profit / row.gross_revenue) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
