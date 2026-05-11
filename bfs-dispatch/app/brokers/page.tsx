"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrokerFormSheet } from "@/components/broker-form-sheet";
import { getBrokers, Broker } from "@/lib/actions";

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  useEffect(() => {
    fetchBrokers();
  }, []);

  async function fetchBrokers() {
    try {
      const data = await getBrokers();
      setBrokers(data);
    } catch (e) {
      console.error("Error fetching brokers:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingBroker(null);
    setSheetOpen(true);
  }

  function handleEdit(broker: Broker) {
    setEditingBroker(broker);
    setSheetOpen(true);
  }

  function handleSuccess() {
    fetchBrokers();
  }

  const filteredBrokers = brokers.filter(
    (b) =>
      b.first_name.toLowerCase().includes(search.toLowerCase()) ||
      b.last_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.email && b.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Brokers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los brokers del sistema
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Broker
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Phone
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {filteredBrokers.map((broker) => (
              <tr
                key={broker.broker_id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {broker.first_name} {broker.last_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {broker.email || <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {broker.phone_number || <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(broker)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBrokers.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            No hay brokers registrados
          </div>
        )}
      </div>

      <BrokerFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        broker={editingBroker}
        onSuccess={handleSuccess}
      />
    </div>
  );
}