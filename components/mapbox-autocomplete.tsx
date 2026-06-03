"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

export type MapboxSuggestion = {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
  address?: string;
};

interface MapboxAutocompleteProps {
  value?: MapboxSuggestion | null;
  onChange: (place: MapboxSuggestion | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  country?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function MapboxAutocomplete({
  value,
  onChange,
  placeholder = "Buscar dirección...",
  label,
  error,
  country = "US",
}: MapboxAutocompleteProps) {
  const [query, setQuery] = useState(value?.place_name || "");
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update query when value changes externally
  useEffect(() => {
    if (value?.place_name) {
      setQuery(value.place_name);
    }
  }, [value?.place_name]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    async (searchText: string) => {
      if (!searchText.trim() || searchText.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      if (!MAPBOX_TOKEN) {
        console.error("Mapbox token no configurado");
        return;
      }

      setLoading(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${MAPBOX_TOKEN}&country=${country}&types=address,place&limit=5`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error fetching suggestions");
        const data = await res.json();
        const features: MapboxSuggestion[] = (data.features || []).map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center,
          context: f.context,
          address: f.address,
        }));
        setSuggestions(features);
      } catch (err) {
        console.error("Error fetching Mapbox suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [country]
  );

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value?.place_name) {
        fetchSuggestions(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions, value?.place_name]);

  function handleSelect(suggestion: MapboxSuggestion) {
    setQuery(suggestion.place_name);
    setSuggestions([]);
    setOpen(false);
    onChange(suggestion);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setQuery(newValue);
    if (!newValue.trim()) {
      onChange(null);
      setSuggestions([]);
    }
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.trim().length >= 3 && setOpen(true)}
            placeholder={placeholder}
            className={cn("pl-10", error && "border-red-500")}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
          )}
        </div>

        {open && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
            <div className="max-h-60 overflow-auto py-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-sm text-left text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <MapPin className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">{suggestion.place_name}</div>
                    <div className="text-xs text-zinc-500">
                      {suggestion.center[1].toFixed(4)}, {suggestion.center[0].toFixed(4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {open && query.trim().length >= 3 && !loading && suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg px-3 py-2 text-sm text-zinc-500">
            No se encontraron direcciones
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
