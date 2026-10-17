import { NextResponse } from "next/server";
import { chainConfigured, chainId, networkLabel } from "@/config/chain";
import { publicClient } from "@/lib/chainServer";
import { kv, kvBackend, ns } from "@/lib/kv";

export const dynamic = "force-dynamic";

/** Strips anything that could be a credential or endpoint from an error message. */
function clean(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/https?:\/\/\S+/g, "[url]").replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]").slice(0, 200);
}

/** Reports whether storage can be read and written, and whether the configured chain answers. */
export async function GET() {
  const key = ns(`health:${Date.now()}`);
  const storage: Record<string, unknown> = { backend: kvBackend };
  try {
    await kv.get(ns("health:probe"));
    storage.read = true;
  } catch (e) {
    storage.read = false;
    storage.readError = clean(e);
  }
  try {
    await kv.set(key, 1);
    await kv.del(key);
    storage.write = true;
  } catch (e) {
    storage.write = false;
    storage.writeError = clean(e);
  }

  let chain: Record<string, unknown> = { configured: chainConfigured, expected: chainId, network: networkLabel };
  if (publicClient) {
    try {
      chain = { ...chain, rpcChainId: await publicClient.getChainId() };
    } catch (e) {
      chain = { ...chain, rpcError: clean(e) };
    }
  }

  const ok = storage.read === true && storage.write === true && chain.rpcChainId === chainId;
  return NextResponse.json({ ok, storage, chain }, { status: ok ? 200 : 503 });
}
