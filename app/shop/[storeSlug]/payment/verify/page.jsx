'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, XCircle, Clock, AlertCircle, 
  Loader2, Package, Phone, Home, ShoppingBag, 
  MessageCircle, Copy, Download
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

  useEffect(() => {
    let ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) {
      ref = ref.split(':')[0].trim();
      setReference(ref);
    }
    
    verifyPayment();
    fetchStore();
  }, []);

  const verifyPayment = async () => {
    try {
      let ref = searchParams.get('reference') || searchParams.get('trxref');
      
      if (!ref) {
        setStatus('processing');
        return;
      }

      ref = ref.split(':')[0].trim();
      setReference(ref);

      const res = await fetch(
        `${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${ref}`,
        { headers: { 'Accept': 'application/json' } }
      );

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setStatus('processing');
        return;
      }

      const data = await res.json();

      if (data.status === 'success') {
        setStatus('success');
        setTransaction(data.data);
        if (data.data.transactionId) {
          localStorage.setItem('lastTransactionId', data.data.transactionId);
        }
      } else if (res.status === 404 || data.message?.includes('not found')) {
        setStatus('processing');
      } else {
        setStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('processing');
    }
  };

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/agent-stores/store/${params.storeSlug}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;
      
      const data = await res.json();
      if (data.status === 'success') {
        setStore(data.data);
      }
    } catch (err) {
      console.error('Error fetching store:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Verifying Payment</h2>
          <p className="text-gray-500 text-sm mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  // Processing
  if (status === 'processing') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-500 p-8 text-center text-white">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              <Clock className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h1 className="text-2xl font-bold">Payment Received!</h1>
            <p className="text-blue-100 mt-1">Your order is being processed</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {reference && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Reference</p>
                    <p className="font-mono font-semibold text-gray-900 text-sm">{reference}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(reference)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Payment Successful!</p>
                  <p className="text-green-700 text-sm mt-1">
                    We've received your payment and your data bundle is being processed.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                What happens next?
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-blue-700 text-sm">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  We're processing your order right now
                </li>
                <li className="flex items-start gap-2 text-blue-700 text-sm">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  Your data bundle will be delivered within <strong>10-60 minutes</strong>
                </li>
                <li className="flex items-start gap-2 text-blue-700 text-sm">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  You'll receive an <strong>SMS confirmation</strong> once delivered
                </li>
              </ul>
            </div>

            {store?.contactInfo?.whatsappNumber && (
              <a
                href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I just made a payment and want to confirm my order. Reference: ${reference || 'N/A'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl mb-4 transition"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </a>
            )}

            <div className="flex gap-3">
              <Link
                href={`/shop/${params.storeSlug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition"
              >
                <ShoppingBag className="w-4 h-4" />
                Buy More
              </Link>
            </div>
          </div>
        </div>

        {store && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Thank you for shopping with <span className="font-medium text-gray-700">{store.storeName}</span>
          </p>
        )}
      </div>
    );
  }

  // Success
  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-green-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-green-100 mt-1">Your data bundle has been confirmed</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Transaction ID */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono font-semibold text-gray-900">{transaction?.transactionId}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(transaction?.transactionId)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-blue-600 font-medium">Product</span>
                </div>
                <p className="font-bold text-gray-900">{transaction?.product?.capacity}GB</p>
                <p className="text-xs text-gray-500">
                  {transaction?.product?.network === 'YELLO' ? 'MTN' : transaction?.product?.network}
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-green-600 font-medium">Amount Paid</span>
                </div>
                <p className="font-bold text-green-600 text-lg">GH₵ {transaction?.amount?.toFixed(2)}</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-purple-600 font-medium">Delivery To</span>
                </div>
                <p className="font-semibold text-gray-900">{transaction?.phoneNumber}</p>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-medium">Status</span>
                </div>
                <p className="font-semibold text-yellow-700">{transaction?.orderStatus || 'Processing'}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 text-xs font-medium">Delivery Time</p>
                  <p className="text-amber-700 text-xs">
                    Your data will be delivered within 10-60 minutes. You'll receive an SMS confirmation.
                  </p>
                </div>
              </div>
            </div>

            {store?.contactInfo?.whatsappNumber && (
              <a
                href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I need help with order ${transaction?.transactionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl mb-4 transition"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </a>
            )}

            <div className="flex gap-3">
              <Link
                href={`/shop/${params.storeSlug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition"
              >
                <ShoppingBag className="w-4 h-4" />
                Buy More
              </Link>
            </div>
          </div>
        </div>

        {store && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Thank you for shopping with <span className="font-medium text-gray-700">{store.storeName}</span>
          </p>
        )}
      </div>
    );
  }

  // Failed
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-red-100 mt-1">{error || "We couldn't process your payment"}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-red-800 mb-2">What might have happened?</h3>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Insufficient funds in your account</li>
              <li>• Payment was cancelled</li>
              <li>• Network or connection issues</li>
              <li>• Payment gateway timeout</li>
            </ul>
          </div>

          {store?.contactInfo?.whatsappNumber && (
            <a
              href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I had an issue with my payment. Reference: ${reference || 'N/A'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl mb-4 transition"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </a>
          )}

          <div className="flex gap-3">
            <Link
              href={`/shop/${params.storeSlug}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href={`/shop/${params.storeSlug}/products`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  );
}
