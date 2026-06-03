import { describe, it, expect } from "vitest";
import { LOAD_STATUS, PAID_STATUS, LOAD_STATUS_LABELS, LOAD_STATUS_TRANSITIONS } from "./constants";

describe("LOAD_STATUS", () => {
  it("has all expected statuses", () => {
    expect(LOAD_STATUS.PENDING).toBe("pending");
    expect(LOAD_STATUS.BOOKED).toBe("booked");
    expect(LOAD_STATUS.PICKED_UP).toBe("picked_up");
    expect(LOAD_STATUS.DELIVERED).toBe("delivered");
    expect(LOAD_STATUS.PAID).toBe("paid");
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
  });
});

describe("LOAD_STATUS_TRANSITIONS", () => {
  it("allows pending → booked", () => {
    expect(LOAD_STATUS_TRANSITIONS.pending).toContain("booked");
  });

  it("allows delivered → paid", () => {
    expect(LOAD_STATUS_TRANSITIONS.delivered).toContain("paid");
  });
});
