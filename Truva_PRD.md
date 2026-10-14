# PRD.md — Truva

## 1. Product Overview

**Product name:** Truva  
**Ecosystem category:** RWA  
**Target chain:** BOT Chain  
**Product type:** Checkout, payment-status, and settlement coordination for permissioned tokenized real-world assets.

### One-sentence pitch

**Truva is an RWA checkout and settlement layer that helps eligible buyers pay for approved tokenized assets and verify the payment-to-delivery lifecycle on BOT Chain.**

### Product concept

Truva provides a straightforward payment and settlement experience for a tokenized real-world asset. An approved issuer lists an asset offering, an eligible buyer selects an amount, Truva creates a payment intent, the buyer submits payment using an explicitly supported payment asset, and Truva tracks whether the payment and token delivery have completed.

Truva is an integration and workflow layer. It does not independently prove that an underlying real-world asset exists, create legal ownership rights, perform custody, value an asset, or replace the asset issuer's legal and compliance obligations.

The name **Truva** should signal trust and verifiable value movement. The product must not claim that transactions are anonymous, invisible, untraceable, or private when standard public blockchain transactions are used.

### MVP scope

Build one end-to-end demo workflow around one approved RWA token suite and one configured payment asset on BOT Chain testnet. Keep the integration modular so additional suites and payment assets can be configured later.

Do not attempt to build a universal marketplace, exchange, bridge, RWA issuer, custody service, privacy mixer, or complete compliance platform in the MVP.

---

## 2. Problem

Tokenized RWA transfers involve several separate steps: an asset issuer defines the offering, investors may need to meet eligibility requirements, payments must be tracked, token allocations/transfers must comply with the asset's rules, and the buyer needs a clear record of what happened.

Truva aims to make the buyer-facing and issuer-facing workflow easier to follow by bringing these steps together in a single checkout and transaction-status experience.

The MVP should answer these questions clearly:

- What asset or tokenized interest is being purchased?
- Who is the issuer or responsible entity?
- What does one token represent, and what does it not represent?
- Is the connected wallet eligible according to the configured RWA suite?
- What payment asset and amount are required?
- Has the payment been confirmed?
- Has token delivery completed?
- If a step fails or is pending, what is the current state and next action?
- Where can the user verify the relevant transactions on-chain?

---

## 3. BOT Chain and RWA Context

The BOT Chain ecosystem includes an RWA category in its Project Party directory. BOT Chain's official RWA documentation describes an ERC-3643 (T-REX)-based issuance and transfer system. In that system, the token maintains balances, `IdentityRegistry` determines wallet eligibility, and `ModularCompliance` checks whether transactions comply with configured rules.

Truva must integrate with this model rather than bypass it.

### Required RWA principles

1. Do not treat an ERC-20-compatible balance as proof that a buyer is eligible to receive an RWA token.
2. Read eligibility and transfer outcomes from the configured RWA suite and its documented interfaces.
3. Never bypass `IdentityRegistry`, `ModularCompliance`, pause/freeze rules, or other suite checks.
4. Do not store identity-document images or sensitive personal data on-chain.
5. Clearly identify the issuer and the information supplied about the underlying asset.
6. Do not claim that a token by itself establishes legal ownership, custody, valuation, redemption rights, or the existence of a physical asset.
7. Do not list an asset as real, backed, audited, approved, or redeemable unless the responsible issuer provides verifiable evidence for that claim.

### Public demo asset warning

BOT Chain's published RWA documentation states that the public `PRWA` asset on BOT Mainnet is a capability-demo asset, is not evidence of real-world asset rights, and must not directly carry real assets. The build agent must verify current official documentation before selecting an integration target. Use testnet or a clearly labelled demonstration flow for development unless an asset suite and offering have been independently approved for the intended use.

Official references to consult during implementation:

- BOT Chain Project Party: https://www.botchain.ai/en/project-party/
- BOT Chain RWA Development Manual: https://dev-docs.botchain.ai/docs/RWA/project-rwa-developer-docs/
- RWA integration overview: https://dev-docs.botchain.ai/docs/RWA/quick-understanding/
- BOT Chain ecosystem support: https://www.botchain.ai/en/ecosystem-support
- BOT Chain developer quick guide: https://dev-docs.botchain.ai/docs/Developers/quick-guide/

