'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Loader2, Home, ShoppingBag, Copy, RefreshCw } from 'lucide-react';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { DeliveryEtaInline } from '../../components/DeliveryEta';

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
        console.warn('[payment-verify]', data.message, res.status);
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

  /* ---------------------------------------------------------------------- */
  /* Shared pieces                                                          */
  /* ---------------------------------------------------------------------- */

  const Shell = ({ tone, Icon, spin, title, subtitle, children }) => (
    <div className="mx-auto w-full max-w-md py-8">
      <div className="card overflow-hidden">
        <div className="flex items-start gap-3.5 border-b border-hairline p-5">
          <span
            className="flex h-11 w-11 flex-none items-center justify-center rounded-lg"
            style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}
          >
            <Icon className={`h-5 w-5 ${spin ? 'animate-spin' : ''}`} />
          </span>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[17px]">{title}</h1>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{subtitle}</p>
          </div>
        </div>
        <div className="space-y-4 p-5">{children}</div>
      </div>
    </div>
  );

  /* A reference is the only thing a customer can hand to support, so it is a
     row you can read and copy, not 11px mono squeezed into a corner. */
  const CopyRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <button
        type="button"
        onClick={() => copy(value)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-hairline bg-sunken px-4 py-3 text-left transition-colors hover:border-hairline-strong"
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.07em] text-ink-3">{label}</span>
          <span className="num mt-0.5 block truncate text-[14px] font-semibold text-ink">{value}</span>
        </span>
        {copied ? (
          <CheckCircle className="h-4 w-4 flex-none" style={{ color: 'var(--ok)' }} />
        ) : (
          <Copy className="h-4 w-4 flex-none text-ink-4" />
        )}
      </button>
    );
  };

  const SupportRow = ({ text, primary }) => (
    <div className="flex gap-2">
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost flex-1"
        >
          <span style={{ color: '#25D366' }} className="flex">
            <WhatsAppIcon className="h-4 w-4" />
          </span>
          Message the shop
        </a>
      )}
      {primary}
    </div>
  );

  /* ---------------------------------------------------------------------- */

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-ink-4" />
          <p className="text-[13px] text-ink-3">Checking your payment…</p>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <Shell
        tone="warn"
        Icon={Loader2}
        spin
        title="Payment received"
        subtitle="We have your money. The bundle is on its way to the number you entered."
      >
        <CopyRow label="Reference" value={reference} />

        {/* Measured, not "10-60 min". The old copy printed a guess as a fact on
            the one screen where a customer is most anxious about timing. */}
        <div className="rounded-lg border border-hairline px-4 py-3">
          <DeliveryEtaInline />
        </div>

        <button type="button" onClick={recheckPayment} disabled={checking} className="btn btn-brand w-full">
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {checking ? 'Checking' : 'Check again'}
        </button>

        {error && (
          <p className="text-center text-[12.5px]" style={{ color: 'var(--warn)' }}>
            {error}
          </p>
        )}

        <SupportRow
          text={`Hi, confirming payment ref: ${reference || 'N/A'}`}
          primary={
            <Link href={`/shop/${params.storeSlug}`} className="btn btn-ghost flex-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
          }
        />
      </Shell>
    );
  }

  if (status === 'success') {
    const rows = [
      { label: 'Bundle', value: `${transaction?.product?.capacity || '?'}GB ${networkName(transaction?.product?.network)}` },
      { label: 'Paid', value: `₵${transaction?.amount?.toFixed?.(2) || transaction?.amount || '?'}` },
      { label: 'Sent to', value: transaction?.phoneNumber || '—' },
    ];
    const done = transaction?.orderStatus === 'completed';

    return (
      <Shell
        tone="ok"
        Icon={CheckCircle}
        title="Payment successful"
        subtitle={done ? 'Delivered. Check the phone.' : 'Your order is confirmed and queued.'}
      >
        <CopyRow label="Transaction ID" value={transaction?.transactionId} />

        <dl className="divide-y divide-hairline border-y border-hairline">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-[13px] text-ink-3">{row.label}</dt>
              <dd className="num text-[14px] font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-[13px] text-ink-3">Status</dt>
            <dd>
              <span
                className="chip"
                style={{
                  background: done ? 'var(--ok-soft)' : 'var(--warn-soft)',
                  color: done ? 'var(--ok)' : 'var(--warn)',
                }}
              >
                {done ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {done ? 'Delivered' : 'Delivering'}
              </span>
            </dd>
          </div>
        </dl>

        {!done && (
          <div className="rounded-lg border border-hairline px-4 py-3">
            <DeliveryEtaInline />
          </div>
        )}

        <p className="text-center text-[12.5px] leading-relaxed text-ink-3">
          The network sends an SMS when the data lands. Keep the transaction ID.
        </p>

        <SupportRow
          text={`Hi, help with order ${transaction?.transactionId}`}
          primary={
            <Link href={`/shop/${params.storeSlug}/products`} className="btn btn-brand flex-1">
              <ShoppingBag className="h-4 w-4" />
              Buy again
            </Link>
          }
        />
      </Shell>
    );
  }

  return (
    <Shell
      tone="bad"
      Icon={XCircle}
      title="We could not confirm this payment"
      subtitle={error || 'Nothing has been lost — if you were charged, check again below.'}
    >
      <CopyRow label="Reference" value={reference} />

      <button type="button" onClick={recheckPayment} disabled={checking} className="btn btn-brand w-full">
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {checking ? 'Checking' : 'Check again'}
      </button>

      <p className="text-center text-[12.5px] leading-relaxed text-ink-3">
        A payment can take a moment to reach us. If money left your phone, send the reference above
        to the shop and they will find it.
      </p>

      <SupportRow
        text={`Hi, payment issue. Ref: ${reference || 'N/A'}`}
        primary={
          <Link href={`/shop/${params.storeSlug}/products`} className="btn btn-ghost flex-1">
            Try again
          </Link>
        }
      />
    </Shell>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  );
}
