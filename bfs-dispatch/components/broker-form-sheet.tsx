"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Broker, createBroker, updateBroker } from "@/lib/actions";

interface BrokerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broker?: Broker | null;
  onSuccess: () => void;
}

export function BrokerFormSheet({ open, onOpenChange, broker, onSuccess }: BrokerFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    mc_number: "",
    usdot_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!broker;

  useEffect(() => {
    if (broker) {
      setForm({
        first_name: broker.first_name || "",
        last_name: broker.last_name || "",
        email: broker.email || "",
        phone_number: broker.phone_number || "",
        mc_number: broker.mc_number || "",
        usdot_number: broker.usdot_number || "",
      });
    } else {
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        mc_number: "",
        usdot_number: "",
      });
    }
    setErrors({});
  }, [broker, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!form.first_name.trim()) {
      setErrors({ first_name: "First name es requerido" });
      return;
    }
    if (!form.last_name.trim()) {
      setErrors({ last_name: "Last name es requerido" });
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateBroker(broker!.broker_id, {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || undefined,
          phone_number: form.phone_number || undefined,
          mc_number: form.mc_number || undefined,
          usdot_number: form.usdot_number || undefined,
        });
      } else {
        await createBroker({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || undefined,
          phone_number: form.phone_number || undefined,
          mc_number: form.mc_number || undefined,
          usdot_number: form.usdot_number || undefined,
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Error saving broker:", err);
      setErrors({ general: "Error al guardar el broker" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Broker" : "Agregar Broker"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos del broker"
              : "Complete los datos para registrar un nuevo broker"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {errors.general && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="ej: John"
              className={cn(errors.first_name && "border-red-500")}
            />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="ej: Doe"
              className={cn(errors.last_name && "border-red-500")}
            />
            {errors.last_name && (
              <p className="text-xs text-red-500">{errors.last_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ej: john.doe@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="ej: +1 555-123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mc_number">MC Number</Label>
            <Input
              id="mc_number"
              value={form.mc_number}
              onChange={(e) => setForm({ ...form, mc_number: e.target.value })}
              placeholder="ej: MC-123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usdot_number">USDOT Number</Label>
            <Input
              id="usdot_number"
              value={form.usdot_number}
              onChange={(e) => setForm({ ...form, usdot_number: e.target.value })}
              placeholder="ej: 1234567"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}