export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function parseSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message);
  if (typeof error === "object" && error !== null && "message" in error) {
    return new AppError(String((error as { message: unknown }).message));
  }
  return new AppError("Error desconocido");
}
