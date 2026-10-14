import { NextResponse } from "next/server";
import { CheckoutError, recordPayment, refreshIntent } from "@/lib/intents";

/** Links the buyer's signed payment transaction to the intent. The chain decides whether it counts. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { txHash?: unknown };
  if (typeof body.txHash !== "string") return NextResponse.json({ error: "txHash is required." }, { status: 400 });
  try {
    await recordPayment(id, body.txHash);
    return NextResponse.json({ intent: await refreshIntent(id) });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "The payment couldn’t be recorded. Refresh to see the current state." }, { status: 500 });
  }
}
