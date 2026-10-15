'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Gift, Clock, Smartphone, ShoppingBag, ShieldCheck, HelpCircle, Search } from 'lucide-react';
import SpinWin from '../components/SpinWin';

/**
 * The public "how Spin & Win works" page.
 *
 * Deliberately describes the EXPERIENCE and nothing else. It says what a
 * customer needs in order to take part and to know they were treated fairly —
 * how a spin is earned, when the wheel is open, what can be won, how a prize
 * is claimed.
 *
 * It does NOT publish the odds, the prize weighting, the daily prize budget,
 * how spins are tied to a payment, or any of the limits that exist to stop the
 * promotion being farmed. Those are the parts worth knowing only if you intend
 * to game them, and a page that lists them is a page that teaches someone how.
 * "Limited number of spins each day" is the honest public form of that.
 */
export default function SpinWinInfoClient({ store, storeSlug }) {
  const name = store?.storeName || 'this shop';

  const steps = [
    {
      Icon: ShoppingBag,
      title: 'Buy any bundle',
      body: `Order data from ${name} as you normally would. Every completed order earns you a spin — nothing to sign up for.`,
    },
    {
      Icon: Gift,
      title: 'Spin on the confirmation screen',
      body: 'Once your payment goes through, the wheel appears on your receipt. One tap, and you will know straight away.',
    },
    {
      Icon: Smartphone,
      title: 'Choose where it goes',
      body: 'Win, and you pick the number. Send it to yourself, or to whoever you were buying for — it is your prize either way.',
    },
  ];

  const faqs = [
    {
      q: 'What can I win?',
      a: 'Free MTN data bundles. The amount varies — bigger bundles are rarer, as you would expect.',
    },
    {
      q: 'Does it cost anything to spin?',
      a: 'No. A spin is earned by buying a bundle, and the spin itself is free. You never pay to play.',
    },
    {
      q: 'When can I spin?',
      a: 'Between 8am and 9pm, Ghana time. Buy outside those hours and your order goes through as normal — the wheel is simply asleep.',
    },
    {
      q: 'How many times can I spin?',
      a: 'There are a limited number of spins each day, so that prizes are shared around rather than taken by a few people. Buy again tomorrow for another go.',
    },
    {
      q: 'I won but did not enter a number in time.',
      a: 'Your prize is safe. Return to the same confirmation link and you will be asked for the number again.',
    },
    {
      q: 'How long does a prize take to arrive?',
      a: 'It is sent like any other order, usually within minutes. Occasionally the network is slow — it stays queued until it is delivered.',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent-soft, rgba(245,158,11,.14))' }}
        >
          <Gift className="h-7 w-7" style={{ color: 'var(--accent, #f59e0b)' }} />
        </div>
        <h1 className="mt-3 text-[22px] font-bold text-ink">Spin &amp; Win</h1>
        <p className="mt-1 text-[13.5px] text-ink-3">
          Buy data, earn a spin, win more data. That is the whole thing.
        </p>
      </div>

      <div
        className="mt-5 flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5"
        style={{ background: 'var(--surface-2, transparent)' }}
      >
        <Clock className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-3)' }} />
        <p className="text-[12.5px] text-ink-3">
          Open daily, <span className="font-semibold text-ink">8am&ndash;9pm</span> Ghana time
        </p>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map(({ Icon, title, body }, i) => (
          <li key={title} className="flex gap-3 rounded-2xl border border-hairline p-3.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--surface-2, rgba(0,0,0,.04))' }}
            >
              <Icon className="h-4.5 w-4.5" style={{ color: 'var(--ink-2, var(--ink))' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink">
                {i + 1}. {title}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          <HelpCircle className="h-4 w-4" /> Questions
        </p>
        <dl className="mt-2 divide-y divide-hairline border-y border-hairline">
          {faqs.map(({ q, a }) => (
            <div key={q} className="py-3">
              <dt className="text-[13px] font-semibold text-ink">{q}</dt>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-hairline p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--ok, #10b981)' }} />
        <p className="text-[12px] leading-relaxed text-ink-3">
          Every spin is decided on our servers, not in your browser, and each result is recorded.
          Prizes are limited each day and the promotion may be paused or changed at any time.
        </p>
      </div>

      <ClaimLookup storeSlug={storeSlug} />

      <Link href={`/shop/${storeSlug}`} className="btn btn-primary mt-5 w-full">
        <ShoppingBag className="h-4 w-4" />
        Buy data &amp; earn a spin
      </Link>
    </div>
  );
}

/**
 * Claim a prize you won but never collected.
 *
 * Recovery used to depend on still having the confirmation link. People close
 * tabs, lose signal and clear history, and the prize was already theirs — it
 * should not evaporate because the link did.
 *
 * It renders the SAME component the receipt uses rather than a second copy of
 * the claim flow: the server already reports an unclaimed prize for any
 * reference, so the only thing missing was somewhere to type one.
 */
function ClaimLookup({ storeSlug }) {
  const [input, setInput] = useState('');
  const [reference, setReference] = useState(null);
  const [outcome, setOutcome] = useState(null);

  return (
    <div className="mt-6 rounded-2xl border border-hairline p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        <Search className="h-4 w-4" /> Won a prize but did not collect it?
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
        Enter the transaction ID from your receipt or SMS and we will check.
      </p>

      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); setOutcome(null); setReference(input.trim()); }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AGTTXN..."
          className="input num min-w-0 flex-1"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn btn-ghost shrink-0" disabled={input.trim().length < 8}>
          Check
        </button>
      </form>

      {reference && (
        <SpinWin key={reference} reference={reference} storeSlug={storeSlug} onState={setOutcome} />
      )}

      {/* SpinWin renders nothing when there is no prize on that reference, so
          say so here — silence reads as a broken page. */}
      {reference && (outcome === 'hidden' || outcome === 'checking') && (
        <p className="mt-2.5 text-[12.5px] text-ink-3">
          {outcome === 'checking'
            ? 'Checking…'
            : 'No unclaimed prize on that transaction ID. Check it against your receipt, or buy a bundle to earn a new spin.'}
        </p>
      )}
    </div>
  );
}
