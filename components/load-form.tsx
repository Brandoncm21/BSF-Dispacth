"use client";

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { RouteSelector } from "@/components/route-selector";
import { CreatableSelect } from "@/components/creatable-select";
import { TruckSelector } from "@/components/truck-selector";
import { SearchableSelect } from "@/components/searchable-select";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getDriversByCarrier, getRoutesWithDetails, searchActiveBrokers } from "@/lib/actions";
import { LOAD_STATUS, LOAD_STATUS_LABELS, PAID_STATUS } from "@/lib/constants";
import { loadSchema, LoadForm as LoadFormType, SelectOption, LoadFormSubmitData, MAX_FILE_SIZE } from "@/types/load";

const supabase = createSupabaseBrowserClient();

type LoadFormProps = {
  initialValues?: LoadFormType;
  onSubmit: (data: LoadFormSubmitData) => Promise<void>;
  isLoading: boolean;
  carriers: SelectOption[];
  trucks: SelectOption[];
  drivers: SelectOption[];
  cargoTypes: SelectOption[];
  requirements: SelectOption[];
  onCreateCargoType: (name: string) => Promise<number>;
  onCreateSpecialRequirement: (name: string) => Promise<number>;
};

export type LoadFormHandle = {
  submit: () => Promise<void>;
};

