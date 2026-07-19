'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Phone, CheckCircle2, AlertTriangle, Loader2, ArrowRight,
  RotateCcw, Info, Search, X,
} from 'lucide-react';

/**
 * Customer-facing number check for the storefront.
 * Calls the PUBLIC (no-auth) verify endpoint through the store's own proxy,
 * so guests can check a number before paying. MTN only.
 */
export default function VerifyNumberModal({ open, onClose, prefill = '' }) {
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('input'); // input | scanning | result
  const [scanMsg, setScanMsg] = useState('Checking availability…');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const seed = String(prefill || '').replace(/\D/g, '').slice(0, 10);
      setPhone(seed);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setStage('input'); setPhone(''); setResult(null); setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && open && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onPhone = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
  const pretty = (n) => n.replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 $2 $3').trim();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function verify() {
    const num = phone.trim();
    if (num.length < 9) { inputRef.current?.focus(); return; }
    setError(''); setResult(null); setScanMsg('Checking availability…'); setStage('scanning');
    let data = null;
    try {
      const [res] = await Promise.all([
        fetch('/api/proxy/verify-number/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: num }),
        }).then((r) => r.json()).catch((e) => ({ error: e.message })),
        (async () => { await sleep(1400); setScanMsg('Almost done…'); await sleep(1300); })(),
      ]);
      data = res;
    } catch (e) { data = { error: e.message }; }

    if (!data || data.error || typeof data.servable === 'undefined') {
      setError((data && data.error) || 'Could not complete the check. Please try again.');
      setStage('input');
      return;
    }
    setScanMsg('Finishing up…'); await sleep(400);
    setResult({ servable: !!data.servable, num });
    setStage('result');
  }

  function again() {
    setStage('input'); setPhone(''); setResult(null); setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <style>{`@keyframes vmSlide{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}@keyframes vmPop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}`}</style>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-[vmPop_.18s_ease-out]">
        {/* header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Search className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 leading-tight">Check this number</h3>
            <p className="text-xs text-gray-500">See if it&apos;s ready before you pay</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {stage === 'input' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MTN number</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef} value={phone} onChange={onPhone}
                    onKeyDown={(e) => e.key === 'Enter' && verify()}
                    inputMode="numeric" placeholder="024 000 0000" autoComplete="off"
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold tracking-wide text-lg"
                  />
                </div>
                <button onClick={verify} className="px-5 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold shadow-md active:scale-95 transition-all flex items-center gap-2">
                  Check <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <div className="mt-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              <p className="mt-3 text-xs text-gray-400">A ready number gets any bundle instantly.</p>
            </div>
          )}

          {stage === 'scanning' && (
            <div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-emerald-500 rounded-full" style={{ animation: 'vmSlide 1.15s ease-in-out infinite' }} />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{scanMsg}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Confirming with the network</p>
                </div>
              </div>
            </div>
          )}

          {stage === 'result' && result && (
            <div>
              {result.servable ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-800">Ready to receive data</h4>
                    <p className="text-sm text-emerald-700 mt-0.5"><span className="font-semibold">{pretty(result.num)}</span> can get data now — buy any bundle size.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-800">New number — activate first</h4>
                      <p className="text-sm text-amber-700 mt-0.5"><span className="font-semibold">{pretty(result.num)}</span> is new to the network.</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3"><Info className="w-3.5 h-3.5" /> To get this number working:</p>
                    <ol className="space-y-2.5">
                      {['Buy a 1GB bundle first.', 'Allow up to 72 hours for the new line to activate.', 'After that, buy any amount and it delivers instantly.'].map((s, i) => (
                        <li key={i} className="flex gap-2.5 items-start text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-md bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>{s}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={again} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Check another
                </button>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-sm transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
