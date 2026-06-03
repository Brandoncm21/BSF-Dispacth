import { describe, it, expect } from "vitest";
import { calculateDispatchFee, calculateNetProfit } from "./calculations";

describe("calculateDispatchFee", () => {
  it("calcula fee correctamente con valores normales", () => {
    expect(calculateDispatchFee(1000, 10)).toBe(100);
    expect(calculateDispatchFee(2500, 15)).toBe(375);
  });

  it("retorna 0 cuando rate es 0", () => {
    expect(calculateDispatchFee(0, 10)).toBe(0);
  });

  it("retorna 0 cuando dispatch_fee_pct es 0", () => {
    expect(calculateDispatchFee(1000, 0)).toBe(0);
  });

  it("maneja decimales con precisión", () => {
    expect(calculateDispatchFee(999.99, 7.5)).toBeCloseTo(74.99925, 5);
  });

  it("maneja dispatch_fee_pct = 100", () => {
    expect(calculateDispatchFee(1000, 100)).toBe(1000);
  });
});

describe("calculateNetProfit", () => {
  it("calcula profit restando dispatch_fee del rate", () => {
    expect(calculateNetProfit(1000, 100)).toBe(900);
    expect(calculateNetProfit(2500, 375)).toBe(2125);
  });

  it("retorna 0 cuando dispatch_fee iguala rate", () => {
    expect(calculateNetProfit(500, 500)).toBe(0);
  });
});
