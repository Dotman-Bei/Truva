import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

/**
 * The few storage operations Truva needs. In production this is Redis (Upstash / Vercel KV, which
 * work across serverless instances); locally, with no Redis configured, it is a JSON file.
 */
export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  /** Sets only if absent. Returns true when this call created the key. Atomic in Redis. */
  setNX(key: string, value: unknown, ttlMs?: number): Promise<boolean>;
  del(key: string): Promise<void>;
  zadd(key: string, score: number, member: string): Promise<void>;
  /** Members by descending score. */
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
}

// ---------- Redis ----------

function redisKV(r: Redis): KV {
  return {
    get: (k) => r.get(k),
    async set(k, v) {
      await r.set(k, v);
    },
    async setNX(k, v, ttlMs) {
      const res = ttlMs ? await r.set(k, v, { nx: true, px: ttlMs }) : await r.set(k, v, { nx: true });
      return res === "OK";
    },
    async del(k) {
      await r.del(k);
    },
    async zadd(k, score, member) {
      await r.zadd(k, { score, member });
    },
    zrevrange: (k, start, stop) => r.zrange<string[]>(k, start, stop, { rev: true }),
    async mget<T>(keys: string[]) {
      return keys.length ? r.mget<T[]>(...keys) : [];
    },
  };
}

// ---------- local JSON file (development only) ----------

type FileData = {
  strings: Record<string, unknown>;
  expires: Record<string, number>;
  zsets: Record<string, Record<string, number>>;
};

function fileKV(file: string): KV {
  let queue: Promise<unknown> = Promise.resolve();
  const run = <T>(fn: (d: FileData) => T | Promise<T>, write = false): Promise<T> => {
    const p = queue.then(async () => {
      let d: FileData;
      try {
        d = JSON.parse(await fs.readFile(file, "utf8"));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        d = { strings: {}, expires: {}, zsets: {} };
      }
      for (const [k, at] of Object.entries(d.expires)) {
        if (at <= Date.now()) {
          delete d.strings[k];
          delete d.expires[k];
          write = true;
        }
      }
      const out = await fn(d);
      if (write) {
        await fs.mkdir(path.dirname(file), { recursive: true });
        const tmp = `${file}.${process.pid}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(d));
        await fs.rename(tmp, file);
      }
      return out;
    });
    queue = p.catch(() => undefined);
    return p;
  };
  const clone = <T>(v: unknown) => (v === undefined ? null : (structuredClone(v) as T));

  return {
    get: <T>(k: string) => run((d) => clone<T>(d.strings[k])),
    set: (k, v) =>
      run((d) => {
        d.strings[k] = clone(v);
        delete d.expires[k];
      }, true),
    setNX: (k, v, ttlMs) =>
      run((d) => {
        if (k in d.strings) return false;
        d.strings[k] = clone(v);
        if (ttlMs) d.expires[k] = Date.now() + ttlMs;
        return true;
      }, true),
    del: (k) =>
      run((d) => {
        delete d.strings[k];
        delete d.expires[k];
      }, true),
    zadd: (k, score, member) =>
      run((d) => {
        (d.zsets[k] ??= {})[member] = score;
      }, true),
    zrevrange: (k, start, stop) =>
      run((d) =>
        Object.entries(d.zsets[k] ?? {})
          .sort((a, b) => b[1] - a[1])
          .map(([m]) => m)
          .slice(start, stop < 0 ? undefined : stop + 1),
      ),
    mget: <T>(keys: string[]) => run((d) => keys.map((k) => clone<T>(d.strings[k]))),
  };
}

// ---------- pick a backend ----------

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const kvBackend = url && token ? "redis" : "file";

export const kv: KV =
  url && token
    ? redisKV(new Redis({ url, token }))
    : fileKV(path.resolve(process.cwd(), process.env.TRUVA_KV_FILE || ".data/kv.json"));

/** Runs fn while holding a short lock on `name`, so two requests can't update one checkout at once. */
export async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const key = `lock:${name}`;
  for (let i = 0; i < 50; i++) {
    if (await kv.setNX(key, 1, 15_000)) {
      try {
        return await fn();
      } finally {
        await kv.del(key);
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Busy: another update to this checkout is in progress. Try again.");
}
