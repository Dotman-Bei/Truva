import "server-only";
import type { Address } from "viem";
import { botChain, networkLabel } from "@/config/chain";
import type { Offering } from "@/config/offerings";
import { rwaTokenAbi } from "./abi";
import { publicClient as client } from "./chainServer";

export type Verification = {
  ok: boolean;
  checkedAt: string;
  problems: string[];
};

/**
 * Checks an offering's configuration against the chain: the network is set, and every
 * contract the checkout depends on has an address with deployed code. Fails closed.
 */
export async function verifyOffering(offering: Offering): Promise<Verification> {
  const checkedAt = new Date().toISOString();
  if (!client) {
    return { ok: false, checkedAt, problems: ["The network is not configured."] };
  }

  const contracts: [string, Address | null][] = [
    ["Token", offering.token.address],
    ["IdentityRegistry", offering.suite.identityRegistry],
    ["ModularCompliance", offering.suite.compliance],
    ["Payment token", offering.payment.address],
  ];

  const problems: string[] = [];
  if (!offering.treasury) problems.push("Issuer treasury wallet is not set.");
  if (!offering.inventory) problems.push("Issuer inventory wallet is not set.");
  try {
    const chainId = await client.getChainId();
    if (chainId !== botChain.id) problems.push(`The RPC reports chain ${chainId}, not ${botChain.id}.`);
    for (const [label, address] of contracts) {
      if (!address) {
        problems.push(`${label} address is not set.`);
        continue;
      }
      const code = await client.getCode({ address });
      if (!code || code === "0x") problems.push(`${label} has no contract code on ${networkLabel}.`);
    }

    // ERC-3643 acceptance checks from the BOT Chain testnet guide.
    const token = offering.token.address;
    if (token && !problems.some((p) => p.startsWith("Token "))) {
      const rpc = client;
      const read = <F extends "identityRegistry" | "compliance" | "paused" | "decimals">(functionName: F) =>
        rpc.readContract({ address: token, abi: rwaTokenAbi, functionName });
      const [ir, mc, paused, decimals] = await Promise.all([read("identityRegistry"), read("compliance"), read("paused"), read("decimals")]);
      const same = (a: string, b: string | null) => !!b && a.toLowerCase() === b.toLowerCase();
      if (!same(ir, offering.suite.identityRegistry)) problems.push("The token points to a different IdentityRegistry than the one configured.");
      if (!same(mc, offering.suite.compliance)) problems.push("The token points to a different ModularCompliance than the one configured.");
      if (decimals !== offering.token.decimals) problems.push(`The token has ${decimals} decimals, not the configured ${offering.token.decimals}.`);
      if (paused) problems.push("The token is paused by its agent, so deliveries would be rejected.");
    }
  } catch {
    problems.push(`${networkLabel} could not be reached.`);
  }

  return { ok: problems.length === 0, checkedAt, problems };
}
