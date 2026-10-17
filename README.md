# Truva

An RWA checkout and settlement layer for BOT Chain: an eligible buyer pays for an approved tokenized asset,
and Truva verifies the payment-to-delivery lifecycle on-chain. It integrates BOT Chain's existing ERC-3643
(T-REX) suite and never bypasses its identity or compliance rules.

**Live on Bohr testnet: <https://truva-smoky.vercel.app>**: a real checkout settled through the live site,
[`TRV-VNYT-JWSK`](https://truva-smoky.vercel.app/checkout/TRV-VNYT-JWSK) (payment
[`0x378b736b…bd312d`](https://scan.bohr.life/tx/0x378b736b2c40c357315cb7a3912c1dd64c557d9d261bc6fc38a2e693b5bd312d),
delivery [`0x1968c5de…21eebfe`](https://scan.bohr.life/tx/0x1968c5de1a45fdf70b03c35a942ec0ef46f18711bbaa3fdb4a3abf07b21eebfe)).
Hosted on Vercel with Upstash Redis; Next.js 15.5.27.

| Folder | What it is |
| --- | --- |
| [`web/`](web/) | Next.js app: seven pages, the intent API and on-chain verification. Setup in [`web/README.md`](web/README.md). |
| [`contracts/`](contracts/) | `TestUSD` (valueless payment token) and the scripts that deploy Truva's demo ERC-3643 suite. Foundry. |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Design spec. [`Truva_PRD.md`](Truva_PRD.md) is the product spec. |

```bash
cd web && npm install && cp .env.example .env.local && npm run dev   # app
cd web && npm test                                                    # 17 unit tests
cd contracts && npm install && forge install foundry-rs/forge-std --no-git && forge test   # 12 contract tests
```

## BOT Chain mainnet: capability demo (2026-10-17)

A real checkout settled on **BOT Chain mainnet (chain 677)**, `TRV-QR56-B6AM`, verified by Truva step by step:

| Step | Mainnet transaction |
| --- | --- |
| Buyer draws test tUSD | [`0x7d5464a9…0576fc66`](https://scan.botchain.ai/tx/0x7d5464a938d6f6b55e5aeea0612884fa1d17ea858376fb64c629d4a30576fc66) |
| Buyer pays 250 tUSD → `DELIVERY_PENDING` | [`0x72efd611…ad46c08c`](https://scan.botchain.ai/tx/0x72efd611d75e32f63b53059bfe88d8e88ace239afa0cda5b3ed8e21ead46c08c), block 27001726 |
| Issuer delivers 25 TDA → `SETTLED` | [`0x7162ea6b…1aab9846f`](https://scan.botchain.ai/tx/0x7162ea6b240984937e50ded9d73588db4c738c1010eb82b873da39d1aab9846f), block 27001733 |

| Contract (mainnet) | Address |
| --- | --- |
| Truva Demo Asset (TDA) | `0x4180485a08B52c54Fd6Ebd632D787356c35112b3` |
| IdentityRegistry | `0x7f3727Ae8906CB67405626164D96eb65Eae282af` |
| ModularCompliance | `0xF15E7096e6bb4194826D72EE357297b5A15A1215` |
| TestUSD (tUSD) | `0x7164eB049f6A99D3a704a3137e8D6918B5A47609` |

Full list: [`contracts/deployments/bot-mainnet-demo.json`](contracts/deployments/bot-mainnet-demo.json).

**This is a capability demo, like BOT Chain's own mainnet PRWA.** Both tokens are valueless and no real-world
asset is sold. To keep gas low (0.102 BOT for the whole deployment, at the network's 20 gwei floor), the suite is
proxies on BOT Chain's published T-REX 4.1.3 and ONCHAINID 2.2.1 implementation authorities, and eligibility is
"registered by the issuer" without KYC claims. BOT Chain owns those authorities and could upgrade the logic behind
the proxies. Selling a real asset for real money needs a real issuer, legal review and a security review first.

## Testnet status (2026-10-14): a real checkout has settled on Bohr

**First end-to-end checkout, `TRV-ZBXK-3JY7`, settled on Bohr testnet (chain 968):**

| Step | Transaction |
| --- | --- |
| Buyer draws test tUSD from the faucet | [`0x96c46ff3…26d9ae9`](https://scan.bohr.life/tx/0x96c46ff3e595d4cbd9dd43a7993d727c47d63ed7c1151f2d703fe04cb26d9ae9) |
| Buyer pays 250 tUSD to the issuer treasury (verified by Truva → `DELIVERY_PENDING`) | [`0x90219d84…23e1a6c`](https://scan.bohr.life/tx/0x90219d84795567871d4c7aceef99aa7e9a0af7df294e1fc9a240c831a23e1a6c), block 26843733 |
| Issuer delivers 25 TDA through the ERC-3643 suite (verified by Truva → `SETTLED`) | [`0x0a4b309e…f586e47`](https://scan.bohr.life/tx/0x0a4b309e220fb50b5bc1e8f1991cf20cd32bfb50b6f6fdbb63d7eb876f586e47), block 26843752 |

Checked on the same run: replaying that payment hash on a new checkout is refused; an ineligible wallet is
refused (403); an amount under the minimum is refused (400).

### What's deployed on Bohr testnet

| Contract | Address |
| --- | --- |
| Truva Demo Asset (TDA), ERC-3643 token | `0xE00EE1B6da55aA48f5DAaF5d486BCa534165FFe1` |
| IdentityRegistry | `0x6878acfb92EC4a4D2921889CCd04284BC357d3D1` |
| ModularCompliance | `0xc3D514b77f253F328c54D94fddA3e7FD6024fBC9` |
| TestUSD (tUSD), payment token | `0xA5064e9b0F54751C93A3283BAa605948f4dce56C` |

The full list (registries, claim issuer, ONCHAINIDs, roles) is in
[`contracts/deployments/bohr-demo-suite.json`](contracts/deployments/bohr-demo-suite.json).

**Why Truva runs its own suite.** BOT Chain's public PRWA suite (token `0x9228…0a740`) is paused, its
registry only accepts identities registered by BOT Chain's agents, and its T-REX gateway is closed to public
deployment. So Truva deployed the *unmodified* Tokeny T-REX 4.1.6 and ONCHAINID 2.2.1 contracts on Bohr,
using BOT Chain's `KYC_APPROVED` claim topic, with Truva's test wallet as issuer and agent. Eligibility is real:
each buyer has an ONCHAINID holding a signed KYC claim from a trusted ClaimIssuer, and the token itself rejects
transfers to unverified wallets. To switch back to BOT Chain's suite once it is unpaused, change the three
`NEXT_PUBLIC_RWA_*` addresses in `web/.env.local`; nothing else changes.

## Onboard testers

Only registered wallets can buy. To let someone test the live site, ask for their wallet address (MetaMask on
Bohr testnet) and run, from `contracts/`:

```bash
./onboard.sh 0xTHEIR_WALLET 0xANOTHER_WALLET     # registers them and sends 0.05 test BOT each for gas
./onboard.sh --check 0xTHEIR_WALLET               # only shows whether a wallet is eligible
```

Each new tester gets an ONCHAINID with a signed KYC claim and is registered in the IdentityRegistry, at about
0.11 test BOT from the issuer wallet. Wallets that are already eligible are skipped. Testers then open the
offering, use **Get 10,000 test tUSD**, and pay. To keep testers simple, the issuer manages their ONCHAINID;
in production each investor would hold their own identity key.

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