export const LoadForm = forwardRef<LoadFormHandle, LoadFormProps>(function LoadForm({
  initialValues,
  onSubmit,
  isLoading: _isLoading,
  carriers,
  trucks: _trucks,
  drivers,
  cargoTypes,
  requirements,
  onCreateCargoType,
  onCreateSpecialRequirement,
}: LoadFormProps, ref: Ref<LoadFormHandle>) {
  const [form, setForm] = useState<LoadFormType>(initialValues ?? {
    load_data: "",
    weight_lbs: "",
    carrier_id: "",
    truck_id: "",
    driver_id: "",
    route_id: "",
    cargo_type_id: "",
    special_requirements_id: "",
    broker_id: "",
    rate: "",
    dispatch_fee_pct: "",
    factoring: false,
    load_status: LOAD_STATUS.PENDING,
    paid_status: PAID_STATUS.UNPAID,
    status_id: 1,
    picked_up_at: "",
    delivered_at: "",
    confirmed_digital: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filteredDrivers, setFilteredDrivers] = useState<SelectOption[]>(drivers);
  const [dispatchFeePercent, setDispatchFeePercent] = useState<string>("");
  const [fuelType, setFuelType] = useState<string | null>(null);
  const [fuelCostPerMile, setFuelCostPerMile] = useState<number | null>(null);
  const [routeMiles, setRouteMiles] = useState<number | null>(null);

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    }
  }, [initialValues]);

  const computedDispatchFee = form.rate && dispatchFeePercent
    ? (parseFloat(form.rate) * parseFloat(dispatchFeePercent)) / 100
    : 0;

  const fetchFilteredOptions = useCallback(async (carrierId: number) => {
    if (!carrierId) {
      setFilteredDrivers(drivers);
      setDispatchFeePercent("");
      return;
    }
    try {
      const [driverData, carrierData] = await Promise.all([
        getDriversByCarrier(carrierId),
        supabase.from("carriers").select("dispatch_fee_percent").eq("carrier_id", carrierId).single(),
      ]);
      setFilteredDrivers(driverData.map((d: { driver_id: number; first_name: string; last_name: string }) => ({
        id: d.driver_id,
        label: `${d.first_name} ${d.last_name}`,
      })));
      if (carrierData.data && carrierData.data.dispatch_fee_percent !== null) {
        const feePct = String(carrierData.data.dispatch_fee_percent);
        setDispatchFeePercent(feePct);
        if (!initialValues?.dispatch_fee_pct) {
          setForm((prev) => ({ ...prev, dispatch_fee_pct: feePct }));
        }
      }
    } catch (e) {
      console.error("Error fetching filtered options:", e);
      setFilteredDrivers(drivers);
    }
  }, [drivers, initialValues]);

  const handleCarrierChange = (carrierId: string) => {
    setForm((prev) => ({ ...prev, carrier_id: carrierId, driver_id: "", truck_id: "" }));
    setDispatchFeePercent("");
    if (carrierId) {
      fetchFilteredOptions(parseInt(carrierId));
    } else {
      setFilteredDrivers(drivers);
    }
  };

  // Fetch fuel info when truck changes
  useEffect(() => {
    if (!form.truck_id) {
      setFuelType(null);
      setFuelCostPerMile(null);
      return;
    }
    supabase
      .from("trucks")
      .select("fuel_type, fuel_cost_per_mile")
      .eq("truck_id", parseInt(form.truck_id))
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFuelType(data.fuel_type);
          setFuelCostPerMile(data.fuel_cost_per_mile);
        }
      });
  }, [form.truck_id]);

  // Fetch route miles when route changes
  useEffect(() => {
    if (!form.route_id) {
      setRouteMiles(null);
      return;
    }
    getRoutesWithDetails()
      .then((routes) => {
        const route = routes.find((r) => r.route_id === parseInt(form.route_id));
        if (route) setRouteMiles(route.miles);
      })
      .catch(() => {});
  }, [form.route_id]);

  const estimatedFuelCost = routeMiles && fuelCostPerMile
    ? Math.round(routeMiles * fuelCostPerMile * 100) / 100
    : null;

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }));

  async function handleSubmit() {
    setFormErrors({});
    setUploadError(null);

    const result = loadSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        errors[key] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    if (rcFile && rcFile.size > MAX_FILE_SIZE) {
      setUploadError("RC debe ser menor a 5MB");
      return;
    }

    if (bolFile && bolFile.size > MAX_FILE_SIZE) {
      setUploadError("BOL debe ser menor a 5MB");
      return;
    }

    onSubmit({ formData: result.data, rcFile, bolFile });
  }

  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="carrier_id">Carrier *</Label>
        <select
          id="carrier_id"
          value={form.carrier_id}
          onChange={(e) => handleCarrierChange(e.target.value)}
          className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Seleccionar</option>
          {carriers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {formErrors.carrier_id && <p className="text-xs text-red-500">{formErrors.carrier_id}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="driver_id">Driver *</Label>
        <select
          id="driver_id"
          value={form.driver_id}
          onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
          className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Seleccionar</option>
          {filteredDrivers.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        {formErrors.driver_id && <p className="text-xs text-red-500">{formErrors.driver_id}</p>}
      </div>

      <div className="space-y-2">
        <SearchableSelect
          value={form.broker_id ? parseInt(form.broker_id) : null}
          onChange={(id) => setForm({ ...form, broker_id: id?.toString() || "" })}
          onSearch={async (query) => {
            const results = await searchActiveBrokers(query);
            return results.map((b) => ({
              id: b.broker_id,
              label: `${b.first_name} ${b.last_name}`,
              meta: b.mc_number || "",
            }));
          }}
          label="Broker"
          placeholder="Buscar broker por nombre o MC#..."
          error={formErrors.broker_id}
        />
      </div>

      <div className="space-y-2">
        <TruckSelector
          value={form.truck_id ? parseInt(form.truck_id) : null}
          onChange={(id) => setForm({ ...form, truck_id: id?.toString() || "" })}
          carrierId={form.carrier_id ? parseInt(form.carrier_id) : null}
          label="Truck *"
          error={formErrors.truck_id}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <RouteSelector
          value={form.route_id ? parseInt(form.route_id) : null}
          onChange={(id) => setForm({ ...form, route_id: id?.toString() || "" })}
          label="Ruta *"
          error={formErrors.route_id}
        />
      </div>

      {routeMiles && fuelCostPerMile && (
        <div className="col-span-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">⛽ Costo Estimado de Combustible</p>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-amber-600 dark:text-amber-300">Millas</span>
              <p className="font-semibold text-amber-900 dark:text-amber-100">{routeMiles} mi</p>
            </div>
            <div>
              <span className="text-amber-600 dark:text-amber-300">Tipo</span>
              <p className="font-semibold text-amber-900 dark:text-amber-100 capitalize">{fuelType || "—"}</p>
            </div>
            <div>
              <span className="text-amber-600 dark:text-amber-300">$/mi</span>
              <p className="font-semibold text-amber-900 dark:text-amber-100">${fuelCostPerMile.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-amber-600 dark:text-amber-300">Total Est.</span>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                ${estimatedFuelCost!.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {routeMiles && form.rate && parseFloat(form.rate) > 0 && (
        <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">💰 Rate por Milla</p>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-blue-600 dark:text-blue-300">Rate</span>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                ${parseFloat(form.rate).toLocaleString("es-CR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-blue-400">÷</div>
            <div>
              <span className="text-blue-600 dark:text-blue-300">Millas</span>
              <p className="font-semibold text-blue-900 dark:text-blue-100">{routeMiles} mi</p>
            </div>
            <div className="text-blue-400">=</div>
            <div>
              <span className="text-blue-600 dark:text-blue-300">Rate/milla</span>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                ${(parseFloat(form.rate) / routeMiles).toFixed(2)}/mi
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="col-span-2 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="picked_up_at" className="text-xs">Pickup</Label>
          <Input
            id="picked_up_at"
            type="datetime-local"
            value={form.picked_up_at}
            onChange={(e) => setForm({ ...form, picked_up_at: e.target.value })}
            className="text-sm py-1.5"
          />
          {formErrors.picked_up_at && <p className="text-xs text-red-500">{formErrors.picked_up_at}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="delivered_at" className="text-xs">Delivery</Label>
          <Input
            id="delivered_at"
            type="datetime-local"
            value={form.delivered_at}
            onChange={(e) => setForm({ ...form, delivered_at: e.target.value })}
            className="text-sm py-1.5"
          />
          {formErrors.delivered_at && <p className="text-xs text-red-500">{formErrors.delivered_at}</p>}
        </div>
      </div>

      <CreatableSelect
        options={cargoTypes}
        value={form.cargo_type_id ? parseInt(form.cargo_type_id) : null}
        onChange={(id) => setForm({ ...form, cargo_type_id: id?.toString() || "" })}
        onCreateNew={onCreateCargoType}
        label="Tipo de Carga"
        placeholder="Seleccionar tipo..."
      />

      <CreatableSelect
        options={requirements}
        value={form.special_requirements_id ? parseInt(form.special_requirements_id) : null}
        onChange={(id) => setForm({ ...form, special_requirements_id: id?.toString() || "" })}
        onCreateNew={onCreateSpecialRequirement}
        label="Requisito Especial"
        placeholder="Seleccionar requisito..."
      />

      <div className="space-y-2">
        <Label htmlFor="rate">Rate ($)</Label>
        <Input
          id="rate"
          type="number"
          min="0"
          step="0.01"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label>Dispatch Fee (%)</Label>
        <div className="flex items-center h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {dispatchFeePercent ? `${(parseFloat(dispatchFeePercent) * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>

      {computedDispatchFee > 0 && (
        <div className="space-y-2">
          <Label>Dispatch Fee</Label>
          <div className="flex items-center h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              ${computedDispatchFee.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="weight_lbs">Peso (lbs)</Label>
        <Input
          id="weight_lbs"
          type="number"
          value={form.weight_lbs}
          onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="load_data">Descripción</Label>
        <Input
          id="load_data"
          value={form.load_data}
          onChange={(e) => setForm({ ...form, load_data: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="factoring"
          checked={form.factoring}
          onChange={(e) => setForm({ ...form, factoring: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="factoring">Usa Factoring</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="load_status">Status</Label>
        <select
          id="load_status"
          value={form.load_status}
          onChange={(e) => setForm({ ...form, load_status: e.target.value })}
          className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
        >
          <option value={LOAD_STATUS.PENDING}>{LOAD_STATUS_LABELS[LOAD_STATUS.PENDING]}</option>
          <option value={LOAD_STATUS.BOOKED}>{LOAD_STATUS_LABELS[LOAD_STATUS.BOOKED]}</option>
          <option value={LOAD_STATUS.PICKED_UP}>{LOAD_STATUS_LABELS[LOAD_STATUS.PICKED_UP]}</option>
          <option value={LOAD_STATUS.DELIVERED}>{LOAD_STATUS_LABELS[LOAD_STATUS.DELIVERED]}</option>
                    <option value={LOAD_STATUS.PAID}>{LOAD_STATUS_LABELS[LOAD_STATUS.PAID]}</option>
          <option value={LOAD_STATUS.CANCELLED}>{LOAD_STATUS_LABELS[LOAD_STATUS.CANCELLED]}</option>
          <option value={LOAD_STATUS.DELAYED}>{LOAD_STATUS_LABELS[LOAD_STATUS.DELAYED]}</option>
        </select>
      </div>

      <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
        <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-md">
          <input
            type="checkbox"
            id="confirmed_digital"
            checked={form.confirmed_digital}
            onChange={(e) => setForm({ ...form, confirmed_digital: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <Label htmlFor="confirmed_digital" className="text-sm leading-relaxed cursor-pointer">
            Confirmo digitalmente que los datos de esta carga son correctos y acepto
            el registro bajo mi usuario de operaciones.
          </Label>
        </div>
        {formErrors.confirmed_digital && (
          <p className="text-xs text-red-500 mt-1 ml-1">{formErrors.confirmed_digital}</p>
        )}
      </div>

      <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
        <Label className="text-sm font-medium mb-2 block">Documentos (PDF, máx 5MB)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rc_file" className="text-xs text-zinc-500">Rate Confirmation (RC)</Label>
            <div className="relative">
              <input
                id="rc_file"
                type="file"
                accept=".pdf"
                onChange={(e) => setRcFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="rc_file"
                className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
              >
                <Upload className="h-4 w-4" />
                {rcFile ? rcFile.name : "Seleccionar PDF"}
              </label>
            </div>
            {rcFile && <p className="text-xs text-zinc-500">{ (rcFile.size / 1024 / 1024).toFixed(2) } MB</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bol_file" className="text-xs text-zinc-500">Bill of Lading (BOL)</Label>
            <div className="relative">
              <input
                id="bol_file"
                type="file"
                accept=".pdf"
                onChange={(e) => setBolFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="bol_file"
                className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
              >
                <Upload className="h-4 w-4" />
                {bolFile ? bolFile.name : "Seleccionar PDF"}
              </label>
            </div>
            {bolFile && <p className="text-xs text-zinc-500">{ (bolFile.size / 1024 / 1024).toFixed(2) } MB</p>}
          </div>
        </div>
        {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
      </div>
    </div>
  );
});

