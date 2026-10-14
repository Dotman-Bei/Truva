import type { Address } from "viem";

export type OfferingStatus = "Draft" | "Demo" | "Active" | "Paused" | "Closed";

export type Offering = {
  id: string;
  name: string;
  /** Authored line break for display titles: [first line, second line]. */
  titleLines: [string, string];
  shortDescription: string;
  issuer: { legalName: string; contact: string };
  category: string;
  represents: string;
  doesNotRepresent: string;
  token: { name: string; symbol: string; decimals: number; address: Address | null };
  suite: { identityRegistry: Address | null; compliance: Address | null };
  network: string;
  payment: { symbol: string; decimals: number; address: Address | null };
  /** Issuer wallet that receives payment. */
  treasury: Address | null;
  /** Issuer wallet that delivers tokens to the buyer. */
  inventory: Address | null;
  pricePerToken: string;
  minPurchase: string;
  maxPurchase: string;
  truvaFee: string | null;
  window: { start: string; end: string | null };
  disclosures: { title: string; href: string; type: string; date: string }[];
  fulfilment: string;
  status: OfferingStatus;
  lastVerified: string | null;
};

const addr = (v: string | undefined) => (v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : null);

// The public PRWA demo suite on Bohr testnet (BOT Chain RWA address table, verified on-chain
// 2026-10-14). BOT Chain describes PRWA as a capability demo: it carries no real-world rights.
// Price and purchase limits are Truva test values (docs/FRONTEND.md §6), not issuer terms.
export const offerings: Offering[] = [
  {
    id: "prwa-demo",
    name: "PRWA capability demo",
    titleLines: ["PRWA", "capability demo"],
    shortDescription:
      "BOT Chain’s public demonstration token on Bohr testnet, used here to walk through the full checkout. It carries no claim on any real-world asset.",
    issuer: {
      legalName: "BOT Chain public demo suite (token owner 0xE88E…24a9)",
      contact: "https://www.botchain.ai/en/ecosystem-support",
    },
    category: "Capability demonstration",
    represents:
      "One unit of BOT Chain’s Project Real World Asset (PRWA) demo token on Bohr testnet, used to test eligibility, payment and delivery.",
    doesNotRepresent:
      "Ownership, custody, redemption rights, yield, or any interest in a real-world asset. BOT Chain states that PRWA is not evidence of real-world asset rights. It has no value.",
    token: {
      name: "Project Real World Asset",
      symbol: "PRWA",
      decimals: 6,
      address: addr(process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS),
    },
    suite: {
      identityRegistry: addr(process.env.NEXT_PUBLIC_RWA_IDENTITY_REGISTRY_ADDRESS),
      compliance: addr(process.env.NEXT_PUBLIC_RWA_COMPLIANCE_ADDRESS),
    },
    network: "Bohr testnet",
    payment: { symbol: "tUSD", decimals: 6, address: addr(process.env.NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS) },
    treasury: addr(process.env.NEXT_PUBLIC_ISSUER_TREASURY_ADDRESS),
    inventory: addr(process.env.NEXT_PUBLIC_ISSUER_INVENTORY_ADDRESS),
    pricePerToken: "10.00",
    minPurchase: "50.00",
    maxPurchase: "5000.00",
    truvaFee: null,
    window: { start: "2026-10-01", end: null },
    disclosures: [
      {
        title: "BOT Chain RWA development manual",
        href: "https://dev-docs.botchain.ai/docs/RWA/project-rwa-developer-docs/",
        type: "Docs",
        date: "2026-10-14",
      },
      {
        title: "PRWA suite address table",
        href: "https://dev-docs.botchain.ai/docs/RWA/deployment-addresses/",
        type: "Docs",
        date: "2026-10-14",
      },
    ],
    fulfilment:
      "Delivered by transfer from the issuer’s inventory wallet after payment confirms. Both wallets must pass the suite’s compliance rules, and the token must not be paused.",
    status: "Demo",
    lastVerified: null,
  },
];

export const primaryOffering = offerings[0];

export function getOffering(id: string): Offering | undefined {
  return offerings.find((o) => o.id === id);
}
