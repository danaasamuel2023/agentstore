// app/shop/[storeSlug]/page.jsx - STORE HOME WITH PRODUCT PURCHASE (SAME AS PRODUCTS PAGE)
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Store, Phone, MessageCircle, Clock, MapPin, Star,
  Package, Zap, Shield, ChevronRight, AlertCircle, XCircle,
  TrendingUp, Users, CheckCircle, ArrowRight
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
        {type === 'success' && <CheckCircle className="w-4 h-4" />}
        {type === 'error' && <XCircle className="w-4 h-4" />}
        {type === 'warning' && <AlertCircle className="w-4 h-4" />}
        <span className="font-medium text-sm">{message}</span>
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

// Network Logos (Same as products page)
const MTNLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
    <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontSize="18" fill="#7c3aed">PREMIUM</text>
  </svg>
);

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Purchase States
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNetwork, setProcessingNetwork] = useState('');
  const [bundleMessages, setBundleMessages] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme !== 'light');
    }
    fetchStoreAndProducts();
  }, [params.storeSlug]);

  const fetchStoreAndProducts = async () => {
    try {
      // Fetch store info
      const storeRes = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
      const storeData = await storeRes.json();
      
      if (storeData.status === 'success') {
        setStore(storeData.data);
      }
      
      // Fetch products
      const productsRes = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/products`);
      const productsData = await productsRes.json();
      
      if (productsData.status === 'success') {
        setProducts(productsData.data?.products || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load store', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // ======== PURCHASE LOGIC (Same as products page) ========
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

  const handleSelectBundle = (index) => {
    setSelectedProductIndex(index === selectedProductIndex ? null : index);
    setPhoneNumber('');
    setCustomerName('');
    setBundleMessages(prev => ({ ...prev, [index]: null }));
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

  // ======== HELPER FUNCTIONS (Same as products page) ========
  const getNetworkLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo />;
    if (network === 'TELECEL') return <TelecelLogo />;
    if (network === 'AT_PREMIUM') return <AirtelTigoLogo />;
    return <Package className="w-14 h-14" />;
  };

  const getCardColors = (network) => {
    if (network === 'YELLO') return {
      card: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
      expanded: 'bg-yellow-500',
      button: 'bg-black hover:bg-gray-900 text-yellow-400',
      text: 'text-black'
    };
    if (network === 'TELECEL') return {
      card: 'bg-gradient-to-br from-red-600 to-red-700',
      expanded: 'bg-red-600',
      button: 'bg-red-900 hover:bg-red-800 text-white',
      text: 'text-white'
    };
    if (network === 'AT_PREMIUM') return {
      card: 'bg-gradient-to-br from-purple-600 to-purple-700',
      expanded: 'bg-purple-600',
      button: 'bg-purple-900 hover:bg-purple-800 text-white',
      text: 'text-white'
    };
    return {
      card: 'bg-gradient-to-br from-blue-600 to-blue-700',
      expanded: 'bg-blue-600',
      button: 'bg-blue-900 hover:bg-blue-800 text-white',
      text: 'text-white'
    };
  };

  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AT Premium';
    return network;
  };

  const isStoreOpen = () => {
    if (!store || !store.isOpen) return false;
    if (!store.autoCloseOutsideHours) return true;
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = store.businessHours?.[dayName];
    if (!todayHours || !todayHours.isOpen) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  // Get featured products (sorted by price, limited)
  const featuredProducts = products
    .filter(p => p.inStock)
    .sort((a, b) => a.sellingPrice - b.sellingPrice)
    .slice(0, 6);

  // Loading with Lottie
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
        <p className="text-gray-400 text-sm mt-2">Loading store...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Store Not Found</h1>
          <p className="text-gray-400">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'text-white' : 'text-black'}>
      {/* Toast */}
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, visible: false }))} />}
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isProcessing} network={processingNetwork} />

      {/* Hero Section */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 mb-6 shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Store Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {store.storeLogo ? (
                <img src={store.storeLogo} alt={store.storeName} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <Store className="w-8 h-8 text-black" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{store.storeName}</h1>
                {store.verification?.isVerified && (
                  <span className="inline-flex items-center text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3 mr-1" /> Verified Store
                  </span>
                )}
              </div>
            </div>
            
            {store.storeDescription && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2`}>
                {store.storeDescription}
              </p>
            )}
            
            {/* Store Status & Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isStoreOpen() 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : 'bg-red-900/50 text-red-400 border border-red-700'
              }`}>
                {isStoreOpen() ? '🟢 Open Now' : '🔴 Closed'}
              </span>
              
              {store.metrics?.rating > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-xs border border-yellow-700">
                  <Star className="w-3 h-3 fill-current" /> {store.metrics.rating.toFixed(1)}
                </span>
              )}
              
              {store.metrics?.totalOrders > 0 && (
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  <TrendingUp className="w-3 h-3" /> {store.metrics.totalOrders}+ orders
                </span>
              )}
            </div>
            
            {/* Quick Contact */}
            <div className="flex flex-wrap gap-2">
              {store.contactInfo?.phoneNumber && (
                <a href={`tel:${store.contactInfo.phoneNumber}`} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors">
                  <Phone className="w-4 h-4" /> Call Now
                </a>
              )}
              {store.contactInfo?.whatsappNumber && (
                <a href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-500 transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 md:w-64">
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
              <Package className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{products.length}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
              <Zap className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">10min</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Delivery</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
              <Shield className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">100%</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Secure</p>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
              <Users className="w-6 h-6 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-bold">{store.metrics?.totalCustomers || '500'}+</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
        <p className="text-red-300 text-xs sm:text-sm">
          <strong>⚠️ Important:</strong> Verify your phone number before purchase. Data delivered in 10min-1hr.
        </p>
      </div>

      {/* Featured Products Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Featured Bundles</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best deals on data bundles</p>
          </div>
          <Link 
            href={`/shop/${params.storeSlug}/products`}
            className="flex items-center gap-1 text-yellow-500 text-sm font-medium hover:text-yellow-400"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid - SAME AS PRODUCTS PAGE */}
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProducts.map((product, index) => {
              const colors = getCardColors(product.network);
              const isSelected = selectedProductIndex === index;
              
              return (
                <div key={product._id} className="flex flex-col relative">
                  {/* Badges */}
                  {!product.inStock && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded-full shadow-lg">OUT OF STOCK</span>
                    </div>
                  )}
                  {product.isOnSale && product.salePrice && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded-full shadow-lg">SALE</span>
                    </div>
                  )}
                  
                  {/* Card */}
                  <div 
                    className={`${colors.card} ${colors.text} overflow-hidden shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${isSelected ? 'rounded-t-xl' : 'rounded-xl'}`}
                    onClick={() => handleSelectBundle(index)}
                  >
                    {/* Card Content - Horizontal on Mobile */}
                    <div className="flex sm:flex-col items-center p-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 sm:mb-2">
                        {getNetworkLogo(product.network)}
                      </div>
                      <div className="ml-4 sm:ml-0 sm:text-center flex-1">
                        <h3 className="text-2xl sm:text-3xl font-bold">{product.capacity}GB</h3>
                        <p className={`text-xs ${product.network === 'YELLO' ? 'text-black/70' : 'text-white/70'}`}>
                          {getNetworkName(product.network)} Bundle
                        </p>
                      </div>
                      <div className="sm:hidden text-right">
                        {product.isOnSale && product.salePrice ? (
                          <>
                            <p className="text-xl font-bold">₵{product.salePrice.toFixed(2)}</p>
                            <p className="text-xs line-through opacity-70">₵{product.sellingPrice.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-xl font-bold">₵{product.sellingPrice.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Price Footer - Desktop Only */}
                    <div className={`hidden sm:grid grid-cols-2 ${product.network === 'YELLO' ? 'bg-black text-white' : 'bg-black/50 text-white'}`}>
                      <div className="p-3 text-center border-r border-white/10">
                        {product.isOnSale && product.salePrice ? (
                          <>
                            <p className="font-bold text-lg">₵{product.salePrice.toFixed(2)}</p>
                            <p className="text-[10px] line-through opacity-60">₵{product.sellingPrice.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="font-bold text-lg">₵{product.sellingPrice.toFixed(2)}</p>
                        )}
                        <p className="text-[10px] text-gray-400">Price</p>
                      </div>
                      <div className="p-3 text-center">
                        <p className="font-bold">90 Days</p>
                        <p className="text-[10px] text-gray-400">Validity</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Form */}
                  {isSelected && (
                    <div className={`${colors.expanded} p-4 rounded-b-xl shadow-lg`}>
                      {!product.inStock ? (
                        <div className="text-center py-6">
                          <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-white" />
                          <p className="font-bold text-white">Out of Stock</p>
                          <p className="text-xs text-white/70">Check back later or try other bundles</p>
                        </div>
                      ) : (
                        <>
                          {bundleMessages[index] && (
                            <div className={`mb-3 p-2 rounded-lg text-sm flex items-center gap-2 ${
                              bundleMessages[index].type === 'error' ? 'bg-red-800/80 text-red-200' : 'bg-green-800/80 text-green-200'
                            }`}>
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              {bundleMessages[index].text}
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-white/80 mb-1">Your Name</label>
                            <input
                              type="text"
                              placeholder="Enter your name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                                product.network === 'YELLO' 
                                  ? 'bg-yellow-300 text-black placeholder-yellow-700 focus:ring-yellow-600' 
                                  : 'bg-white/90 text-black placeholder-gray-500 focus:ring-white'
                              } focus:ring-2 focus:outline-none`}
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-white/80 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              placeholder={getPhoneNumberPlaceholder(product.network)}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                                product.network === 'YELLO' 
                                  ? 'bg-yellow-300 text-black placeholder-yellow-700 focus:ring-yellow-600' 
                                  : 'bg-white/90 text-black placeholder-gray-500 focus:ring-white'
                              } focus:ring-2 focus:outline-none`}
                            />
                            <p className="text-[10px] text-white/60 mt-1">Data will be sent to this number</p>
                          </div>
                          
                          <button
                            onClick={() => handlePurchase(product, index)}
                            disabled={isProcessing}
                            className={`w-full py-3 ${colors.button} font-bold rounded-lg transition-colors text-sm disabled:opacity-50`}
                          >
                            Buy {product.capacity}GB for ₵{product.isOnSale && product.salePrice ? product.salePrice.toFixed(2) : product.sellingPrice.toFixed(2)}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold mb-2">No Products Available</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Check back soon for new bundles</p>
          </div>
        )}
      </div>

      {/* View All Products CTA */}
      {products.length > 6 && (
        <div className="text-center mb-8">
          <Link 
            href={`/shop/${params.storeSlug}/products`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
          >
            View All {products.length} Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* How It Works */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 mb-6`}>
        <h2 className="text-xl font-bold mb-4 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-yellow-500">1</span>
            </div>
            <h3 className="font-bold mb-1">Select Bundle</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose your preferred data bundle</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-green-500">2</span>
            </div>
            <h3 className="font-bold mb-1">Enter Details</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Provide your name and phone number</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-blue-500">3</span>
            </div>
            <h3 className="font-bold mb-1">Receive Data</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get data in 10min-1hr after payment</p>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      {store.businessHours && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> Business Hours
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(store.businessHours).slice(0, 7).map(([day, hours]) => (
              <div key={day} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="font-medium capitalize text-sm">{day}</p>
                <p className={`text-xs ${hours.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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