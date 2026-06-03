"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { id: number; label: string; meta?: string };

interface SearchableSelectProps {
  initialLabel?: string;
  value: number | null;
  onChange: (id: number | null) => void;
  onSearch: (query: string) => Promise<Option[]>;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar...",
  label,
  error,
  disabled,
  initialLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedLabel = initialLabel || results.find((r) => r.id === value)?.label || "";

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await onSearch(q.trim());
      setResults(data);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(option: Option) {
    onChange(option.id);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0 && results[highlightIdx]) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative">
        {value ? (
          <div
            role="button"
            tabIndex={0}
            onClick={handleOpen}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm cursor-pointer",
              "hover:bg-zinc-50 dark:hover:bg-zinc-900",
              error && "border-red-500"
            )}
          >
            <span className="text-zinc-900 dark:text-zinc-50">{selectedLabel}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs px-1"
              >
                ✕
              </button>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={handleOpen}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm cursor-pointer",
              "hover:bg-zinc-50 dark:hover:bg-zinc-900",
              error && "border-red-500"
            )}
          >
            <span className="text-zinc-400">{placeholder}</span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </div>
        )}

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe para buscar..."
                  className="h-8 pl-7 text-sm"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-auto p-1">
              {loading && (
                <div className="px-3 py-4 text-sm text-zinc-400 text-center">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Buscando...
                </div>
              )}

              {!loading && results.length === 0 && query.trim() && (
                <div className="px-3 py-4 text-sm text-zinc-400 text-center">
                  Sin resultados para "{query}"
                </div>
              )}

              {!loading && results.length === 0 && !query.trim() && (
                <div className="px-3 py-4 text-sm text-zinc-400 text-center">
                  Escribe para buscar brokers
                </div>
              )}

              {results.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm text-left",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    idx === highlightIdx && "bg-zinc-100 dark:bg-zinc-800",
                    option.id === value && "bg-zinc-50 dark:bg-zinc-900"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-zinc-900 dark:text-zinc-100">{option.label}</span>
                    {option.meta && (
                      <span className="text-xs text-zinc-400">{option.meta}</span>
                    )}
                  </div>
                  {option.id === value && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}



