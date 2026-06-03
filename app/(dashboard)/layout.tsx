import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[16rem_1fr] grid-rows-[auto_1fr] h-screen">
      <div className="col-start-1 col-end-2 row-start-1 row-end-3 min-h-0">
        <Sidebar />
      </div>
      <div className="col-start-2 col-end-3 row-start-1 row-end-2 min-h-0">
        <Header />
      </div>
      <main className="col-start-2 col-end-3 row-start-2 row-end-3 overflow-y-auto min-h-0">
        {children}
      </main>
    </div>
  );
}
