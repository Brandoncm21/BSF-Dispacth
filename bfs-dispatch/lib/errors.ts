export type AppError = {
  message: string
  code?: string
  field?: string
}

export function parseSupabaseError(error: unknown): AppError {
  if (error instanceof Error) return { message: error.message }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return { message: String((error as { message: unknown }).message) }
  }
  return { message: 'Error desconocido' }
}
