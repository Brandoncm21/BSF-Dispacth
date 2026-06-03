import { describe, it, expect } from "vitest";
import { formatTimestamp, formatUSD, formatDollarPerMile, toDatetimeLocal } from "./format";

describe("formatTimestamp", () => {
  it("returns em dash for null", () => {
    expect(formatTimestamp(null)).toBe("—");
  });

  it("formats ISO date string", () => {
    const result = formatTimestamp("2025-07-01T10:30:00Z");
    expect(result).toBeTypeOf("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatUSD", () => {
  it("formats number as USD", () => {
    expect(formatUSD(1234.5)).toBe("$1,234.50");
  });

  it("handles zero", () => {
    expect(formatUSD(0)).toBe("$0.00");
  });

  it("returns em dash for null", () => {
    expect(formatUSD(null)).toBe("—");
  });
});

describe("formatDollarPerMile", () => {
  it("formats valid rate and miles", () => {
    expect(formatDollarPerMile(1000, 500)).toBe("$2.00");
  });

  it("returns em dash for zero miles", () => {
    expect(formatDollarPerMile(1000, 0)).toBe("—");
  });

  it("returns em dash for null miles", () => {
    expect(formatDollarPerMile(1000, null)).toBe("—");
  });
});

describe("toDatetimeLocal", () => {
  it("formats ISO string to datetime-local", () => {
    const result = toDatetimeLocal("2025-07-01T10:30:00Z");
    expect(result).toContain("2025-07-01T");
  });

  it("returns empty string for null", () => {
    expect(toDatetimeLocal(null)).toBe("");
  });
});
