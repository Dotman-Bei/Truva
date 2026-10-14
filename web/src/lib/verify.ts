import "server-only";
import { createPublicClient, http, type Address } from "viem";
import { botChain, chainConfigured, networkLabel } from "@/config/chain";
import type { Offering } from "@/config/offerings";

export type Verification = {
  ok: boolean;
  checkedAt: string;
  problems: string[];
};

const client = chainConfigured
  ? createPublicClient({ chain: botChain, transport: http(undefined, { timeout: 8000 }) })
  : null;

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
  } catch {
    problems.push(`${networkLabel} could not be reached.`);
  }

  return { ok: problems.length === 0, checkedAt, problems };
}
