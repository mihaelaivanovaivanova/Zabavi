import { describe, expect, it } from "vitest";
import { clampFocalPercent, moveItemTo } from "@/lib/listOrder";

describe("moveItemTo", () => {
  it("moves an item later in the list", () => {
    expect(moveItemTo(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves an item earlier in the list", () => {
    expect(moveItemTo(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("is a no-op when from equals to", () => {
    expect(moveItemTo(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("is a no-op for an out-of-range index", () => {
    expect(moveItemTo(["a", "b", "c"], 0, 5)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const original = ["a", "b", "c"];
    moveItemTo(original, 0, 2);
    expect(original).toEqual(["a", "b", "c"]);
  });
});

describe("clampFocalPercent", () => {
  it("passes through values already in range", () => {
    expect(clampFocalPercent(37)).toBe(37);
  });

  it("clamps below 0 up to 0", () => {
    expect(clampFocalPercent(-10)).toBe(0);
  });

  it("clamps above 100 down to 100", () => {
    expect(clampFocalPercent(142)).toBe(100);
  });

  it("falls back to 50 (center) for NaN", () => {
    expect(clampFocalPercent(Number.NaN)).toBe(50);
  });
});
