"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BrokerContactForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { contact_name: string; email: string; phone: string }) => void;
  onCancel: () => void;
}) {
  const [contact_name, setContact_name] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact_name.trim()) return;
    onSubmit({ contact_name, email, phone });
    setContact_name("");
    setEmail("");
    setPhone("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Nombre *</label>
          <Input value={contact_name} onChange={(e) => setContact_name(e.target.value)} placeholder="Nombre del contacto" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Teléfono</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-123-4567" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm">Guardar</Button>
      </div>
    </form>
  );
}
