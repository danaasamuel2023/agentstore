'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Package, CheckCircle, Clock, XCircle, AlertCircle,
  Phone, Hash, Calendar, Loader2, ArrowLeft, Copy, ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api';

// Network Logos
const MTNLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#FFCC00"/>
    <path d="M12 18 L18 30 L24 18 L30 30 L36 18" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#DC2626"/>
    <text x="24" y="30" textAnchor="middle" fontFamily="system-ui" fontWeight="bold" fontSize="18" fill="#fff">T</text>
  </svg>
);

const ATLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#7C3AED"/>
    <text x="24" y="30" textAnchor="middle" fontFamily="system-ui" fontWeight="bold" fontSize="14" fill="#fff">AT</text>
  </svg>
);

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: CheckCircle, text: 'Delivered', bg: 'bg-green-100', color: 'text-green-700' },
    delivered: { icon: CheckCircle, text: 'Delivered', bg: 'bg-green-100', color: 'text-green-700' },
    pending: { icon: Clock, text: 'Pending', bg: 'bg-yellow-100', color: 'text-yellow-700' },
    waiting: { icon: Clock, text: 'In Queue', bg: 'bg-yellow-100', color: 'text-yellow-700' },
    accepted: { icon: Clock, text: 'Accepted', bg: 'bg-blue-100', color: 'text-blue-700' },
    processing: { icon: Loader2, text: 'Processing', bg: 'bg-blue-100', color: 'text-blue-700', spin: true },
    on: { icon: Loader2, text: 'In Progress', bg: 'bg-blue-100', color: 'text-blue-700', spin: true },
    failed: { icon: XCircle, text: 'Failed', bg: 'bg-red-100', color: 'text-red-700' },
    refunded: { icon: CheckCircle, text: 'Refunded', bg: 'bg-purple-100', color: 'text-purple-700' },
  };
  
  const { icon: Icon, text, bg, color, spin } = config[status] || config.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bg} ${color}`}>
      <Icon className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
      {text}
    </span>
  );
};

// Order Card
const OrderCard = ({ order, onCopy, expanded, onToggle }) => {
  const getLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo />;
    if (network === 'TELECEL') return <TelecelLogo />;
    if (network === 'AT_PREMIUM' || network === 'at') return <ATLogo />;
    return <Package className="w-9 h-9 text-gray-400" />;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden mb-4">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getLogo(order.product?.network)}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {order.product?.networkDisplay} {order.product?.capacityDisplay}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">To: {order.recipientPhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          {/* Status Message */}
          <div className={`mt-4 p-4 rounded-xl ${
            order.status === 'completed' || order.status === 'delivered'
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800'
              : order.status === 'failed'
                ? 'bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800'
          }`}>
            <p className={`text-sm ${
              order.status === 'completed' || order.status === 'delivered'
                ? 'text-green-700 dark:text-green-400'
                : order.status === 'failed'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-blue-700 dark:text-blue-400'
            }`}>
              {order.statusMessage}
            </p>
          </div>

          {/* Order Details */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-900 dark:text-white">{order.orderReference}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCopy(order.orderReference); }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Amount Paid</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                GH₵{order.pricing?.totalPaid?.toFixed(2) || order.pricing?.basePrice?.toFixed(2) || '0.00'}
              </span>
            </div> */}

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Ordered</span>
              <span className="text-sm text-gray-900 dark:text-white">{order.timeSinceOrder}</span>
            </div>
          </div>

          {/* Help for pending/failed */}
          {(order.status === 'pending' || order.status === 'waiting' || order.status === 'failed') && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-xl">
              <p className="text-amber-800 dark:text-amber-400 text-sm mb-3">
                {order.status === 'failed'
                  ? 'Something went wrong with your order. Contact support for help.'
                  : 'Your order is being processed. Delivery usually takes 10 mins - 24 hours.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function OrderSearchPage() {
  const params = useParams();
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setOrders([]);
    setSearched(true);
    setExpandedIndex(0);

    try {
      const payload = {};
      if (searchType === 'phone') payload.phoneNumber = searchValue.trim();
      else if (searchType === 'reference') payload.reference = searchValue.trim();
      else if (searchType === 'transactionId') payload.transactionId = searchValue.trim();

      const res = await fetch(`${API_BASE}/momo-purchase/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success' && data.data?.orders?.length > 0) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/shop/${params.storeSlug}/products`}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Track Your Order</h1>
        <p className="text-gray-500 dark:text-gray-400">Check the status of your data bundle delivery</p>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <form onSubmit={handleSearch}>
          {/* Search Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search by</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {[
                { key: 'phone', label: 'Phone', icon: Phone },
                { key: 'reference', label: 'Reference', icon: Hash },
                { key: 'transactionId', label: 'Trans. ID', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSearchType(key)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    searchType === key
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchType === 'phone' ? 'Enter phone number (e.g., 0241234567)' :
                  searchType === 'reference' ? 'Enter order reference' :
                  'Enter transaction ID'
                }
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading || !searchValue.trim()}
            className="w-full py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-5 h-5" /> Track Order</>
            )}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Looking for your order...</p>
        </div>
      )}

      {/* Results */}
      {!loading && orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
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
        </div>
      )}

      {/* No Results */}
      {!loading && searched && orders.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">No Orders Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            We couldn't find any orders matching your search.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">Tips:</p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Status Guide</h3>
            <div className="space-y-3">
              {[
                { status: 'pending', desc: 'Order received, waiting to be processed' },
                { status: 'processing', desc: 'Your data is being sent to the network' },
                { status: 'completed', desc: 'Data delivered successfully! Check your phone' },
                { status: 'failed', desc: 'Something went wrong - contact support' }
              ].map(({ status, desc }) => (
                <div key={status} className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Delivery Time</h3>
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  Most orders are delivered within <strong>10 minutes to 1 hour</strong> depending on network conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copied Toast */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
