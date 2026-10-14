import { NextResponse } from "next/server";
import { refreshIntent } from "@/lib/intents";
import { previewIntent } from "@/lib/preview";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intent = previewIntent(id) ?? (await refreshIntent(id));
  if (!intent) return NextResponse.json({ error: "No checkout with that reference." }, { status: 404 });
  return NextResponse.json({ intent, checkedAt: new Date().toISOString() });
}
