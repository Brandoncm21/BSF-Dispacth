"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LoadForm, type LoadFormHandle } from "@/components/load-form";
import { toDatetimeLocal } from "@/lib/format";
import { LOAD_STATUS, PAID_STATUS } from "@/lib/constants";
import type { Load, LoadForm as LoadFormType, SelectOption, LoadFormSubmitData } from "@/types/load";

type LoadFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLoad: Load | null;
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

export function LoadFormDialog({
  open,
  onOpenChange,
  editingLoad,
  onSubmit,
  isLoading,
  carriers,
  trucks,
  drivers,
  cargoTypes,
  requirements,
  onCreateCargoType,
  onCreateSpecialRequirement,
}: LoadFormDialogProps) {
  const formRef = useRef<LoadFormHandle>(null);

  const initialValues: LoadFormType | undefined = editingLoad
    ? {
        load_data: editingLoad.load_data || "",
        weight_lbs: editingLoad.weight_lbs?.toString() || "",
        carrier_id: editingLoad.carrier_id?.toString() || "",
        truck_id: editingLoad.truck_id?.toString() || "",
        driver_id: editingLoad.driver_id?.toString() || "",
        route_id: editingLoad.route_id?.toString() || "",
        cargo_type_id: editingLoad.cargo_type_id?.toString() || "",
        special_requirements_id: editingLoad.special_requirements_id?.toString() || "",
        rate: editingLoad.rate?.toString() || "",
        dispatch_fee_pct: editingLoad.dispatch_fee_pct?.toString() || "",
        factoring: editingLoad.factoring || false,
        load_status: editingLoad.load_status || LOAD_STATUS.PENDING,
        paid_status: editingLoad.paid_status || PAID_STATUS.UNPAID,
        status_id: 1,
        picked_up_at: toDatetimeLocal(editingLoad.picked_up_at),
        delivered_at: toDatetimeLocal(editingLoad.delivered_at),
        confirmed_digital: false,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLoad ? "Editar Carga" : "Nueva Carga"}</DialogTitle>
          <DialogDescription>
            {editingLoad ? "Modifica los datos de la carga" : "Completa los datos para registrar una nueva carga"}
          </DialogDescription>
        </DialogHeader>

        <LoadForm
          ref={formRef}
          initialValues={initialValues}
          onSubmit={onSubmit}
          isLoading={isLoading}
          carriers={carriers}
          trucks={trucks}
          drivers={drivers}
          cargoTypes={cargoTypes}
          requirements={requirements}
          onCreateCargoType={onCreateCargoType}
          onCreateSpecialRequirement={onCreateSpecialRequirement}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => formRef.current?.submit()} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
