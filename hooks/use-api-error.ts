"use client";

import { useState, useCallback } from "react";
import { AppError, parseSupabaseError } from "@/lib/errors";

export function useApiError() {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback((err: unknown) => {
    setError(parseSupabaseError(err));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, setError, handleError, clearError };
}
