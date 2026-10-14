# FRONTEND.md — Truva

Source of truth for every visual and interaction decision in the Truva frontend. The PRD
(`Truva_PRD.md`) owns behaviour, routes and rules; this file owns how they look and move. Built with
the `design-taste-frontend` skill (direction `editorial-report`, seed `211762465`, palette redrawn
once and then taken from the subject; see §2.3).

---

## 1. Who it is for, and the one action per page

**Primary reader: the buyer.** A wallet holder looking at an issuer-approved (or clearly labelled demo)
tokenized asset on BOT Chain. They are cautious, comfortable with wallets, and want to know three
things before signing anything: *what am I buying, am I allowed to buy it, and did it actually
arrive.* Second reader: **the issuer / operator**, who needs to see which checkouts are stuck and why.
Third: **the read-only visitor** (an incubation reviewer, a curious builder) checking that the product
is honest about what it is.

| Route | Page | The one action it drives |
| --- | --- | --- |
| `/` | Home | **See the offering** (go to the configured offering's detail page) |
| `/assets` | Offerings | **Open an offering** |
| `/assets/[assetId]` | Offering detail | **Check eligibility**, which becomes **Continue to checkout** only when the wallet is Eligible and the offering is Active or Demo |
| `/checkout/[intentId]` | Checkout | The single next step for the current state: **Pay**, **Refresh status**, or **View receipt** |
| `/activity` | Activity | **Open a transaction on the explorer** (filter by state to find it) |
| `/portfolio` | Portfolio | **Resolve a pending delivery** (open its checkout); otherwise read balances |
| `/dashboard` | Issuer dashboard | **Review delivery-pending and failed checkouts** |

Every page also carries the wallet action in the header, but it is never the page's main action
except on Portfolio when no wallet is connected.

---

## 2. Visual direction

### 2.1 Thesis

**Truva is laid out like a printed settlement record.** For three hundred years, merchants tied
payment to delivery with paper: the bill of lading, the bill of exchange, the share certificate.
Truva does the same job on-chain. So the site is set like a well-edited printed annual: a didone
display face of the kind engraved on certificates, a strict column line, flat blocks of colour like a
two-colour print job, and real archival scans of those documents as its pictures. The checkout's state
is always the largest, plainest thing on the screen.

**The idea sentence:** *On this page, the six-state payment-to-delivery lifecycle (CREATED → SETTLED)
becomes a departure board of solid status blocks, and the settled checkout becomes a printed receipt
in the lineage of the bill of lading.*

**The live thing (Home):** the lifecycle board. Each row is a real state from the PRD state machine,
including the failure states. Tap a row and it opens to show exactly what the buyer sees in that
state, what Truva has verified on-chain, and what the next action is. It works with a thumb on a
phone. Without script, all rows render open as a plain list.

### 2.2 Composition rules (all pages)

- **The axis.** One vertical line at **42% of the viewport width** on desktop (≥1024px). Page titles,
  section headings and main body columns start on it. The zone left of it (0–42%) holds side notes:
  status blocks, network facts, the lifecycle ladder, the eligibility panel. Nothing else.
- On tablet (768–1023px) the axis moves to **33%**. On phone it collapses to the left margin and side
  notes move inline above the content they annotate.
- **Margins:** `clamp(16px, 2.2vw, 32px)`, the same on every page. No centred 1200px container; large
  things (mosaics, boards, colour fields) run edge to edge, running text is limited by `ch`.
- **Corners:** square everywhere (radius 0). Buttons, inputs, panels, status blocks, images.
- **No two neighbouring sections share a layout.** Text page, then colour field, then board, then
  text page.
- **Surfaces are separated by tone, never by lines or shadows.** The only shadow in the product sits
  on things that truly float: the wallet sheet and the transaction-confirm dialog.

### 2.3 Palette

The dealt palette (burgundy ground with bubblegum ink) and its one redraw (candy yellow and magenta)
both fought the subject: a settlement product has to look like it keeps records. Following the skill,
the direction's proportions are kept (paper ground, one ink, solid block colours, one accent) and the
colours come from the subject itself: certificate paper, engraving-green ink, and a fresh seal colour
for the one action.

```css
:root {
  /* ground and ink */
  --bg:         #f2f0e9;  /* certificate paper: 80%+ of every page */
  --surface:    #e6e3d8;  /* one tone step: panels, inputs, board rows */
  --surface-2:  #d9d5c6;  /* the second step, used only for alternating bands */
  --ink:        #0e2b20;  /* engraving green-black: all running text */
  --muted:      #4b5f55;  /* secondary notes only; 6.1:1 on --bg */

  /* the one accent: the primary action and the open board row, nothing else */
  --accent:     #c9f04f;  /* seal lime */
  --accent-ink: #0e2b20;

  /* the colour field: one per page at most (CTA, footer, receipt header) */
  --field:      #0e3b2a;  /* deep ledger green */
  --field-ink:  #f2f0e9;

  /* status blocks: semantic, solid, always paired with a word */
  --st-neutral:  #d6d1c1;  --st-neutral-ink:  #0e2b20;  /* CREATED, AWAITING_PAYMENT, REFUNDED */
  --st-progress: #e8b84a;  --st-progress-ink: #0e2b20;  /* PAYMENT_SUBMITTED, PAYMENT_CONFIRMED, DELIVERY_PENDING, REFUND_PENDING */
  --st-done:     #1e6b45;  --st-done-ink:     #f2f0e9;  /* SETTLED, Eligible */
  --st-fail:     #a8322b;  --st-fail-ink:     #f2f0e9;  /* PAYMENT_FAILED, DELIVERY_FAILED, Not eligible */
  --st-closed:   #9c9684;  --st-closed-ink:   #0e2b20;  /* EXPIRED, CANCELLED, Unable to verify */
}
```

Proportion: ground 75–90% of any screen; accent under 5% (the primary button, the open board row,
focus rings). Headings are ink, never accent. Every status colour always sits behind a word, so colour
is never the only signal. Contrast checked: all ink/ground pairs ≥ 5.5:1.

### 2.4 Type: two faces

| Role | Face | Setting |
| --- | --- | --- |
| Display | **Bodoni Moda** 500 (italic 500 for a whole line only, never one word) | tracking -0.02em to -0.06em at the largest size, leading 0.9–0.95, sentence case |
| Text and data | **Jost** 400 / 500 | leading 1.6, tracking 0.01em, `font-variant-numeric: tabular-nums` on every amount, address and timestamp |

Loaded from Google Fonts with `display=swap` (via `next/font/google`). No monospace anywhere outside
real code blocks: hashes and addresses are set in Jost with tabular figures and truncated
`0x3f2a…91c4`, with the full value on copy and in the title attribute.

**Five sizes, no more:**

```css
--step-small:   clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);  /* 13–14px: notes, legal, table meta */
--step-body:    clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);   /* 17–19px: running text, table cells */
--step-lead:    clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);     /* 20–26px: standfirsts, state descriptions */
--step-head:    clamp(2rem, 1.3rem + 3.2vw, 4rem);            /* 32–64px: section and page titles */
--step-display: clamp(3.5rem, 8.3vw, 8rem);                   /* 56–128px: hero title, the checkout state, the CTA */
```

Every headline fits in **two lines or fewer at 1440, 768 and 390px**. Line breaks in the display
titles are authored and wrapped per line (for the masked reveal).

### 2.5 Spacing scale

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112 · 160` (px), as `--space-1` … `--space-10`.

- Inside a component: 4–24.
- Between blocks in a section: 32–72.
- Between sections: **160 desktop, 112 tablet, 72 phone**. Always clearly larger than any gap inside a
  section.
- Space above a heading is at least twice the space below it.
- Touch targets ≥ 44px high; primary buttons 56px.

### 2.6 Motion

- **Signature move: the masked headline.** On load, each authored line of the display title rises from
  behind its own baseline (900ms, `cubic-bezier(0.16, 1, 0.3, 1)`, second line +110ms); the
  standfirst and the primary button then fade up together. Used on Home, the offering detail title
  and the checkout state title, nowhere else.
- **Section entrances:** heading, then text, then picture or fragment, staggered 70ms, rising 24px with
  opacity, triggered once at 15% visibility. Content is visible by default; the script only adds the
  hidden start state, so nothing stays hidden if JS fails.
- **State change:** when a checkout advances (poll result), the status block swaps colour with a 240ms
  cross-fade and the state title runs the masked reveal again. This is the only motion that repeats,
  because it carries news.
- **Board rows:** opening a row animates height (grid-template-rows 0fr→1fr, 320ms) and the accent fill.
- **Controls:** press scales to 0.98 (100ms); hover shifts the button fill one tone (150ms); focus is a
  2px accent outline at 2px offset, instant.
- **One moving picture:** a slow 18s scale drift (1 → 1.06) on the hero mosaic's largest scan; if an
  honest clip of cargo handling is found in the open collections, it replaces one mosaic tile as a
  muted loop with a poster frame.
- Transform and opacity only. `prefers-reduced-motion: reduce` keeps every element and drops all
  travel and drift; state changes become instant swaps.
- No spinners as the only feedback for chain waits: a waiting state names what it is waiting for
  ("Waiting for 2 confirmations on Bohr testnet") and shows elapsed time.

### 2.7 Imagery

Real pictures of the subject's world, found in open collections, downloaded into `public/archive/`
and credited in the footer of every page that shows them. They show the history of payment-to-delivery
paperwork. **They are never presented as Truva's asset, issuer or customers.**

Shortlist (all checked as available, commercial-use licences):

- *Sir George Pollock — Bill of lading*, Archives New Zealand, CC BY 2.0 (hero mosaic, wide cell)
- *Travancore — Bill of lading for additional stores*, Archives New Zealand, CC BY 2.0 (hero mosaic)
- *Administrative Bill of Exchange issued at Quebec, 1751*, CC0 (hero mosaic)
- *Bill of Exchange, Adams & Co, Melbourne, 1853*, Museums Victoria, CC BY 4.0 (hero mosaic)
- *Stock certificate for $50 issued to A.J. Rogers*, UT Arlington, CC BY 4.0 ("Not a deed" tile)
- *The King at home* (counting-house, John Leech, 1859), public domain (empty-state illustration on Activity)

Treatment: all scans greyscale (`grayscale(1) contrast(1.05)`), cropped tight, square corners. The
product's own pictures are its interface: real-size fragments built in HTML (eligibility result,
quote, receipt) marked `data-ui`.

---

## 3. Pages and sections, in build order

Build order: **Shell → Home → Offerings → Offering detail → Checkout → Activity → Portfolio →
Dashboard.** Each page is finished, inspected at 1440/768/390 and fixed before the next starts.

Values shown in `{braces}` come from the offering config or from chain reads at runtime. Values marked
*(sample)* are demo-config content that must be confirmed against the real testnet suite before testers
see it (listed in §6).

### 3.0 Shell (built with Home)

**Header (desktop).** Flush to the top edge, one row, 64px:
- Left: the wordmark **Truva** in Bodoni Moda, paper-coloured on a solid ink block.
- Then a flat accent-free tab in `--surface` running to the 42% axis, holding three links:
  **Offerings · Activity · Portfolio**. A fourth link, **Dashboard**, appears only when the connected
  wallet holds an issuer or operator role.
- On the axis: the network block, **Bohr testnet**, solid `--st-progress` with ink text. Always
  visible. Wrong network replaces it with a solid `--st-fail` block: **Wrong network**.
- Far right: the wallet button. Disconnected: **Connect wallet** (solid ink, paper text).
  Connected: `0x3f2a…91c4` on `--surface`, opening a sheet with: copy address, view on explorer,
  disconnect.

**Header (phone).** One 56px row: wordmark block, network block (short label **Testnet**), and a
**Menu** text button that opens a full-screen paper sheet listing the links at `--step-head` size and
the wallet button at the bottom.

**Wrong-network bar.** When the wallet is on another chain, a full-width `--st-fail` field under the
header: "Your wallet is on another network. Truva only signs on Bohr testnet (chain {chainId})." with a
button **Switch network**. All write actions on the page are disabled until it clears.

**Footer.** See §3.1 section 7; the same footer closes every page.

### 3.1 Home `/`

Argument, one claim per section:

1. Truva is the checkout for approved tokenized real-world assets on BOT Chain → title + the documents it descends from
2. Buying takes three actions and each gives you something you can check → call and response
3. Every state is shown as it is, including the ones that went wrong → the lifecycle board (live thing)
4. A token is not a deed, and Truva says so → statement tiles
5. What actually happened on testnet is public → recent activity bands
6. Check first, then pay → inverted close
7. Where to verify everything → footer

**1 · Hero: mosaic masthead, title on the axis.**
- Top 52% of the viewport: a gutterless 6×2 mosaic. Four greyscale archival scans (the two bills of
  lading, the two bills of exchange; the Pollock bill spans two columns) and four flat tiles: ink,
  `--field`, `--surface-2`, and one `--st-done` tile holding the word **Settled** in Bodoni at
  `--step-head` (the only text in the band). The header sits flush on the band's top edge.
- Below the band, left margin, max 30ch, `--step-lead`:
  > Truva is the checkout for approved tokenized real-world assets on BOT Chain. Check your wallet's
  > eligibility, pay, and follow every step to delivery on-chain.
- From the axis, `--step-display`, two authored lines:
  > **Checkout you**
  > **can verify**
- Under the title on the axis: primary button **See the offering** (solid accent, 56px), and beside it
  the text link **How settlement works** (scrolls to the board).
- Phone: 3×2 mosaic at 38% of the screen (two scans, four tiles), title at 13vw on two lines from the
  left margin, standfirst at 17px beneath, button full width.

**2 · How buying works: call and response column.**
Heading on the axis, `--step-head`: **Three things you do**. Then one 560px column on the axis; three
exchanges 88px apart. Each is a sentence at `--step-lead` 500, the call (what the buyer does, in a
`--surface` panel), and indented 56px beneath it the response (a real-size `data-ui` fragment of what
Truva returns).

- **First, connect your wallet.**
  Call: the wallet button reading `0x3f2a…91c4 · Bohr testnet`.
  Response: the eligibility fragment: status block **Eligible**, then "Checked against the offering's
  IdentityRegistry on Bohr testnet, {time} ago. Truva reads this result; the token contract still
  enforces it on every transfer."
- **Then, choose an amount.**
  Call: the amount field holding `250` with the unit `{paymentSymbol}`.
  Response: the quote fragment: "You pay 250.00 {paymentSymbol} · You receive 25 {tokenSymbol} at
  10.00 each · Truva fee: none · Network fee: paid in BOT, shown by your wallet before you sign."
- **Pay once, and watch it settle.**
  Call: the button **Pay 250.00 {paymentSymbol}**.
  Response (breaks out to 760px, running to the right margin): a receipt fragment showing Intent
  `TRV-7Q4K-2M9D` *(sample)*, payment `0x9b1e…40aa` **Confirmed**, delivery `0x51c0…e7f3` **Confirmed**,
  state **Settled**, both hashes as explorer links.
- Phone: column fills the width, response un-indented with a 24px gap, the receipt runs edge to edge.

**3 · The lifecycle board (the live thing).** Full-bleed, 12px side margins, on `--ink` ground. No
section heading: the open row's name is the largest type. Each row is a 72px `--surface`-on-ink band
(one tone off: `#173a2d`), 4px gaps, text at 26–30px in paper: the buyer-facing state name at column 1,
what it means at column 6, who acts next at column 10, and at column 12 a solid status block. Top and
bottom rows are cut in half by the section edges. One row is open at a time: 216px, filled with
`--accent`, detail in two lines at 17px.

| State (row name) | Meaning | Who acts next | Open-row detail |
| --- | --- | --- | --- |
| Intent created | A payment intent exists for your wallet and amount | You | "The quote is held until {expiry}. Nothing has been paid. You can still change the amount." |
| Awaiting payment | Truva is waiting for your signed transfer | You | "Sign the {paymentSymbol} transfer in your wallet. Truva will not retry a payment without a fresh click from you." |
| Payment submitted | Your transaction is in the mempool | BOT Chain | "Truva is watching {txHash}. A refresh never sends a second payment." |
| Payment confirmed | The transfer is final on-chain | The issuer | "Confirmed in block {block}. Truva checked the amount, the token and the recipient against the intent." |
| Delivery pending | Payment confirmed, delivery pending | The issuer | "Your payment is confirmed. The issuer's delivery has not reached your wallet yet. Keep reference {intentId}." |
| Settled | Payment and delivery both verified | No one | "Both transactions are verified on-chain. Your receipt links to each one." |
| Delivery failed | The token suite rejected the transfer | The issuer | "ModularCompliance refused the delivery. Your checkout is not complete, and Truva shows the reason the contract gave." |
| Payment failed | The payment transaction reverted | You | "No funds left your wallet beyond the network fee. Start a new intent when you are ready." |
| Expired | The intent passed its deadline unpaid | You | "Nothing was paid. Create a new intent to get a fresh quote." |

Default open row: **Delivery pending** (it is the state other checkouts hide). Phone: rows 64px with
the name and status block only; the open row (200px) lists the dropped facts as lines.

**4 · Not a deed: statement tiles.** A board of filled tiles, 8px gaps. Tile A (8 columns, two rows,
`--field`): **NOT A DEED** in Bodoni capitals on two lines at `clamp(64px, 9vw, 132px)`, bottom-left.
Tile B (`--surface-2`): the figure **3643**, same size, cropped by the tile edge, with a 13px note
"ERC-3643 (T-REX) permissioned token standard". Tile C: the A.J. Rogers stock certificate scan.
Below, on paper, columns 7–12, at 22px:

> A token is a record on BOT Chain, nothing more. Truva does not create legal ownership, hold custody,
> value an asset, or prove that an underlying asset exists. Those obligations stay with the issuer,
> who is named on every offering with what one token represents and what it does not. Eligibility is
> decided by the token suite's IdentityRegistry and ModularCompliance contracts, not by Truva, and
> every transaction here is public: anyone can see wallet addresses and amounts on the explorer.

Phone: two-column board, slogan tile at 46svh, number and photo as squares side by side, text at 18px.

**5 · Recent activity: banded list.** Heading `--step-head`, two lines, first in `--muted`, second in
ink: **Recent activity / on Bohr testnet**, with **Open activity** (secondary, solid ink) at the far
right of the same row. Left: a 150px column of filter blocks **All · Settled · Pending · Failed**
(active one solid ink, paper text, with the count from the index). Right: alternating `--surface` /
`--surface-2` bands, 76px, 4px gaps: time (tabular), offering name + intent reference, amount, status
block, and two explorer links **Payment** and **Delivery**. Shows the latest six real checkouts from
the index.
Empty state (true until the first testnet checkout): one band reading "No checkouts on Bohr testnet
yet. The first one will appear here with both of its transaction links." Never seeded with invented
rows. Phone: filter blocks become a horizontal row; each band stacks time, name, status.

**6 · Close: the idea again, inverted.** Full-bleed `--field`, 90svh. Display, two lines, paper ink:

> **Verify before**
> **you pay**

Bottom row, shared baseline: "Truva checks your wallet against the offering's identity registry
before checkout opens. If the check can't run, checkout stays closed." and the accent button
**Check eligibility** (goes to the offering detail with the eligibility panel focused). Phone: 80svh,
title at 15vw, button full width at the foot.

**7 · Footer.** Continues the `--field` after 160px. The name **Truva** in Bodoni across the full
content width (cropped by the bottom edge, never the top). 72px below, two parts:
- Columns 1–5, 32px, links: **Source on GitHub**, **BOT Chain RWA docs**, **Bohr testnet explorer**.
- Columns 7–12, three columns of 15px links: *Product* (Offerings, Activity, Portfolio, Dashboard),
  *Read first* (What a token is not, Threat model, Setup guide), *Archive credits* (each scan's title,
  creator, licence, linked to its source page).
- Last row, 13px: "Bohr testnet demonstration. No real-world asset is sold here. Transactions and
  wallet addresses on BOT Chain are public." left; **Back to top** right.

### 3.2 Offerings `/assets`

Argument: here is what you can buy, and exactly what state each offering is in.

- **Title on the axis**, `--step-display`: **Offerings**. (All app-page titles use the display size, set by the shared `PageHead`, with the side note in the left zone.) Left of the axis, side note at
  `--step-body`: "Truva lists only offerings an issuer has configured and verified, or demos labelled
  as demos. There is no open marketplace."
- **Filter blocks:** **All · Active · Demo · Paused · Closed**, each with its count; filters with zero
  are shown but quiet (`--muted`), never hidden, so the visitor sees the whole state space.
- **The board** (same family as the Home board, light version on `--surface`): one row per offering.
  Columns: name + symbol, issuer, network, payment asset, status block (**Demo** uses `--accent` with
  the word *Demo*; Active `--st-done`; Paused `--st-progress`; Closed `--st-closed`). Clicking a row
  opens it (216px) with the short description, "Last configuration check {date}", and the button
  **Open offering**.
- With the MVP's one configured offering, the board shows that row already open, followed by one quiet
  band: "More offerings appear here when issuers complete configuration and disclosures."
- Config error state: if the offering's config fails verification at load, its row shows
  **Unable to verify** and the button is replaced by "Configuration could not be verified against
  Bohr testnet. Checkout is closed for this offering."
- Phone: rows show name and status only; the open row lists issuer, network, payment asset as lines
  and the button full width.

### 3.3 Offering detail `/assets/[assetId]`

Argument: what this is, who stands behind it, whether you can buy it, then buy it.

**Masthead.** A short band (30% of the first screen): one greyscale archival scan and three flat tiles.
Under it, from the axis, the offering name at `--step-display` on two authored lines, e.g.
**Demo invoice / pool A** *(sample)*, with the symbol and status beside it: `{tokenSymbol}` and a
**Demo** block. Standfirst at `--step-lead`, left margin, 30ch: `{shortDescription}`, e.g. "A
demonstration token on Bohr testnet that walks through the full checkout. It carries no claim on any
real-world asset." *(sample)*

**Left zone (0–42%), sticky on desktop: the purchase panel.** This is the page's action.
- Not connected: "Connect a wallet to check eligibility." + **Connect wallet**.
- Wrong network: `--st-fail` block **Wrong network** + **Switch network**.
- Checking: "Checking {shortAddress} against the IdentityRegistry…" with elapsed seconds.
- **Eligible** (`--st-done`): amount field (in `{paymentSymbol}`, with min/max shown under it:
  "Minimum 50.00 · Maximum 5,000.00" *(sample)*), the live quote (you pay / you receive / Truva fee:
  none), and **Continue to checkout** (accent). Re-checks eligibility on click before creating the
  intent.
- **Not eligible** (`--st-fail`): "This wallet is not registered as eligible for {tokenSymbol}. Truva
  can't change that; eligibility is set by the issuer's identity process." Link: **Contact the
  issuer**. No checkout button.
- **Unable to verify** (`--st-closed`): "The eligibility check didn't complete, so checkout stays
  closed. This is usually an RPC problem, not your wallet." + **Try again**.
- Offering Paused or Closed: the status block and "Checkout is closed for this offering." in place of
  the amount field.

**Right of the axis, text page sections (each heading `--step-head`):**
1. **What one token is.** Two columns of 34–40ch: *Represents*: `{representsText}`; *Does not
   represent*: `{disclaimerText}`. The second column sits on `--surface` so it can't be skimmed past.
   Sample for the demo: Represents "One unit of a demonstration offering, used to test checkout and
   delivery on Bohr testnet." Does not represent "Ownership, custody, redemption rights, yield, or any
   interest in a real-world asset. It has no value."
2. **Issuer.** `{issuerLegalName}`, `{issuerContact}`, category `{assetCategory}`, fulfilment method
   in plain words: "Delivered by transfer from the issuer's inventory wallet after payment
   confirms. Both wallets must pass the suite's compliance rules." (or the allocation variant).
3. **Terms.** A real table (rows on tone bands): price per token, payment asset (symbol, decimals,
   address link), minimum, maximum, Truva fee (**None**), offering window (`{start}` – `{end}`),
   status, last configuration check.
4. **Contracts.** Token, IdentityRegistry, ModularCompliance and payment token, each: name, truncated
   address, copy button, explorer link, network. Heading note: "Truva reads these contracts; it does
   not control them."
5. **Disclosures.** The issuer's documents as a list of links with file type and date. If none:
   "The issuer has not published disclosures for this demo offering." (never hidden).

**Phone.** Masthead, title, standfirst; then the purchase panel becomes a fixed bottom bar showing the
eligibility state and one button (**Check eligibility** / **Continue to checkout**); tapping expands it
to a full-height sheet with the amount field and quote. Sections follow in one column.

### 3.4 Checkout `/checkout/[intentId]`

Argument: where your money and your token are right now, and the one thing to do next.

**Left zone: the lifecycle ladder.** The six happy-path states listed top to bottom by name (no
numbers). Passed states in ink with the time they were verified; the current state as a solid status
block; future states in `--muted`. An exception state (failed, expired, refund) replaces the ladder's
remaining states with itself in its colour.

**Right of the axis:**
- **The state title** at `--step-display`, two authored lines, re-revealed on every state change:
  - Awaiting payment → **Ready / to pay**
  - Payment submitted → **Payment / sent**
  - Payment confirmed → **Payment / confirmed**
  - Delivery pending → **Paid, delivery / pending**
  - Settled → **Settled**
  - Payment failed → **Payment / failed**
  - Delivery failed → **Delivery / rejected**
  - Expired → **Intent / expired**
- **The explanation**, `--step-lead`, one or two sentences, from the board's open-row detail for that
  state (§3.1, section 3), with the real values filled in.
- **The one action**, accent, 56px:
  - Awaiting payment: **Pay 250.00 {paymentSymbol}** → opens the confirm dialog (amount, recipient,
    network, chain ID, "Your wallet will ask you to sign. Truva never sends a payment without this
    click."). Disabled with the reason when the wallet is wrong-network or eligibility re-check fails.
  - Submitted / confirmed / delivery pending: **Refresh status** (secondary), with "Checked {n}s ago".
    Auto-polls; the button never resends anything.
  - Settled: **View receipt** (scrolls to it) and **Print receipt** as a text link.
  - Payment failed / Expired: **Start a new checkout** (back to the offering).
  - Delivery failed: **Contact the issuer**, plus the refund route if the issuer configured one; the
    page states plainly "This checkout is not complete."
- **Intent details**, a real table: reference, offering, buyer wallet, payment asset and amount,
  token quantity, created, expires, last updated.
- **Transactions:** two bands, *Payment* and *Delivery*, each with status block, truncated hash, block
  number and **View on explorer**. A transaction not yet sent reads "Not sent yet".
- **The receipt** (settled only): the one place the page changes field. A `--field` header band with
  "Truva receipt" and the reference in Bodoni, then the record on paper, set like a printed document:
  offering, issuer, buyer wallet, paid, delivered, both transaction links, settled at. Last line at
  13px: "This receipt summarises verified on-chain transactions. It is not a certificate of legal
  ownership of any underlying asset." Print stylesheet: receipt only, black on white.

**Phone.** The ladder becomes a single row of six thin filled segments with the current state's name
beside it; the state title at 13vw; the action button fixed to the bottom edge; details and
transactions stack.

### 3.5 Activity `/activity`

Argument: everything that happened is public, and every row points at the chain.

- Title on the axis: **Activity**. Side note: "Every checkout on Bohr testnet, read from BOT Chain.
  If the index is behind, the chain wins and the row says so."
- **Environment strip:** a full-width `--st-progress` band, "Testnet transactions. Nothing here moved
  a real asset." (Production rows, when they exist, would carry no such band and a separate filter.)
- **Filter blocks:** **All · Pending · Delivery pending · Settled · Failed · Expired**, with counts.
- **The list:** a real table on desktop (tone bands, no lines): time, reference, offering, buyer
  (truncated), amount, status block, **Payment** and **Delivery** explorer links. Rows link to their
  checkout page. Stale-index rows show a `--st-closed` note "Index behind chain — reconciling".
- Pagination: **Older** / **Newer** text buttons, 25 rows per page.
- Empty state: the John Leech counting-house engraving, large, greyscale, with "No checkouts on Bohr
  testnet yet. The first one will appear here with both of its transaction links."
- Phone: each row becomes a stacked band: status block and time on top, reference and amount, then the
  two links as 44px buttons.

### 3.6 Portfolio `/portfolio`

Argument: what your wallet holds, read from the chain, and what is still on its way.

- Not connected: the title **Portfolio** and one line "Connect a wallet to read your balances from BOT
  Chain." + **Connect wallet** (the page's only action in this state).
- Connected:
  - **Pending deliveries first**, if any: a `--st-progress` field: "{n} delivery pending" in
    `--step-head`, each row with reference, amount paid, time since payment confirmed, and **Open
    checkout**.
  - **Holdings:** for each configured token, the balance as the largest figure on the page
    (`--step-display`, tabular): `25 {tokenSymbol}`, the token name, contract address with explorer
    link, network, eligibility block where meaningful. A demo token always carries the line "Demo
    token on Bohr testnet. It has no value and represents no real-world asset." No valuations, no
    totals in currency.
  - **Recent checkouts:** the last ten as tone bands, same row anatomy as Activity.
- Zero balance: "You don't hold {tokenSymbol} yet." with **See the offering**.

### 3.7 Issuer dashboard `/dashboard`

Argument: which checkouts need you, and proof that you can't rewrite any of them.

- **Access gate.** Role is read from the configured suite/offering roles for the connected wallet.
  - Not connected: "Connect the wallet that holds your issuer or operator role."
  - No role: `--st-fail` block **No access** and "This wallet has no issuer or operator role for any
    offering configured in Truva." No dashboard data is rendered.
- **Needs attention** (top, full width, `--st-progress` field): delivery-pending and failed counts in
  `--step-display`, each a link that sets the filter below.
- **Totals:** checkouts, settled, pending, failed, expired, total paid in `{paymentSymbol}`; set as a
  single sentence-row of figures, each labelled, with the note "Derived from indexed events and
  reconciled against BOT Chain. Last reconciled {time}."
- **Checkouts table:** filters **Pending · Delivery pending · Settled · Failed · Expired**; columns as
  Activity plus buyer wallet in full on hover. Hashes are read-only text with explorer links; there is
  no edit control on any transaction or state.
- **Offering settings:** two parts side by side on desktop (stacked on phone):
  - *Editable:* display name, short description, disclosure links, issuer contact. Inputs on
    `--surface`, **Save changes** (accent). Changes are logged with wallet and time.
  - *Locked:* token, suite and payment addresses, price rules, status transitions that require a
    configuration check. Each shows its value and the reason it is locked: "Changed only through a
    verified configuration update."
- **Status control:** Active ↔ Paused, behind a confirm dialog that states the consequence ("New
  checkouts stop. Checkouts already paid continue to delivery.").

---

## 4. Components

| Component | Behaviour | Desktop | Phone |
| --- | --- | --- | --- |
| **Header** | Wordmark block, link tab, network block, wallet button | One 64px row flush to the top | 56px row: wordmark, **Testnet** block, **Menu** → full-screen sheet |
| **WalletButton / WalletSheet** | Connect via wagmi; connected shows truncated address; sheet has copy, explorer, disconnect | Sheet anchored under the button (the one floating element, with shadow) | Full-width bottom sheet |
| **NetworkBlock** | Bohr testnet / Wrong network | Label in full | Short label |
| **WrongNetworkBar** | Full-width fail field + **Switch network**; disables writes | Under header | Same, text wraps to two lines max |
| **StatusBlock** | Solid colour + word for every PRD state and eligibility result; colour from §2.3 | 13–14px text, 28px tall in tables, 40px in panels | Same |
| **Board / BoardRow** | One open row; click/tap or Enter/Space opens; `aria-expanded`; no-JS renders all open | Full columns at 26–30px | Name + status only; open row lists the rest |
| **FilterBlocks** | Single-select, counts, zero counts shown quiet | Vertical stack (Home) or row | Horizontal scroll row, sticky under header |
| **Hash / Address** | Truncated, tabular, copy button with "Copied" for 1.5s, explorer link | Inline | Copy and explorer as 44px targets |
| **Amount** | Formats from token decimals, tabular, symbol after | — | — |
| **AmountField** | Numeric input in payment units, min/max validation in words ("Minimum is 50.00 {paymentSymbol}") | In the sticky panel | Inside the bottom sheet |
| **Quote** | Pay / receive / Truva fee / network-fee note, recalculated as typed | Panel | Sheet |
| **EligibilityPanel** | The six states in §3.3; fails closed | Sticky left zone | Fixed bottom bar → sheet |
| **LifecycleLadder** | State list with current block and verified times | Left zone | Segment row + state name |
| **StateTitle** | Display title with masked reveal on mount and on state change | Axis | 13vw |
| **ConfirmDialog** | States amount, recipient, network, chain ID before signing; Esc closes; focus trapped | Centred, 480px, shadow (floats) | Full-screen sheet |
| **TxBand** | Payment or delivery: status, hash, block, explorer | Row | Stacked |
| **Receipt** | Printed-record layout, print stylesheet | Full width of the right zone | Full width |
| **DataTable** | Real `<table>`, tone bands, tabular numbers, sortable by time | Table | Converts to stacked bands under 768px |
| **ArchiveMosaic** | Gutterless grid of greyscale scans and flat tiles; slow drift on the largest scan | 6×2 | 3×2 |
| **Notice** | Full-width field for environment/demo/stale-index messages | Band | Band |
| **EmptyState** | One sentence of what will appear and why it's empty; optional archival image | — | — |
| **Footer** | §3.1 section 7 | Name full width, two-part row | Name fitted, places at 26px, link columns two across |
| **Button** | Square, solid. Primary = accent; secondary = ink with paper text; text link = underline on hover. One primary per screen | 56px primary, 44px secondary | Primary full width |

Loading: tone blocks the size of the content they replace, no shimmer gradient. Errors always name
what failed and what still holds ("Your payment is safe on-chain; Truva couldn't reach the indexer").

---

## 5. Avoid

The skill's house rules apply on every page, app screens included. Specific to Truva:

- **No eyebrows**: no "RWA CHECKOUT" label over the hero, no "New" pill, no small caps over headings.
- **No monospace for hashes or addresses**: Jost with tabular figures, truncated.
- **No step numbers** in the lifecycle or how-it-works (no 01/02/03, no "Step 2 of 6"); states are
  named.
- **No icon-topped feature cards**, no three-up "Secure · Compliant · Fast" row, no tricolon
  headlines.
- **No fake dashboard**: no grey placeholder bars, no invented charts, no seeded activity rows, no
  user counts, no partner logos, no "trusted by".
- **No gradients, glass, glows, blur panels or floating pill navigation.** No crypto-default
  neon-on-black, no violet/indigo, no cream-and-terracotta.
- **No hairline dividers or 1px boxes**: tone steps and space only (tables may keep their structure
  but use bands).
- **No shadow on anything at rest.**
- **No styled accent word** in a headline (no italic or coloured "verify").
- **No spinner-only waits**: every wait names what it's waiting for.
- **No claims the PRD forbids**: never "secure", "audited", "backed", "guaranteed", "private",
  "anonymous", "instant", or "you own"; never "Payment successful" before the chain confirms it.
- **No genre verbs**: unlock, seamless, effortless, empower, next-generation, revolutionise.

---

## 6. Sample content to confirm before testers

These appear in the designs at full density and come from demo config, not from evidence:

- Offering name "Demo invoice pool A", symbol, price 10.00 per token, minimum 50.00, maximum 5,000.00,
  short description, represents / does-not-represent text, issuer name and contact.
- Payment asset symbol (shown as `{paymentSymbol}`): must be the verified Bohr testnet payment token.
- The intent reference format `TRV-XXXX-XXXX` and the sample hashes in the Home how-it-works fragment
  (they illustrate the interface and are labelled as an example in the markup's `aria-label`).
- All archival scans are credited third-party images of historical documents, not Truva's assets.
