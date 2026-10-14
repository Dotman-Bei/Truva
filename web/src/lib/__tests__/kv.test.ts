import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// Use the file backend in a throwaway directory.
beforeAll(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  process.env.TRUVA_KV_FILE = path.join(mkdtempSync(path.join(tmpdir(), "truva-kv-")), "kv.json");
});

describe("kv (file backend)", () => {
  it("lets exactly one caller claim a key, even when racing", async () => {
    const { kv } = await import("../kv");
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => kv.setNX("tx:0xabc", `intent-${i}`)));
    expect(results.filter(Boolean)).toHaveLength(1);
    const owner = await kv.get<string>("tx:0xabc");
    expect(owner).toBe(`intent-${results.indexOf(true)}`);
  });

  it("releases an expired claim", async () => {
    const { kv } = await import("../kv");
    expect(await kv.setNX("lock:x", 1, 20)).toBe(true);
    expect(await kv.setNX("lock:x", 1, 20)).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(await kv.setNX("lock:x", 1, 20)).toBe(true);
  });

  it("orders the index newest first", async () => {
    const { kv } = await import("../kv");
    await kv.zadd("intents", 1, "old");
    await kv.zadd("intents", 3, "new");
    await kv.zadd("intents", 2, "mid");
    expect(await kv.zrevrange("intents", 0, -1)).toEqual(["new", "mid", "old"]);
  });

  it("runs locked sections one at a time", async () => {
    const { withLock } = await import("../kv");
    const order: string[] = [];
    await Promise.all(
      ["a", "b", "c"].map((n) =>
        withLock("same", async () => {
          order.push(`${n}-in`);
          await new Promise((r) => setTimeout(r, 15));
          order.push(`${n}-out`);
        }),
      ),
    );
    for (let i = 0; i < order.length; i += 2) expect(order[i].split("-")[0]).toBe(order[i + 1].split("-")[0]);
  });
});
