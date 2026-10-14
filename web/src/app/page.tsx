import Image from "next/image";
import Link from "next/link";
import { networkLabel } from "@/config/chain";
import { primaryOffering as offering } from "@/config/offerings";
import { getRecentActivity } from "@/lib/activity";
import { formatAmount } from "@/lib/format";
import { STATES, type Tone } from "@/lib/states";
import { StatusBlock } from "@/components/StatusBlock";
import { LifecycleBoard } from "@/components/home/LifecycleBoard";
import { ArchiveClip } from "@/components/home/ArchiveClip";
import styles from "./page.module.css";

const offeringHref = `/assets/${offering.id}`;

export default async function Home() {
  const activity = await getRecentActivity(6);
  const pay = offering.payment.symbol;
  const tok = offering.token.symbol;

  return (
    <>
      {/* 1. Hero: mosaic masthead, title on the axis */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.mosaic}>
          <div className={`${styles.cell} ${styles.a}`}>
            <Image
              src="/archive/sir-george-pollock-bill-of-lading-paper.webp"
              alt="An 1851 bill of lading for goods shipped from London to Port Lyttelton, New Zealand"
              fill
              priority
              sizes="(min-width: 768px) 34vw, 67vw"
              className={`${styles.img} ${styles.drift}`}
            />
          </div>
          <div className={`${styles.cell} ${styles.b}`} />
          <div className={`${styles.cell} ${styles.c}`}>
            <Image
              src="/archive/administrative-bill-of-exchange-issued-at-quebec-paper.webp"
              alt="A handwritten bill of exchange issued at Quebec in 1759"
              fill
              priority
              sizes="17vw"
              className={styles.img}
            />
          </div>
          <div className={`${styles.cell} ${styles.d}`}>
            <span className={styles.settled}>Settled</span>
          </div>
          <div className={`${styles.cell} ${styles.e}`}>
            <Image
              src="/archive/bill-of-exchange-second-of-exchange-adams.webp"
              alt="An engraved 1853 bill of exchange from Adams & Co, Melbourne"
              fill
              sizes="17vw"
              className={styles.img}
            />
          </div>
          <div className={`${styles.cell} ${styles.f}`} />
          <div className={`${styles.cell} ${styles.g}`}>
            <Image
              src="/archive/travancore-bill-of-lading-for-additional-stores-paper.webp"
              alt="An 1860 bill of lading for seven packages of merchandise shipped on the Travancore"
              fill
              sizes="(min-width: 768px) 34vw, 33vw"
              className={styles.img}
            />
          </div>
          <div className={`${styles.cell} ${styles.h}`}>
            <ArchiveClip className={styles.img} />
          </div>
          <div className={`${styles.cell} ${styles.i}`} />
        </div>

        <div className={`${styles.heroBody} wrap`}>
          <h1 id="hero-title" className={`${styles.title} display lines`}>
            <span className="line">
              <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                Checkout you
              </span>
            </span>
            <span className="line">
              <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                can verify
              </span>
            </span>
          </h1>
          <p className={`${styles.standfirst} lead`} data-rise style={{ "--i": 0 } as React.CSSProperties}>
            Truva is the checkout for approved tokenized real-world assets on BOT Chain. Check your wallet’s
            eligibility, pay, and follow every step to delivery on-chain.
          </p>
          <div className={styles.actions} data-rise style={{ "--i": 1 } as React.CSSProperties}>
            <Link href={offeringHref} className="button button--primary">
              See the offering
            </Link>
            <a href="#lifecycle" className="link-plain">
              How settlement works
            </a>
          </div>
        </div>
      </section>

      {/* 2. How buying works: call and response */}
      <section className={`${styles.steps} wrap section`} aria-labelledby="steps-title">
        <h2 id="steps-title" className={`head on-axis ${styles.stepsTitle}`} data-reveal>
          Three things you do
        </h2>

        <ol className={`${styles.exchanges} on-axis`}>
          <li className={styles.exchange}>
            <p className={styles.say} data-reveal>
              First, connect your wallet.
            </p>
            <div className={styles.call} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
              <span className={`${styles.fakeButton} nums`} data-ui aria-label="Example connected wallet">
                0x3f2a…91c4 <span className={styles.fakeNet}>{networkLabel}</span>
              </span>
            </div>
            <div className={styles.response} data-ui data-reveal style={{ "--i": 2 } as React.CSSProperties}>
              <StatusBlock tone="done" size="panel">
                Eligible
              </StatusBlock>
              <p>
                Checked against the offering’s IdentityRegistry on {networkLabel}, 12 seconds ago. Truva reads this
                result; the token contract still enforces it on every transfer.
              </p>
            </div>
          </li>

          <li className={styles.exchange}>
            <p className={styles.say} data-reveal>
              Then, choose an amount.
            </p>
            <div className={styles.call} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
              <span className={`${styles.fakeField} nums`} data-ui aria-label="Example amount field">
                250 <span className="muted">{pay}</span>
              </span>
            </div>
            <div className={styles.response} data-ui data-reveal style={{ "--i": 2 } as React.CSSProperties}>
              <dl className={`${styles.quote} nums`}>
                <div>
                  <dt>You pay</dt>
                  <dd>250.00 {pay}</dd>
                </div>
                <div>
                  <dt>You receive</dt>
                  <dd>
                    25 {tok} at {offering.pricePerToken} each
                  </dd>
                </div>
                <div>
                  <dt>Truva fee</dt>
                  <dd>None</dd>
                </div>
                <div>
                  <dt>Network fee</dt>
                  <dd>Paid in BOT, shown by your wallet before you sign</dd>
                </div>
              </dl>
            </div>
          </li>

          <li className={styles.exchange}>
            <p className={styles.say} data-reveal>
              Pay once, and watch it settle.
            </p>
            <div className={styles.call} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
              <span className={`${styles.fakePrimary} nums`} data-ui aria-label="Example pay button">
                Pay 250.00 {pay}
              </span>
            </div>
            <div
              className={`${styles.response} ${styles.receipt}`}
              data-ui
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              <div className={styles.receiptHead}>
                <span>Truva receipt</span>
                <span className="nums">TRV-7Q4K-2M9D</span>
              </div>
              <dl className={`${styles.receiptBody} nums`}>
                <div>
                  <dt>Offering</dt>
                  <dd>{offering.name}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>
                    0x9b1e…40aa <StatusBlock tone="done">Confirmed</StatusBlock>
                  </dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>
                    0x51c0…e7f3 <StatusBlock tone="done">Confirmed</StatusBlock>
                  </dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>
                    <StatusBlock tone="done">Settled</StatusBlock>
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        </ol>
        <p className={`${styles.example} on-axis small muted`}>
          The wallet, amounts, reference and hashes above are examples of what Truva shows.
        </p>
      </section>

      {/* 3. The lifecycle board (the live thing) */}
      <LifecycleBoard />

      {/* 4. Not a deed: statement tiles */}
      <section id="not-a-deed" className={styles.deed} aria-labelledby="deed-title">
        <div className={styles.tiles}>
          <div className={`${styles.tile} ${styles.slogan}`}>
            <h2 id="deed-title" className={styles.sloganText}>
              Not a<br />
              deed
            </h2>
          </div>
          <div className={`${styles.tile} ${styles.figure}`}>
            <span className={styles.figureNum} aria-hidden="true">
              3643
            </span>
            <span className={`${styles.figureNote} small`}>ERC-3643 (T-REX), the permissioned token standard</span>
          </div>
          <div className={`${styles.tile} ${styles.photo}`}>
            <Image
              src="/archive/stock-certificate-for-50-issued-to-a.webp"
              alt="A 1900 paper stock certificate for two shares of Arlington College"
              fill
              sizes="(min-width: 768px) 33vw, 50vw"
              className={styles.img}
            />
          </div>
        </div>
        <div className={styles.deedText}>
          <p className="lead" data-reveal>
            A token is a record on BOT Chain, nothing more. Truva does not create legal ownership, hold custody,
            value an asset, or prove that an underlying asset exists. Those obligations stay with the issuer, who is
            named on every offering with what one token represents and what it does not. Eligibility is decided by
            the token suite’s IdentityRegistry and ModularCompliance contracts, not by Truva, and every transaction
            here is public: anyone can see wallet addresses and amounts on the explorer.
          </p>
        </div>
      </section>

      {/* 5. Recent activity: banded list */}
      <section className={`${styles.activity} wrap section`} aria-labelledby="activity-title">
        <div className={styles.activityHead}>
          <h2 id="activity-title" className="head" data-reveal>
            <span className="muted">Recent activity</span>
            <br />
            on {networkLabel}
          </h2>
          <Link href="/activity" className="button">
            Open activity
          </Link>
        </div>
        <div className={styles.activityBody}>
          <ul className={styles.filters} aria-label="Filter by state">
            {(
              [
                ["All", "", () => true],
                ["Settled", "settled", (t: Tone) => t === "done"],
                ["Pending", "pending", (t: Tone) => t === "progress" || t === "neutral"],
                ["Failed", "failed", (t: Tone) => t === "fail"],
              ] as const
            ).map(([label, q, match], i) => (
              <li key={label}>
                <Link
                  href={q ? `/activity?state=${q}` : "/activity"}
                  className={`${styles.filter} ${i === 0 ? styles.filterActive : ""}`}
                >
                  <span>{label}</span>
                  <span className="small nums">{activity.filter((r) => match(STATES[r.state].tone)).length}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className={styles.bands} data-reveal="rows">
            {activity.length === 0 ? (
              <li className={`${styles.band} ${styles.empty}`}>
                <p>
                  No checkouts on {networkLabel} yet. The first one will appear here with both of its transaction
                  links.
                </p>
                <p className="muted">
                  Each row will show the time, the intent reference, the amount paid, the settlement state, and
                  links to the payment and delivery transactions on the explorer.
                </p>
              </li>
            ) : (
              activity.map((row) => (
                <li key={row.intentId} className={`${styles.band} nums`}>
                  <span>{new Date(row.updatedAt).toLocaleTimeString("en-GB", { timeStyle: "short" })}</span>
                  <span>
                    {row.offeringName} <span className="muted small">{row.intentId}</span>
                  </span>
                  <span>
                    {formatAmount(row.amount)} {row.paymentSymbol}
                  </span>
                  <StatusBlock tone={STATES[row.state].tone}>{STATES[row.state].label}</StatusBlock>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* 6. Close: the idea again, inverted */}
      <section className={`${styles.close} on-field`} aria-labelledby="close-title">
        <h2 id="close-title" className={`${styles.closeTitle} lines`}>
          <span className="line">
            <span data-reveal>Verify before</span>
          </span>
          <span className="line">
            <span data-reveal style={{ "--i": 1 } as React.CSSProperties}>
              you pay
            </span>
          </span>
        </h2>
        <div className={styles.closeRow}>
          <p>
            Truva checks your wallet against the offering’s identity registry before checkout opens. If the check
            can’t run, checkout stays closed.
          </p>
          <Link href={`${offeringHref}#eligibility`} className="button button--primary">
            Check eligibility
          </Link>
        </div>
      </section>
    </>
  );
}
