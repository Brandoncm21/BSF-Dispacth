"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Lightbulb, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type CardConfig = {
  id: string;
  icon: React.ReactNode;
  title: string;
  role: string;
  content: string;
};

const cards: CardConfig[] = [
  {
    id: "dispatcher-states",
    icon: <User className="h-4 w-4 text-emerald-500" />,
    title: "Guía del Despachador — Mapa de Calor por Estados",
    role: "Despachador",
    content:
      "Los estados con mayor margen de ganancia (barras verdes altas) indican rutas más lucrativas. " +
      "Prioriza la asignación de cargas salientes hacia estos destinos para maximizar rentabilidad. " +
      "Los estados con alto volumen de cargas (barras azules altas) pero margen bajo (barras verdes bajas) " +
      "sugieren rutas saturadas donde podrías negociar mejores tarifas con el broker o reducir costos " +
      "operativos (combustible, peajes) para mejorar el margen. Revisa el detalle por camión para " +
      "identificar qué unidades están generando más ganancia en cada ruta.",
  },
  {
    id: "admin-carriers",
    icon: <Shield className="h-4 w-4 text-blue-500" />,
    title: "Guía del Administrador — Rendimiento por Carrier",
    role: "Administrador",
    content:
      "Los carriers en el top del ranking generan los márgenes más altos de ganancia. " +
      "Considera renovar contratos preferenciales o aumentar la asignación de cargas a estos aliados estratégicos. " +
      "Los carriers con ganancia negativa o baja representan una oportunidad de mejora: " +
      "negocia tarifas más competitivas, evalúa sus costos operativos o considera reemplazarlos " +
      "si el margen no mejora en los próximos períodos. El volumen de cargas solo no indica rentabilidad; " +
      "compara siempre la ganancia neta para tomar decisiones informadas.",
  },
  {
    id: "admin-trucks",
    icon: <Shield className="h-4 w-4 text-purple-500" />,
    title: "Guía del Administrador — Rentabilidad por Camión",
    role: "Administrador",
    content:
      "Los camiones más rentables no siempre son los que más cargas transportan. " +
      "Compara el margen de ganancia (barra verde) versus el volumen de cargas para identificar " +
      "activos eficientes. Un camión con pocas cargas pero alto margen puede estar operando " +
      "en rutas premium. Reasigna estratégicamente las cargas de alto valor a los camiones " +
      "con historial de mejor margen. Esto optimiza la flotilla y maximiza el retorno por unidad. " +
      "Usa esta información para decidir renovaciones, ventas de activos poco rentables, " +
      "o negociaciones de tarifas con carriers específicos.",
  },
];

type Props = {
  visibleRoles?: string[];
};

export function InterpretationCards({ visibleRoles }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = visibleRoles
    ? cards.filter((c) => visibleRoles.includes(c.role))
    : cards;

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2">
      {filtered.map((card) => {
        const isOpen = openId === card.id;
        return (
          <div
            key={card.id}
            className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : card.id)}
              className="flex w-full items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              {card.icon}
              <span className="text-sm font-medium flex-1 text-zinc-700 dark:text-zinc-300">
                {card.title}
              </span>
              <span className="text-xs text-zinc-400 uppercase">{card.role}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p>{card.content}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