---

## 4. BOT Labs Incubation Alignment

The build must follow the BOT Chain Builder / BOT Labs incubation principles: a deployed product, a working demo, credible use, ecosystem fit, milestone execution, public documentation, and evidence of community engagement.

### 4.1 Technical capability

The repository must contain working code, tests, a reproducible setup, and an end-to-end demo. A slide deck or frontend-only mockup is not sufficient.

### 4.2 Market potential

The target initial user is an approved RWA issuer that needs a clearer buyer checkout and settlement workflow, plus a buyer whose wallet must pass the relevant asset suite's eligibility and compliance rules.

Validate demand with interviews or hands-on testing with potential issuers, integrators, or qualified testers. Do not claim product-market fit without evidence.

### 4.3 Ecosystem fit

Truva should generate useful BOT Chain interactions through payment intents, payment confirmation, eligible token transfers/allocations, and settlement records. It must use BOT Chain as a meaningful source of transaction state, not simply as a wallet-login option.

### 4.4 Milestones and incubation readiness

Plan implementation as stages with checkable outcomes rather than one large delivery:

- **M1 — Testnet integration:** validated configuration, wallet connection, read-only RWA suite integration, asset detail, eligibility check.
- **M2 — Complete checkout flow:** create payment intent, submit payment, confirm transaction, handle token delivery/allocation, record settlement status.
- **M3 — First external testers:** run a controlled demo with real testers and record usage accurately.
- **M4 — Mainnet readiness review:** contract review, asset/issuer authorization, compliance/legal review, verified contracts, and documented rollout plan. Do not process real RWA transactions until approved.
- **M5 — Ecosystem growth:** issuer onboarding, integrations, published tutorials/build logs, and repeat users.

### 4.5 Community foundation

Publish useful build updates, setup documentation, tutorials, and feedback for BOT Chain builders. Be truthful about product state and user metrics.

### 4.6 No unnecessary token

Truva does not need its own token. Do not create a Truva token for the MVP. A payment asset or RWA token may be used only where required by a configured, approved flow.

### 4.7 Evidence of usage

Track and report real measurements such as connected wallets, checkout intents, successful payment confirmations, completed settlements, failed/pending settlements, unique users, and repeat users. Do not fabricate transactions or inflate usage.

---

## 5. Target Users and Roles

### 5.1 Buyer / Investor

A wallet holder who wants to view an asset offering, check wallet eligibility, understand the payment terms, initiate checkout, and confirm the status of token delivery.

### 5.2 Issuer / Offer Administrator

An authorized representative of the underlying asset issuer who configures the offering details, supported token suite, sale terms, payment asset, and fulfillment method. The issuer remains responsible for legal disclosures and the underlying asset.

### 5.3 Truva Operator

A restricted platform role that manages the demo's configured asset records, allowed token/payment integrations, and operational settings. The operator must not be able to alter a completed on-chain settlement record silently.

### 5.4 Read-only Visitor

A visitor who can review public asset descriptions, issuer information, disclosed risks, and public transaction status without initiating a purchase.

---

## 6. MVP User Flows

### 6.1 Buyer checkout

```text
Open Truva
   ↓
Browse approved/demo asset offerings
   ↓
Open asset details and disclosures
   ↓
Connect wallet
   ↓
Check eligibility against configured RWA suite
   ↓
Enter purchase amount
   ↓
Review quantity, payment asset, fees, risks and delivery conditions
   ↓
Create payment intent
   ↓
Approve/submit supported payment transaction
   ↓
Wait for transaction confirmation
   ↓
Complete token delivery/allocation through the configured suite/issuer flow
   ↓
Mark checkout settled only when payment and delivery conditions are verified
   ↓
Show receipt with explorer links
```

### 6.2 Pending or failed checkout

- If payment has not confirmed, keep the intent pending and allow the user to refresh status.
- If payment confirms but token delivery is pending, show **Payment confirmed — delivery pending** and provide a traceable reference.
- If the token transfer/allocation is rejected by the RWA suite, do not mark the checkout complete. Show the actual state and expose an authorized resolution/refund process if one is implemented.
- Do not tell users that a payment succeeded merely because a frontend callback fired. Verify on-chain state.
- Do not retry a payment automatically without a fresh explicit user action.

