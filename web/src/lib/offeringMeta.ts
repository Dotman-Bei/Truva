import "server-only";
import { getOffering, offerings, type Offering, type OfferingStatus } from "@/config/offerings";
import { kv, ns, withLock } from "./kv";

/**
 * Issuer-editable, non-critical offering metadata. Contract addresses, price rules and the
 * token suite are never editable here; they change only through a verified configuration update.
 */
export type EditableMeta = {
  name?: string;
  shortDescription?: string;
  issuerContact?: string;
  disclosures?: Offering["disclosures"];
  status?: OfferingStatus;
};

export type MetaChange = { offeringId: string; by: string; at: string; fields: string[] };

type Store = { overrides: Record<string, EditableMeta>; log: MetaChange[] };
const KEY = ns("offering-meta");

async function read(): Promise<Store> {
  return (await kv.get<Store>(KEY)) ?? { overrides: {}, log: [] };
}

export async function saveMeta(offeringId: string, meta: EditableMeta, by: string): Promise<MetaChange> {
  return withLock(KEY, async () => {
    const store = await read();
    store.overrides[offeringId] = { ...store.overrides[offeringId], ...meta };
    const change = { offeringId, by, at: new Date().toISOString(), fields: Object.keys(meta) };
    store.log.push(change);
    await kv.set(KEY, store);
    return change;
  });
}

export async function metaLog(offeringId: string): Promise<MetaChange[]> {
  return (await read()).log.filter((c) => c.offeringId === offeringId).reverse();
}

/** Splits a display name into two lines of similar length for the display title. */
function twoLines(name: string): [string, string] {
  const words = name.split(/\s+/);
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    const bestDiff = Math.abs(words.slice(0, best).join(" ").length - words.slice(best).join(" ").length);
    if (diff < bestDiff) best = i;
  }
  return words.length < 2 ? [name, ""] : [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function apply(o: Offering, m: EditableMeta | undefined): Offering {
  if (!m) return o;
  return {
    ...o,
    name: m.name ?? o.name,
    titleLines: m.name ? twoLines(m.name) : o.titleLines,
    shortDescription: m.shortDescription ?? o.shortDescription,
    issuer: { ...o.issuer, contact: m.issuerContact ?? o.issuer.contact },
    disclosures: m.disclosures ?? o.disclosures,
    status: m.status ?? o.status,
  };
}

/** The configured offering with any saved issuer edits applied. */
export async function liveOffering(id: string): Promise<Offering | undefined> {
  const o = getOffering(id);
  return o && apply(o, (await read()).overrides[id]);
}

export async function liveOfferings(): Promise<Offering[]> {
  const { overrides } = await read();
  return offerings.map((o) => apply(o, overrides[o.id]));
}
