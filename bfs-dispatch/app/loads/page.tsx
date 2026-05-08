import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function LoadsPage() {
  const { data: loads, error } = await supabase
    .from("loads")
    .select(`
      load_id,
      load_data,
      load_weight,
      carriers (first_name, last_name),
      trucks (unit_number),
      drivers (first_name, last_name),
      routes (estimated_time, miles),
      cargo_types (cargo_type_name),
      record_status:status_id (status_name)
    `);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error.message}</p>
          <Link href="/" className="text-blue-500 underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Loads
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
        {!loads || loads.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">No hay loads registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Carga</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Peso</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Carrier</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Truck</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Driver</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Ruta</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loads.map((load) => (
                  <tr key={load.load_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50 font-mono">
                      {load.load_id}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.load_data || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.load_weight ? `${load.load_weight} kg` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.carriers
                        ? `${load.carriers.first_name} ${load.carriers.last_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.trucks?.unit_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.drivers
                        ? `${load.drivers.first_name} ${load.drivers.last_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.cargo_types?.cargo_type_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      {load.routes
                        ? `${load.routes.estimated_time} (${load.routes.miles} mi)`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          load.record_status?.status_name === "Activo"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : load.record_status?.status_name === "Pendiente"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {load.record_status?.status_name || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
