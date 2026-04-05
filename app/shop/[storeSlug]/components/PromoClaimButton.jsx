'use client';
import { useState, useEffect } from 'react';

const API_BASE = 'https://api.datamartgh.shop/api';

export default function PromoClaimButton({ storeSlug }) {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pulse, setPulse] = useState(true);

  // Anti-bot
  const [challenge, setChallenge] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  useEffect(() => { checkVisibility(); }, [storeSlug]);
  useEffect(() => { const t = setTimeout(() => setPulse(false), 10000); return () => clearTimeout(t); }, []);

  const checkVisibility = async () => {
    try {
      const res = await fetch(`${API_BASE}/agent-promo/store/${storeSlug}/promo/status`);
      const data = await res.json();
      if (data.success && data.data.hasActivePromos && data.data.promoEnabled) setVisible(true);
    } catch {}
  };

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`${API_BASE}/agent-promo/store/${storeSlug}/promo/challenge`);
      const data = await res.json();
      if (data.success) { setChallenge(data.data); setSelectedEmoji(null); }
    } catch {}
  };

  const openModal = () => {
    setShowModal(true); setResult(null); setCode(''); setSelectedEmoji(null); setPulse(false);
    fetchChallenge();
  };

  const handleClaim = async () => {
    if (!code.trim() || !phone.trim() || !selectedEmoji) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/agent-promo/store/${storeSlug}/promo/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(), phone: phone.trim(), name: name.trim() || undefined,
          challengeToken: challenge?.token, challengeAnswer: selectedEmoji
        })
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message, data: data.data });
      if (data.success) { setCode(''); setPhone(''); setName(''); setSelectedEmoji(null); }
      else fetchChallenge();
    } catch {
      setResult({ success: false, message: 'Something went wrong. Try again.' });
      fetchChallenge();
    } finally { setLoading(false); }
  };

  const blockPaste = (e) => e.preventDefault();
  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > code.length + 1) return;
    setCode(val); setResult(null);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed top-1/2 -translate-y-1/2 left-4 z-40">
        {pulse && <span className="absolute inset-0 rounded-2xl bg-green-500 animate-ping opacity-30" />}
        <button onClick={openModal}
          className="relative flex items-center gap-2 px-4 py-3 bg-green-600 text-white font-extrabold rounded-2xl shadow-[0_4px_20px_rgba(22,163,74,0.4)] hover:bg-green-500 active:scale-95 transition-all text-sm"
        ><span className="text-lg">🎁</span> FREE DATA</button>
      </div>

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 flex items-start sm:items-center justify-center z-50 pointer-events-none pt-12 sm:pt-0 px-4 overflow-y-auto">
            <div className="bg-[#111] w-full sm:max-w-[380px] rounded-2xl pointer-events-auto overflow-hidden mb-4"
              style={{ animation: 'claimSlide 0.25s ease-out' }}>

              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div>
                  <h2 className="text-white font-bold text-[17px]">Claim Free Data</h2>
                  <p className="text-gray-500 text-xs">Type the code — no paste allowed</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 pb-6 pt-2">
                {result?.success ? (
                  <div className="py-6 text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-white font-bold text-lg mb-1">{result.message}</p>
                    {result.data && (
                      <p className="text-gray-400 text-sm">
                        {result.data.capacity}GB {result.data.networkDisplay} will be sent to {result.data.deliveryPhone}
                      </p>
                    )}
                    <button onClick={() => { setShowModal(false); setResult(null); }}
                      className="mt-5 px-8 py-2.5 bg-yellow-400 text-black font-bold rounded-xl text-sm">Done</button>
                  </div>
                ) : (
                  <>
                    {result && !result.success && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-xs">{result.message}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Your name (optional)" maxLength={50}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm" />
                    </div>

                    <div className="mb-3">
                      <input type="text" value={code} onChange={handleCodeChange}
                        onPaste={blockPaste} onDrop={blockPaste} onCut={blockPaste}
                        autoComplete="off" spellCheck="false" placeholder="TYPE PROMO CODE" maxLength={20}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-center text-[15px] font-mono font-bold tracking-[0.2em] placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors" />
                      <p className="text-gray-600 text-[10px] mt-1 text-center">Paste disabled — type each letter</p>
                    </div>

                    <div className="mb-4">
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input type="tel" value={phone}
                          onChange={(e) => { setPhone(e.target.value.replace(/[^0-9+]/g, '')); setResult(null); }}
                          placeholder="Phone number for delivery" maxLength={15}
                          className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm" />
                      </div>
                    </div>

                    {/* Emoji challenge */}
                    {challenge && (
                      <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-gray-400 text-xs mb-2.5">Tap the <span className="text-2xl align-middle">{challenge.target}</span> to continue</p>
                        <div className="grid grid-cols-6 gap-2">
                          {challenge.options.map((emoji, i) => (
                            <button key={i} onClick={() => setSelectedEmoji(emoji)}
                              className={`text-2xl p-2 rounded-xl transition-all active:scale-90 ${
                                selectedEmoji === emoji
                                  ? 'bg-yellow-400/20 border-2 border-yellow-400 scale-110'
                                  : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                              }`}
                            >{emoji}</button>
                          ))}
                        </div>
                        {selectedEmoji && selectedEmoji !== challenge.target && (
                          <p className="text-red-400 text-[11px] mt-2 text-center">Wrong one — try again</p>
                        )}
                        {selectedEmoji === challenge.target && (
                          <p className="text-green-400 text-[11px] mt-2 text-center">Verified ✓</p>
                        )}
                      </div>
                    )}

                    <button onClick={handleClaim}
                      disabled={loading || !code.trim() || !phone.trim() || selectedEmoji !== challenge?.target}
                      className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-yellow-400 text-sm"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Claiming...
                        </span>
                      ) : 'Claim Now'}
                    </button>

                    <p className="text-center text-[11px] text-gray-600 mt-3">First come, first served</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes claimSlide { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </>
      )}
    </>
  );
}
