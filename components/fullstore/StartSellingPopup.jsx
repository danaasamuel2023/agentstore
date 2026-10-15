'use client';

/**
 * Promo popup for the /start-selling flow.
 *
 * Fires on /account when a logged-in customer doesn't yet have a store
 * (customer.ownedStoreId is null/missing). Dismissal is sticky in
 * localStorage so we don't badger the same customer every visit.
 *
 * Mirrors the NewPortalPopup pattern from DataMart's /store page — one
 * tap to act, one tap to dismiss-forever.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Sparkles, TrendingUp, Share2, Wallet, Store } from 'lucide-react';

const DISMISS_KEY = 'fs_start_selling_popup_dismissed';
const FIRST_DELAY_MS = 1500; // small breathing room after page load

export function StartSellingPopup({ customer, isOpen, onClose }) {
  const [show, setShow] = useState(false);

  // Auto-open logic: only fire if not dismissed and the customer doesn't
  // already own a store. Parent can override via isOpen=true (e.g. a
  // "Learn more" link in the account page).
  useEffect(() => {
    if (isOpen) { setShow(true); return; }
    if (typeof window === 'undefined') return;
    if (!customer) return;
    if (customer.ownedStoreId) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    const t = setTimeout(() => setShow(true), FIRST_DELAY_MS);
    return () => clearTimeout(t);
  }, [customer, isOpen]);

  const dismiss = (sticky = true) => {
    if (sticky && typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
    setShow(false);
    if (onClose) onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[color:var(--surface)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] p-5 sm:p-6 text-center">
          <button
            onClick={() => dismiss(true)}
            className="absolute right-3 top-3 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-black"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-black/15 flex items-center justify-center mb-3">
            <Store className="w-7 h-7 text-black" />
          </div>
          <h2 className="text-xl font-black text-black/90">Sell bundles, keep the profit</h2>
          <p className="text-[12px] text-black/70 mt-1">
            Open your own DataBundle store in 30 seconds — no fee, no approval.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-3">
          <Bullet
            icon={Wallet}
            title="You set the prices"
            desc="Pick your markup on every bundle. The difference is your profit."
          />
          <Bullet
            icon={Share2}
            title="Get a link to share"
            desc="databundle.shop/your-store — share on WhatsApp, social, anywhere."
          />
          <Bullet
            icon={TrendingUp}
            title="Withdraw to MoMo anytime"
            desc="Profit drops into your wallet. Cash out when you want."
          />
          <Bullet
            icon={Sparkles}
            title="Same account"
            desc="You stay signed in — no new password, no new app."
          />
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-2">
          <Link
            href="/start-selling"
            onClick={() => dismiss(false)}
            className="w-full btn btn-primary justify-center text-[14px] py-3"
          >
            Start selling now <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => dismiss(true)}
            className="w-full text-[12px] font-semibold text-[color:var(--ink-faint)] hover:text-[color:var(--ink-mute)] py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[color:var(--brand)]/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[color:var(--brand-deep)]" />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-[color:var(--ink)]">{title}</div>
        <div className="text-[11px] text-[color:var(--ink-mute)] leading-snug mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

export default StartSellingPopup;
