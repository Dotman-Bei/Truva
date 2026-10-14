# Truva web app

Checkout and settlement status for permissioned tokenized real-world assets on BOT Chain. Next.js 15,
TypeScript, wagmi/viem. Design rules live in [`../docs/FRONTEND.md`](../docs/FRONTEND.md); product rules in
[`../Truva_PRD.md`](../Truva_PRD.md).

## Run it

```bash
cd web
npm install
cp .env.example .env.local   # network values are filled and verified; contract addresses are not
npm run dev                  # http://localhost:3000
npm test                     # state machine and quote maths
npm run build
```

## Configuration

| Variable | Status |
| --- | --- |
| `NEXT_PUBLIC_BOT_CHAIN_ID`, `NEXT_PUBLIC_BOT_RPC_URL`, `NEXT_PUBLIC_BOT_EXPLORER_URL` | Bohr testnet: 968, `https://rpc.bohr.life`, `https://scan.bohr.life`. Checked on 2026-10-14 against the BOT Chain quick guide and an `eth_chainId` call. |
| `NEXT_PUBLIC_RWA_TOKEN_ADDRESS`, `…_IDENTITY_REGISTRY_ADDRESS`, `…_COMPLIANCE_ADDRESS` | Set to BOT Chain's PRWA demo suite and verified on-chain (see the root README). |
| `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS` | **Not set.** Deploy `contracts/TestUSD` and put its address here. |
| `NEXT_PUBLIC_ISSUER_TREASURY_ADDRESS`, `NEXT_PUBLIC_ISSUER_INVENTORY_ADDRESS` | **Not set.** The inventory wallet must hold PRWA and be registered by BOT Chain's agents. |
| `TRUVA_UI_PREVIEW` | `1` enables labelled interface previews (see FRONTEND.md §7). Leave empty for testers. |

Until every address is set and has deployed code, and the token is unpaused, the offering shows **Unable to
verify** and checkout stays closed. That is deliberate: Truva fails closed.

## How a checkout moves

1. The offering page reads `IdentityRegistry.isVerified(wallet)`. Anything but `true` keeps checkout closed.
2. `POST /api/intents` re-checks configuration and eligibility on the server, then stores an intent with
   exact integer amounts (`AWAITING_PAYMENT`, 30-minute quote).
3. The buyer signs one ERC-20 `transfer` to the treasury after a confirm dialog; the hash is linked with
   `POST /api/intents/:id/payment`. A transaction hash can belong to only one checkout.
4. On every read, the server checks the receipt: only a successful transaction containing the exact
   `Transfer(buyer → treasury, amount)` moves the intent to `PAYMENT_CONFIRMED`, then `DELIVERY_PENDING`.
5. The issuer links the delivery from the dashboard. Only the exact token `Transfer(inventory → buyer, quantity)`
   in a successful receipt settles it. A reverted delivery becomes `DELIVERY_FAILED`.

Illegal state jumps throw (`src/lib/stateMachine.ts`); `SETTLED` is reachable only from `DELIVERY_PENDING`.

## Known limits

- Intents and issuer edits are stored as JSON files in `.data/`. This is fine for a single-instance testnet
  demo, not for production; swap in a database before more than one server runs.
- There is no event indexer. Activity lists the checkouts created through Truva, each reconciled against the
  chain when read. It does not discover transfers made outside Truva.
- No refund flow is implemented; the states exist so the UI can show them if an issuer adds one.
- Archive pictures and the 1947 clip are credited third-party material (`public/archive/credits.json`). They show
  historical documents, never Truva’s assets.
