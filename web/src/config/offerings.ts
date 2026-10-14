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

// Truva's demo ERC-3643 suite on Bohr testnet: unmodified Tokeny T-REX 4.1.6 and ONCHAINID 2.2.1,
// deployed by contracts/script/DeployDemoSuite.s.sol (addresses in contracts/deployments/). BOT Chain's
// public PRWA suite is paused, so Truva runs its own suite to complete a real testnet checkout.
// Price and purchase limits are test values (docs/FRONTEND.md §6), not issuer terms.
export const offerings: Offering[] = [
  {
    id: "truva-demo",
    name: "Truva demo asset",
    titleLines: ["Truva demo", "asset"],
    shortDescription:
      "A demonstration ERC-3643 token on Bohr testnet, issued by Truva to run the full checkout end to end. It carries no claim on any real-world asset.",
    issuer: {
      legalName: "Truva testnet demo issuer (wallet 0xEab0…9ac9)",
      contact: "https://github.com/Dotman-Bei/Truva",
    },
    category: "Capability demonstration",
    represents:
      "One unit of the Truva Demo Asset (TDA) on Bohr testnet, used to test eligibility, payment and delivery against a real ERC-3643 suite.",
    doesNotRepresent:
      "Ownership, custody, redemption rights, yield, or any interest in a real-world asset. It is a test token with no value.",
    token: {
      name: "Truva Demo Asset",
      symbol: "TDA",
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
        title: "Suite deployment record (addresses and roles)",
        href: "https://github.com/Dotman-Bei/Truva/blob/main/contracts/deployments/bohr-demo-suite.json",
        type: "JSON",
        date: "2026-10-14",
      },
      {
        title: "ERC-3643 (T-REX) standard",
        href: "https://www.erc3643.org/",
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
