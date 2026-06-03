"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportDataTable } from "@/components/reports/report-data-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { getReportsData } from "@/lib/actions";
import type { GroupedReport } from "@/lib/actions";
import { Loader2, X } from "lucide-react";

type DateRange = "week" | "month" | "year" | "all";

const RANGE_LABELS: Record<DateRange, string> = {
  week: "Semana",
  month: "Mes",
  year: "Año",
  all: "Todo",
};

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
  { value: "all", label: "Todo" },
];

export default function ReportsPage() {
  const tzOffsetRef = useRef(new Date().getTimezoneOffset());
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [activeTab, setActiveTab] = useState("dispatcher");
  const [byDispatcher, setByDispatcher] = useState<GroupedReport[]>([]);
  const [byCarrier, setByCarrier] = useState<GroupedReport[]>([]);
  const [byTruck, setByTruck] = useState<GroupedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getReportsData(dateRange, tzOffsetRef.current);
      setByDispatcher(result.byDispatcher);
      setByCarrier(result.byCarrier);
      setByTruck(result.byTruck);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar reportes");
    }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentData: GroupedReport[] =
    activeTab === "dispatcher" ? byDispatcher
    : activeTab === "carrier" ? byCarrier
    : byTruck;

  const nameColumn =
    activeTab === "dispatcher" ? "Dispatcher"
    : activeTab === "carrier" ? "Carrier"
    : "Camión";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Reportes</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Rendimiento financiero por dispatcher, carrier y camión
          </p>
        </div>
        <ExportButtons data={currentData} tabName={nameColumn} dateLabel={RANGE_LABELS[dateRange]} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div className="flex gap-2 mb-6">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDateRange(opt.value)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === opt.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Performance</CardTitle>
            <div className="flex gap-4 text-sm text-zinc-500">
              <span>
                Total Cargas:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {currentData.reduce((a, r) => a + r.load_count, 0)}
                </strong>
              </span>
              <span>
                Gross:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  ${currentData.reduce((a, r) => a + r.gross_revenue, 0).toLocaleString()}
                </strong>
              </span>
              <span>
                Net Profit:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  ${currentData.reduce((a, r) => a + r.net_profit, 0).toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="dispatcher">Por Dispatcher</TabsTrigger>
                <TabsTrigger value="carrier">Por Carrier</TabsTrigger>
                <TabsTrigger value="truck">Por Truck</TabsTrigger>
              </TabsList>
              <TabsContent value="dispatcher">
                <ReportDataTable data={byDispatcher} nameColumn="Dispatcher" />
              </TabsContent>
              <TabsContent value="carrier">
                <ReportDataTable data={byCarrier} nameColumn="Carrier" />
              </TabsContent>
              <TabsContent value="truck">
                <ReportDataTable data={byTruck} nameColumn="Camión" />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
