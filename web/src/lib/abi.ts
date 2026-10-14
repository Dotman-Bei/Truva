// Minimal ABIs for the documented ERC-3643 (T-REX) and ERC-20 interfaces Truva reads.
export const identityRegistryAbi = [
  {
    type: "function",
    name: "isVerified",
    stateMutability: "view",
    inputs: [{ name: "_userAddress", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const agentRoleAbi = [
  {
    type: "function",
    name: "isAgent",
    stateMutability: "view",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

/** ERC-3643 token getters used for the suite acceptance checks. */
export const rwaTokenAbi = [
  { type: "function", name: "identityRegistry", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "compliance", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;
