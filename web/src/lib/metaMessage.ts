import type { EditableMeta } from "./offeringMeta";

/** The exact text an issuer signs to change offering metadata. Shared by client and server. */
export function metaMessage(offeringId: string, issuedAt: string, meta: EditableMeta): string {
  return [
    "Truva: update offering metadata",
    `Offering: ${offeringId}`,
    `Issued at: ${issuedAt}`,
    `Changes: ${JSON.stringify(meta)}`,
  ].join("\n");
}
