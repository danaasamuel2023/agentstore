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
      <p className="font-bold text-slate-900 text-sm">🎁 Invite a friend, get {amount} off</p>
      <p className="text-[12px] text-slate-700 mt-1 leading-snug">
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
        <button type="button" onClick={copy} className="flex-1 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-semibold">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <a href={`/shop/${slug}/invite-a-friend`} className="mt-2.5 block text-center text-[12px] font-semibold text-slate-800 underline">
        ▶ See how it works (1-min video)
      </a>
    </div>
  );
}

/**
 * Shop home page banner: "Invite a friend, get GH₵1 off". Tap → type the MoMo
 * number you pay with → your invite link. Hidden while the programme is off.
 */
export function InviteBanner({ slug }) {
  const [cfg, setCfg] = useState(null);
  const [open, setOpen] = useState(false);
  const [momo, setMomo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API}/referral/config`).then((r) => r.json()).then((j) => setCfg(j?.data || null)).catch(() => {});
  }, []);
  if (!cfg || !cfg.enabled) return null;
  const amount = `GH₵${Number(cfg.amount).toFixed(cfg.amount % 1 ? 2 : 0)}`;

  const getLink = async () => {
    const m = momo.replace(/\D/g, '');
    if (m.length !== 10) { setErr('Enter your 10-digit MoMo number'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${API}/stores/${slug}/referral/link-by-number`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ momo: m }),
      });
      const j = await r.json();
      if (j.status === 'success') setInfo(j.data); else setErr(j.message || 'Could not make your link. Try again.');
    } catch { setErr('Could not make your link. Try again.'); }
    setBusy(false);
  };

  const link = info ? `${window.location.origin}/shop/${slug}?r=${info.code}` : '';
  const msg = `I buy my bundles here, fast and cheap. Try it: ${link}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <p className="font-bold text-slate-900 text-[15px]">🎁 Invite a friend, get {amount} off</p>
          <p className="text-[12px] text-slate-700 mt-0.5">Share your link. When a friend buys for the first time, your next order is {amount} cheaper.</p>
        </div>
        <span className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-black">{open ? 'Close' : 'Get my link'}</span>
      </button>

      {open && !info && (
        <div className="mt-3 space-y-2">
          <input
            type="tel" inputMode="numeric" maxLength={10} value={momo}
            onChange={(e) => setMomo(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="MoMo number you pay with"
            className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-medium"
          />
          <p className="text-[11px] text-slate-700">Your discount is used when you pay with this MoMo number.</p>
          {err && <p className="text-[12px] text-red-600">{err}</p>}
          <button type="button" onClick={getLink} disabled={busy} className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold disabled:opacity-50">
            {busy ? 'Please wait…' : 'Get my invite link'}
          </button>
        </div>
      )}

      {open && info && (
        <div className="mt-3 space-y-2">
          <p className="text-[12px] text-slate-700 break-all rounded-lg bg-white px-3 py-2 border border-amber-200">{link}</p>
          <div className="flex gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold">
              <WhatsAppIcon className="h-4 w-4" /> Share
            </a>
            <button type="button" onClick={copy} className="flex-1 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-semibold">
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <p className="text-[11px] text-slate-700">To use your discount, pay with Pay with MoMo from {info.payerMasked}.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Buy pop-up, under the MoMo number (2026-11-05): tells the payer they can earn
 * money off by sharing their link after paying. Honest wording: one reward per
 * friend, one reward per order. Hidden while the programme is off.
 */
export function InviteNudge() {
  const [amount, setAmount] = useState(0);
  useEffect(() => {
    let alive = true;
    fetch(`${API}/referral/config`)
      .then((r) => r.json())
      .then((j) => { if (alive && j?.data?.enabled) setAmount(Number(j.data.amount) || 0); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!(amount > 0)) return null;
  const amt = `GH₵${amount.toFixed(amount % 1 ? 2 : 0)}`;
  return (
    <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 text-[11px] leading-snug text-slate-800">
      🎁 <b>Want {amt} off?</b> After you pay, share your link with family and friends.
      Every friend who buys gives you {amt} off an order. More friends, more money off!
    </p>
  );
}
