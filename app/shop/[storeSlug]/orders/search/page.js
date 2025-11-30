// app/shop/[storeSlug]/orders/search/page.jsx - WITH PROXY API
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Search, Package, CheckCircle, Clock, XCircle, AlertCircle,
  Phone, Mail, Calendar, CreditCard, Loader, Moon, Sun,
  ArrowLeft, RefreshCw, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

// Lottie for loading
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

// API Base - Using Proxy to prevent CORS
const API_BASE = '/api/proxy/v1';

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

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: CheckCircle, text: 'Completed', bg: 'bg-green-900/50', color: 'text-green-400' },
    pending: { icon: Clock, text: 'Pending', bg: 'bg-yellow-900/50', color: 'text-yellow-400' },
    processing: { icon: Loader, text: 'Processing', bg: 'bg-blue-900/50', color: 'text-blue-400' },
    failed: { icon: XCircle, text: 'Failed', bg: 'bg-red-900/50', color: 'text-red-400' },
    refunded: { icon: RefreshCw, text: 'Refunded', bg: 'bg-purple-900/50', color: 'text-purple-400' }
  };
  
  const { icon: Icon, text, bg, color } = config[status] || config.pending;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {text}
    </span>
  );
};

// Order Card
const OrderCard = ({ order, storeInfo, onCopy }) => {
  const getNetworkLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo size={36} />;
    if (network === 'TELECEL') return <TelecelLogo size={36} />;
    if (network === 'AT_PREMIUM') return <AirtelTigoLogo size={36} />;
    return <Package className="w-9 h-9 text-gray-400" />;
  };

  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'AT_PREMIUM') return 'AirtelTigo';
    return network;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getNetworkLogo(order.product.network)}
          <div>
            <h3 className="font-bold text-white">
              {getNetworkName(order.product.network)} {order.product.capacity}GB
            </h3>
            <p className="text-xs text-gray-400">{order.product.displayName}</p>
          </div>
        </div>
        <p className="text-xl font-bold text-yellow-400">GH₵ {order.amount.toFixed(2)}</p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-3 py-2 border-y border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Order:</span>
          <StatusBadge status={order.orderStatus} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Payment:</span>
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {/* Status Message */}
      {order.statusMessage && (
        <div className={`mb-3 p-2 rounded-lg text-xs ${
          order.orderStatus === 'completed' ? 'bg-green-900/30 text-green-400' :
          order.orderStatus === 'failed' ? 'bg-red-900/30 text-red-400' :
          'bg-blue-900/30 text-blue-400'
        }`}>
          {order.statusMessage}
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Transaction ID:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white text-xs">{order.transactionId}</span>
            <button onClick={() => onCopy(order.transactionId)} className="p-1 hover:bg-gray-700 rounded">
              <Copy className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Phone:</span>
          <span className="text-white">{order.phoneNumber}</span>
        </div>
        
        {order.customerName && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Customer:</span>
            <span className="text-white">{order.customerName}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Date:</span>
          <span className="text-white text-xs">{formatDate(order.orderDate)}</span>
        </div>
      </div>

      {/* Help Section */}
      {(order.orderStatus === 'failed' || order.orderStatus === 'pending') && storeInfo?.contact?.whatsapp && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <a 
            href={`https://wa.me/${storeInfo.contact.whatsapp.replace(/[^0-9]/g, '')}?text=Hi, I need help with order ${order.transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            <Phone className="w-4 h-4" /> Contact Support
          </a>
        </div>
      )}
    </div>
  );
};

export default function OrderSearchPage() {
  const params = useParams();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchType, setSearchType] = useState('transactionId');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [searched, setSearched] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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
    showToast('Copied!', 'success');
  };

  // Search using PROXY
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      showToast('Enter a search value', 'warning');
      return;
    }

    setLoading(true);
    setOrders([]);
    setStoreInfo(null);
    setSearched(true);

    try {
      const payload = {};
      if (searchType === 'transactionId') payload.transactionId = searchValue.trim();
      else if (searchType === 'phoneNumber') payload.phoneNumber = searchValue.trim();
      else if (searchType === 'reference') payload.reference = searchValue.trim();

      const response = await fetch(
        `${API_BASE}/agent-stores/stores/${params.storeSlug}/orders/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        setOrders(data.data.orders);
        setStoreInfo(data.data.store);
        showToast(`Found ${data.data.orders.length} order(s)`, 'success');
      } else {
        showToast(data.message || 'No orders found', 'error');
      }
    } catch (error) {
      showToast('Search failed', 'error');
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
            <Link href={`/shop/${params.storeSlug}/products`} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Track Order</h1>
              <p className="text-gray-400 text-sm">Search for your order</p>
            </div>
          </div>
          <button onClick={toggleDarkMode} className="p-2 bg-gray-800 rounded-lg">
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Search Form */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <form onSubmit={handleSearch}>
            {/* Search Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search By:</label>
              <div className="grid grid-cols-3 gap-2">
                {['transactionId', 'phoneNumber', 'reference'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSearchType(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      searchType === type
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type === 'transactionId' ? 'Transaction ID' : 
                     type === 'phoneNumber' ? 'Phone' : 'Reference'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === 'transactionId' ? 'Enter transaction ID...' : 
                    searchType === 'phoneNumber' ? 'Enter phone number...' : 
                    'Enter reference...'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-4 h-4" /> Search Order</>
              )}
            </button>
          </form>

          {/* Tip */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Transaction ID was sent after payment completion
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 100, height: 100 }} />
            <p className="text-gray-400 text-sm mt-2">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!loading && orders.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">
              Results ({orders.length})
            </h2>
            {orders.map((order, index) => (
              <OrderCard 
                key={index}
                order={order}
                storeInfo={storeInfo}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && searched && orders.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="font-bold mb-2">No Orders Found</h3>
            <p className="text-gray-400 text-sm">Check your search details and try again</p>
          </div>
        )}

        {/* Help - Before Search */}
        {!searched && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-3">How to Track</h3>
            <div className="space-y-3">
              {[
                { num: 1, title: 'Choose Method', desc: 'Select Transaction ID, Phone, or Reference' },
                { num: 2, title: 'Enter Details', desc: 'Type in your information exactly' },
                { num: 3, title: 'View Status', desc: 'See your order and delivery status' }
              ].map(({ num, title, desc }) => (
                <div key={num} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {num}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{title}</h4>
                    <p className="text-gray-400 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Shop */}
        <div className="mt-6 text-center">
          <Link 
            href={`/shop/${params.storeSlug}/products`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
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