### 6.3 Issuer operations

- Authorized issuer/operator creates or configures an offering.
- The offering is associated with an already deployed and verified token suite and the issuer's fulfillment method.
- The issuer provides information describing what the token represents, the responsible legal entity, required eligibility, payment terms, transfer restrictions, and any redemption/settlement conditions.
- The offering is published only after all required configuration and disclosures are complete.
- The issuer can review checkout states but cannot rewrite transaction history.

---

## 7. Asset Offering Model

Each offering must contain, at minimum:

- Unique offering ID
- Display name
- Short description
- Issuer legal/entity name and contact reference
- Asset category
- Clear description of the tokenized right or interest
- Explicit disclaimer describing what the token does not represent
- Token name, symbol, decimals, and contract address
- RWA suite/contract references required for eligibility and transfer checks
- Network/environment
- Payment asset address, symbol, and decimals
- Price/quantity rules
- Minimum and maximum purchase, if applicable
- Offering start/end status and timestamps
- Disclosure or documentation links
- Issuance/fulfillment method
- Offering status: Draft, Demo, Active, Paused, Closed
- Last configuration verification timestamp

For the MVP, support one configured demo offering. Do not build a permissionless asset marketplace.

---

## 8. Eligibility and Compliance Checks

Before checkout is enabled, Truva must query the relevant RWA suite to determine whether the wallet meets the configured eligibility state. Use the documented interface and the exact suite addresses for the selected environment.

Requirements:

- Show a simple state such as Eligible, Not eligible, or Unable to verify.
- Do not infer eligibility from token balance alone.
- Do not expose sensitive identity/claim details unnecessarily.
- Do not collect or upload government ID documents unless a future, separately reviewed onboarding workflow requires it.
- Do not implement a fake KYC system or label a wallet “verified” based only on a frontend toggle.
- Re-check eligibility immediately before a purchase/fulfillment action where the underlying suite requires it.
- Let the underlying RWA contracts enforce compliance. Frontend checks are informative, not a substitute for contract enforcement.
- If the eligibility contract call fails, fail closed: disable checkout and explain that eligibility could not be verified.

---

## 9. Payment and Settlement Model

### 9.1 MVP approach

Implement the smallest safe end-to-end checkout compatible with the selected testnet RWA suite. The payment asset must be explicitly configured and its address, decimals, transfer behavior, and environment must be verified from trusted sources.

Do not assume that a token transfer automatically grants legal rights to an asset. Truva is a workflow and settlement-status layer around an issuer-authorized tokenized offering.

### 9.2 Payment intent

Each payment intent should have:

- Unique intent ID
- Buyer wallet
- Offering ID
- Payment asset
- Payment amount
- Requested token quantity
- Creation/expiry timestamps
- Payment transaction hash, once submitted
- Token delivery transaction hash, once submitted
- Current state
- Error/reference field that does not contain sensitive secrets

### 9.3 State machine

Use an explicit, tested lifecycle such as:

```text
CREATED
  ↓
AWAITING_PAYMENT
  ↓
PAYMENT_SUBMITTED
  ↓
PAYMENT_CONFIRMED
  ↓
DELIVERY_PENDING
  ↓
SETTLED
```

Terminal/exception states may include:

- EXPIRED
- PAYMENT_FAILED
- DELIVERY_FAILED
- REFUND_PENDING (only if a refund flow exists)
- REFUNDED (only after verifiable refund completion)
- CANCELLED (only if cancellation is valid for that stage)

Do not permit illegal state jumps. In particular, a checkout must not enter SETTLED unless the configured payment and token delivery requirements have both been verified.

### 9.4 Funds handling

Prefer a non-custodial or narrowly scoped flow where possible. Do not describe Truva as an escrow agent or custodian unless the implemented contracts and legal structure actually establish that role.

For MVP, do not implement a generalized escrow contract or hold real assets unless required by the chosen testnet flow and reviewed for security. If an escrow/settlement contract is used, define its permissions, release conditions, refund conditions, failure handling, and threat model before coding it.

