import { searchBrokers as searchBrokersAction } from "@/lib/actions";
import { BrokersTableClient } from "./components/brokers-table-client";

export default async function BrokersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { search, status, page: pg } = await searchParams;
  const searchQuery = search || "";
  const statusFilter = status || "all";
  const currentPage = Number(pg) || 1;
  const PAGE_SIZE = 16;

  const { data: initialBrokers, count: initialTotal } = await searchBrokersAction(
    searchQuery,
    statusFilter,
    currentPage,
    PAGE_SIZE
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Brokers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los brokers del sistema
          </p>
        </div>
      </div>

      <BrokersTableClient
        initialBrokers={initialBrokers}
        initialTotal={initialTotal}
        initialSearch={searchQuery}
        initialStatusFilter={statusFilter}
        initialPage={currentPage}
      />
    </div>
  );
}
