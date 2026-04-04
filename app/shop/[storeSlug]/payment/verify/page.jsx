'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, XCircle, Clock, AlertCircle,
  Loader2, Package, Phone, Home, ShoppingBag,
  MessageCircle, Copy, RefreshCw, Wifi, Shield
} from 'lucide-react';

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

  useEffect(() => {
    let ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) {
      ref = ref.split(':')[0].trim();
      setReference(ref);
    }
    verifyPayment();
    fetchStore();
  }, []);

  useEffect(() => {
    if (status === 'processing' && reference && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        verifyPayment();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, retryCount]);

  const verifyPayment = async () => {
    try {
      let ref = searchParams.get('reference') || searchParams.get('trxref');
      if (!ref) { setStatus('processing'); return; }
      ref = ref.split(':')[0].trim();
      setReference(ref);

      const res = await fetch(
        `${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${ref}`,
        { headers: { 'Accept': 'application/json' } }
      );
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) { setStatus('processing'); return; }

      const data = await res.json();
      if (data.status === 'success') {
        setStatus('success');
        setTransaction(data.data);
        if (data.data.transactionId) localStorage.setItem('lastTransactionId', data.data.transactionId);
      } else if (res.status === 404 || data.message?.includes('not found')) {
        setStatus('processing');
      } else {
        setStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch {
      try {
        const ref = searchParams.get('reference') || searchParams.get('trxref');
        if (ref) {
          const statusRes = await fetch(
            `${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/status-by-ref/${ref.split(':')[0].trim()}`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (statusRes.ok) {
            const d = await statusRes.json();
            if (d.status === 'success' && d.data?.paymentStatus === 'completed') {
              setStatus('success'); setTransaction(d.data); return;
            }
          }
        }
      } catch {}
      setStatus('processing');
    }
  };

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/agent-stores/store/${params.storeSlug}`);
      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) return;
      const data = await res.json();
      if (data.status === 'success') setStore(data.data);
    } catch {}
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recheckPayment = async () => {
    setChecking(true);
    setError(null);
    try {
      const ref = reference || searchParams.get('reference') || searchParams.get('trxref');
      if (!ref) return;
      const cleanRef = ref.split(':')[0].trim();

      const res = await fetch(
        `${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${cleanRef}`,
        { headers: { 'Accept': 'application/json' } }
      );
      const ct = res.headers.get('content-type');
      if (ct && ct.includes('application/json')) {
        const data = await res.json();
        if (data.status === 'success') { setStatus('success'); setTransaction(data.data); return; }
      }
      const statusRes = await fetch(
        `${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/status-by-ref/${cleanRef}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (statusRes.ok) {
        const d = await statusRes.json();
        if (d.status === 'success' && d.data?.paymentStatus === 'completed') {
          setStatus('success'); setTransaction(d.data); return;
        }
      }
      setError('Still processing. Please wait a moment and try again.');
    } catch {
      setError('Connection issue. Please check your internet and try again.');
    } finally {
      setChecking(false);
    }
  };

  const storeName = store?.storeName || 'Store';
  const storeColor = store?.theme?.primaryColor || '#2563eb';
  const whatsapp = store?.contactInfo?.whatsappNumber;

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
            <Shield className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Verifying Payment</h2>
          <p className="text-gray-500 text-sm">Securely confirming with Paystack...</p>
        </div>
      </div>
    );
  }

  // ── Processing ──
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white p-4 flex items-start justify-center pt-8 sm:pt-16">
        <div className="w-full max-w-sm">
          {/* Animated header card */}
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-center text-white mb-6 overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <Clock className="w-7 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Payment Received</h1>
              <p className="text-blue-200 text-sm">Your order is being processed</p>
            </div>
          </div>

          {/* Reference */}
          {reference && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Payment Reference</p>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <code className="text-sm font-semibold text-gray-800 truncate mr-2">{reference}</code>
                <button onClick={() => copy(reference)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Payment Confirmed</p>
                <p className="text-green-600 text-xs">We received your payment successfully</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { num: '1', text: 'Order is being prepared', done: true },
                { num: '2', text: 'Data bundle delivery in 10-60 min', done: false },
                { num: '3', text: 'SMS confirmation on delivery', done: false },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    step.done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? <CheckCircle className="w-4 h-4" /> : step.num}
                  </div>
                  <p className={`text-sm ${step.done ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Check status button */}
          <button
            onClick={recheckPayment}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold rounded-2xl mb-3 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
          >
            {checking ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Verifying with Paystack...</>
            ) : (
              <><RefreshCw className="w-5 h-5" /> Check Payment Status</>
            )}
          </button>

          {error && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-3">
              <p className="text-amber-700 text-xs text-center">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mb-4">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi, I made a payment and want to confirm. Ref: ${reference || 'N/A'}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" /> Support
              </a>
            )}
            <Link
              href={`/shop/${params.storeSlug}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-2xl transition"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>

          {store && (
            <p className="text-center text-gray-400 text-xs">
              Powered by <span className="font-medium text-gray-500">{storeName}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    const network = transaction?.product?.network;
    const networkDisplay = network === 'YELLO' ? 'MTN' : network === 'AT_PREMIUM' ? 'AirtelTigo' : network;

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 flex items-start justify-center pt-8 sm:pt-16">
        <div className="w-full max-w-sm">
          {/* Success header */}
          <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-center text-white mb-6 overflow-hidden shadow-xl shadow-green-600/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            {/* Animated checkmark */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">Payment Successful!</h1>
            <p className="text-green-100 text-sm">Your data bundle is confirmed</p>
          </div>

          {/* Transaction ID */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Transaction ID</p>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <code className="text-sm font-bold text-gray-900 truncate mr-2">{transaction?.transactionId}</code>
              <button onClick={() => copy(transaction?.transactionId)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Order details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order Details</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">Product</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{transaction?.product?.capacity}GB</p>
                  <p className="text-xs text-gray-400">{networkDisplay}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">₵</span>
                  </div>
                  <span className="text-sm text-gray-500">Amount</span>
                </div>
                <p className="text-sm font-bold text-green-600">GH₵ {transaction?.amount?.toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">Delivery to</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{transaction?.phoneNumber}</p>
              </div>

              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-500">Status</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  {transaction?.orderStatus === 'completed' ? 'Completed' : 'Delivering'}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Wifi className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-0.5">Delivery in progress</p>
                <p className="text-blue-700 text-xs leading-relaxed">
                  Your data bundle will arrive within 10-60 minutes. You'll get an SMS when it's delivered.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 mb-4">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi, I need help with order ${transaction?.transactionId}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 px-5 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" /> Contact Support
              </a>
            )}
            <div className="flex gap-2.5">
              <Link
                href={`/shop/${params.storeSlug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-2xl transition"
              >
                <Home className="w-4 h-4" /> Home
              </Link>
              <Link
                href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" /> Buy More
              </Link>
            </div>
          </div>

          {store && (
            <p className="text-center text-gray-400 text-xs">
              Thank you for shopping with <span className="font-medium text-gray-500">{storeName}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Failed ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white p-4 flex items-start justify-center pt-8 sm:pt-16">
      <div className="w-full max-w-sm">
        {/* Error header */}
        <div className="relative bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-8 text-center text-white mb-6 overflow-hidden shadow-xl shadow-red-600/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Verification Failed</h1>
            <p className="text-red-100 text-sm">{error || "We couldn't verify your payment"}</p>
          </div>
        </div>

        {/* Reference */}
        {reference && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Payment Reference</p>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <code className="text-sm font-semibold text-gray-800 truncate mr-2">{reference}</code>
              <button onClick={() => copy(reference)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
        )}

        {/* Re-verify button */}
        <button
          onClick={recheckPayment}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-2xl mb-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/10"
        >
          {checking ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Checking with Paystack...</>
          ) : (
            <><RefreshCw className="w-5 h-5" /> Re-verify Payment</>
          )}
        </button>

        <p className="text-gray-400 text-xs text-center mb-4">
          If you were charged, tap above to re-verify your payment
        </p>

        {/* What happened */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">What might have happened?</p>
          <div className="space-y-2.5">
            {[
              'Payment was cancelled before completing',
              'Insufficient funds in your account',
              'Network or connection timeout',
              'Temporary payment gateway issue',
            ].map((reason, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5 flex-shrink-0" />
                <p className="text-gray-600 text-sm">{reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 mb-4">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi, I had a payment issue. Reference: ${reference || 'N/A'}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-5 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" /> Contact Support
            </a>
          )}
          <div className="flex gap-2.5">
            <Link
              href={`/shop/${params.storeSlug}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-2xl transition"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link
              href={`/shop/${params.storeSlug}/products`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
              Try Again
            </Link>
          </div>
        </div>

        {store && (
          <p className="text-center text-gray-400 text-xs">
            Powered by <span className="font-medium text-gray-500">{storeName}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  );
}
