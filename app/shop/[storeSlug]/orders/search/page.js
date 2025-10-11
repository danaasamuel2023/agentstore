// app/shop/[storeSlug]/orders/search/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Search, Package, CheckCircle, Clock, XCircle, AlertCircle,
  Phone, Mail, Calendar, CreditCard, Loader, Moon, Sun,
  ArrowLeft, RefreshCw, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-down max-w-md">
      <div className={`p-4 rounded-lg shadow-lg flex items-start ${
        type === 'success' 
          ? 'bg-green-500 text-white' 
          : type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-yellow-500 text-black'
      }`}>
        <div className="mr-3 flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="h-6 w-6" />
          ) : type === 'error' ? (
            <XCircle className="h-6 w-6" />
          ) : (
            <AlertCircle className="h-6 w-6" />
          )}
        </div>
        <div className="flex-grow">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 flex-shrink-0">
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Network Logo Components (same as products page)
const MTNLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
    <path d="M50 125 L150 125" stroke="#cc0000" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const AirtelTigoLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
    <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontSize="18" fill="#7c3aed">PREMIUM</text>
  </svg>
);

// Order Status Badge Component
const OrderStatusBadge = ({ status, isDarkMode }) => {
  const getStatusConfig = () => {
    switch(status) {
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Completed',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          bgColorDark: 'bg-green-900',
          textColorDark: 'text-green-200'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          bgColorDark: 'bg-yellow-900',
          textColorDark: 'text-yellow-200'
        };
      case 'processing':
        return {
          icon: Loader,
          text: 'Processing',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          bgColorDark: 'bg-blue-900',
          textColorDark: 'text-blue-200'
        };
      case 'failed':
        return {
          icon: XCircle,
          text: 'Failed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          bgColorDark: 'bg-red-900',
          textColorDark: 'text-red-200'
        };
      case 'refunded':
        return {
          icon: RefreshCw,
          text: 'Refunded',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          bgColorDark: 'bg-purple-900',
          textColorDark: 'text-purple-200'
        };
      default:
        return {
          icon: AlertCircle,
          text: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          bgColorDark: 'bg-gray-700',
          textColorDark: 'text-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isDarkMode 
        ? `${config.bgColorDark} ${config.textColorDark}` 
        : `${config.bgColor} ${config.textColor}`
    }`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.text}
    </span>
  );
};

// Order Card Component
const OrderCard = ({ order, storeInfo, isDarkMode, onCopy }) => {
  const getNetworkLogo = (network) => {
    switch(network) {
      case 'YELLO': return <MTNLogo size={40} />;
      case 'TELECEL': return <TelecelLogo size={40} />;
      case 'AT_PREMIUM': return <AirtelTigoLogo size={40} />;
      default: return <Package className="w-10 h-10 text-gray-400" />;
    }
  };

  const getNetworkName = (network) => {
    switch(network) {
      case 'YELLO': return 'MTN';
      case 'AT_PREMIUM': return 'AirtelTigo';
      default: return network;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-lg shadow-sm p-6 mb-4 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getNetworkLogo(order.product.network)}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {getNetworkName(order.product.network)} {order.product.capacity}GB
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {order.product.displayName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            GH₵ {order.amount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Order Status:
          </span>
          <OrderStatusBadge status={order.orderStatus} isDarkMode={isDarkMode} />
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Payment Status:
          </span>
          <OrderStatusBadge status={order.paymentStatus} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Status Message */}
      {order.statusMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          order.orderStatus === 'completed' 
            ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-50 text-green-800'
            : order.orderStatus === 'failed'
              ? isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-800'
              : isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-800'
        }`}>
          <p className="text-sm font-medium">{order.statusMessage}</p>
        </div>
      )}

      {/* Order Details */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 space-y-3`}>
        {/* Transaction ID */}
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Transaction ID:
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono font-medium">
              {order.transactionId}
            </span>
            <button
              onClick={() => onCopy(order.transactionId)}
              className={`p-1 rounded hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
              title="Copy Transaction ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Phone Number:
          </span>
          <span className="text-sm font-medium">{order.phoneNumber}</span>
        </div>

        {/* Customer Name */}
        {order.customerName && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Customer:
            </span>
            <span className="text-sm font-medium">{order.customerName}</span>
          </div>
        )}

        {/* Order Date */}
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Order Date:
          </span>
          <span className="text-sm">{formatDate(order.orderDate)}</span>
        </div>

        {/* Completed Date */}
        {order.completedDate && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Completed:
            </span>
            <span className="text-sm">{formatDate(order.completedDate)}</span>
          </div>
        )}

        {/* Delivery Info */}
        {order.deliveryInfo && (
          <div className={`mt-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <h4 className="text-sm font-semibold mb-2">Delivery Information</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Reference:
                </span>
                <span className="font-mono">{order.deliveryInfo.reference}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Status:
                </span>
                <OrderStatusBadge status={order.deliveryInfo.status} isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Support */}
      {(order.orderStatus === 'failed' || order.orderStatus === 'pending') && (
        <div className={`mt-4 p-3 rounded-lg border-l-4 ${
          isDarkMode 
            ? 'bg-yellow-900 border-yellow-600' 
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <p className="text-sm font-medium mb-2">Need Help?</p>
          <div className="space-y-1 text-sm">
            {storeInfo.contact.whatsapp && (
              <a 
                href={`https://wa.me/${storeInfo.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-green-600 hover:text-green-700"
              >
                <Phone className="w-4 h-4 mr-1" />
                WhatsApp: {storeInfo.contact.whatsapp}
              </a>
            )}
            {storeInfo.contact.phone && (
              <a 
                href={`tel:${storeInfo.contact.phone}`}
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <Phone className="w-4 h-4 mr-1" />
                Call: {storeInfo.contact.phone}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrderSearchPage() {
  const params = useParams();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchType, setSearchType] = useState('transactionId');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [copied, setCopied] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme === 'dark' || (!storedTheme && prefersDark));
    }

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translate3d(0, -20px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
      .animate-fade-in-down {
        animation: fadeInDown 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      visible: false
    }));
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      showToast('Please enter a search value', 'warning');
      return;
    }

    setLoading(true);
    setOrders([]);
    setStoreInfo(null);

    try {
      const searchPayload = {};
      
      if (searchType === 'transactionId') {
        searchPayload.transactionId = searchValue.trim();
      } else if (searchType === 'phoneNumber') {
        searchPayload.phoneNumber = searchValue.trim();
      } else if (searchType === 'reference') {
        searchPayload.reference = searchValue.trim();
      }

      const response = await fetch(
        `${API_BASE}/agent-stores/stores/${params.storeSlug}/orders/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchPayload)
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        setOrders(data.data.orders);
        setStoreInfo(data.data.store);
        setSearchCriteria(data.data.searchCriteria);
        showToast(`Found ${data.data.orders.length} order(s)`, 'success');
      } else {
        showToast(data.message || 'No orders found', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to search orders. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setOrders([]);
    setStoreInfo(null);
    setSearchCriteria(null);
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'} min-h-screen transition-colors duration-200`}>
      {/* Toast Notification */}
      {toast.visible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href={`/shop/${params.storeSlug}/products`}
              className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-100'
              } transition-colors`}
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Track Your Order</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Search for your order status
              </p>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Search Form */}
        <div className={`${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg shadow-sm p-6 mb-6`}>
          <form onSubmit={handleSearch}>
            {/* Search Type Selector */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Search By:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('transactionId')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'transactionId'
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Transaction ID
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('phoneNumber')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'phoneNumber'
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Phone Number
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('reference')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'reference'
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Reference
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {searchType === 'transactionId' && 'Transaction ID (e.g., AGTTXN1234567890)'}
                {searchType === 'phoneNumber' && 'Phone Number (e.g., 0241234567)'}
                {searchType === 'reference' && 'Payment Reference (e.g., AGT-GN-AB1234CD)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === 'transactionId' 
                      ? 'Enter transaction ID...' 
                      : searchType === 'phoneNumber'
                        ? 'Enter phone number...'
                        : 'Enter payment reference...'
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                } w-5 h-5`} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search Order
                  </>
                )}
              </button>
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Search Tips */}
          <div className={`mt-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              <strong>Tip:</strong> You can search using your transaction ID, phone number, or payment reference. 
              Your transaction ID was sent to you after completing the payment.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Results */}
        {!loading && orders.length > 0 && (
          <div>
            {/* Store Info */}
            {storeInfo && (
              <div className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border rounded-lg shadow-sm p-4 mb-4`}>
                <h3 className="font-semibold mb-2">{storeInfo.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  {storeInfo.contact.whatsapp && (
                    <a 
                      href={`https://wa.me/${storeInfo.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-green-600 hover:text-green-700"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      WhatsApp
                    </a>
                  )}
                  {storeInfo.contact.email && (
                    <a 
                      href={`mailto:${storeInfo.contact.email}`}
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </a>
                  )}
                  {storeInfo.contact.phone && (
                    <a 
                      href={`tel:${storeInfo.contact.phone}`}
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Search Results ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
              </h2>
            </div>

            {/* Orders List */}
            <div>
              {orders.map((order, index) => (
                <OrderCard 
                  key={index}
                  order={order}
                  storeInfo={storeInfo}
                  isDarkMode={isDarkMode}
                  onCopy={handleCopyToClipboard}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && orders.length === 0 && searchCriteria && (
          <div className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow-sm p-12 text-center`}>
            <Package className={`w-16 h-16 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            } mx-auto mb-4`} />
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              We couldn't find any orders matching your search criteria.
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Please check your search details and try again.
            </p>
          </div>
        )}

        {/* Help Section */}
        {!loading && orders.length === 0 && !searchCriteria && (
          <div className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border rounded-lg shadow-sm p-6`}>
            <h3 className="text-lg font-semibold mb-4">How to Track Your Order</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                  isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                } flex items-center justify-center mr-3`}>
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Choose Search Method</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select whether you want to search by Transaction ID, Phone Number, or Payment Reference.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                  isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                } flex items-center justify-center mr-3`}>
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Enter Your Details</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Type in the required information. Make sure it matches exactly what you used during purchase.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                  isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                } flex items-center justify-center mr-3`}>
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">View Your Order Status</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Once found, you'll see complete details about your order including payment and delivery status.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Shop Button */}
        <div className="mt-8 text-center">
          <Link 
            href={`/shop/${params.storeSlug}/products`}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}