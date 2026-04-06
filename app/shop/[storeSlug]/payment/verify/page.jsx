'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Loader2, Phone, Home, ShoppingBag, MessageCircle, Copy, RefreshCw } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api';

function PaymentVerifyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [transaction, setTransaction] = useState(null);
  const [store, setStore] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reference, setReference] = useState(null);
  const [checking, setChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debugError, setDebugError] = useState(null);

  useEffect(() => {
    let ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) setReference(ref.split(':')[0].trim());
    verifyPayment();
    fetchStore();
  }, []);

  useEffect(() => {
    if (status === 'processing' && reference && retryCount < 3) {
      const t = setTimeout(() => { setRetryCount(p => p + 1); verifyPayment(); }, 5000);
      return () => clearTimeout(t);
    }
  }, [status, retryCount]);

  // Helper to build transaction data from status endpoint
  const buildTxFromStatus = (tx) => ({
    transactionId: tx.transactionId,
    amount: tx.sellingPrice || tx.amount,
    product: tx.product || (tx.productId ? { network: tx.productId.network, capacity: tx.productId.capacity } : { network: tx.network, capacity: tx.capacity }),
    phoneNumber: tx.phoneNumber || tx.customerPhone,
    orderStatus: tx.orderStatus
  });

  const verifyPayment = async () => {
    try {
      let ref = searchParams.get('reference') || searchParams.get('trxref');
      if (!ref) { setStatus('processing'); return; }
      ref = ref.split(':')[0].trim();
      setReference(ref);

      // Step 1: Try verify endpoint
      try {
        const res = await fetch(`${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${ref}`, { headers: { Accept: 'application/json' } });
        const ct = res.headers.get('content-type');
        if (ct?.includes('application/json')) {
          const data = await res.json();
          if (data.status === 'success') {
            setStatus('success');
            setTransaction(data.data);
            if (data.data?.transactionId) localStorage.setItem('lastTransactionId', data.data.transactionId);
            return;
          }
          setDebugError(`Verify: ${data.message || 'Unknown'} (${res.status})`);
        }
      } catch (e) {
        setDebugError(`Verify error: ${e.message}`);
      }

      // Step 2: Check transaction status directly (works on refresh)
      try {
        const statusRes = await fetch(`${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/status/${ref}`, { headers: { Accept: 'application/json' } });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'success' && statusData.data) {
            const tx = statusData.data;
            if (tx.paymentStatus === 'completed' || tx.orderStatus === 'completed') {
              setStatus('success');
              setTransaction(buildTxFromStatus(tx));
              return;
            }
            // Payment exists but not completed yet
            setStatus('processing');
            return;
          }
        }
      } catch {}

      setStatus('processing');
    } catch (err) {
      setStatus('processing');
    }
  };

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/agent-stores/store/${params.storeSlug}`);
      const ct = res.headers.get('content-type');
      if (!ct?.includes('application/json')) return;
      const data = await res.json();
      if (data.status === 'success') setStore(data.data);
    } catch {}
  };

  const copy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const recheckPayment = async () => {
    setChecking(true); setError(null); setDebugError(null);
    try {
      const ref = (reference || searchParams.get('reference') || searchParams.get('trxref') || '').split(':')[0].trim();
      if (!ref) return;

      // Try verify first
      try {
        const res = await fetch(`${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${ref}`, { headers: { Accept: 'application/json' } });
        const ct = res.headers.get('content-type');
        if (ct?.includes('application/json')) {
          const d = await res.json();
          if (d.status === 'success') { setStatus('success'); setTransaction(d.data); return; }
          setDebugError(`Verify: ${d.message || d.details || 'Unknown error'} (${res.status})`);
        }
      } catch (e) {
        setDebugError(`Verify: ${e.message}`);
      }

      // Try status check
      try {
        const r2 = await fetch(`${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/status/${ref}`, { headers: { Accept: 'application/json' } });
        if (r2.ok) {
          const d = await r2.json();
          if (d.status === 'success' && d.data) {
            if (d.data.paymentStatus === 'completed' || d.data.orderStatus === 'completed') {
              setStatus('success'); setTransaction(buildTxFromStatus(d.data)); return;
            }
          }
        }
      } catch {}

      setError('Still processing. Try again shortly.');
    } catch { setError('Connection issue. Check your internet.'); }
    finally { setChecking(false); }
  };

  const whatsapp = store?.contactInfo?.whatsappNumber;
  const networkName = (n) => n === 'YELLO' ? 'MTN' : n === 'AT_PREMIUM' ? 'AirtelTigo' : n;

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Verifying payment...</p>
      </div>
    </div>
  );

  if (status === 'processing') return (
    <div className="flex items-start justify-center min-h-[70vh] pt-10 px-4">
      <div className="w-full max-w-xs">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 pt-6 pb-5 text-center border-b border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 mx-auto mb-3 relative">
              <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
              <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-500 animate-spin" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Payment Received</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Processing your order...</p>
          </div>
          <div className="p-4 space-y-3">
            {reference && (
              <button onClick={() => copy(reference)} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 group">
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reference</p>
                  <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate">{reference}</p>
                </div>
                {copied ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              </button>
            )}
            <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-950/30 rounded-xl px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 dark:text-green-400">Payment confirmed. Data delivery in 10-60 min.</p>
            </div>
            <button onClick={recheckPayment} disabled={checking}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 text-white dark:text-gray-900 text-xs font-semibold rounded-xl transition active:scale-[0.98]"
            >{checking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</> : <><RefreshCw className="w-3.5 h-3.5" /> Check Status</>}</button>
            {error && <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center">{error}</p>}
            {debugError && <p className="text-[10px] text-gray-500 dark:text-gray-600 text-center font-mono">{debugError}</p>}
            <div className="flex gap-2">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi, confirming payment ref: ${reference || 'N/A'}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition active:scale-[0.98]"
                ><MessageCircle className="w-3.5 h-3.5" /> Support</a>
              )}
              <Link href={`/shop/${params.storeSlug}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              ><Home className="w-3.5 h-3.5" /> Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="flex items-start justify-center min-h-[70vh] pt-10 px-4">
      <div className="w-full max-w-xs">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 pt-6 pb-5 text-center border-b border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Payment Successful</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Order confirmed</p>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => copy(transaction?.transactionId)} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 group">
              <div className="text-left min-w-0">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Transaction ID</p>
                <p className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 truncate">{transaction?.transactionId}</p>
              </div>
              {copied ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            </button>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700/50">
              {[
                { label: 'Product', value: `${transaction?.product?.capacity || '?'}GB ${networkName(transaction?.product?.network)}`, icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                { label: 'Amount', value: `GH₵ ${transaction?.amount?.toFixed?.(2) || transaction?.amount || '?'}`, icon: <span className="text-[10px] font-bold">₵</span>, green: true },
                { label: 'Phone', value: transaction?.phoneNumber || '—', icon: <Phone className="w-3.5 h-3.5" /> },
                { label: 'Status', value: transaction?.orderStatus === 'completed' ? 'Completed' : 'Delivering', icon: <Clock className="w-3.5 h-3.5" />, badge: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                    {row.icon}<span className="text-xs">{row.label}</span>
                  </div>
                  {row.badge ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />{row.value}
                    </span>
                  ) : (
                    <span className={`text-xs font-semibold ${row.green ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">Data delivery in 10-60 min. SMS on completion.</p>
            <div className="flex gap-2">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi, help with order ${transaction?.transactionId}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition active:scale-[0.98]"
                ><MessageCircle className="w-3.5 h-3.5" /> Support</a>
              )}
              <Link href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-xl transition active:scale-[0.98]"
              ><ShoppingBag className="w-3.5 h-3.5" /> Buy More</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Failed
  return (
    <div className="flex items-start justify-center min-h-[70vh] pt-10 px-4">
      <div className="w-full max-w-xs">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 pt-6 pb-5 text-center border-b border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Verification Failed</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{error || "Couldn't verify payment"}</p>
          </div>
          <div className="p-4 space-y-3">
            {reference && (
              <button onClick={() => copy(reference)} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 group">
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reference</p>
                  <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate">{reference}</p>
                </div>
                {copied ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              </button>
            )}
            <button onClick={recheckPayment} disabled={checking}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition active:scale-[0.98]"
            >{checking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</> : <><RefreshCw className="w-3.5 h-3.5" /> Re-verify Payment</>}</button>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">If you were charged, tap above to re-check</p>
            {debugError && <p className="text-[10px] text-red-400 dark:text-red-500 text-center font-mono bg-red-50 dark:bg-red-950/30 rounded-lg px-2 py-1.5">{debugError}</p>}
            <div className="flex gap-2">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi, payment issue. Ref: ${reference || 'N/A'}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition active:scale-[0.98]"
                ><MessageCircle className="w-3.5 h-3.5" /> Support</a>
              )}
              <Link href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >Try Again</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  );
}
