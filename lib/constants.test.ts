import { describe, it, expect } from "vitest";
import { LOAD_STATUS, PAID_STATUS, LOAD_STATUS_LABELS, LOAD_STATUS_TRANSITIONS, LOAD_STATUS_COLORS } from "./constants";

describe("LOAD_STATUS", () => {
  it("has all expected statuses", () => {
    expect(LOAD_STATUS.PENDING).toBe("pending");
    expect(LOAD_STATUS.BOOKED).toBe("booked");
    expect(LOAD_STATUS.PICKED_UP).toBe("picked_up");
    expect(LOAD_STATUS.DELIVERED).toBe("delivered");
    expect(LOAD_STATUS.PAID).toBe("paid");
    expect(LOAD_STATUS.CANCELLED).toBe("cancelled");
    expect(LOAD_STATUS.DELAYED).toBe("delayed");
  });
});

describe("PAID_STATUS", () => {
  it("has all expected statuses", () => {
    expect(PAID_STATUS.UNPAID).toBe("unpaid");
    expect(PAID_STATUS.PARTIAL).toBe("partial");
    expect(PAID_STATUS.PAID).toBe("paid");
  });
});

describe("LOAD_STATUS_LABELS", () => {
  it("has Spanish labels", () => {
    expect(LOAD_STATUS_LABELS.pending).toBe("Pendiente");
    expect(LOAD_STATUS_LABELS.delivered).toBe("Entregado");
    expect(LOAD_STATUS_LABELS.cancelled).toBe("Cancelada");
    expect(LOAD_STATUS_LABELS.delayed).toBe("Retrasada");
  });
});

describe("LOAD_STATUS_COLORS", () => {
  it("has semantic colors", () => {
    expect(LOAD_STATUS_COLORS.cancelled).toContain("red");
    expect(LOAD_STATUS_COLORS.delayed).toContain("orange");
  });
});

describe("LOAD_STATUS_TRANSITIONS", () => {
  it("allows pending → booked", () => {
    expect(LOAD_STATUS_TRANSITIONS.pending).toContain("booked");
  });

  it("allows delivered → paid", () => {
    expect(LOAD_STATUS_TRANSITIONS.delivered).toContain("paid");
  });

  it("allows picked_up → delayed", () => {
    expect(LOAD_STATUS_TRANSITIONS.picked_up).toContain("delayed");
  });

  it("allows delayed → cancelled", () => {
    expect(LOAD_STATUS_TRANSITIONS.delayed).toContain("cancelled");
  });
});