### 9.5 Fees

Do not invent protocol fees. The MVP should either charge no Truva fee or display a clearly configurable fee with a documented purpose. All fees must be shown before the user signs a transaction.

---

## 10. Token Delivery / Fulfillment

Token delivery must use a documented, issuer-authorized method compatible with the selected RWA suite.

Possible configured approaches include:

- Transfer from an issuer-controlled inventory wallet, provided the source and recipient are eligible and all compliance rules pass.
- Issuer-mediated allocation/minting, only where the issuer role and suite permissions explicitly authorize it.

Truva must not attempt privileged `mint`, `burn`, identity-registration, forced-transfer, pause, or freeze operations using unauthorized roles.

The settlement verifier must confirm the actual on-chain delivery outcome. Never mark delivery complete based only on a backend database update.

If the configured suite's architecture does not support the planned checkout/fulfillment flow, document that blocker and adapt the flow. Do not work around the suite's eligibility/compliance rules.

---

## 11. Receipt and Activity History

For each checkout, show:

- Intent/reference ID
- Offering name
- Buyer wallet
- Payment asset and amount
- Payment transaction status/link
- Delivery transaction status/link
- Quantity delivered, if applicable
- Current settlement state
- Created/updated timestamps
- Failure reason or next step, where appropriate

The receipt is an audit-friendly application summary, not a legal certificate of underlying asset ownership.

Activity history should be derived from verified contract events and transactions wherever possible. If data is indexed off-chain for faster display, on-chain state remains authoritative.

---

## 12. Issuer Dashboard

The issuer/operator dashboard should allow authorized roles to:

- View configured offerings
- View offering status and configuration verification state
- View checkout intents and their states
- Filter by pending, settled, failed, expired, or delivery-pending status
- Open associated transaction hashes in the configured explorer
- See aggregate counts and totals clearly marked as derived values
- Update permitted non-critical offering metadata when appropriate

The dashboard must not permit an administrator to alter historic transaction hashes or silently convert an unsuccessful checkout into a settled one.

---

## 13. Portfolio

The connected user's portfolio should show holdings from configured RWA token contracts and the state of their recent Truva checkouts.

Display, where available:

- Asset/token name and symbol
- Balance read from contract state
- Contract/network reference
- Eligibility status where this is safe and meaningful to display
- Recent purchases/settlements
- Pending deliveries
- Transaction links

Do not calculate or display speculative portfolio valuations unless there is a verified, documented price source. Never present a demo token as a real asset holding.

---

## 14. Standard Pages and Routes

The MVP will have **7 standard pages/routes**.

### 1. Home
**Route:** `/`

Purpose:
- Explain Truva's RWA checkout and settlement role
- Show a small number of configured offerings or demo status
- Link to asset browsing and recent activity
- Provide wallet connection

### 2. Asset Offerings
**Route:** `/assets`

Purpose:
- List approved or clearly labelled demo offerings
- Show issuer, token details, offering status, and network
- Filter basic states such as Active and Demo

### 3. Asset Detail
**Route:** `/assets/[assetId]`

Purpose:
- Show asset/token details and issuer information
- Explain the represented interest and limitations
- Display disclosures and configured suite details
- Check connected wallet eligibility
- Initiate checkout when eligible and offering is active

### 4. Checkout
**Route:** `/checkout/[intentId]`

Purpose:
- Review purchase quantity and payment amount
- Show supported payment asset and fees
- Create/submit payment intent actions
- Track payment and token delivery state
- Show recovery/next steps for pending or failed checkouts

### 5. Activity
**Route:** `/activity`

Purpose:
- Show recent public checkout/settlement activity
- Filter by state
- Open payment and delivery explorer links
- Distinguish testnet/demo transactions from approved production transactions

### 6. Issuer Dashboard
**Route:** `/dashboard`

Purpose:
- Restrict issuer/operator controls to authorized roles
- Manage configured offering metadata and status
- View checkout states, settlement results and summary metrics

### 7. Portfolio
**Route:** `/portfolio`

Purpose:
- Show the connected user's configured RWA token balances
- Show recent checkouts and settlements
- Identify pending delivery states

### Route summary

