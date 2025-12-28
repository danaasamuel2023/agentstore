// app/shop/[storeSlug]/orders/search/page.jsx - Updated with Public Track API
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Search, Package, CheckCircle, Clock, XCircle, AlertCircle,
  Phone, Hash, Calendar, Loader2, Moon, Sun,
  ArrowLeft, RefreshCw, Copy, MapPin, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';

// Lottie for loading
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

// API Base
const API_BASE = 'https://api.datamartgh.shop/api';
const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/0029Vb6zDvaGzzKTwCWszC1Z';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-yellow-500 text-black'
      }`}>
        {type === 'success' && <CheckCircle className="w-5 h-5" />}
        {type === 'error' && <XCircle className="w-5 h-5" />}
        {type === 'warning' && <AlertCircle className="w-5 h-5" />}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
      </div>
    </div>
  );
};

// Network Logos
const MTNLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="115" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="36" fill="#cc0000">T</text>
  </svg>
);

const AirtelTigoLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="115" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="36" fill="#7c3aed">AT</text>
  </svg>
);

// Status Badge with better visuals
const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: CheckCircle, text: 'Delivered', bg: 'bg-green-500/20', border: 'border-green-500/50', color: 'text-green-400' },
    delivered: { icon: CheckCircle, text: 'Delivered', bg: 'bg-green-500/20', border: 'border-green-500/50', color: 'text-green-400' },
    pending: { icon: Clock, text: 'Pending', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', color: 'text-yellow-400' },
    waiting: { icon: Clock, text: 'In Queue', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', color: 'text-yellow-400' },
    accepted: { icon: Clock, text: 'Accepted', bg: 'bg-blue-500/20', border: 'border-blue-500/50', color: 'text-blue-400' },
    processing: { icon: Loader2, text: 'Processing', bg: 'bg-blue-500/20', border: 'border-blue-500/50', color: 'text-blue-400', spin: true },
    on: { icon: Loader2, text: 'In Progress', bg: 'bg-blue-500/20', border: 'border-blue-500/50', color: 'text-blue-400', spin: true },
    failed: { icon: XCircle, text: 'Failed', bg: 'bg-red-500/20', border: 'border-red-500/50', color: 'text-red-400' },
    refunded: { icon: RefreshCw, text: 'Refunded', bg: 'bg-purple-500/20', border: 'border-purple-500/50', color: 'text-purple-400' },
    refund: { icon: RefreshCw, text: 'Refunded', bg: 'bg-purple-500/20', border: 'border-purple-500/50', color: 'text-purple-400' }
  };
  
  const { icon: Icon, text, bg, border, color, spin } = config[status] || config.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${bg} ${border} ${color}`}>
      <Icon className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
      {text}
    </span>
  );
};

