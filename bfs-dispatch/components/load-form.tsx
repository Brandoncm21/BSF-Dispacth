"use client";

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { RouteSelector } from "@/components/route-selector";
import { CreatableSelect } from "@/components/creatable-select";
import { TruckSelector } from "@/components/truck-selector";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getDriversByCarrier } from "@/lib/actions";
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
    rate: "",
    dispatch_fee_pct: "",
    factoring: false,
    load_status: LOAD_STATUS.PENDING,
    paid_status: PAID_STATUS.UNPAID,
    status_id: 1,
    picked_up_at: "",
    delivered_at: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filteredDrivers, setFilteredDrivers] = useState<SelectOption[]>(drivers);
  const [dispatchFeePercent, setDispatchFeePercent] = useState<string>("");

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

      <div className="space-y-2">
        <Label htmlFor="picked_up_at">Fecha/Hora Recogida</Label>
        <Input
          id="picked_up_at"
          type="datetime-local"
          value={form.picked_up_at}
          onChange={(e) => setForm({ ...form, picked_up_at: e.target.value })}
        />
        {formErrors.picked_up_at && <p className="text-xs text-red-500">{formErrors.picked_up_at}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivered_at">Fecha/Hora Entrega</Label>
        <Input
          id="delivered_at"
          type="datetime-local"
          value={form.delivered_at}
          onChange={(e) => setForm({ ...form, delivered_at: e.target.value })}
        />
        {formErrors.delivered_at && <p className="text-xs text-red-500">{formErrors.delivered_at}</p>}
      </div>

      <div className="col-span-2 -mt-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Zona horaria: Costa Rica (UTC-6)</p>
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
        <Label htmlFor="rate">Rate ($) *</Label>
        <Input
          id="rate"
          type="number"
          min="0"
          step="0.01"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          placeholder="0.00"
        />
        {formErrors.rate && <p className="text-xs text-red-500">{formErrors.rate}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dispatch_fee_pct">Dispatch Fee (%)</Label>
        <Input
          id="dispatch_fee_pct"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={form.dispatch_fee_pct}
          onChange={(e) => setForm({ ...form, dispatch_fee_pct: e.target.value })}
          placeholder="3-8%"
        />
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
        </select>
      </div>

      <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
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