```text
/                       Home
/assets                 Asset Offerings
/assets/[assetId]       Asset Detail
/checkout/[intentId]    Checkout
/activity               Activity
/dashboard              Issuer Dashboard
/portfolio              Portfolio
```

**Total standard pages: 7**

Wallet prompts, eligibility feedback, transaction states, pending confirmation, errors, receipts, and modal confirmations should be handled within these routes rather than adding unnecessary standalone routes.

---

## 15. Frontend Implementation Rule

This PRD deliberately contains **no visual or design requirements**.

When it is time to build the frontend, the coding agent MUST first read and follow `frontend.md`.

`frontend.md` is the source of truth for visual design, page layout, components, styles, responsive behavior, interactions, typography, hierarchy, and frontend polish.

Do not invent separate or competing visual rules in this PRD. Implement the required behavior and routes here, while taking all design decisions from `frontend.md`.

---

## 16. Smart Contract and Integration Architecture

Keep the MVP architecture small and integrate with BOT Chain's existing RWA suite rather than rebuilding an ERC-3643 system unnecessarily.

### Required integration modules

- **Network configuration:** independently configured testnet/mainnet RPC, chain ID, explorer, and contract references.
- **RWA suite adapter:** read asset metadata, balance, eligibility, and documented events; submit only operations that are valid for the current role.
- **Payment adapter:** verify and submit the configured payment asset operation.
- **Checkout state machine:** validate legal state transitions and link payments to delivery outcomes.
- **Read/index layer:** optionally index events for activity lists and dashboards, with chain state as the source of truth.

### Optional Truva settlement contract

Add a settlement contract only if the selected workflow requires an on-chain payment intent/receipt that cannot be represented safely through existing contracts and transaction events.

If added, define and test:

- Who can create an intent
- Who can change state
- Whether it ever holds funds
- Payment confirmation rules
- Delivery confirmation rules
- Expiry and cancellation behavior
- Refund behavior, if supported
- Replay/double-settlement protection
- Admin powers and emergency behavior

Do not deploy an unnecessary contract solely to increase the amount of blockchain code.

---

## 17. Security Requirements and Threat Model

Follow the BOT Chain Builder security baseline and standard EVM safety practices.

### Smart contract safety

- Checks-effects-interactions
- Reentrancy protection where relevant
- Explicit access control
- No unbounded loops
- Validated token/asset addresses
- Safe handling of token decimals and integer amounts
- Explicit state-transition checks
- Duplicate settlement prevention
- Replay protection for payment/delivery references
- No silent modification of completed receipts
- Safe pausing/emergency behavior where appropriate

### RWA and compliance safety

- Never bypass the suite's identity or compliance rules.
- Never expose sensitive identity claims or documents unnecessarily.
- Never accept a frontend-only eligibility assertion as authoritative.
- Do not handle production RWA assets without issuer approval, legal review, security review and a verified integration.
- Do not imply that token ownership alone guarantees off-chain redemption or property rights.

### Payment safety

- Verify payment token address and decimals from the current environment configuration.
- Verify chain ID before signing/submitting.
- Handle wrong-network connections.
- Never assume a transaction succeeded before observing the required on-chain confirmation/state.
- Prevent accidental repeated payments on refresh/retry.
- Never store private keys, seed phrases, or wallet signing secrets on the server.
- Treat external API results and webhooks as untrusted until validated.
- Keep secrets server-side and out of source control.

### Threat model to document in README

Include at least:

- Fake or misconfigured asset listing
- Malicious issuer/admin
- Wrong contract address or network
- Ineligible buyer
- Payment confirmation spoofing
- Payment duplication/replay
- Payment confirmed but delivery failed
- Delivery confirmed but indexer is stale
- Unsupported or malicious ERC-20 behavior
- Unauthorized settlement-state updates
- RPC/indexer outage
- Leaked API keys or server secrets
- Misleading claims about asset backing/legal rights

---

## 18. Chain Configuration and Environments

Before integration or deployment, the coding agent MUST fetch and verify current BOT Chain and RWA configuration from official documentation.

Verify at build time:

- Bohr Testnet chain ID and RPC
- BOT Chain Mainnet chain ID and RPC
- Explorer URLs
- Test token/faucet information
- RWA suite, token, registry, compliance and gateway addresses required by the chosen flow
- ABIs and documented interfaces
- Which asset suites are demonstrations versus production-approved integrations

Do not blindly hardcode contract addresses or copy environment values from this PRD. Use environment-specific configuration and validate the connected chain before enabling write operations.

Keep testnet and mainnet addresses, identity registrations, claims, and balances separated. The current RWA manual documents independent testnet and mainnet environments; the agent must reread the current documentation because values and deployment state may change.

Suggested configuration variables include (adapt to the selected stack):

```env
NEXT_PUBLIC_CHAIN_ENV=bohr-testnet
NEXT_PUBLIC_BOT_CHAIN_ID=
NEXT_PUBLIC_BOT_RPC_URL=
NEXT_PUBLIC_BOT_EXPLORER_URL=
NEXT_PUBLIC_RWA_TOKEN_ADDRESS=
NEXT_PUBLIC_RWA_IDENTITY_REGISTRY_ADDRESS=
NEXT_PUBLIC_RWA_COMPLIANCE_ADDRESS=
NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS=
TRUVA_OPERATOR_PRIVATE_KEY=
```

Only include an operator private key if the architecture strictly requires a server-side operator transaction. Prefer user-signed actions and managed signer infrastructure over a raw private key. Never expose private secrets using public-prefixed environment variables. The sample above is a variable checklist, not a statement that every variable must be public.

---

## 19. Technology Expectations

Use standard EVM tooling and a maintainable implementation.

Suggested options:

- Solidity only if a Truva contract is needed
- Hardhat or Foundry for contracts and tests
- TypeScript
- React/Next.js or a comparable web framework
- viem/wagmi or equivalent wallet/RPC tooling
- A small backend/indexer only where required for reliable event indexing or server-side orchestration

The building agent can choose equivalent tooling if it documents the choice and keeps the product compatible with BOT Chain and the selected RWA suite.

Do not add a complex backend, database, message queue, or custom indexer unless the actual flows need it.

---

## 20. Data and Privacy

On-chain contracts are authoritative for balances, eligibility responses exposed by the suite, payment transaction state, token transfers, and any on-chain settlement receipt.

An optional database/indexer may maintain read-optimized copies of offerings, checkout summaries, and event history. It must support re-sync/reconciliation from chain data.

Rules:

- Never store seed phrases or private keys.
- Do not put sensitive identity documents or personal data on-chain.
- Do not log API secrets or authorization headers.
- Store only data needed for the workflow.
- Mark demo/testnet data clearly.
- Make it clear that public blockchain transactions and wallet addresses are visible to observers.
- Do not market Truva as an anonymity or transaction-obfuscation tool.

---

## 21. MVP Non-Goals

Do NOT build these into the first release:

- Truva utility token
- Privacy mixer or transaction obfuscation
- Anonymous or untraceable payments
- Multi-chain support
- Cross-chain bridge
- General-purpose DEX or order book
- RWA asset issuance platform from scratch
- Replacement for ERC-3643 identity/compliance contracts
- Unrestricted permissionless asset listings
- Custodial wallet
- Real-world asset valuation engine
- Legal-title or ownership verification service
- Guaranteed redemption or yield claims
- Automated underwriting/credit scoring
- Complex escrow or dispute arbitration unless specifically required and reviewed
- Multiple payment assets before the first end-to-end flow is stable
- Real production asset offerings using the public demo token

---

## 22. Future Expansion

Only consider after the MVP is tested with users and the integration path is verified.

### Phase 2 — Issuer integrations

- Support multiple approved ERC-3643 suites
- Improve issuer onboarding/config validation
- Add controlled payment-asset configuration
- Add reconciliation tools for failed/pending deliveries

### Phase 3 — Embedded checkout

- Payment-link or SDK/API integration for issuer websites
- Webhook/event notifications with signature validation
- Invoice-style references and settlement reports

### Phase 4 — Settlement automation

- Permissioned automated release after verified delivery
- Better refund/expiry handling if appropriate
- Auditable operational controls

### Phase 5 — Broader RWA lifecycle

