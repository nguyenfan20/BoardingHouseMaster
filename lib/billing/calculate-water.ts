// Công thức: docs/BILLING.md §3. Pure function, không side effect.
import type { WaterInput, WaterBreakdown } from "./types";

export function calculateWater(input: WaterInput): WaterBreakdown {
  switch (input.calcType) {
    case "per_person":
      return {
        calcType: "per_person",
        waterRate: input.waterRate,
        numOccupants: input.numOccupants,
        water: input.numOccupants * input.waterRate,
      };
    case "fixed":
      return {
        calcType: "fixed",
        waterRate: input.waterRate,
        water: input.waterRate,
      };
    case "per_m3": {
      const consumedM3 = input.newIndex - input.oldIndex;
      return {
        calcType: "per_m3",
        waterRate: input.waterRate,
        consumedM3,
        water: consumedM3 * input.waterRate,
      };
    }
  }
}
