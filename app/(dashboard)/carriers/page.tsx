import { searchCarriers } from "@/lib/actions";
import { CarriersTableClient } from "./components/carriers-table-client";

export default async function CarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { search, status, page: pg } = await searchParams;
  const searchQuery = search || "";
  const statusFilter = status || "all";
  const currentPage = Number(pg) || 1;
  const perPage = 16;

  const { data: initialCarriers, count: initialTotal } = await searchCarriers(
    searchQuery,
    statusFilter,
    currentPage,
    perPage
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Carriers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los carriers del sistema
          </p>
        </div>
      </div>

      <CarriersTableClient
        initialCarriers={initialCarriers}
        initialTotal={initialTotal}
        initialSearch={searchQuery}
        initialStatusFilter={statusFilter}
        initialPage={currentPage}
      />
    </div>
  );
}
