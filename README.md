# Truva

An RWA checkout and settlement layer for BOT Chain: an eligible buyer pays for an approved tokenized asset,
and Truva verifies the payment-to-delivery lifecycle on-chain. It integrates BOT Chain's existing ERC-3643
(T-REX) suite and never bypasses its identity or compliance rules.

| Folder | What it is |
| --- | --- |
| [`web/`](web/) | Next.js app: seven pages, the intent API and on-chain verification. Setup in [`web/README.md`](web/README.md). |
| [`contracts/`](contracts/) | `TestUSD`, the valueless Bohr-only payment token (Bohr testnet has none). Foundry. |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Design spec. [`Truva_PRD.md`](Truva_PRD.md) is the product spec. |

```bash
cd web && npm install && cp .env.example .env.local && npm run dev   # app
cd web && npm test                                                    # 13 unit tests
cd contracts && forge install foundry-rs/forge-std --no-git && forge test   # 7 contract tests
```

## Integration status (verified 2026-10-14)

| Piece | Status |
| --- | --- |
| Bohr testnet, chain 968, `rpc.bohr.life` | Verified with `eth_chainId`. |
| PRWA token `0x9228…0a740` | Verified: "Project Real World Asset", PRWA, 6 decimals. |
| IdentityRegistry `0x17e3…5F53`, ModularCompliance `0x1E2e…E37A` | Verified: the token's own `identityRegistry()` and `compliance()` return them. Sample wallets Alice and Bob read `isVerified == true`; an unknown wallet reads `false`. |
| Payment token | **None exists on Bohr.** `contracts/TestUSD` is written, tested and dry-run against Bohr; deploying it needs about 0.02 test BOT from your wallet. |
| Issuer treasury wallet | **Not set.** Any wallet you control. |
| Issuer inventory wallet | **Blocked externally.** It must hold PRWA and be registered in the IdentityRegistry, and only BOT Chain's agents can mint PRWA or register identities. |
| Token transfers | **Blocked externally.** PRWA is paused; deliveries revert until BOT Chain's Token Agent calls `unpause()`. |
| Buyer eligibility for your wallet | **Blocked externally.** Registration is done by the Identity Registry Agent on request. |

BOT Chain's testnet guide says to request test eligibility, test assets and test gas "through public support
channels" (<https://www.botchain.ai/en/ecosystem-support>). Until then Truva reads the real suite, shows the real
eligibility result for any wallet, and keeps checkout closed with the reasons listed on the offering.

A second PRWA suite (`0xA7aE…6036`, IdentityRegistry `0x5C3f…3417`) is referenced on the testnet-practice page.
It is also live; Truva uses the one in the address table. Ask BOT Chain which one they will unpause.

## Threat model

| Threat | What Truva does |
| --- | --- |
| Fake or misconfigured asset listing | Offerings are server config, not user-submitted. Before checkout opens, the server checks every address has code, the token's `identityRegistry()`, `compliance()` and `decimals()` match the config, and the token isn't paused. Any failure closes checkout and is shown on the offering. |
| Malicious issuer or admin | Issuer edits are limited to name, description, contact and disclosure links, each signed by a wallet the token reports as agent or owner, and logged. Addresses, prices and history can't be edited. Settlement state comes only from chain receipts. |
| Wrong contract address or network | Chain ID is set in config and checked; writes are disabled on any other network. The RPC's own chain ID is compared on every verification. |
| Ineligible buyer | `isVerified` is read client-side for the UI, then re-read on the server before an intent is created and on the client before paying. Anything but `true` fails closed. The token's compliance still enforces it on transfer. |
| Payment confirmation spoofing | A payment counts only if the receipt succeeded and contains `Transfer(buyer → treasury, exact amount)` emitted by the configured payment token. A frontend callback or a submitted hash alone changes nothing. |
| Payment duplication or replay | A transaction hash can be linked to one checkout only. Refresh and polling only read. A new payment needs a fresh click through a confirm dialog. |
| Payment confirmed, delivery failed | A reverted delivery moves the checkout to `DELIVERY_FAILED`, never `SETTLED`. The buyer sees the reason and the issuer contact; the state machine forbids any jump to `SETTLED` except from `DELIVERY_PENDING` with a verified transfer. |
| Delivery confirmed, record stale | Every read of a checkout re-checks pending transactions against the chain. Chain state wins. |
| Unsupported or malicious ERC-20 behaviour | Only the configured payment token's logs count, matched on exact `from`, `to` and `value`. Fee-on-transfer or rebasing tokens would fail the exact-amount check and land in `PAYMENT_FAILED`. |
| Unauthorised settlement-state updates | No endpoint sets state directly. State moves only through the tested state machine, driven by chain receipts. |
| RPC or indexer outage | Reads fail closed: verification and eligibility report "unable to verify", and checkout pages keep the last verified state and say the network couldn't be reached. |
| Leaked keys or secrets | Truva holds no private keys. Users sign in their own wallets; issuer edits use signed messages. The only server state is the intent and edit stores. |
| Misleading claims about backing or rights | Every offering states what one token does and doesn't represent. PRWA is labelled a capability demo with no value. Receipts state they are not ownership certificates. The UI never says "secure", "backed", "guaranteed" or "private". |

**Known gaps:** the intent store is a JSON file (single instance only), there's no event indexer (Activity shows
checkouts made through Truva), and no refund flow exists. All are listed in `web/README.md`.
