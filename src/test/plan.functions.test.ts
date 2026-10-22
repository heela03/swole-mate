import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { generatePlan } from "@/lib/plan-core";
import { poolFor, SLOTS } from "@/lib/meal";

// A tiny fake OpenAI-compatible provider, so we can test the AI step without a real key.
let server: http.Server;
let baseURL = "";
let paths: string[] = [];
let replyWith: () => string = () => "{}";

beforeAll(async () => {
  server = http.createServer((req, res) => {
    paths.push(`${req.method} ${req.url}`);
    req.resume();
    req.on("end", () => {
      if (!req.url?.endsWith("/chat/completions")) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: { message: "unsupported endpoint" } }));
        return;
      }
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          id: "t",
          object: "chat.completion",
          created: 1,
          model: "test",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: replyWith() },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
});

afterAll(() => server.close());

beforeEach(() => {
  paths = [];
  process.env["AI_API_KEY"] = "test-key";
  process.env["AI_BASE_URL"] = baseURL;
  process.env["AI_MODEL"] = "test-model";
});

const input = { goal: 120, diet: "non-veg" as const, days: 1 as const };

describe("generatePlan (AI step)", () => {
  it("uses the chat-completions endpoint and accepts ids from the retrieved pool", async () => {
    const ids = SLOTS.map((s) => poolFor(s, "non-veg")[0]!.id);
    replyWith = () =>
      JSON.stringify({ days: [{ breakfast: ids[0], lunch: ids[1], dinner: ids[2] }] });

    const out = await generatePlan(input);

    expect(out.source).toBe("ai");
    expect(out.plan.map((m) => m.recipeId)).toEqual(ids);
    expect(paths).toEqual(["POST /v1/chat/completions"]);
  });

  it("ignores ids the model invented and falls back to the rules-based pick", async () => {
    replyWith = () =>
      JSON.stringify({ days: [{ breakfast: "NOT_A_RECIPE", lunch: "NOPE", dinner: "NADA" }] });

    const out = await generatePlan(input);

    expect(out.plan).toHaveLength(3);
    for (const m of out.plan) {
      expect(poolFor(m.slot, "non-veg").some((r) => r.id === m.recipeId)).toBe(true);
    }
  });

  it("falls back to the basic plan when the model returns garbage", async () => {
    replyWith = () => "sorry, I cannot help with that";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await generatePlan(input);
    expect(out.source).toBe("basic");
    expect(out.plan).toHaveLength(3);
  });

  it("uses the basic plan when no key is configured", async () => {
    delete process.env["AI_API_KEY"];
    const out = await generatePlan(input);
    expect(out.source).toBe("basic");
    expect(out.reason).toBe("AI not configured");
    expect(paths).toEqual([]);
  });
});
