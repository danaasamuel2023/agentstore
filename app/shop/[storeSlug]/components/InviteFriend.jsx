'use client';

/**
 * Bring a friend (2026-11-04).
 *  - captureInvite(slug): remember ?r=CODE when a friend opens an invite link.
 *  - attachInvite(slug, transactionId): tell the server this order came via a link.
 *  - <InviteFriendBox slug transactionId />: after a paid order, the customer's own
 *    invite link + WhatsApp share. Shows nothing when the programme is off.
 * The reward (GH₵ off the next order) is paid by the platform, not the agent.
 */
import { useEffect, useState } from 'react';
import WhatsAppIcon from './WhatsAppIcon';

const API = 'https://api.datamartgh.shop/api/v1/agent-stores';
const key = (slug) => `invite:${slug}`;

export function captureInvite(slug) {
  try {
    const code = new URLSearchParams(window.location.search).get('r');
    if (code && /^[A-Za-z0-9]{5,10}$/.test(code)) {
      localStorage.setItem(key(slug), JSON.stringify({ code: code.toUpperCase(), at: Date.now() }));
    }
  } catch { /* storage blocked */ }
}

export async function attachInvite(slug, transactionId) {
  try {
    const raw = localStorage.getItem(key(slug));
    if (!raw || !transactionId) return;
    const { code, at } = JSON.parse(raw);
    if (!code || Date.now() - at > 30 * 864e5) return;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    await fetch(`${API}/stores/${slug}/referral/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, code }),
      signal: ctl.signal,
    }).catch(() => {});
    clearTimeout(t);
  } catch { /* never block a sale */ }
}

export async function rewardOffFor(slug, momo) {
  try {
    const r = await fetch(`${API}/stores/${slug}/referral/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ momo }),
    });
    const j = await r.json();
    return Number(j?.data?.off) || 0;
  } catch { return 0; }
}

export default function InviteFriendBox({ slug, transactionId }) {
  const [info, setInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug || !transactionId) return;
    let alive = true;
    fetch(`${API}/stores/${slug}/referral/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    })
      .then((r) => r.json())
      .then((j) => { if (alive && j.status === 'success') setInfo(j.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug, transactionId]);

  if (!info) return null;
  const link = `${window.location.origin}/shop/${slug}?r=${info.code}`;
  const amount = `GH₵${Number(info.amount).toFixed(info.amount % 1 ? 2 : 0)}`;
  const msg = `I buy my bundles here, fast and cheap. Try it: ${link}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-left">
      <p className="font-bold text-ink text-sm">🎁 Invite a friend, get {amount} off</p>
      <p className="text-[12px] text-ink-3 mt-1 leading-snug">
        When a friend buys from this shop with your link for the first time, you get {amount} off your next order.
        Pay with MoMo {info.payerMasked} to use it.
      </p>
      {info.rewardsWaiting > 0 && (
        <p className="text-[12px] font-semibold text-green-700 mt-2">
          You have {info.rewardsWaiting} reward{info.rewardsWaiting > 1 ? 's' : ''} waiting.
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold"
        >
          <WhatsAppIcon className="h-4 w-4" /> Share
        </a>
        <button type="button" onClick={copy} className="flex-1 py-2.5 rounded-xl border border-amber-300 bg-paper text-ink text-sm font-semibold">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
