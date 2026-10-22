import { describe, it, expect } from "vitest";
import { bmi, proteinGoal, allowedDiets, basicPlan, groceryList, byId } from "@/lib/meal";

describe("meal rules", () => {
  it("BMI 70kg/175cm", () => expect(bmi(70, 175)).toBe(22.9));
  it("protein goal guy 1.4 g/kg", () => expect(proteinGoal(70, 175, "male")).toBe(98));
  it("protein goal girl 1.2 g/kg", () => expect(proteinGoal(60, 165, "female")).toBe(72));
  it("veg only allows veg", () => expect(allowedDiets("veg")).toEqual(["veg"]));
  it("veg+egg excludes non-veg", () => expect(allowedDiets("veg-egg")).not.toContain("non-veg"));
  it("plan is 3 days x 3 meals", () => expect(basicPlan(90, "veg")).toHaveLength(9));
  it("veg plan has no egg/meat", () =>
    basicPlan(90, "veg").forEach((m) => expect(byId(m.recipeId)!.diet).toBe("veg")));
  it("grocery list includes pantry flags", () =>
    expect(groceryList(basicPlan(90, "veg")).some((g) => g.pantry)).toBe(true));
});

import { groupGrocery, ingredientCount } from "@/lib/meal";
describe("days & grocery groups", () => {
  it("single-day plan has 3 meals", () => expect(basicPlan(90, "veg", 1)).toHaveLength(3));
  it("spices are grouped after veggies", () => {
    const g = groupGrocery(groceryList(basicPlan(90, "veg"))).map((x) => x.key);
    expect(g.indexOf("vegetable")).toBeLessThan(g.indexOf("spice or seasoning"));
  });
});

describe("grocery piece counts", () => {
  it("countable veggies carry a piece count", () => {
    const onion = groceryList(basicPlan(90, "veg")).find((g) => g.name === "Onion");
    expect(onion?.count).toBeGreaterThanOrEqual(1);
  });
  it("spices and dairy have no piece count", () => {
    const list = groceryList(basicPlan(90, "veg"));
    expect(list.find((g) => g.name === "Salt")?.count).toBeNull();
    expect(list.find((g) => g.category === "dairy")?.count).toBeNull();
  });
  it("parses counts from amount text", () => {
    expect(ingredientCount("1 chopped (80 g)")).toBe(1);
    expect(ingredientCount("4 cloves")).toBe(4);
    expect(ingredientCount("a handful, chopped")).toBe(1);
    expect(ingredientCount("80 g")).toBeNull();
    expect(ingredientCount("1 tbsp")).toBeNull();
    expect(ingredientCount("1/2 cup")).toBeNull();
  });
});
