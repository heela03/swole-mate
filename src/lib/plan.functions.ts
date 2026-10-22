import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  goal: z.number().min(20).max(400),
  diet: z.enum(["veg", "veg-egg", "non-veg"]),
  note: z.string().max(300).optional(),
  days: z.union([z.literal(1), z.literal(3)]).default(3),
});

export const draftPlan = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const { generatePlan } = await import("./plan-core");
    return generatePlan(data);
  });
