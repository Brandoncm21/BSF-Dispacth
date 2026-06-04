import { searchDrivers, getActiveCarriers } from "@/lib/actions";
import { DriversTableClient } from "./components/drivers-table-client";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page: pg } = await searchParams;
  const searchQuery = search || "";
  const currentPage = Number(pg) || 1;
  const perPage = 16;

  const [{ data: initialDrivers, count: initialTotal }, initialCarriers] = await Promise.all([
    searchDrivers(searchQuery, currentPage, perPage),
    getActiveCarriers(),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Drivers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los drivers del sistema
          </p>
        </div>
      </div>

      <DriversTableClient
        initialDrivers={initialDrivers}
        initialTotal={initialTotal}
        initialCarriers={initialCarriers}
        initialSearch={searchQuery}
        initialPage={currentPage}
      />
    </div>
  );
}
