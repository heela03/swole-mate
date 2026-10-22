import { describe, expect, it } from "vitest";
import { FACTS, nextFactIndex } from "@/lib/facts";

describe("fresh facts", () => {
  it("never selects the previous refresh's fact", () => {
    for (let previous = 0; previous < FACTS.length; previous++) {
      for (const random of [0, 0.2, 0.5, 0.9, 0.999999]) {
        const next = nextFactIndex(previous, random);
        expect(next).not.toBe(previous);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(FACTS.length);
      }
    }
  });
  it("handles the first visit without a previous fact", () => {
    expect(nextFactIndex(-1, 0)).toBe(0);
    expect(nextFactIndex(-1, 0.999999)).toBe(FACTS.length - 1);
  });
});