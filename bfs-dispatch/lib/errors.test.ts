import { describe, it, expect } from "vitest";
import { AppError, parseSupabaseError } from "./errors";

describe("AppError", () => {
  it("creates an error with message", () => {
    const error = new AppError("test error");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("test error");
    expect(error.name).toBe("AppError");
  });

  it("creates an error with code and field", () => {
    const error = new AppError("validation failed", "VALIDATION_ERROR", "email");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.field).toBe("email");
  });
});

describe("parseSupabaseError", () => {
  it("returns same AppError when given AppError", () => {
    const original = new AppError("original msg", "CODE");
    const result = parseSupabaseError(original);
    expect(result).toBe(original);
  });

  it("converts standard Error to AppError", () => {
    const result = parseSupabaseError(new Error("standard error"));
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe("standard error");
  });

  it("converts object with message property", () => {
    const result = parseSupabaseError({ message: "object error" });
    expect(result.message).toBe("object error");
  });

  it("falls back for unknown input", () => {
    const result = parseSupabaseError(null);
    expect(result.message).toBe("Error desconocido");
  });
});