- Approved tokenized receivables or fund units where legal and technical integrations exist
- Reporting and issuer analytics
- Additional compliance/reporting integrations

These are future possibilities, not promises of current capability.

---

## 23. Metrics

Track real metrics from the start.

### Product usage

- Connected unique wallets
- Offerings viewed
- Eligibility checks
- Checkout intents created
- Payment transactions submitted
- Payment confirmations
- Completed token deliveries
- Completed settlements
- Failed/expired/delivery-pending checkouts
- Repeat users

### On-chain activity

- Truva-related transactions
- Payment transaction count/value by configured asset
- RWA token transfer/allocation count
- Settlement receipts, if implemented
- Unique interacting wallets

### Quality and reliability

- Checkout completion rate
- Median time from payment submission to confirmation
- Median time from payment confirmation to token delivery
- Failed delivery rate
- Stale indexer/reconciliation incidents
- Wallet/network configuration failures

Use clearly defined metrics and do not count one user multiple times beyond the stated methodology. Do not fabricate usage numbers.

---

## 24. Milestone Plan

### M1 — Research and project foundation

- Read this PRD and the complete official BOT Chain RWA manual.
- Verify current integration paths and addresses.
- Select one testnet RWA suite and payment asset.
- Document the exact checkout and fulfillment flow.
- Initialize repository, testing, linting, and environment configuration.
- Connect wallet and implement read-only network/suite checks.

### M2 — Asset discovery and eligibility

- Implement configured offering data.
- Implement asset detail page/data adapter.
- Read token metadata and balances.
- Query eligibility using the suite's documented interface.
- Add tests and clear failure states.

### M3 — Checkout and settlement flow

- Create payment intent.
- Submit and verify the payment transaction.
- Integrate authorized token delivery/allocation.
- Verify the delivery transaction.
- Implement state machine and activity/receipt history.
- Add retry protection and reconciliation behavior.

### M4 — Issuer dashboard and portfolio

- Implement offering status/configuration display.
- Implement issuer/operator access restrictions.
- Show pending, completed, and failed checkout states.
- Read portfolio balances from chain.
- Implement all standard routes.
- Follow `frontend.md` for the entire frontend implementation.

### M5 — Security and testnet acceptance

- Add contract tests if a Truva contract exists.
- Add integration and end-to-end tests.
- Test wrong chain, ineligible wallet, rejected transfer, missing payment, duplicate retry, stale indexer, and RPC outage cases.
- Verify all critical contract addresses and network assumptions.
- Publish setup/deployment instructions.
- Run a controlled testnet demo.

### M6 — Real-user validation and incubation package

- Recruit real testers and, where practical, an issuer/integration partner.
- Record actual usage and feedback.
- Publish a 2–4 minute demo video.
- Publish build logs/tutorials and ecosystem feedback.
- Prepare mainnet readiness evidence, including security review and asset/issuer/legal approval.
- Do not enable real production asset sales unless all requirements are met.

---

## 25. Definition of Done

The MVP is complete only when:

- [ ] Repository setup and instructions are complete.
- [ ] Current BOT Chain/RWA configuration has been verified from official sources.
- [ ] Wallet connection works and rejects the wrong network for write operations.
- [ ] At least one clearly labelled testnet/demo asset offering is configured.
- [ ] Asset details and issuer information display correctly.
- [ ] Token metadata and balances are read from chain.
- [ ] Eligibility is queried using the documented RWA suite interface.
- [ ] Ineligible or unverified wallets cannot continue to checkout.
- [ ] Buyer can create a payment intent.
- [ ] Buyer can submit the configured payment transaction.
- [ ] Payment confirmation is verified from on-chain state.
- [ ] Token delivery/allocation is verified from on-chain state.
- [ ] Checkout reaches SETTLED only when all configured settlement conditions are complete.
- [ ] Pending and failed states are recoverable and accurately displayed.
- [ ] Duplicate/replayed payments cannot silently create duplicate fulfillment.
- [ ] Issuer dashboard role restrictions work.
- [ ] Portfolio shows on-chain balances.
- [ ] Activity and receipts link to the correct explorer transactions.
- [ ] Tests cover critical success and failure paths.
- [ ] Threat model is documented.
- [ ] No unsupported claims about privacy, asset backing, yield, ownership or redemption appear in the app.
- [ ] README includes setup, architecture, run/test/deploy steps, assumptions, limitations, and demo instructions.
- [ ] Contracts are verified if any are deployed.
- [ ] Public repository contains genuine commit history.
- [ ] A working demo exists.
- [ ] Real-user testing has been performed and reported accurately.
- [ ] Mainnet use has a documented security, issuer-approval, legal/compliance and operational readiness plan.

