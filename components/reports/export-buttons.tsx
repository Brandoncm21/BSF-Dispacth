"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { GroupedReport } from "@/lib/actions";

type Props = {
  data: GroupedReport[];
  tabName: string;
  dateLabel: string;
};

export function ExportButtons({ data, tabName, dateLabel }: Props) {
  function exportCSV() {
    const headers = ["Entidad", "Cargas", "Gross Revenue", "Net Profit", "Margen %"];
    const rows = data.map((r) => [
      r.entity_name,
      r.load_count,
      r.gross_revenue.toFixed(2),
      r.net_profit.toFixed(2),
      r.gross_revenue > 0 ? ((r.net_profit / r.gross_revenue) * 100).toFixed(1) : "0",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bfs-report-${tabName.toLowerCase()}-${dateLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      window.print();
      return;
    }

    const headers = ["Entidad", "Cargas", "Gross Revenue", "Net Profit", "Margen %"];
    const rows = data.map((r) => [
      r.entity_name,
      r.load_count,
      `$${r.gross_revenue.toLocaleString()}`,
      `$${r.net_profit.toLocaleString()}`,
      r.gross_revenue > 0 ? `${((r.net_profit / r.gross_revenue) * 100).toFixed(1)}%` : "0%",
    ]);

    const today = new Date().toLocaleDateString("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    printWin.document.write(`
      <html>
      <head>
        <title>BFS Dispatch - ${tabName} Report</title>
        <style>
          @page { size: letter; margin: 0.75in; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 20px; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #18181b; padding-bottom: 16px; }
          .header h1 { font-size: 22px; font-weight: 700; color: #18181b; }
          .header p { font-size: 13px; color: #52525b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #18181b; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
          td { padding: 8px 12px; border-bottom: 1px solid #e4e4e7; }
          tr:nth-child(even) { background: #f4f4f5; }
          .text-right { text-align: right; }
          .footer { margin-top: 24px; font-size: 10px; color: #a1a1aa; text-align: center; }
          .no-print { display: none; }
          @media print {
            .header h1 { font-size: 20px; }
            table { font-size: 11px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BFS Dispatch - Performance Report</h1>
          <p>Reporte: ${tabName} | Generado: ${today} | Periodo: ${dateLabel}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map(
                      (cell, i) =>
                        `<td${i >= 2 ? ' class="text-right"' : ""}>${cell}</td>`
                    )
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">BFS Dispatch © ${new Date().getFullYear()} — BestFreight System — Confidential</div>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV} disabled={data.length === 0}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={data.length === 0}>
        <Printer className="mr-1.5 h-3.5 w-3.5" />
        PDF
      </Button>
    </div>
  );
}
