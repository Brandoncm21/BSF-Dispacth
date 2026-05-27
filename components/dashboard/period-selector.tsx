"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
  group: string;
};

const OPTIONS: Option[] = [
  { value: "this_week", label: "Esta Semana", group: "Fechas Rápidas" },
  { value: "last_week", label: "Semana Pasada", group: "Fechas Rápidas" },
  { value: "last_4_weeks", label: "Últimas 4 Semanas", group: "Fechas Rápidas" },
  { value: "this_month", label: "Este Mes", group: "Fechas Rápidas" },
  { value: "last_month", label: "Mes Anterior", group: "Fechas Rápidas" },
  { value: "last_3_months", label: "Últimos 3 Meses", group: "Fechas Rápidas" },
  { value: "this_quarter", label: "Este Trimestre", group: "Fechas Rápidas" },
  { value: "last_quarter", label: "Trimestre Anterior", group: "Trimestres" },
  { value: "last_2_quarters", label: "Últimos 2 Trimestres", group: "Trimestres" },
  { value: "this_semester", label: "Este Semestre", group: "Semestres" },
  { value: "last_semester", label: "Semestre Anterior", group: "Semestres" },
  { value: "this_year", label: "Este Año", group: "Anual" },
  { value: "last_year", label: "Año Anterior", group: "Anual" },
];

const LABEL_MAP: Record<string, string> = {};
for (const o of OPTIONS) LABEL_MAP[o.value] = o.label;

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const groups = OPTIONS.reduce<Record<string, Option[]>>((acc, o) => {
    if (!acc[o.group]) acc[o.group] = [];
    acc[o.group].push(o);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative w-[220px] no-print">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        <span>{LABEL_MAP[value] || "Seleccionar período"}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {Object.entries(groups).map(([groupName, options]) => (
            <div key={groupName}>
              <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900">
                {groupName}
              </div>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    value === opt.value
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
