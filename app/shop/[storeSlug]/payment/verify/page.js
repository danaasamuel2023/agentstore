// app/shop/[storeSlug]/payment/verify/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, XCircle, Clock, AlertCircle, 
  Loader2, Package, Phone, Mail, ArrowRight,
  Home, ShoppingBag, MessageCircle, Copy, 
  Download, Share2, Printer
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

export default function PaymentVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, failed, error
  const [transactionData, setTransactionData] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme === 'dark' || (!storedTheme && prefersDark));
    }
    
    verifyPayment();
    fetchStoreData();
  }, []);

  const verifyPayment = async () => {
    try {
      const reference = searchParams.get('reference') || searchParams.get('trxref');
      
      if (!reference) {
        setVerificationStatus('error');
        setError('No payment reference found');
        return;
      }

      // Call backend to verify payment
      const response = await fetch(
        `${API_BASE}/agent-stores/stores/${params.storeSlug}/payment/verify?reference=${reference}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        setVerificationStatus('success');
        setTransactionData(data.data);
        
        // Store transaction ID for easy access
        if (data.data.transactionId) {
          localStorage.setItem('lastTransactionId', data.data.transactionId);
        }
      } else {
        setVerificationStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationStatus('error');
      setError('An error occurred while verifying your payment');
    }
  };

  const fetchStoreData = async () => {
    try {
      const response = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
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

  const downloadReceipt = () => {
    // Generate receipt content
    const receiptContent = `
TRANSACTION RECEIPT
==================
Transaction ID: ${transactionData?.transactionId}
Date: ${new Date().toLocaleString()}
Store: ${storeData?.storeName}

PRODUCT DETAILS
---------------
Network: ${transactionData?.product?.network}
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

  // Loading State
  if (verificationStatus === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Verifying Payment
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (verificationStatus === 'success') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Success Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden`}>
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
              <div className="inline-flex p-4 bg-white/20 rounded-full mb-4 backdrop-blur">
                <CheckCircle className="w-16 h-16" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-green-100 text-lg">Your data bundle purchase has been confirmed</p>
            </div>

            {/* Transaction Details */}
            <div className="p-6 md:p-8">
              {/* Transaction ID */}
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Transaction ID
                    </p>
                    <p className={`font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {transactionData?.transactionId}
                    </p>
                  </div>
                  <button
                    onClick={copyTransactionId}
                    className={`p-2 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg transition-colors`}
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    )}
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Product Details */}
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Product Details
                      </h3>
                      <div className="space-y-1">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Network: <span className="font-semibold">
                            {transactionData?.product?.network === 'YELLO' ? 'MTN' : transactionData?.product?.network}
                          </span>
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Data Bundle: <span className="font-semibold">{transactionData?.product?.capacity}GB</span>
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Amount Paid: <span className="font-semibold text-green-600">
                            GH₵ {transactionData?.amount?.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'} rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Delivery Details
                      </h3>
                      <div className="space-y-1">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Phone: <span className="font-semibold">{transactionData?.phoneNumber}</span>
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Status: <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            <Clock className="w-3 h-3 mr-1" />
                            {transactionData?.orderStatus || 'Processing'}
                          </span>
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Est. Delivery: <span className="font-semibold">10-60 minutes</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Notice */}
              <div className={`${isDarkMode ? 'bg-yellow-900/20 border-yellow-600' : 'bg-yellow-50 border-yellow-400'} border-l-4 rounded-lg p-4 mb-6`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                      Important Delivery Information
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Your data bundle will be delivered within 10-60 minutes. Delivery times may vary based on network conditions. 
                      You will receive an SMS confirmation once the data has been credited to your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  onClick={downloadReceipt}
                  className={`flex items-center justify-center gap-2 px-4 py-3 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } rounded-lg transition-colors`}
                >
                  <Download className="w-5 h-5" />
                  Download Receipt
                </button>
                
                <button
                  onClick={() => window.print()}
                  className={`flex items-center justify-center gap-2 px-4 py-3 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } rounded-lg transition-colors`}
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                
                {navigator.share && (
                  <button
                    onClick={shareTransaction}
                    className={`flex items-center justify-center gap-2 px-4 py-3 ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } rounded-lg transition-colors`}
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                )}
              </div>

              {/* WhatsApp Support */}
              {storeData?.contactInfo?.whatsappNumber && (
                <div className={`${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} rounded-xl p-4 mb-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Need Help?
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Contact us on WhatsApp for support
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${storeData.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I need help with my order ${transactionData?.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Chat Now
                    </a>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/shop/${params.storeSlug}`}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } rounded-lg transition-colors`}
                >
                  <Home className="w-5 h-5" />
                  Back to Store
                </Link>
                
                <Link
                  href={`/shop/${params.storeSlug}/products`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Buy More Data
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Store Info Footer */}
          {storeData && (
            <div className={`mt-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-sm">
                Thank you for shopping with{' '}
                <span className="font-semibold">{storeData.storeName}</span>
              </p>
              {storeData.metrics?.rating > 0 && (
                <div className="flex items-center justify-center mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(storeData.metrics.rating)
                            ? 'text-yellow-400 fill-current'
                            : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm">
                      {storeData.metrics.rating.toFixed(1)} ({storeData.metrics.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Failed/Error State
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden`}>
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center text-white">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-4 backdrop-blur">
              <XCircle className="w-16 h-16" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment Failed</h1>
            <p className="text-red-100 text-lg">
              {error || 'We couldn\'t process your payment'}
            </p>
          </div>

          {/* Error Details */}
          <div className="p-6 md:p-8">
            <div className={`${isDarkMode ? 'bg-red-900/20 border-red-600' : 'bg-red-50 border-red-400'} border-l-4 rounded-lg p-4 mb-6`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                What went wrong?
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'} mb-3`}>
                {error || 'The payment could not be completed. This could be due to:'}
              </p>
              <ul className={`list-disc list-inside text-sm space-y-1 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                <li>Insufficient funds in your account</li>
                <li>Payment was cancelled</li>
                <li>Network connectivity issues</li>
                <li>Payment gateway timeout</li>
              </ul>
            </div>

            {/* Support Section */}
            {storeData?.contactInfo?.whatsappNumber && (
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Need Assistance?
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Our support team is here to help
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${storeData.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/shop/${params.storeSlug}/products`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                Try Again
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link
                href={`/shop/${params.storeSlug}`}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } rounded-lg transition-colors`}
              >
                <Home className="w-5 h-5" />
                Back to Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}