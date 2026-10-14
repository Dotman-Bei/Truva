import { defineChain, type Address } from "viem";

// Every value comes from the environment. Nothing here is a verified BOT Chain value;
// see .env.example and the official RWA manual before filling them in.
const env = {
  name: process.env.NEXT_PUBLIC_CHAIN_ENV ?? "bohr-testnet",
  chainId: Number(process.env.NEXT_PUBLIC_BOT_CHAIN_ID || 0),
  rpcUrl: process.env.NEXT_PUBLIC_BOT_RPC_URL ?? "",
  explorerUrl: (process.env.NEXT_PUBLIC_BOT_EXPLORER_URL ?? "").replace(/\/$/, ""),
};

export const isTestnet = env.name !== "bot-mainnet";
export const networkLabel = isTestnet ? "Bohr testnet" : "BOT Chain";
export const networkShortLabel = isTestnet ? "Testnet" : "Mainnet";

/** False until chain ID and RPC are configured. Writes stay disabled while false. */
export const chainConfigured = env.chainId > 0 && env.rpcUrl.length > 0;

export const botChain = defineChain({
  id: env.chainId || 1,
  name: networkLabel,
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: env.rpcUrl ? [env.rpcUrl] : [] } },
  blockExplorers: env.explorerUrl
    ? { default: { name: "Explorer", url: env.explorerUrl } }
    : undefined,
  testnet: isTestnet,
});

export const chainId = env.chainId;

export function explorerTx(hash: string): string | null {
  return env.explorerUrl ? `${env.explorerUrl}/tx/${hash}` : null;
}

export function explorerAddress(address: Address | string): string | null {
  return env.explorerUrl ? `${env.explorerUrl}/address/${address}` : null;
}

export const explorerHome = env.explorerUrl || null;
