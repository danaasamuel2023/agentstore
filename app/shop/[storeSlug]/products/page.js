// app/shop/[storeSlug]/products/page.jsx - WITH PROXY API
'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Filter, Search, ShoppingCart, Star, Info, X,
  ChevronDown, Package, Zap, Shield, Moon, Sun, AlertCircle, XCircle
} from 'lucide-react';

// Lottie for loading
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

// API Base - Using Proxy to prevent CORS
const API_BASE = '/api/proxy/v1';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-yellow-500 text-black'
      }`}>
        {type === 'success' && <span>✓</span>}
        {type === 'error' && <span>✕</span>}
        {type === 'warning' && <span>⚠</span>}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
      </div>
    </div>
  );
};

// Loading Overlay with Lottie
const LoadingOverlay = ({ isLoading, network }) => {
  if (!isLoading) return null;
  
  const getNetworkName = () => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AirtelTigo';
    return '';
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 text-center">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 100, height: 100, margin: '0 auto' }} />
        <h4 className="text-xl font-bold text-yellow-400 mt-2">Processing Order...</h4>
        <p className="text-gray-400 text-sm mt-1">
          Your {getNetworkName()} bundle is being processed
        </p>
      </div>
    </div>
  );
};

// Network Logos
const MTNLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#7c3aed" strokeWidth="2"/>
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
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNetwork, setProcessingNetwork] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [bundleMessages, setBundleMessages] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    fetchProducts();
    
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme !== 'light');
    }
  }, [params.storeSlug]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedNetwork, sortBy, searchTerm]);

  // Fetch products using PROXY
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
      case 'price_low': filtered.sort((a, b) => a.sellingPrice - b.sellingPrice); break;
      case 'price_high': filtered.sort((a, b) => b.sellingPrice - a.sellingPrice); break;
      case 'capacity_low': filtered.sort((a, b) => a.capacity - b.capacity); break;
      case 'capacity_high': filtered.sort((a, b) => b.capacity - a.capacity); break;
    }
    
    setFilteredProducts(filtered);
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleSelectBundle = (index) => {
    setSelectedProductIndex(index === selectedProductIndex ? null : index);
    setPhoneNumber('');
    setCustomerName('');
    setBundleMessages(prev => ({ ...prev, [index]: null }));
  };

  const validatePhoneNumber = (number, network) => {
    const clean = number.replace(/[\s-]/g, '');
    if (network === 'YELLO') return clean.length === 10 && /^0\d{9}$/.test(clean);
    if (network === 'TELECEL') return /^(020|050)\d{7}$/.test(clean);
    if (network === 'AT_PREMIUM') return /^(026|027|056|057)\d{7}$/.test(clean);
    return clean.length === 10 && /^0\d{9}$/.test(clean);
  };

  const getPhoneNumberPlaceholder = (network) => {
    if (network === 'YELLO') return '024XXXXXXX';
    if (network === 'TELECEL') return '020/050XXXXXXX';
    if (network === 'AT_PREMIUM') return '026/027XXXXXXX';
    return '0XXXXXXXXX';
  };

  const generateAutoEmail = (phone) => {
    const clean = phone.replace(/[\s-]/g, '');
    return `customer_${clean}@datamartgh.shop`;
  };

  // Handle purchase using PROXY
  const handlePurchase = async (product, index) => {
    setBundleMessages(prev => ({ ...prev, [index]: null }));
    
    if (!product.inStock) {
      setBundleMessages(prev => ({ ...prev, [index]: { text: 'This bundle is out of stock.', type: 'error' } }));
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber, product.network)) {
      const networkName = product.network === 'YELLO' ? 'MTN' : product.network === 'AT_PREMIUM' ? 'AirtelTigo' : 'Telecel';
      setBundleMessages(prev => ({ ...prev, [index]: { text: `Enter a valid ${networkName} number`, type: 'error' } }));
      return;
    }
    
    if (!customerName.trim()) {
      setBundleMessages(prev => ({ ...prev, [index]: { text: 'Please enter your name', type: 'error' } }));
      return;
    }
    
    setIsProcessing(true);
    setProcessingNetwork(product.network);
    
    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          phoneNumber,
          customerEmail: generateAutoEmail(phoneNumber),
          customerName,
          quantity: 1
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data.authorizationUrl) {
        showToast(`${product.capacity}GB bundle initiated!`, 'success');
        window.location.href = data.data.authorizationUrl;
      } else {
        showToast(data.message || 'Failed to initialize payment', 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingNetwork('');
    }
  };

  const getNetworkLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo />;
    if (network === 'TELECEL') return <TelecelLogo />;
    if (network === 'AT_PREMIUM') return <AirtelTigoLogo />;
    return <Package className="w-12 h-12" />;
  };

  const getCardColors = (network) => {
    if (network === 'YELLO') return {
      card: 'bg-yellow-400',
      expanded: 'bg-yellow-500',
      button: 'bg-black hover:bg-gray-900 text-yellow-400'
    };
    if (network === 'TELECEL') return {
      card: 'bg-gradient-to-tr from-red-700 to-red-500',
      expanded: 'bg-red-600',
      button: 'bg-red-900 hover:bg-red-800 text-white'
    };
    if (network === 'AT_PREMIUM') return {
      card: 'bg-gradient-to-tr from-purple-700 to-purple-500',
      expanded: 'bg-purple-600',
      button: 'bg-purple-900 hover:bg-purple-800 text-white'
    };
    return {
      card: 'bg-gradient-to-tr from-blue-700 to-blue-500',
      expanded: 'bg-blue-600',
      button: 'bg-blue-900 hover:bg-blue-800 text-white'
    };
  };

  const networks = ['all', ...new Set(products.map(p => p.network))];

  // Loading with Lottie
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
        <p className="text-gray-400 text-sm mt-2">Loading products...</p>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'} min-h-screen`}>
      {/* Toast */}
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, visible: false }))} />}
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isProcessing} network={processingNetwork} />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Data Bundles</h1>
            <p className="text-gray-400 text-sm">Choose your bundle</p>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-800 text-yellow-400"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            {/* Network Filter */}
            <div className="flex gap-2 flex-wrap">
              {networks.map((network) => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedNetwork === network
                      ? network === 'YELLO' ? 'bg-yellow-500 text-black' :
                        network === 'TELECEL' ? 'bg-red-600 text-white' :
                        network === 'AT_PREMIUM' ? 'bg-purple-600 text-white' :
                        'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {network === 'all' ? 'All' : 
                   network === 'YELLO' ? 'MTN' :
                   network === 'AT_PREMIUM' ? 'AT' : 'Telecel'}
                </button>
              ))}
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
            >
              <option value="price_low">Price ↑</option>
              <option value="price_high">Price ↓</option>
              <option value="capacity_low">Size ↑</option>
              <option value="capacity_high">Size ↓</option>
            </select>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>{filteredProducts.length} products</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> 10min-1hr</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> Secure</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-6 p-3 bg-red-900/50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-300 text-sm">
            <strong>Important:</strong> Verify your phone number before purchase. Data delivered in 10min-1hr.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => {
            const colors = getCardColors(product.network);
            const isSelected = selectedProductIndex === index;
            
            return (
              <div key={product._id} className="flex flex-col relative">
                {/* Badges */}
                {!product.inStock && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-red-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full">OUT</span>
                  </div>
                )}
                {product.isOnSale && product.salePrice && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-green-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full">SALE</span>
                  </div>
                )}
                
                {/* Card */}
                <div 
                  className={`${colors.card} ${product.network === 'YELLO' ? 'text-black' : 'text-white'} overflow-hidden shadow-lg cursor-pointer hover:-translate-y-1 transition-transform ${isSelected ? 'rounded-t-lg' : 'rounded-lg'}`}
                  onClick={() => handleSelectBundle(index)}
                >
                  <div className="flex flex-col items-center p-4">
                    <div className="w-12 h-12 mb-2">{getNetworkLogo(product.network)}</div>
                    <h3 className="text-xl font-bold">{product.capacity}GB</h3>
                  </div>
                  
                  <div className={`grid grid-cols-2 text-white ${product.network === 'YELLO' ? 'bg-black' : 'bg-black/70'}`}>
                    <div className="p-2 text-center border-r border-gray-700">
                      {product.isOnSale && product.salePrice ? (
                        <>
                          <p className="font-bold">GH₵{product.salePrice.toFixed(2)}</p>
                          <p className="text-[10px] line-through opacity-70">GH₵{product.sellingPrice.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="font-bold">GH₵{product.sellingPrice.toFixed(2)}</p>
                      )}
                      <p className="text-[10px] text-gray-400">Price</p>
                    </div>
                    <div className="p-2 text-center">
                      <p className="font-bold text-sm">90 Days</p>
                      <p className="text-[10px] text-gray-400">Validity</p>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Form */}
                {isSelected && (
                  <div className={`${colors.expanded} p-4 rounded-b-lg`}>
                    {!product.inStock ? (
                      <div className="text-center py-4">
                        <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-bold">Out of Stock</p>
                        <p className="text-xs opacity-70">Check other bundles</p>
                      </div>
                    ) : (
                      <>
                        {bundleMessages[index] && (
                          <div className={`mb-3 p-2 rounded text-sm ${
                            bundleMessages[index].type === 'error' ? 'bg-red-800 text-red-200' : 'bg-green-800 text-green-200'
                          }`}>
                            {bundleMessages[index].text}
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-white/80 mb-1">Your Name</label>
                          <input
                            type="text"
                            placeholder="Enter name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className={`w-full px-3 py-2 rounded text-sm ${
                              product.network === 'YELLO' 
                                ? 'bg-yellow-300 text-black placeholder-yellow-700' 
                                : 'bg-white/90 text-black placeholder-gray-500'
                            }`}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-white/80 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            placeholder={getPhoneNumberPlaceholder(product.network)}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className={`w-full px-3 py-2 rounded text-sm ${
                              product.network === 'YELLO' 
                                ? 'bg-yellow-300 text-black placeholder-yellow-700' 
                                : 'bg-white/90 text-black placeholder-gray-500'
                            }`}
                          />
                          <p className="text-[10px] text-white/60 mt-1">Data sent to this number</p>
                        </div>
                        
                        <button
                          onClick={() => handlePurchase(product, index)}
                          className={`w-full py-2 ${colors.button} font-bold rounded transition-colors`}
                        >
                          Buy Now
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-400">Try different filters</p>
          </div>
        )}
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