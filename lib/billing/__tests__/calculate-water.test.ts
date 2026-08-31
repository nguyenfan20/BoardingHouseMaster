import { describe, expect, it } from "vitest";
import { calculateWater } from "../calculate-water";

describe("calculateWater", () => {
  it("per_person", () => {
    const result = calculateWater({ calcType: "per_person", numOccupants: 3, waterRate: 150000 });
    expect(result.water).toBe(450000);
  });

  it("fixed", () => {
    const result = calculateWater({ calcType: "fixed", waterRate: 200000 });
    expect(result.water).toBe(200000);
  });

  it("per_m3", () => {
    const result = calculateWater({ calcType: "per_m3", oldIndex: 10, newIndex: 18, waterRate: 25000 });
    expect(result.consumedM3).toBe(8);
    expect(result.water).toBe(200000);
  });
});
