'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Search, Zap, ShieldCheck, Clock, Wallet, Package, Smartphone } from 'lucide-react';
import { TopNav } from '@/components/fullstore/TopNav';
import { Footer } from '@/components/fullstore/Footer';
import { LiveTicker } from '@/components/fullstore/LiveTicker';

export default function Landing() {
  const [slug, setSlug] = useState('');

  const go = (e) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean) window.location.href = `/${clean}`;
  };

  return (
    <>
      <TopNav />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="brand-glow-1" style={{ top: -160, right: -160 }} />
        <div className="brand-glow-2" style={{ top: 80, left: -120 }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 relative">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 fade-up">
              <span className="chip mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)]" /> Live across Ghana
              </span>
              <h1 className="text-[44px] sm:text-[60px] leading-[1.02] font-black tracking-tight text-[color:var(--ink)]">
                Data bundles, <br />
                <span className="bg-[color:var(--brand)] px-2 -mx-1 rounded-md">delivered fast.</span>
              </h1>
              <p className="mt-5 text-[15px] sm:text-base text-[color:var(--ink-mute)] max-w-xl leading-relaxed">
                MTN, Telecel and AirtelTigo bundles to any Ghana number in 1–5 minutes.
                Open your store, top up once, then re-order with one tap.
              </p>

              <form onSubmit={go} className="mt-7 card p-2 max-w-md flex items-center fade-up-delay-1">
                <div className="flex items-center gap-2 pl-3 pr-2 flex-1">
                  <Search className="w-4 h-4 text-[color:var(--ink-faint)]" />
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="your store name (e.g. kwame-data)"
                    className="bg-transparent outline-none flex-1 py-2.5 text-[14px]"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Open store <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="mt-3 text-[12px] text-[color:var(--ink-faint)]">
                Got a link from your reseller? Paste the slug and we'll take you there.
              </p>
            </div>

            <div className="lg:col-span-5 fade-up-delay-2">
              <HeroPreview />
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-12 card px-5 py-3.5">
            <LiveTicker />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-3">How it works</div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Three steps. No drama.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StepCard
            n="01"
            icon={Smartphone}
            title="Open your store"
            body="Tap the link your reseller sent you. Or search a store name above."
          />
          <StepCard
            n="02"
            icon={Wallet}
            title="Top up your wallet"
            body="Deposit by MoMo through Paystack. Money lands in seconds, with a one-time 24h hold on your first deposit for safety."
          />
          <StepCard
            n="03"
            icon={Package}
            title="Buy bundles forever"
            body="Pick a bundle, type the number, done. Save numbers and re-order with one tap. Failed orders auto-refund."
          />
        </div>
      </section>

      {/* ===== WHY ===== */}
      <section className="bg-[color:var(--surface-2)] border-y border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid md:grid-cols-3 gap-10">
            <Feature icon={Zap} title="Fast" body="Most bundles deliver in under 2 minutes. We show real-time provider health so you know what to expect before buying." />
            <Feature icon={ShieldCheck} title="Safe" body="Wallet is spend-only. No surprise debits, no withdrawals to MoMo. Every order is logged, every refund automatic." />
            <Feature icon={Clock} title="Always open" body="Buy at 2am, buy on Sunday, buy on a public holiday. We don't sleep when you need data." />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h3 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
          Ready when you are.
        </h3>
        <p className="mt-3 text-[color:var(--ink-mute)] max-w-md mx-auto text-[15px]">
          Got a store link? Open it now. New here? Ask your favourite reseller for theirs.
        </p>
        <Link href="#" onClick={(e) => { e.preventDefault(); document.querySelector('input')?.focus(); }} className="btn btn-yellow mt-6">
          Find a store <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <Footer />
    </>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      {/* Stacked card mockup */}
      <div className="card p-5 shadow-xl rotate-[1.5deg]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Your wallet</div>
            <div className="text-3xl font-extrabold mt-1 tabular-nums">GH₵ 47.50</div>
          </div>
          <span className="chip">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)]" /> Active
          </span>
        </div>
        <div className="card-soft p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFCC00] flex items-center justify-center text-xs font-black">MTN</div>
            <div>
              <div className="text-[13px] font-bold">5GB MTN</div>
              <div className="text-[11px] text-[color:var(--ink-mute)]">to 024***8821</div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[color:var(--success)]">✓ Delivered</span>
        </div>
        <div className="card-soft p-3 flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E30613] flex items-center justify-center text-xs font-black text-white">t</div>
            <div>
              <div className="text-[13px] font-bold">10GB Telecel</div>
              <div className="text-[11px] text-[color:var(--ink-mute)]">to 020***4412</div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[color:var(--success)]">✓ Delivered</span>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 card p-4 shadow-xl -rotate-[3deg] hidden sm:block">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Just delivered</div>
        <div className="text-[13px] font-bold mt-1">2GB AirtelTigo</div>
        <div className="text-[11px] text-[color:var(--ink-mute)]">to 026***9911 · 8s ago</div>
      </div>
    </div>
  );
}

function StepCard({ n, icon: Icon, title, body }) {
  return (
    <div className="card p-6 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black tracking-wider text-[color:var(--ink-faint)]">{n}</span>
        <div className="w-10 h-10 rounded-xl bg-[color:var(--brand-glow)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[color:var(--brand-deep)]" />
        </div>
      </div>
      <h3 className="text-lg font-extrabold mb-1.5">{title}</h3>
      <p className="text-[13px] text-[color:var(--ink-mute)] leading-relaxed">{body}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div>
      <div className="w-10 h-10 rounded-xl bg-[color:var(--ink)] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[color:var(--brand)]" />
      </div>
      <h3 className="text-xl font-extrabold mb-1.5">{title}</h3>
      <p className="text-[13px] text-[color:var(--ink-mute)] leading-relaxed">{body}</p>
    </div>
  );
}
