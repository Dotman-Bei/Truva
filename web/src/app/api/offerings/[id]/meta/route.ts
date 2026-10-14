import { NextResponse } from "next/server";
import { isAddress, verifyMessage, type Hex } from "viem";
import { getOffering } from "@/config/offerings";
import { isOfferingAgent } from "@/lib/chainServer";
import { metaMessage } from "@/lib/metaMessage";
import { liveOffering, saveMeta, type EditableMeta } from "@/lib/offeringMeta";

const MAX_AGE_MS = 5 * 60 * 1000;

function clean(input: unknown, current: { status: string }): EditableMeta | string {
  if (!input || typeof input !== "object") return "Expected a changes object.";
  const m = input as Record<string, unknown>;
  const out: EditableMeta = {};
  for (const key of Object.keys(m)) {
    if (!["name", "shortDescription", "issuerContact", "disclosures", "status"].includes(key)) {
      return `“${key}” can’t be edited here. It changes only through a verified configuration update.`;
    }
  }
  if (m.name !== undefined) {
    if (typeof m.name !== "string" || m.name.trim().length < 3 || m.name.length > 60) return "Display name must be 3 to 60 characters.";
    out.name = m.name.trim();
  }
  if (m.shortDescription !== undefined) {
    if (typeof m.shortDescription !== "string" || m.shortDescription.length > 280) return "Short description must be 280 characters or fewer.";
    out.shortDescription = m.shortDescription.trim();
  }
  if (m.issuerContact !== undefined) {
    if (typeof m.issuerContact !== "string" || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.issuerContact) || /^https:\/\/\S+$/.test(m.issuerContact))) {
      return "Issuer contact must be an email address or an https link.";
    }
    out.issuerContact = m.issuerContact;
  }
  if (m.disclosures !== undefined) {
    if (!Array.isArray(m.disclosures) || m.disclosures.length > 20) return "Disclosures must be a list of up to 20 links.";
    const list = [];
    for (const d of m.disclosures as Record<string, unknown>[]) {
      if (typeof d?.title !== "string" || typeof d?.href !== "string" || !/^https:\/\//.test(d.href)) {
        return "Each disclosure needs a title and an https link.";
      }
      list.push({ title: d.title.slice(0, 120), href: d.href, type: String(d.type ?? "Link").slice(0, 20), date: String(d.date ?? "").slice(0, 20) });
    }
    out.disclosures = list;
  }
  if (m.status !== undefined) {
    const allowed = current.status === "Paused" ? ["Active", "Demo"] : ["Paused"];
    if (typeof m.status !== "string" || !allowed.includes(m.status)) return "That status change isn’t allowed from here.";
    out.status = m.status as EditableMeta["status"];
  }
  return out;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = getOffering(id);
  const current = await liveOffering(id);
  if (!base || !current) return NextResponse.json({ error: "No such offering." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { address?: unknown; issuedAt?: unknown; changes?: unknown; signature?: unknown };
  if (typeof body.address !== "string" || !isAddress(body.address) || typeof body.issuedAt !== "string" || typeof body.signature !== "string") {
    return NextResponse.json({ error: "address, issuedAt, changes and signature are required." }, { status: 400 });
  }
  const age = Date.now() - Date.parse(body.issuedAt);
  if (!(age >= 0 && age < MAX_AGE_MS)) return NextResponse.json({ error: "That signature has expired. Sign again." }, { status: 401 });

  const changes = clean(body.changes, current);
  if (typeof changes === "string") return NextResponse.json({ error: changes }, { status: 400 });
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

  // The signed text must be exactly what we rebuild from the submitted changes.
  const message = metaMessage(id, body.issuedAt, body.changes as EditableMeta);
  const valid = await verifyMessage({ address: body.address, message, signature: body.signature as Hex }).catch(() => false);
  if (!valid) return NextResponse.json({ error: "The signature doesn’t match this wallet and these changes." }, { status: 401 });

  const role = await isOfferingAgent(base.token.address, body.address);
  if (role === null) return NextResponse.json({ error: "The issuer role couldn’t be read from the token contract." }, { status: 503 });
  if (!role) return NextResponse.json({ error: "This wallet has no issuer or operator role for this offering." }, { status: 403 });

  const change = await saveMeta(id, changes, body.address);
  return NextResponse.json({ change, offering: await liveOffering(id) });
}
