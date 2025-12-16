// app/shop/[storeSlug]/page.jsx - WITH SIMPLE CONFIRMATION MODAL
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ShoppingBag, Star, TrendingUp, Clock, Shield, Award,
  ChevronRight, Package, Zap, Users, Heart, ArrowRight,
  Wifi, Smartphone, Globe, CheckCircle, MessageCircle,
  Moon, Sun, AlertTriangle, Phone, Mail, MapPin,
  Facebook, Instagram, Twitter, Send, DollarSign,
  Sparkles, Gift, Crown, Rocket, Timer, CreditCard,
  WifiIcon, Percent, TrendingDown, Loader2, X
} from 'lucide-react';

// Lottie for loading animation
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

// API Base - Using Proxy to prevent CORS
const API_BASE = 'https://api.datamartgh.shop/api/v1';

// ===== SIMPLE CONFIRMATION MODAL =====
const ConfirmationModal = ({ isOpen, onClose, onConfirm, product, phoneNumber, isProcessing }) => {
  if (!isOpen || !product) return null;
  
  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AirtelTigo';
    return network;
  };
  
  const getNetworkColor = (network) => {
    if (network === 'YELLO') return { bg: 'from-yellow-400 to-yellow-500', text: 'text-black', btn: 'bg-yellow-500 hover:bg-yellow-400 text-black' };
    if (network === 'TELECEL') return { bg: 'from-red-500 to-red-600', text: 'text-white', btn: 'bg-red-500 hover:bg-red-400 text-white' };
    if (network === 'AT_PREMIUM') return { bg: 'from-purple-500 to-purple-600', text: 'text-white', btn: 'bg-purple-500 hover:bg-purple-400 text-white' };
    return { bg: 'from-blue-500 to-blue-600', text: 'text-white', btn: 'bg-blue-500 hover:bg-blue-400 text-white' };
  };
  
  const colors = getNetworkColor(product?.network);
  const price = product?.isOnSale && product?.salePrice ? product.salePrice : product?.sellingPrice;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-modal-pop">
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.bg} ${colors.text} p-5 text-center`}>
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Are you sure?</h2>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-400 mb-4">We're sending data to this number:</p>
          
          {/* Phone Number - Big and Bold */}
          <div className="bg-gray-800 rounded-xl p-5 mb-4">
            <p className="text-3xl font-bold text-white tracking-wider mb-2">{phoneNumber}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors.btn}`}>
              {product?.capacity}GB {getNetworkName(product?.network)}
            </span>
          </div>
          
          {/* Warning */}
          <p className="text-amber-400 text-sm mb-6">
            ⚠️ Data cannot be reversed once sent!
          </p>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              No, Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 py-3 ${colors.btn} font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wait...
                </>
              ) : (
                `Yes, Pay ₵${price?.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes modal-pop {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-modal-pop { animation: modal-pop 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// Network Logo Components
const MTNLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MTN Logo">
    <title>MTN</title>
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Telecel Logo">
    <title>Telecel</title>
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
    <path d="M50 125 L150 125" stroke="#cc0000" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AirtelTigo Logo">
    <title>AirtelTigo</title>
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
    <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontSize="18" fill="#7c3aed">PREMIUM</text>
  </svg>
);

// ===== PRODUCT CARD WITH CONFIRMATION MODAL =====
function ProductCard({ product, storeSlug, isDarkMode, customColors, isSelected, onSelect }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AT Premium';
    return network;
  };
  
  const getCardColors = (network) => {
    if (network === 'YELLO') return {
      card: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
      expanded: 'bg-yellow-500',
      text: 'text-black',
      subtext: 'text-black/70',
      button: 'bg-black hover:bg-gray-900 text-yellow-400',
      footer: 'bg-black text-white',
      input: 'bg-yellow-300 text-black placeholder-yellow-700 focus:ring-yellow-600'
    };
    if (network === 'TELECEL') return {
      card: 'bg-gradient-to-br from-red-600 to-red-700',
      expanded: 'bg-red-600',
      text: 'text-white',
      subtext: 'text-white/70',
      button: 'bg-red-900 hover:bg-red-800 text-white',
      footer: 'bg-black/50 text-white',
      input: 'bg-white/90 text-black placeholder-gray-500 focus:ring-white'
    };
    if (network === 'AT_PREMIUM') return {
      card: 'bg-gradient-to-br from-purple-600 to-purple-700',
      expanded: 'bg-purple-600',
      text: 'text-white',
      subtext: 'text-white/70',
      button: 'bg-purple-900 hover:bg-purple-800 text-white',
      footer: 'bg-black/50 text-white',
      input: 'bg-white/90 text-black placeholder-gray-500 focus:ring-white'
    };
    return {
      card: 'bg-gradient-to-br from-blue-600 to-blue-700',
      expanded: 'bg-blue-600',
      text: 'text-white',
      subtext: 'text-white/70',
      button: 'bg-blue-900 hover:bg-blue-800 text-white',
      footer: 'bg-black/50 text-white',
      input: 'bg-white/90 text-black placeholder-gray-500 focus:ring-white'
    };
  };
  
  const getNetworkLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo />;
    if (network === 'TELECEL') return <TelecelLogo />;
    if (network === 'AT_PREMIUM') return <AirtelTigoLogo />;
    return <Package className="w-12 h-12" />;
  };
  
  const getPhoneNumberPlaceholder = (network) => {
    if (network === 'YELLO') return '024XXXXXXX';
    if (network === 'TELECEL') return '020/050XXXXXXX';
    if (network === 'AT_PREMIUM') return '026/027XXXXXXX';
    return '0XXXXXXXXX';
  };
  
  const validatePhoneNumber = (number, network) => {
    const clean = number.replace(/[\s-]/g, '');
    if (network === 'YELLO') return clean.length === 10 && /^0\d{9}$/.test(clean);
    if (network === 'TELECEL') return /^(020|050)\d{7}$/.test(clean);
    if (network === 'AT_PREMIUM') return /^(026|027|056|057)\d{7}$/.test(clean);
    return clean.length === 10 && /^0\d{9}$/.test(clean);
  };
  
  const generateAutoEmail = (phone) => {
    const clean = phone.replace(/[\s-]/g, '');
    return `customer_${clean}@datamartgh.shop`;
  };
  
  // Show confirmation modal
  const handleShowConfirmation = () => {
    setErrorMessage('');
    
    if (!product.inStock) {
      setErrorMessage('This bundle is out of stock.');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber, product.network)) {
      const networkName = getNetworkName(product.network);
      setErrorMessage(`Enter a valid ${networkName} number`);
      return;
    }
    
    if (!customerName.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    
    setShowConfirmation(true);
  };
  
  // Confirmed purchase
  const handleConfirmedPurchase = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${storeSlug}/purchase/initialize`, {
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
        window.location.href = data.data.authorizationUrl;
      } else {
        setShowConfirmation(false);
        setErrorMessage(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      setShowConfirmation(false);
      setErrorMessage('Error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const colors = getCardColors(product.network);
  
  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedPurchase}
        product={product}
        phoneNumber={phoneNumber}
        isProcessing={isProcessing}
      />
      
      <article className="flex flex-col relative">
        {/* Badges */}
        {product.inStock === false && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded-full shadow-lg">OUT OF STOCK</span>
          </div>
        )}
        {product.isOnSale && product.salePrice && product.inStock !== false && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded-full shadow-lg">SALE</span>
          </div>
        )}
        
        {/* Card */}
        <div 
          className={`${colors.card} ${colors.text} overflow-hidden shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${isSelected ? 'rounded-t-xl' : 'rounded-xl'}`}
          onClick={() => onSelect(product._id)}
        >
          {/* Card Content - Horizontal on Mobile */}
          <div className="flex sm:flex-col items-center p-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 sm:mb-2">
              {getNetworkLogo(product.network)}
            </div>
            <div className="ml-4 sm:ml-0 sm:text-center flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold">{product.capacity}GB</h3>
              <p className={`text-xs ${colors.subtext}`}>
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
          <div className={`hidden sm:grid grid-cols-2 ${colors.footer}`}>
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
            {product.inStock === false ? (
              <div className="text-center py-6">
                <X className="w-12 h-12 mx-auto mb-2 opacity-50 text-white" />
                <p className="font-bold text-white">Out of Stock</p>
                <p className="text-xs text-white/70">Check back later or try other bundles</p>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-3 p-2 rounded-lg text-sm flex items-center gap-2 bg-red-800/80 text-red-200">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-white/80 mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium ${colors.input} focus:ring-2 focus:outline-none`}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-medium text-white/80 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder={getPhoneNumberPlaceholder(product.network)}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium ${colors.input} focus:ring-2 focus:outline-none`}
                  />
                  <p className="text-[10px] text-white/60 mt-1">Data will be sent to this number</p>
                </div>
                
                <button
                  onClick={handleShowConfirmation}
                  disabled={isProcessing}
                  className={`w-full py-3 ${colors.button} font-bold rounded-lg transition-colors text-sm disabled:opacity-50`}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 inline mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <>Buy {product.capacity}GB for ₵{product.isOnSale && product.salePrice ? product.salePrice.toFixed(2) : product.sellingPrice.toFixed(2)}</>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </article>
    </>
  );
}

// ===== MAIN STORE PAGE =====
export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#1976d2',
    secondary: '#dc004e'
  });

  useEffect(() => {
    if (params.storeSlug && typeof window !== 'undefined') {
      localStorage.setItem('lastVisitedStoreSlug', params.storeSlug);
    }
  }, [params.storeSlug]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
      setIsDarkMode(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [params.storeSlug]);

  const fetchStoreData = async () => {
    try {
      const storeSlug = params.storeSlug || localStorage.getItem('lastVisitedStoreSlug');
      if (!storeSlug) {
        setLoading(false);
        return;
      }

      const storeResponse = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`);
      const storeData = await storeResponse.json();
      
      if (storeData.status === 'success') {
        setStore(storeData.data);
        
        if (storeData.data.customization) {
          setCustomColors({
            primary: storeData.data.customization.primaryColor || '#1976d2',
            secondary: storeData.data.customization.secondaryColor || '#dc004e'
          });
        }
        
        const productsResponse = await fetch(`${API_BASE}/agent-stores/stores/${storeSlug}/products`);
        const productsData = await productsResponse.json();
        
        if (productsData.status === 'success') {
          setProducts(productsData.data?.products || []);
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const featuredProducts = products.filter(p => p.featured || p.isOnSale).slice(0, 4);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  const handleSelectProduct = (productId) => {
    setSelectedProductId(selectedProductId === productId ? null : productId);
  };

  // Loading State with Lottie
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
        <p className="text-gray-400 text-sm mt-2">Loading store...</p>
      </div>
    );
  }

  // Store Not Found
  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Store Not Found</h1>
          <p className="text-gray-400 mb-6">This store is no longer available.</p>
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg">
            <ArrowRight className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'} min-h-screen transition-colors`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>

        {/* Hero Section */}
        <section 
          className="rounded-xl overflow-hidden text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})` }}
        >
          <div className="px-6 py-8">
            <div className="flex items-center gap-4 mb-4">
              {store?.storeLogo && (
                <img src={store.storeLogo} alt={store.storeName} className="h-14 w-14 rounded-xl border-2 border-white/30" />
              )}
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {store?.storeName}
                  {store?.verification?.isVerified && <Shield className="w-5 h-5 text-green-400" />}
                </h1>
                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isStoreOpen() ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1 ${isStoreOpen() ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {isStoreOpen() ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2">Buy Affordable Data Bundles</h2>
            <p className="text-white/80 text-sm mb-4">⚡ 30-60min delivery • 💰 Best prices • 🌐 All networks</p>
            
            <div className="flex gap-3">
              <Link 
                href={`/shop/${params.storeSlug}/products`}
                className="inline-flex items-center px-5 py-2 bg-white text-gray-900 font-bold rounded-full text-sm"
              >
                <ShoppingBag className="w-4 h-4 mr-2" /> Shop Now
              </Link>
              {store?.contactInfo?.whatsappNumber && (
                <a 
                  href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2 bg-green-500 text-white font-bold rounded-full text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Network Selection */}
        <section id="products">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Network</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { network: 'YELLO', name: 'MTN', logo: <MTNLogo />, color: 'from-yellow-400 to-yellow-500', textColor: 'text-black' },
              { network: 'TELECEL', name: 'Telecel', logo: <TelecelLogo />, color: 'from-red-600 to-red-700', textColor: 'text-white' },
              { network: 'AT_PREMIUM', name: 'AirtelTigo', logo: <AirtelTigoLogo />, color: 'from-purple-600 to-purple-700', textColor: 'text-white' },
            ].map(({ network, name, logo, color, textColor }) => {
              const count = products.filter(p => p.network === network).length;
              if (count === 0) return null;
              
              return (
                <Link 
                  key={network} 
                  href={`/shop/${params.storeSlug}/products?network=${network}`}
                  className={`bg-gradient-to-br ${color} ${textColor} p-4 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1`}
                >
                  <div className="transform scale-75 origin-left">{logo}</div>
                  <h3 className="font-bold text-lg">{name}</h3>
                  <p className={`${textColor === 'text-black' ? 'text-black/70' : 'text-white/80'} text-xs`}>{count} bundles</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" /> Hot Deals
              </h2>
              <Link 
                href={`/shop/${params.storeSlug}/products`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  storeSlug={params.storeSlug} 
                  isDarkMode={isDarkMode}
                  customColors={customColors}
                  isSelected={selectedProductId === product._id}
                  onSelect={handleSelectProduct}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Products</h2>
              <Link 
                href={`/shop/${params.storeSlug}/products`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  storeSlug={params.storeSlug} 
                  isDarkMode={isDarkMode}
                  customColors={customColors}
                  isSelected={selectedProductId === product._id}
                  onSelect={handleSelectProduct}
                />
              ))}
            </div>
            
            {/* See All Products Button */}
            {products.length > 8 && (
              <div className="mt-6 text-center">
                <Link
                  href={`/shop/${params.storeSlug}/products`}
                  className="inline-flex items-center gap-2 py-3 px-8 rounded-xl font-bold transition-all bg-yellow-500 hover:bg-yellow-400 text-black"
                >
                  <Package className="w-5 h-5" />
                  See All {products.length} Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Store Info */}
        {store && (
          <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About {store.storeName}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{store.storeDescription}</p>
            
            <div className="grid grid-cols-2 gap-4">
              {store.contactInfo?.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: customColors.primary }} />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{store.contactInfo.phoneNumber}</p>
                  </div>
                </div>
              )}
              {store.contactInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: customColors.primary }} />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{store.contactInfo.email}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}