// Order Card - Updated for new API response
const OrderCard = ({ order, onCopy, expanded, onToggle }) => {
  const getNetworkLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo size={44} />;
    if (network === 'TELECEL') return <TelecelLogo size={44} />;
    if (network === 'AT_PREMIUM' || network === 'at') return <AirtelTigoLogo size={44} />;
    return <Package className="w-11 h-11 text-gray-400" />;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden mb-4 transition-all duration-300">
      {/* Header - Clickable */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-750"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getNetworkLogo(order.product?.network)}
            <div>
              <h3 className="font-bold text-white text-lg">
                {order.product?.networkDisplay} {order.product?.capacityDisplay}
              </h3>
              <p className="text-sm text-gray-400">To: {order.recipientPhone}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700">
          {/* Status Message */}
          <div className={`mt-4 p-3 rounded-xl ${
            order.status === 'completed' || order.status === 'delivered' 
              ? 'bg-green-900/30 border border-green-800' 
              : order.status === 'failed' 
                ? 'bg-red-900/30 border border-red-800' 
                : 'bg-blue-900/30 border border-blue-800'
          }`}>
            <p className={`text-sm ${
              order.status === 'completed' || order.status === 'delivered'
                ? 'text-green-300' 
                : order.status === 'failed' 
                  ? 'text-red-300' 
                  : 'text-blue-300'
            }`}>
              {order.statusMessage}
            </p>
          </div>

          {/* Order Details */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white text-sm">{order.orderReference}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCopy(order.orderReference); }}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Amount Paid</span>
              <span className="font-bold text-yellow-400 text-lg">
                GH₵{order.pricing?.totalPaid?.toFixed(2) || order.pricing?.basePrice?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Ordered</span>
              <span className="text-white text-sm">{order.timeSinceOrder}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Processing</span>
              <span className="text-white text-sm capitalize">{order.processingMethod?.replace(/_/g, ' ') || 'Automatic'}</span>
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking && (
            <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-indigo-300 text-sm">Tracking Information</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {order.tracking.batchNumber && (
                  <div className="bg-indigo-900/30 rounded-lg p-2">
                    <p className="text-xs text-indigo-400">Batch #</p>
                    <p className="font-bold text-indigo-200">{order.tracking.batchNumber}</p>
                  </div>
                )}
                {order.tracking.positionInBatch && (
                  <div className="bg-indigo-900/30 rounded-lg p-2">
                    <p className="text-xs text-indigo-400">Position</p>
                    <p className="font-bold text-indigo-200">#{order.tracking.positionInBatch}</p>
                  </div>
                )}
                {order.tracking.portalId && (
                  <div className="bg-indigo-900/30 rounded-lg p-2">
                    <p className="text-xs text-indigo-400">Portal ID</p>
                    <p className="font-bold text-indigo-200 text-sm">{order.tracking.portalId}</p>
                  </div>
                )}
                {order.tracking.portalStatus && (
                  <div className="bg-indigo-900/30 rounded-lg p-2">
                    <p className="text-xs text-indigo-400">Portal Status</p>
                    <p className="font-bold text-indigo-200 capitalize">{order.tracking.portalStatus}</p>
                  </div>
                )}
              </div>

              {order.tracking.trackingMessage && (
                <p className="mt-3 text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded-lg">
                  ℹ️ {order.tracking.trackingMessage}
                </p>
              )}
            </div>
          )}

          {/* Help for pending/failed orders */}
          {(order.status === 'pending' || order.status === 'waiting' || order.status === 'failed') && (
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-700/50 rounded-xl">
              <p className="text-amber-300 text-sm mb-3">
                {order.status === 'failed' 
                  ? '❌ Something went wrong with your order.' 
                  : '⏳ Your order is being processed. Delivery usually takes 10 mins - 24 hours.'}
              </p>
              <a 
                href={WHATSAPP_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> 
                Join WhatsApp for Support
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function OrderSearchPage() {
  const params = useParams();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme !== 'light');
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Search using the new Track API
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      showToast('Please enter a value to search', 'warning');
      return;
    }

    setLoading(true);
    setOrders([]);
    setSearched(true);
    setExpandedIndex(0);

    try {
      const payload = {};
      if (searchType === 'phone') payload.phoneNumber = searchValue.trim();
      else if (searchType === 'reference') payload.reference = searchValue.trim();
      else if (searchType === 'transactionId') payload.transactionId = searchValue.trim();

      const response = await fetch(`${API_BASE}/momo-purchase/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success' && data.data?.orders?.length > 0) {
        setOrders(data.data.orders);
        showToast(`Found ${data.data.orders.length} order(s)`, 'success');
      } else {
        showToast(data.message || 'No orders found', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast('Search failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toast */}
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(p => ({ ...p, visible: false }))} 
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/shop/${params.storeSlug}/products`} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Track Your Order</h1>
              <p className="text-gray-400 text-sm">Check your delivery status</p>
            </div>
          </div>
          <button onClick={toggleDarkMode} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Search Form */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-700">
          <form onSubmit={handleSearch}>
            {/* Search Type Toggle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">Search by:</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-900 rounded-xl">
                {[
                  { key: 'phone', label: 'Phone', icon: Phone },
                  { key: 'reference', label: 'Reference', icon: Hash },
                  { key: 'transactionId', label: 'Trans. ID', icon: Calendar }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSearchType(key)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      searchType === key
                        ? 'bg-yellow-500 text-black shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === 'phone' ? 'Enter phone number (e.g., 0241234567)' : 
                    searchType === 'reference' ? 'Enter order reference' : 
                    'Enter transaction ID'
                  }
                  className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-5 h-5" /> Track Order</>
              )}
            </button>
          </form>
        </div>

        {/* Loading Animation */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
            <p className="text-gray-400 text-sm mt-2">Looking for your order...</p>
          </div>
        )}

        {/* Results */}
        {!loading && orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-400" />
                Found {orders.length} order{orders.length > 1 ? 's' : ''}
              </h2>
            </div>
            
            {orders.map((order, index) => (
              <OrderCard 
                key={index}
                order={order}
                onCopy={handleCopy}
                expanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
              />
            ))}

            {/* General Help */}
            <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-600 rounded-full flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Need Help?</p>
                  <p className="text-gray-400 text-sm mb-3">
                    Join our WhatsApp channel for support and delivery updates.
                  </p>
                  <a 
                    href={WHATSAPP_CHANNEL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Join Channel
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && searched && orders.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">No Orders Found</h3>
            <p className="text-gray-400 text-sm mb-4">
              We couldn't find any orders matching your search. Please check your details and try again.
            </p>
            <div className="bg-gray-700/50 rounded-xl p-4 text-left">
              <p className="text-sm text-gray-300 font-medium mb-2">Tips:</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Make sure the phone number is correct</li>
                <li>• Check if you have the right reference</li>
                <li>• Try searching with a different method</li>
              </ul>
            </div>
          </div>
        )}

        {/* How It Works - Before Search */}
        {!searched && (
          <div className="space-y-4">
            {/* Status Guide */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-400" />
                Order Status Guide
              </h3>
              <div className="space-y-3">
                {[
                  { status: 'pending', desc: 'Order received, waiting to be processed' },
                  { status: 'processing', desc: 'Your data is being sent to the network' },
                  { status: 'completed', desc: 'Data delivered successfully! Check your phone' },
                  { status: 'failed', desc: 'Something went wrong - contact support' }
                ].map(({ status, desc }) => (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <span className="text-gray-400 text-sm">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-2xl p-5">
              <h3 className="font-bold mb-3 text-amber-300 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Delivery Time
              </h3>
              <p className="text-amber-200 text-sm mb-3">
                Most orders are delivered within <strong>10 minutes to 24 hours</strong> depending on network conditions.
              </p>
              <p className="text-amber-300/80 text-xs">
                🤝 We always deliver - your data is guaranteed!
              </p>
            </div>

            {/* How to Search */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <h3 className="font-bold mb-4">How to Track Your Order</h3>
              <div className="space-y-4">
                {[
                  { num: 1, title: 'Choose Search Method', desc: 'Select Phone, Reference, or Transaction ID' },
                  { num: 2, title: 'Enter Your Details', desc: 'Type in exactly as provided during purchase' },
                  { num: 3, title: 'View Status', desc: 'See real-time status and tracking info' }
                ].map(({ num, title, desc }) => (
                  <div key={num} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {num}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{title}</h4>
                      <p className="text-gray-400 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Back to Shop */}
        <div className="mt-6 text-center">
          <Link 
            href={`/shop/${params.storeSlug}/products`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>Powered by DataMart Ghana</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}