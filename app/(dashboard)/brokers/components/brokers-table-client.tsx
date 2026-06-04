"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit2, Search, X, Trash2, Mail, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrokerFormSheet } from "@/components/broker-form-sheet";
import {
  searchBrokers as searchBrokersAction,
  Broker,
  getBrokerContacts,
  createBrokerContact,
  deleteBrokerContact,
  setPrimaryContact,
} from "@/lib/actions";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { BrokerContactForm } from "./broker-contact-form";

type Props = {
  initialBrokers: Broker[];
  initialTotal: number;
  initialSearch: string;
  initialStatusFilter: string;
  initialPage: number;
};

export function BrokersTableClient({
  initialBrokers,
  initialTotal,
  initialSearch,
  initialStatusFilter,
  initialPage,
}: Props) {
  const PAGE_SIZE = 16;
  const [brokers, setBrokers] = useState<Broker[]>(initialBrokers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);

  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [contacts, setContacts] = useState<Awaited<ReturnType<typeof getBrokerContacts>>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const isFirstRender = useRef(true);

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchBrokersAction(search, statusFilter, page, PAGE_SIZE);
      setBrokers(result.data);
      setTotal(result.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar brokers");
      setBrokers([]);
      setTotal(0);
    }
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchBrokers();
  }, [fetchBrokers]);

  async function handleViewBroker(broker: Broker) {
    setSelectedBroker(broker);
    setLoadingContacts(true);
    try {
      const data = await getBrokerContacts(broker.broker_id);
      setContacts(data);
    } catch (e) {
      console.error("Error fetching contacts:", e);
      setContacts([]);
    }
    setLoadingContacts(false);
    setShowAddContact(false);
  }

  async function handleAddContact(brokerId: number, contact: { contact_name: string; email: string; phone: string }) {
    try {
      await createBrokerContact({ broker_id: brokerId, ...contact, is_primary: contacts.length === 0 });
      const updated = await getBrokerContacts(brokerId);
      setContacts(updated);
      setShowAddContact(false);
    } catch (e) {
      console.error("Error adding contact:", e);
    }
  }

  async function handleDeleteContact(contactId: number) {
    if (!selectedBroker) return;
    if (!confirm("¿Eliminar este contacto?")) return;
    try {
      await deleteBrokerContact(contactId);
      const updated = await getBrokerContacts(selectedBroker.broker_id);
      setContacts(updated);
    } catch (e) {
      console.error("Error deleting contact:", e);
    }
  }

  async function handleSetPrimary(contactId: number) {
    if (!selectedBroker) return;
    try {
      await setPrimaryContact(contactId, selectedBroker.broker_id);
      const updated = await getBrokerContacts(selectedBroker.broker_id);
      setContacts(updated);
    } catch (e) {
      console.error("Error setting primary:", e);
    }
  }

  function handleAdd() {
    setSelectedBroker(null);
    setEditingBroker(null);
    setSheetOpen(true);
  }

  function handleEdit(broker: Broker) {
    setEditingBroker(broker);
    setSheetOpen(true);
  }

  function handleSuccess() {
    fetchBrokers();
    if (selectedBroker) {
      const updated = brokers.find(b => b.broker_id === selectedBroker.broker_id);
      if (updated) setSelectedBroker(updated);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Broker
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="1">Activo</option>
          <option value="2">Inactivo</option>
          <option value="3">Pendiente</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={16} columns={4} />
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">MC# / USDOT</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {brokers.map((broker) => (
                  <tr key={broker.broker_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => handleViewBroker(broker)}>
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
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {broker.mc_number || <span className="text-zinc-400">—</span>} / {broker.usdot_number || <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(broker)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {brokers.length === 0 && (
              <div className="py-12 text-center text-zinc-500">No hay brokers registrados</div>
            )}
          </div>
          <PaginationControls currentPage={page} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      {selectedBroker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setSelectedBroker(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedBroker.first_name} {selectedBroker.last_name}
                </h2>
                <p className="text-sm text-zinc-500">
                  {selectedBroker.mc_number && `MC: ${selectedBroker.mc_number}`}
                  {selectedBroker.mc_number && selectedBroker.usdot_number && " | "}
                  {selectedBroker.usdot_number && `USDOT: ${selectedBroker.usdot_number}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBroker(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Tabs defaultValue="contacts" className="p-6">
              <TabsList>
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="contacts">Contactos ({contacts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">Email</p>
                    <p className="text-sm">{selectedBroker.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">Teléfono</p>
                    <p className="text-sm">{selectedBroker.phone_number || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">MC Number</p>
                    <p className="text-sm font-mono">{selectedBroker.mc_number || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">USDOT Number</p>
                    <p className="text-sm font-mono">{selectedBroker.usdot_number || "—"}</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedBroker(null); handleEdit(selectedBroker); }}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar Broker
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="mt-4">
                {loadingContacts ? (
                  <div className="text-center py-8 text-zinc-500">Cargando contactos...</div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">No hay contactos registrados</div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.contact_id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <span className="text-sm font-medium">{contact.contact_name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{contact.contact_name}</p>
                              {contact.is_primary && <Badge variant="secondary" className="text-xs"><Star className="h-3 w-3 mr-1" />Principal</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                              {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!contact.is_primary && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(contact.contact_id)} title="Marcar como principal">
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteContact(contact.contact_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddContact ? (
                  <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                    <BrokerContactForm
                      onSubmit={(data) => selectedBroker && handleAddContact(selectedBroker.broker_id, data)}
                      onCancel={() => setShowAddContact(false)}
                    />
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddContact(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Contacto
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      <BrokerFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        broker={editingBroker}
        onSuccess={handleSuccess}
      />
    </>
  );
}
