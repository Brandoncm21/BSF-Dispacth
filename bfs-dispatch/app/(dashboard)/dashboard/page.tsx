import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, DollarSign, TrendingUp, Truck, ShieldAlert } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function getKPIs() {
  const supabase = await createSupabaseServerClient();

  const { count: totalLoads } = await supabase
    .from("loads")
    .select("*", { count: "exact", head: true });

  const { data: sales } = await supabase
    .from("sales")
    .select("total_amount, total_profit");

  const { count: totalCarriers } = await supabase
    .from("carriers")
    .select("*", { count: "exact", head: true });

  const totalRevenue = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
  const totalProfit = sales?.reduce((sum, s) => sum + (s.total_profit || 0), 0) || 0;
  const avgRPM = totalRevenue > 0 ? totalRevenue / Math.max(totalLoads || 1, 1) : 0;

  return { totalLoads: totalLoads || 0, totalRevenue, totalProfit, avgRPM, totalCarriers };
}

export default async function DashboardPage(props: { searchParams: Promise<{ denied?: string }> }) {
  const kpis = await getKPIs();
  const searchParams = await props.searchParams;
  const isDenied = searchParams.denied === "1";

  return (
    <div className="p-8">
      {isDenied && (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Acceso Denegado: No tienes permisos para acceder a ese módulo.
          </AlertDescription>
        </Alert>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Resumen general del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cargas</CardTitle>
            <Package className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalLoads}</div>
            <CardDescription>Cargas registradas</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${kpis.totalRevenue.toLocaleString()}
            </div>
            <CardDescription>Ingresos totales</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${kpis.totalProfit.toLocaleString()}
            </div>
            <CardDescription>Profit acumulado</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carriers</CardTitle>
            <Truck className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCarriers}</div>
            <CardDescription>Carriers activos</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
