"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { searchLoads as searchLoadsAction, updateLoadStatus, deleteLoad as deleteLoadAction, createCargoType, createSpecialRequirement } from "@/lib/actions";
import { parseSupabaseError, AppError } from "@/lib/errors";
import type { Load, SelectOption } from "@/types/load";

const supabase = createSupabaseBrowserClient();

const PAGE_SIZE = 16;

export function useLoads() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [carriers, setCarriers] = useState<SelectOption[]>([]);
  const [trucks, setTrucks] = useState<SelectOption[]>([]);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [cargoTypes, setCargoTypes] = useState<SelectOption[]>([]);
  const [requirements, setRequirements] = useState<SelectOption[]>([]);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchLoadsAction(search, statusFilter, page, PAGE_SIZE);
      setLoads(result.data as Load[]);
      setTotalItems(result.count);
    } catch (e) {
      setError(parseSupabaseError(e instanceof Error ? e : { message: "Error al cargar loads" }));
      setLoads([]);
      setTotalItems(0);
    }
    setLoading(false);
  }, [search, statusFilter, page]);

  const fetchSelectOptions = useCallback(async () => {
    const [carriersRes, trucksRes, driversRes, cargoRes, reqRes] = await Promise.all([
      supabase.from("carriers").select("carrier_id, company_name").eq("status_id", 1),
      supabase.from("trucks").select("truck_id, unit_number, carrier_id").eq("status_id", 1),
      supabase.from("drivers").select("driver_id, first_name, last_name, carrier_id").eq("status_id", 1),
      supabase.from("cargo_types").select("cargo_type_id, cargo_type_name").eq("status_id", 1),
      supabase.from("special_requirements").select("special_requirements_id, requirement_description").eq("status_id", 1),
    ]);

    if (carriersRes.data) setCarriers(carriersRes.data.map((c) => ({ id: c.carrier_id, label: c.company_name })));
    if (trucksRes.data) {
      const allTrucks = trucksRes.data.map((t) => ({ id: t.truck_id, label: t.unit_number }));
      setTrucks(allTrucks);
    }
    if (driversRes.data) {
      const allDrivers = driversRes.data.map((d) => ({ id: d.driver_id, label: `${d.first_name} ${d.last_name}` }));
      setDrivers(allDrivers);
    }
    if (cargoRes.data) setCargoTypes(cargoRes.data.map((c) => ({ id: c.cargo_type_id, label: c.cargo_type_name })));
    if (reqRes.data) setRequirements(reqRes.data.map((r) => ({ id: r.special_requirements_id, label: r.requirement_description })));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchLoads();
    fetchSelectOptions();
  }, [fetchLoads, fetchSelectOptions]);

  const updateStatus = useCallback(async (loadId: number, newStatus: string) => {
    const result = await updateLoadStatus(loadId, newStatus);
    if (result.error) setError(parseSupabaseError({ message: result.error }));
    else fetchLoads();
  }, [fetchLoads]);

  const handleDelete = useCallback(async (loadId: number) => {
    if (!confirm("¿Eliminar esta carga?")) return;
    const result = await deleteLoadAction(loadId);
    if (result.error) setError(parseSupabaseError({ message: result.error }));
    else fetchLoads();
  }, [fetchLoads]);

  const handleCreateCargoType = useCallback(async (name: string): Promise<number> => {
    const result = await createCargoType(name);
    const newOption = { id: result, label: name };
    setCargoTypes((prev) => [...prev, newOption]);
    return result;
  }, []);

  const handleCreateSpecialRequirement = useCallback(async (name: string): Promise<number> => {
    const result = await createSpecialRequirement(name);
    const newOption = { id: result, label: name };
    setRequirements((prev) => [...prev, newOption]);
    return result;
  }, []);

  return {
    loads,
    loading,
    error,
    page,
    search,
    statusFilter,
    totalItems,
    carriers,
    trucks,
    drivers,
    cargoTypes,
    requirements,
    setSearch,
    setStatusFilter,
    setPage,
    setError,
    fetchLoads,
    updateStatus,
    handleDelete,
    handleCreateCargoType,
    handleCreateSpecialRequirement,
  };
}
