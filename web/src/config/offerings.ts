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

// SAMPLE demo-config content (docs/FRONTEND.md §6). Confirm every value against the
// selected Bohr testnet suite before testers see it.
export const offerings: Offering[] = [
  {
    id: "demo-invoice-pool-a",
    name: "Demo invoice pool A",
    titleLines: ["Demo invoice", "pool A"],
    shortDescription:
      "A demonstration token on Bohr testnet that walks through the full checkout. It carries no claim on any real-world asset.",
    issuer: { legalName: "Truva demo issuer (test configuration)", contact: "issuer-demo@truva.example" },
    category: "Receivables (demonstration)",
    represents:
      "One unit of a demonstration offering, used to test checkout and delivery on Bohr testnet.",
    doesNotRepresent:
      "Ownership, custody, redemption rights, yield, or any interest in a real-world asset. It has no value.",
    token: {
      name: "Demo Invoice Pool A",
      symbol: "tDIPA",
      decimals: 18,
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
    disclosures: [],
    fulfilment:
      "Delivered by transfer from the issuer’s inventory wallet after payment confirms. Both wallets must pass the suite’s compliance rules.",
    status: "Demo",
    lastVerified: null,
  },
];

export const primaryOffering = offerings[0];

export function getOffering(id: string): Offering | undefined {
  return offerings.find((o) => o.id === id);
}
