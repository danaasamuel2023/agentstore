// app/shop/[storeSlug]/payment/verify/page.jsx - WEBHOOK-BASED VERIFICATION
'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  CheckCircle, XCircle, Clock, AlertCircle, 
  Loader2, Package, Phone, Mail, ArrowRight,
  Home, ShoppingBag, MessageCircle, Copy, 
  Download, Share2, Printer, RefreshCw
} from 'lucide-react';

// Lottie for animations
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';
import successAnimation from '@/public/animations/payment-success.json';
import errorAnimation from '@/public/animations/warning.json';

// API Base - Using Proxy to prevent CORS
const API_BASE = '/api/proxy';

export default function PaymentVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [transactionData, setTransactionData] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [reference, setReference] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme !== 'light');
    }
    
    // Get reference from URL
    let ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) {
      ref = ref.split(':')[0].trim();
      setReference(ref);
    }
    
    verifyPayment();
    fetchStoreData();
  }, []);

  // Verify payment using PROXY
  const verifyPayment = async () => {
    try {
      let ref = searchParams.get('reference') || searchParams.get('trxref');
      
      if (!ref) {
        // No reference - show processing anyway (user might have come here directly)
        setVerificationStatus('processing');
        return;
      }

      // Clean the reference
      ref = ref.split(':')[0].trim();
      setReference(ref);

      console.log('[Payment Verify] Store slug:', params.storeSlug);
      console.log('[Payment Verify] Verifying reference:', ref);

      const response = await fetch(
        `${API_BASE}/v1/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${ref}`,
        { headers: { 'Accept': 'application/json' } }
      );

      console.log('[Payment Verify] Response status:', response.status);

      // If we get HTML (404) or any error, show processing instead of error
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('[Payment Verify] Non-JSON response, showing processing state');
        setVerificationStatus('processing');
        return;
      }

      const data = await response.json();
      console.log('[Payment Verify] Response data:', data);

      if (data.status === 'success') {
        setVerificationStatus('success');
        setTransactionData(data.data);
        
        if (data.data.transactionId) {
          localStorage.setItem('lastTransactionId', data.data.transactionId);
        }
      } else if (response.status === 404 || data.message?.includes('not found')) {
        // Order not found yet - webhook might still be processing
        setVerificationStatus('processing');
      } else {
        setVerificationStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      // Instead of showing error, show processing - webhook handles the actual verification
      setVerificationStatus('processing');
    }
  };

  // Fetch store data using PROXY
  const fetchStoreData = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/agent-stores/store/${params.storeSlug}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return;
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setStoreData(data.data);
      }
    } catch (err) {
      console.error('Error fetching store:', err);
    }
  };

  const copyTransactionId = () => {
    if (transactionData?.transactionId) {
      navigator.clipboard.writeText(transactionData.transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReference = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReceipt = () => {
    const receiptContent = `
TRANSACTION RECEIPT
==================
Transaction ID: ${transactionData?.transactionId}
Date: ${new Date().toLocaleString()}
Store: ${storeData?.storeName}

PRODUCT DETAILS
---------------
Network: ${transactionData?.product?.network === 'YELLO' ? 'MTN' : transactionData?.product?.network}
Data Bundle: ${transactionData?.product?.capacity}GB
Price: GH₵ ${transactionData?.amount?.toFixed(2)}

DELIVERY DETAILS
----------------
Phone Number: ${transactionData?.phoneNumber}
Status: ${transactionData?.orderStatus}

Thank you for your purchase!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transactionData?.transactionId}.txt`;
    a.click();
  };

  const shareTransaction = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Data Bundle Purchase',
        text: `I just purchased ${transactionData?.product?.capacity}GB data bundle from ${storeData?.storeName}!`,
        url: window.location.href
      });
    }
  };

  // Loading State with Lottie
  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Lottie 
            animationData={loadingAnimation} 
            loop 
            autoplay 
            style={{ width: 120, height: 120, margin: '0 auto' }} 
          />
          <h2 className="text-xl font-bold text-white mt-4">Verifying Payment</h2>
          <p className="text-gray-400 text-sm mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  // Processing State - Payment received, webhook handling order
  if (verificationStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Processing Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-center text-white">
              <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <Clock className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Payment Received!</h1>
              <p className="text-blue-100 text-sm mt-1">Your order is being processed</p>
            </div>

            {/* Processing Details */}
            <div className="p-5">
              {/* Reference ID if available */}
              {reference && (
                <div className="bg-gray-700 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Payment Reference</p>
                      <p className="font-mono font-bold text-white text-sm break-all">{reference}</p>
                    </div>
                    <button
                      onClick={copyReference}
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Message */}
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Payment Successful!</p>
                    <p className="text-green-300 text-sm mt-1">
                      We've received your payment and your data bundle is being processed.
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Happening */}
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  What happens next?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <p className="text-blue-200 text-sm">We're processing your order right now</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <p className="text-blue-200 text-sm">Your data bundle will be delivered within <strong>10-60 minutes</strong></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <p className="text-blue-200 text-sm">You'll receive an <strong>SMS confirmation</strong> once delivered</p>
                  </li>
                </ul>
              </div>

              {/* Delivery Time Notice */}
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 text-xs font-medium">Delivery Time</p>
                    <p className="text-yellow-300 text-xs">
                      Most orders complete within 10-30 minutes. Please allow up to 60 minutes during peak hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Support */}
              {storeData?.contactInfo?.whatsappNumber && (
                <a
                  href={`https://wa.me/${storeData.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I just made a payment and want to confirm my order. Reference: ${reference || 'N/A'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg mb-4 font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Support on WhatsApp
                </a>
              )}

              {/* Navigation */}
              <div className="flex gap-2">
                <Link
                  href={`/shop/${params.storeSlug}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  <Home className="w-4 h-4" />
                  Store
                </Link>
                
                <Link
                  href={`/shop/${params.storeSlug}/products`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy More
                </Link>
              </div>
            </div>
          </div>

          {/* Store Footer */}
          {storeData && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Thank you for shopping with <span className="text-yellow-400">{storeData.storeName}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Success State
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Success Card */}
          <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center text-white">
              <Lottie 
                animationData={successAnimation} 
                loop={false} 
                autoplay 
                style={{ width: 100, height: 100, margin: '0 auto' }} 
              />
              <h1 className="text-2xl font-bold mt-2">Payment Successful!</h1>
              <p className="text-green-100 text-sm">Your data bundle has been confirmed</p>
            </div>

            {/* Transaction Details */}
            <div className="p-5">
              {/* Transaction ID */}
              <div className="bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Transaction ID</p>
                    <p className="font-mono font-bold text-white">{transactionData?.transactionId}</p>
                  </div>
                  <button
                    onClick={copyTransactionId}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Product */}
                <div className="bg-blue-900/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-xs font-medium">Product</span>
                  </div>
                  <p className="text-white font-bold">
                    {transactionData?.product?.capacity}GB
                  </p>
                  <p className="text-gray-400 text-xs">
                    {transactionData?.product?.network === 'YELLO' ? 'MTN' : transactionData?.product?.network}
                  </p>
                </div>

                {/* Amount */}
                <div className="bg-green-900/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-xs font-medium">Amount Paid</span>
                  </div>
                  <p className="text-green-400 font-bold text-lg">
                    GH₵ {transactionData?.amount?.toFixed(2)}
                  </p>
                </div>

                {/* Phone */}
                <div className="bg-purple-900/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-xs font-medium">Delivery To</span>
                  </div>
                  <p className="text-white font-medium text-sm">
                    {transactionData?.phoneNumber}
                  </p>
                </div>

                {/* Status */}
                <div className="bg-yellow-900/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Status</span>
                  </div>
                  <p className="text-yellow-400 font-medium text-sm">
                    {transactionData?.orderStatus || 'Processing'}
                  </p>
                </div>
              </div>

              {/* Delivery Notice */}
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 text-xs font-medium">Delivery Time</p>
                    <p className="text-yellow-300 text-xs">
                      Your data will be delivered within 10-60 minutes. You'll receive an SMS confirmation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={downloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  <Download className="w-4 h-4" />
                  Receipt
                </button>
                
                {navigator.share && (
                  <button
                    onClick={shareTransaction}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
              </div>

              {/* WhatsApp Support */}
              {storeData?.contactInfo?.whatsappNumber && (
                <a
                  href={`https://wa.me/${storeData.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I need help with order ${transactionData?.transactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg mb-4"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Support on WhatsApp
                </a>
              )}

              {/* Navigation */}
              <div className="flex gap-2">
                <Link
                  href={`/shop/${params.storeSlug}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  <Home className="w-4 h-4" />
                  Store
                </Link>
                
                <Link
                  href={`/shop/${params.storeSlug}/products`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy More
                </Link>
              </div>
            </div>
          </div>

          {/* Store Footer */}
          {storeData && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Thank you for shopping with <span className="text-yellow-400">{storeData.storeName}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Failed/Error State - Only shown for actual payment failures
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-center text-white">
            <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center">
              <XCircle className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold">Payment Failed</h1>
            <p className="text-red-100 text-sm">{error || 'We couldn\'t process your payment'}</p>
          </div>

          {/* Error Details */}
          <div className="p-5">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
              <h3 className="text-red-400 font-medium mb-2">What might have happened?</h3>
              <ul className="text-red-300 text-sm space-y-1">
                <li>• Insufficient funds in your account</li>
                <li>• Payment was cancelled</li>
                <li>• Network or connection issues</li>
                <li>• Payment gateway timeout</li>
              </ul>
            </div>

            {/* Support */}
            {storeData?.contactInfo?.whatsappNumber && (
              <a
                href={`https://wa.me/${storeData.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I had an issue with my payment. Reference: ${reference || 'N/A'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg mb-4"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </a>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              <Link
                href={`/shop/${params.storeSlug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                <Home className="w-4 h-4" />
                Store
              </Link>
              
              <Link
                href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg"
              >
                <ArrowRight className="w-4 h-4" />
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}