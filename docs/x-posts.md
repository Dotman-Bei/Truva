# X launch posts

All posts fit 280 characters (links count as 23). Banners are in `brand/posts/`.

> Before posting: make https://github.com/Dotman-Bei/Truva public, or the GitHub links will not open.

## 1. Launch post (PR)

Banner: `brand/posts/post-pr.png`

```
Officially launched on BOT Chain Mainnet.

Truva: an ERC-3643 checkout for tokenized real-world assets: eligibility read from the IdentityRegistry, payment and delivery verified from on-chain Transfer events.

Live capability demo, valueless test assets:
https://truva-smoky.vercel.app
```

## 2. Technical thread (5 posts)

Banner on the first post: `brand/posts/post-thread.png`. Post each next one as a reply.

**1/5**

```
How a Truva checkout settles on BOT Chain Mainnet (chain 677).

Four steps, each verified on-chain: eligibility, payment intent, payment, delivery. Nothing is marked complete because a frontend says so.

A technical thread. 1/5
```

**2/5**

```
Eligibility. Truva calls IdentityRegistry.isVerified(wallet) on the asset's ERC-3643 suite.

It is re-read on the server before an intent is created and again before payment. If the read fails, checkout stays closed: fail-closed by design. 2/5
```

**3/5**

```
Intent and payment. Quotes are exact integer units derived from token decimals; no floats.

The buyer signs one ERC-20 transfer. Truva confirms it only if the receipt succeeded and contains Transfer(buyer → treasury, exact amount) from the configured token. 3/5
```

**4/5**

```
Delivery. The issuer transfers the RWA token. ERC-3643 compliance runs inside the token, so a transfer to an unverified wallet reverts.

Truva settles only on a successful Transfer(inventory → buyer, exact quantity). A reverted delivery becomes Delivery failed. 4/5
```

**5/5**

```
Integrity. Every tx hash is claimed atomically by exactly one checkout, so a replayed payment is refused. The state machine rejects illegal jumps: Settled is reachable only from Delivery pending.

Code: https://github.com/Dotman-Bei/Truva
Live: https://truva-smoky.vercel.app 5/5
```

## 3. Standalone posts

**Post 1**: banner `brand/posts/post-failclosed.png`

```
Truva fails closed.

If the IdentityRegistry can't be read, if a contract address has no code, or if the token reports paused(), checkout does not open. The offering page lists the exact reason instead.

An unknown answer is treated as a no.

https://truva-smoky.vercel.app/assets
```

**Post 2**: banner `brand/posts/post-receipt.png`

```
A Truva receipt summarises verified on-chain transactions: offering, buyer wallet, payment and delivery hashes, block numbers, settlement time.

It is not a certificate of legal ownership. What a token represents is defined by its issuer, and Truva shows that on every offering.
```

**Post 3**: banner `brand/posts/post-gas.png`

```
Truva's mainnet suite reuses BOT Chain's published T-REX 4.1.3 and ONCHAINID 2.2.1 implementations through proxies instead of redeploying the logic.

Token, IdentityRegistry, compliance, payment token, registration and mint: 0.102 BOT in total at the 20 gwei floor.
```

**Post 4**: banner `brand/posts/post-health.png`

```
Truva exposes its own status at /api/health: storage read and write, and the chain ID the RPC reports, checked against the configured network.

If either fails, it returns 503 rather than a green light.

https://truva-smoky.vercel.app/api/health
```

**Post 5**: banner `brand/posts/post-issuers.png`

```
Truva is built for issuers already running an ERC-3643 suite on BOT Chain.

Point it at your token, IdentityRegistry and compliance contracts, and buyers get a checkout that verifies every step on-chain. Source code is public.

https://github.com/Dotman-Bei/Truva
```