---

## 26. Git Commit Rules

Git commits are a required part of the development process.

During the build, commit changes continuously instead of waiting until the entire project is finished.

## Commit Frequency

For a normal build, aim for **50+ meaningful commits** across the development process.

Do NOT create 50 meaningless commits just to reach the number. Every commit should represent a real, completed development step.

Make a commit whenever you complete a logical unit of work, such as:

- Creating a new page
- Creating or modifying a component
- Adding a feature
- Implementing an API endpoint
- Adding database functionality
- Adding authentication logic
- Adding validation
- Adding error handling
- Connecting frontend to backend
- Adding a utility/helper
- Adding a configuration
- Refactoring a specific section
- Fixing a bug
- Improving an existing feature
- Adding tests
- Fixing failing tests
- Improving responsiveness
- Fixing accessibility issues
- Updating documentation
- Completing a route
- Completing a major UI section
- Integrating an external service

## Commit Process

After completing each logical development unit:

1. Check the current changes.
2. Verify that the changes work.
3. Stage only the relevant files.
4. Create a descriptive commit.
5. Continue building from the committed state.

Use conventional commit messages where appropriate:

- `feat: add dashboard`
- `feat: add wallet connection`
- `feat: implement transaction history`
- `fix: resolve wallet connection error`
- `refactor: simplify auth middleware`
- `test: add dashboard tests`
- `style: improve mobile layout`
- `docs: update setup instructions`

## Important Rules

- Do NOT wait until the end of the project to commit everything.
- Do NOT make one giant commit containing the entire project.
- Do NOT create fake changes solely to increase the commit count.
- Do NOT repeatedly modify and commit the same thing without a meaningful reason.
- Keep commits small, focused, and logically separated.
- Before moving to the next major feature, make sure the previous feature has been committed.
- If a task contains several independent steps, commit each completed step separately.
- If you encounter and fix a bug during development, commit the fix separately.
- If you make a meaningful refactor, commit it separately.

## Target

For a substantial project, aim for **50+ meaningful commits by the time the build is complete**, distributed naturally throughout development.

The commit history should clearly show the progression of the project from initial setup → individual features → integrations → fixes → testing → polish → final state.

At the end of the build, run `git log` and verify that the history accurately reflects the development process.

---

## 27. Final Coding-Agent Rules

1. Read the entire PRD before coding.
2. Before frontend development, read and follow `frontend.md`.
3. Do not add visual requirements to this PRD.
4. Read the current official BOT Chain RWA documentation, including environment and acceptance guidance.
5. Do not invent or assume contract addresses, permissions, token economics, legal claims, or asset backing.
6. Keep the MVP focused on one verified testnet offering and one payment asset.
7. Keep the existing RWA suite's identity and compliance rules intact.
8. Do not treat the public `PRWA` demo as a real asset-rights token.
9. Do not describe Truva as anonymous or untraceable.
10. Never mark a checkout settled before verified payment and delivery completion.
11. Document any assumption or unresolved integration dependency before working around it.
12. Test failure states, not just the happy path.
13. Follow the Git Commit Rules continuously.
14. Never fake usage, testing results, contracts, transactions, partnerships, audits, or asset disclosures.
15. At the end, run `git log` and verify that commit history reflects genuine development.

---

## 28. Product Positioning

**Truva — a clearer way to pay for approved tokenized real-world assets.**

The MVP should prove one useful workflow:

**Approved offering → eligibility check → payment intent → verified payment → compliant token delivery → verifiable settlement receipt.**

Truva should succeed through reliability, transparency, clear state handling, and an integration that respects BOT Chain's RWA infrastructure—not through unsupported promises of anonymity, yield, or automatic legal ownership.
