import { NextResponse } from "next/server";
import { CheckoutError, recordDelivery, refreshIntent } from "@/lib/intents";

/**
 * Links an issuer delivery transaction to the intent. No role is needed to submit a hash because
 * nothing is trusted from the request: the checkout settles only if the chain shows the exact
 * token transfer from the issuer's inventory wallet to the buyer.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { txHash?: unknown };
  if (typeof body.txHash !== "string") return NextResponse.json({ error: "txHash is required." }, { status: 400 });
  try {
    await recordDelivery(id, body.txHash);
    return NextResponse.json({ intent: await refreshIntent(id) });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "The delivery couldn’t be recorded. Refresh to see the current state." }, { status: 500 });
  }
}
