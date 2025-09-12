// app/shop/[storeSlug]/products/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Filter, Search, ShoppingCart, Star, Info, X,
  ChevronDown, Package, Zap, Shield, Moon, Sun
} from 'lucide-react';

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
    <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
      <div className={`p-4 rounded-md shadow-lg flex items-center ${
        type === 'success' 
          ? 'bg-green-500 text-white' 
          : type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-yellow-500 text-black'
      }`}>
        <div className="mr-3">
          {type === 'success' ? (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : type === 'error' ? (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-grow">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4">
          <svg className={`h-5 w-5 ${type === 'warning' ? 'text-black' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Loading Overlay Component
const LoadingOverlay = ({ isLoading, network }) => {
  if (!isLoading) return null;
  
  const getNetworkColor = () => {
    switch(network) {
      case 'YELLO': return 'text-yellow-500';
      case 'TELECEL': return 'text-red-600';
      case 'AT_PREMIUM': return 'text-purple-600';
      default: return 'text-blue-600';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto text-center">
        <div className="flex justify-center mb-4">
          <svg className={`animate-spin h-16 w-16 ${getNetworkColor()}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h4 className={`text-xl font-bold ${getNetworkColor()} mb-2`}>Processing Your Order...</h4>
        <p className="text-gray-700">Your data bundle request is being processed. Please do not close this page.</p>
      </div>
    </div>
  );
};

// Network Logo Components
const MTNLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
    <path d="M50 125 L150 125" stroke="#cc0000" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
    <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontSize="18" fill="#7c3aed">PREMIUM</text>
  </svg>
);

export default function ProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState(searchParams.get('network') || 'all');
  const [sortBy, setSortBy] = useState('price_low');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNetwork, setProcessingNetwork] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bundleMessages, setBundleMessages] = useState({});
  
  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    fetchProducts();
    
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme === 'dark' || (!storedTheme && prefersDark));
    }
  }, [params.storeSlug]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedNetwork, sortBy, searchTerm]);

  // Add CSS for animations
  useEffect(() => {
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

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/products`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setProducts(data.data?.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter(p => p.network === selectedNetwork);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.capacity.toString().includes(searchTerm) ||
        p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.network.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case 'capacity_low':
        filtered.sort((a, b) => a.capacity - b.capacity);
        break;
      case 'capacity_high':
        filtered.sort((a, b) => b.capacity - a.capacity);
        break;
    }
    
    setFilteredProducts(filtered);
  };

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

  const handleSelectBundle = (index) => {
    setSelectedProductIndex(index === selectedProductIndex ? null : index);
    setPhoneNumber('');
    setEmail('');
    setCustomerName('');
    setBundleMessages(prev => ({ ...prev, [index]: null }));
  };

  const validatePhoneNumber = (number, network) => {
    const cleanNumber = number.replace(/[\s-]/g, '');
    
    if (network === 'YELLO') {
      // MTN validation
      return cleanNumber.length === 10 && /^0\d{9}$/.test(cleanNumber);
    } else if (network === 'TELECEL') {
      // Telecel validation
      return /^(020|050)\d{7}$/.test(cleanNumber);
    } else if (network === 'AT_PREMIUM') {
      // AirtelTigo validation
      return /^(026|027|056|057)\d{7}$/.test(cleanNumber);
    }
    
    // Generic validation
    return cleanNumber.length === 10 && /^0\d{9}$/.test(cleanNumber);
  };

  const getPhoneNumberPlaceholder = (network) => {
    switch(network) {
      case 'YELLO': return '0XXXXXXXXX';
      case 'TELECEL': return '020/050XXXXXXX';
      case 'AT_PREMIUM': return '026/027/056/057XXXXXXX';
      default: return '0XXXXXXXXX';
    }
  };

  const handlePurchase = async (product, index) => {
    setBundleMessages(prev => ({ ...prev, [index]: null }));
    
    if (!product.inStock) {
      setBundleMessages(prev => ({ 
        ...prev, 
        [index]: { text: 'Sorry, this bundle is currently out of stock.', type: 'error' } 
      }));
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber, product.network)) {
      setBundleMessages(prev => ({ 
        ...prev, 
        [index]: { text: `Please enter a valid ${product.network === 'YELLO' ? 'MTN' : product.network} number`, type: 'error' } 
      }));
      return;
    }
    
    if (!email || !customerName) {
      setBundleMessages(prev => ({ 
        ...prev, 
        [index]: { text: 'Please fill in all fields', type: 'error' } 
      }));
      return;
    }
    
    setIsProcessing(true);
    setProcessingNetwork(product.network);
    
    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product._id,
          phoneNumber,
          customerEmail: email,
          customerName,
          quantity: 1
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data.authorizationUrl) {
        showToast(`${product.capacity}GB bundle purchase initiated successfully!`, 'success');
        window.location.href = data.data.authorizationUrl;
      } else {
        showToast('Failed to initialize payment', 'error');
      }
    } catch (error) {
      showToast('Error processing purchase: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingNetwork('');
    }
  };

  const getNetworkLogo = (network) => {
    switch(network) {
      case 'YELLO': return <MTNLogo />;
      case 'TELECEL': return <TelecelLogo />;
      case 'AT_PREMIUM': return <AirtelTigoLogo />;
      default: return <Package className="w-12 h-12" />;
    }
  };

  const getCardColors = (network) => {
    if (network === 'YELLO') {
      return {
        card: 'bg-yellow-400',
        expanded: isDarkMode ? 'bg-yellow-500' : 'bg-yellow-400',
        button: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-yellow-100 text-yellow-800'
      };
    } else if (network === 'TELECEL') {
      return {
        card: 'bg-gradient-to-tr from-red-700 to-red-500',
        expanded: 'bg-gradient-to-br from-red-600 to-red-700',
        button: 'bg-red-900 hover:bg-red-800',
        badge: 'bg-red-100 text-red-800'
      };
    } else if (network === 'AT_PREMIUM') {
      return {
        card: 'bg-gradient-to-tr from-purple-700 to-purple-500',
        expanded: 'bg-gradient-to-br from-purple-600 to-purple-700',
        button: 'bg-purple-900 hover:bg-purple-800',
        badge: 'bg-purple-100 text-purple-800'
      };
    }
    return {
      card: 'bg-gradient-to-tr from-blue-700 to-blue-500',
      expanded: 'bg-gradient-to-br from-blue-600 to-blue-700',
      button: 'bg-blue-900 hover:bg-blue-800',
      badge: 'bg-blue-100 text-blue-800'
    };
  };

  const networks = ['all', ...new Set(products.map(p => p.network))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isProcessing} network={processingNetwork} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Premium Data Bundles</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose from our wide range of affordable data packages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowServiceModal(true)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <Info className="w-5 h-5" />
              <span className="hidden sm:inline">Service Info</span>
            </button>
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-800'}`}
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4 mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search bundles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            
            {/* Network Filter */}
            <div className="flex gap-2 flex-wrap">
              {networks.map((network) => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedNetwork === network
                      ? network === 'YELLO' ? 'bg-yellow-500 text-black' :
                        network === 'TELECEL' ? 'bg-red-600 text-white' :
                        network === 'AT_PREMIUM' ? 'bg-purple-600 text-white' :
                        'bg-blue-600 text-white'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {network === 'all' ? 'All Networks' : 
                   network === 'YELLO' ? 'MTN' :
                   network === 'AT_PREMIUM' ? 'AirtelTigo' : network}
                </button>
              ))}
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="capacity_low">Size: Small to Large</option>
              <option value="capacity_high">Size: Large to Small</option>
            </select>
          </div>
          
          <div className={`mt-4 flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>{filteredProducts.length} products found</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                Fast Delivery (10min - 1hr)
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1 text-green-500" />
                Secure Payment
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className={`mb-8 p-4 border-l-4 rounded-lg shadow ${
          isDarkMode 
            ? 'bg-red-900 border-red-700' 
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Important Notice</h3>
              <div className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                <p className="mb-1">• Please verify your phone number carefully before making a purchase.</p>
                <p>• Data bundles are delivered Fast (10min - 1hr) after successful payment.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => {
            const colors = getCardColors(product.network);
            const isSelected = selectedProductIndex === index;
            
            return (
              <div key={product._id} className="flex flex-col relative">
                {/* Out of stock badge */}
                {!product.inStock && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full shadow-lg">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
                
                {/* Sale badge */}
                {product.isOnSale && product.salePrice && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-green-600 text-white text-xs font-bold py-1 px-2 rounded-full shadow-lg">
                      SALE
                    </span>
                  </div>
                )}
                
                <div 
                  className={`flex flex-col ${colors.card} ${product.network === 'YELLO' ? '' : 'text-white'} overflow-hidden shadow-md transition-transform duration-300 cursor-pointer hover:translate-y-[-5px] ${isSelected ? 'rounded-t-lg' : 'rounded-lg'}`}
                  onClick={() => handleSelectBundle(index)}
                >
                  <div className="flex flex-col items-center justify-center p-5 space-y-3">
                    <div className="w-16 h-16 flex justify-center items-center">
                      {getNetworkLogo(product.network)}
                    </div>
                    <h3 className="text-xl font-bold">
                      {product.capacity} GB
                    </h3>
                    {product.displayName && (
                      <p className={`text-sm ${product.network === 'YELLO' ? 'text-gray-700' : 'text-white/90'}`}>
                        {product.displayName}
                      </p>
                    )}
                  </div>
                  <div className={`grid grid-cols-2 text-white ${product.network === 'YELLO' ? 'bg-black' : 'bg-black/80'}`}
                       style={{ borderRadius: isSelected ? '0' : '0 0 0.5rem 0.5rem' }}>
                    <div className="flex flex-col items-center justify-center p-3 text-center border-r border-r-gray-600">
                      {product.isOnSale && product.salePrice ? (
                        <div>
                          <p className="text-lg font-bold">GH₵ {product.salePrice.toFixed(2)}</p>
                          <p className="text-xs line-through opacity-75">GH₵ {product.sellingPrice.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-lg">GH₵ {product.sellingPrice.toFixed(2)}</p>
                      )}
                      <p className="text-sm font-bold">Price</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-lg">Non Expiry</p>
                      <p className="text-sm font-bold">Validity</p>
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className={`${colors.expanded} p-4 rounded-b-lg shadow-md`}>
                    {bundleMessages[index] && (
                      <div className={`mb-3 p-3 rounded ${
                        bundleMessages[index].type === 'success' 
                          ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800' 
                          : isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                      }`}>
                        {bundleMessages[index].text}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-white mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 rounded ${
                          product.network === 'YELLO' 
                            ? 'bg-yellow-300 text-black placeholder-yellow-700 border border-yellow-500' 
                            : 'bg-white/90 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2`}
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-white mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className={`w-full px-3 py-2 rounded ${
                          product.network === 'YELLO' 
                            ? 'bg-yellow-300 text-black placeholder-yellow-700 border border-yellow-500' 
                            : 'bg-white/90 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2`}
                        placeholder={getPhoneNumberPlaceholder(product.network)}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-white mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className={`w-full px-3 py-2 rounded ${
                          product.network === 'YELLO' 
                            ? 'bg-yellow-300 text-black placeholder-yellow-700 border border-yellow-500' 
                            : 'bg-white/90 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2`}
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-white/80 mt-1">Receipt will be sent to this email</p>
                    </div>
                    
                    <button
                      onClick={() => handlePurchase(product, index)}
                      className={`w-full px-4 py-2 ${colors.button} text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
                      disabled={!product.inStock}
                    >
                      {!product.inStock ? 'Out of Stock' : 'Purchase Now'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Try adjusting your filters or search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}