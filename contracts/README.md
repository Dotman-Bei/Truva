# Truva contracts

Bohr testnet has no public test stablecoin, so the checkout needs one payment token of its own:
**`TestUSD`**, "Truva Test USD (no value)", 6 decimals.

- No owner, no admin, no upgrade path. The only way to get tokens is `faucet()`: 10,000 tUSD per
  wallet per 24 hours.
- It is a standard ERC-20. Truva verifies payments by the `Transfer(buyer → treasury, amount)` event.
- The deploy script refuses to run on any chain except Bohr testnet (968).

Truva deploys no other contract: the RWA token, IdentityRegistry and ModularCompliance are BOT
Chain's existing ERC-3643 suite.

## Test

```bash
forge install foundry-rs/forge-std --no-git   # first time only
forge test
```

## Deploy to Bohr testnet

Needs about 0.02 test BOT for gas. Use your own test wallet; never a key that holds real funds.

```bash
forge script script/DeployTestUSD.s.sol --rpc-url bohr --broadcast --interactive 1
```

`--interactive` asks for the private key in the terminal, so it is never written to disk or shell
history. Put the printed address in `web/.env.local` as `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS`.
