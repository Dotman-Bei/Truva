import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { CheckoutError, createIntent, listIntents } from "@/lib/intents";

export async function GET(req: Request) {
  const buyer = new URL(req.url).searchParams.get("buyer") ?? undefined;
  if (buyer && !isAddress(buyer)) return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  return NextResponse.json({ intents: await listIntents({ buyer }) });
}

export async function POST(req: Request) {
  let body: { offeringId?: unknown; buyer?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  const { offeringId, buyer, amount } = body;
  if (typeof offeringId !== "string" || typeof amount !== "string" || typeof buyer !== "string" || !isAddress(buyer)) {
    return NextResponse.json({ error: "offeringId, buyer and amount are required." }, { status: 400 });
  }
  try {
    const intent = await createIntent({ offeringId, buyer, amount });
    return NextResponse.json({ intent }, { status: 201 });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "The checkout couldn’t be created. Nothing was charged." }, { status: 500 });
  }
}
