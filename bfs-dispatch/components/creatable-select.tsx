"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = { id: number; label: string };

interface CreatableSelectProps {
  options: SelectOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  onCreateNew: (name: string) => Promise<number>;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function CreatableSelect({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Seleccionar...",
  label,
  error,
  className,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowNewInput(false);
        setInputValue("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreateNew() {
    if (!inputValue.trim()) return;

    setCreating(true);
    try {
      const newId = await onCreateNew(inputValue.trim());
      onChange(newId);
      setInputValue("");
      setShowNewInput(false);
      setOpen(false);
    } catch (e) {
      console.error("Error creating option:", e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)} ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (open) {
              setShowNewInput(false);
              setInputValue("");
            }
          }}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
            "hover:bg-zinc-50 dark:hover:bg-zinc-900",
            "focus:outline-none focus:ring-2 focus:ring-ring/50",
            error && "border-red-500"
          )}
        >
          <span className={selectedOption ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
            <div className="max-h-60 overflow-auto p-1">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setInputValue("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    option.id === value && "bg-zinc-100 dark:bg-zinc-800"
                  )}
                >
                  <span>{option.label}</span>
                  {option.id === value && <Check className="h-4 w-4 text-emerald-500" />}
                </button>
              ))}

              {options.length === 0 && !showNewInput && (
                <div className="px-3 py-2 text-sm text-zinc-400">
                  No hay opciones disponibles
                </div>
              )}

              {showNewInput ? (
                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Nombre de la nueva opción"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateNew();
                        }
                        if (e.key === "Escape") {
                          setShowNewInput(false);
                          setInputValue("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateNew}
                      disabled={!inputValue.trim() || creating}
                    >
                      {creating ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewInput(true)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-zinc-500",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    "border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-2"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear nueva opción</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
