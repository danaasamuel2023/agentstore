'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Search, Package, Zap, Shield, AlertCircle, X, Loader2, ChevronDown } from 'lucide-react';
import { DeliveryEtaBanner, DeliveryEtaInline } from '../components/DeliveryEta';
import VerifyNumberModal from '../components/VerifyNumberModal';
import { MTNLogo, TelecelLogo, ATLogo } from '../components/NetworkLogo';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

// Network Logos
// Network marks now live in components/NetworkLogo.jsx — same artwork,
// one copy, so a change to a logo reaches every page at once.

// Toast notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-yellow-500 text-black'
      }`}>
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100">×</button>
      </div>
    </div>
  );
};

// Confirmation Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, product, phoneNumber, isProcessing }) => {
  if (!isOpen || !product) return null;
  
  const getStyle = (network) => {
    if (network === 'YELLO') return { bg: 'from-yellow-400 to-yellow-500', text: 'text-black', btn: 'bg-yellow-500 hover:bg-yellow-400 text-black', name: 'MTN' };
    if (network === 'TELECEL') return { bg: 'from-red-500 to-red-600', text: 'text-white', btn: 'bg-red-600 hover:bg-red-500 text-white', name: 'Telecel' };
    if (network === 'AT_PREMIUM') return { bg: 'from-[#24487F] to-[#1E3A6B]', text: 'text-white', btn: 'bg-[#1E3A6B] hover:bg-[#24487F] text-white', name: 'AirtelTigo' };
    return { bg: 'from-gray-500 to-gray-600', text: 'text-white', btn: 'bg-gray-600 text-white', name: network };
  };
  
  const style = getStyle(product.network);
  const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-paper rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
        
        <div className={`bg-gradient-to-r ${style.bg} ${style.text} p-6 text-center`}>
          <h2 className="text-xl font-bold">Confirm Purchase</h2>
          <p className="text-sm opacity-80 mt-1">Please verify the details below</p>
        </div>
        
        <div className="p-6">
          <div className="bg-sunken rounded-2xl p-5 mb-4 text-center">
            <p className="text-ink-3 text-sm mb-2">Sending data to</p>
            <p className="text-2xl font-bold text-ink tracking-wider">{phoneNumber}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${style.btn}`}>
                {product.capacity}GB {style.name}
              </span>
            </div>
          </div>
          
          {/* Delivery ETA — same logic as mtnup2u + /orders on DataMart */}
          <div className="bg-sunken border border-hairline rounded-xl p-3 mb-3">
            <p className="text-[10px] text-ink-4 uppercase font-semibold mb-1 text-center">Estimated Delivery</p>
            <DeliveryEtaInline />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-amber-700 text-sm text-center">
              ⚠️ Data cannot be reversed once sent. Please confirm the number is correct.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 bg-sunken hover:bg-hairline text-ink-2 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 py-3 ${style.btn} font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₵${price.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Card
const ProductCard = ({ product, storeSlug, onBuy }) => {
  const [expanded, setExpanded] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  
  const getStyle = (network) => {
    if (network === 'YELLO') return { 
      card: 'bg-yellow-400', 
      expanded: 'bg-yellow-500',
      text: 'text-black', 
      subtext: 'text-black/60',
      input: 'bg-yellow-300 placeholder-yellow-700 focus:ring-yellow-600',
      btn: 'bg-black text-yellow-400 hover:bg-gray-900',
      name: 'MTN',
      logo: <MTNLogo size={36} />
    };
    if (network === 'TELECEL') return { 
      card: 'bg-red-600', 
      expanded: 'bg-red-700',
      text: 'text-white', 
      subtext: 'text-white/60',
      input: 'bg-white/90 placeholder-gray-500 focus:ring-white',
      btn: 'bg-red-900 text-white hover:bg-red-800',
      name: 'Telecel',
      logo: <TelecelLogo size={36} />
    };
    if (network === 'AT_PREMIUM') return { 
      card: 'bg-[#1E3A6B]', 
      expanded: 'bg-[#24487F]',
      text: 'text-white', 
      subtext: 'text-white/60',
      input: 'bg-white/90 placeholder-gray-500 focus:ring-white',
      btn: 'bg-[#0F2447] text-white hover:bg-[#16305C]',
      name: 'AirtelTigo',
      logo: <ATLogo size={36} />
    };
    return { 
      card: 'bg-gray-600', 
      expanded: 'bg-gray-700',
      text: 'text-white', 
      subtext: 'text-white/60',
      input: 'bg-white/90 placeholder-gray-500',
      btn: 'bg-gray-800 text-white',
      name: network,
      logo: <Package size={36} />
    };
  };
  
  const style = getStyle(product.network);
  const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;
  
  const validatePhone = () => {
    const clean = phone.replace(/[\s-]/g, '');
    if (product.network === 'YELLO') return clean.length === 10 && /^0\d{9}$/.test(clean);
    if (product.network === 'TELECEL') return /^(020|050)\d{7}$/.test(clean);
    if (product.network === 'AT_PREMIUM') return /^(026|027|056|057)\d{7}$/.test(clean);
    return clean.length === 10;
  };
  
  const getPlaceholder = () => {
    if (product.network === 'YELLO') return '024XXXXXXX';
    if (product.network === 'TELECEL') return '020/050XXXXXXX';
    if (product.network === 'AT_PREMIUM') return '026/027XXXXXXX';
    return '0XXXXXXXXX';
  };
  
  const handleBuy = () => {
    setError('');
    if (!product.inStock) {
      setError('This bundle is out of stock');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!validatePhone()) {
      setError(`Enter a valid ${style.name} number`);
      return;
    }
    onBuy(product, phone, name);
  };
  
  return (
    <div className="relative">
      {/* Out of Stock Badge */}
      {!product.inStock && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">OUT OF STOCK</span>
        </div>
      )}
      
      {/* Sale Badge */}
      {product.isOnSale && product.salePrice && product.inStock && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">SALE</span>
        </div>
      )}
      
      {/* Card */}
      <div 
        onClick={() => !expanded && setExpanded(true)}
        className={`${style.card} ${style.text} overflow-hidden cursor-pointer transition-all hover:shadow-lg ${expanded ? 'rounded-t-2xl' : 'rounded-2xl hover:-translate-y-1'}`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            {style.logo}
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${product.network === 'YELLO' ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'} transition`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <h3 className="text-3xl font-bold">{product.capacity}GB</h3>
          <p className={`text-sm ${style.subtext} mb-3`}>{style.name} Bundle</p>
          
          <div className="flex items-center justify-between">
            <div>
              {product.isOnSale && product.salePrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">₵{product.salePrice.toFixed(2)}</span>
                  <span className={`text-sm ${style.subtext} line-through`}>₵{product.sellingPrice.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-2xl font-bold">₵{product.sellingPrice.toFixed(2)}</span>
              )}
            </div>
            <span className={`text-xs ${style.subtext}`}>90 days</span>
          </div>
        </div>
      </div>
      
      {/* Expanded Form */}
      {expanded && (
        <div className={`${style.expanded} ${style.text} p-5 rounded-b-2xl`}>
          {!product.inStock ? (
            <div className="text-center py-4">
              <X className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold">Out of Stock</p>
              <p className={`text-sm ${style.subtext}`}>Check back later</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/20 text-red-100 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1.5 opacity-80">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-black ${style.input} focus:ring-2 focus:outline-none`}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 opacity-80">Phone Number</label>
                <input
                  type="tel"
                  placeholder={getPlaceholder()}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-black ${style.input} focus:ring-2 focus:outline-none`}
                />
                <p className={`text-xs ${style.subtext} mt-1.5`}>Data will be sent to this number</p>
              </div>
              
              <button
                onClick={handleBuy}
                className={`w-full py-3 ${style.btn} font-semibold rounded-xl transition`}
              >
                Buy {product.capacity}GB for ₵{price.toFixed(2)}
              </button>

              {/* Optional pre-check for MTN — new SIMs need activation first */}
              {product.network === 'YELLO' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowVerify(true)}
                    className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-black/20 bg-black/5 text-black font-semibold text-sm hover:bg-black/10 hover:border-black/30 transition"
                  >
                    <Search className="w-4 h-4" /> New number? Check it can be served
                  </button>
                  <p className="text-center text-[11px] text-black/50 mt-1.5">Optional — takes a few seconds. Skip it if the number already works.</p>
                </>
              )}
            </>
          )}
        </div>
      )}

      <VerifyNumberModal open={showVerify} onClose={() => setShowVerify(false)} prefill={phone} />
    </div>
  );
};

// Main Products Page Content
function ProductsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  /* MTN is selected on arrival, not "all". Most bundles sold here are MTN, and
     a mixed grid makes someone scan past two networks they did not want before
     reaching theirs. A ?network= link still wins, so the home page's network
     shortcuts land where they say they will. */
  const [network, setNetwork] = useState(searchParams.get('network') || 'YELLO');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, product: null, phone: '', name: '' });
  const [paymentMethodModal, setPaymentMethodModal] = useState({ show: false, product: null, phone: '', name: '', reference: '', transactionId: '', authorizationUrl: '' });
  const [momoPayPhone, setMomoPayPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpModal, setOtpModal] = useState({ show: false, reference: '', message: '' });
  const [otp, setOtp] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending' | 'completed' | null
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [params.storeSlug]);

  useEffect(() => {
    filterProducts();
  }, [products, network]);

  /* Not every shop stocks MTN. Once the catalogue lands, if the selected
     network is not one this shop actually sells, fall to the first it does —
     otherwise the page opens on an empty grid and looks broken. */
  useEffect(() => {
    if (!products.length) return;
    const stocked = new Set(products.map((p) => p.network));
    if (!stocked.has(network)) {
      const order = ['YELLO', 'AT_PREMIUM', 'at', 'TELECEL'];
      setNetwork(order.find((n) => stocked.has(n)) || products[0].network);
    }
  }, [products, network]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/products`);
      const data = await res.json();
      if (data.status === 'success') {
        setProducts(data.data?.products || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    // One network is always selected, so this is unconditional now.
    let result = products.filter((p) => p.network === network);

    // Always cheapest first. The sort dropdown is gone — four orderings for a
    // list of two dozen items is a decision nobody wants to make, and price
    // ascending is what all but a handful would have picked anyway. The sort
    // itself stays, so the list is never in arbitrary API order.
    result.sort((a, b) => a.sellingPrice - b.sellingPrice);

    setFiltered(result);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleBuy = async (product, phone, name) => {
    setIsProcessing(true);
    try {
      const cleanPhone = phone.replace(/[\s-]/g, '');
      const res = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          phoneNumber: cleanPhone,
          customerEmail: `customer_${cleanPhone}@datamartgh.shop`,
          customerName: name,
          quantity: 1
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        showToast(`${data.message || 'Payment failed'}${data.details ? ': ' + data.details : ''}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectCharge = async () => {
    if (!momoPayPhone || momoPayPhone.replace(/[\s\-]/g, '').length < 10) {
      showToast('Please enter a valid MoMo number', 'error');
      return;
    }
    const { product, phone, name } = paymentMethodModal;
    const cleanMomoPhone = momoPayPhone.replace(/[\s\-]/g, '');
    setIsProcessing(true);
    setPaymentMethodModal(prev => ({ ...prev, show: false }));

    try {
      // Step 1: Initialize (creates transaction, skips Paystack redirect)
      const initRes = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          phoneNumber: phone,
          customerEmail: `customer_${phone}@datamartgh.shop`,
          customerName: name,
          quantity: 1,
          paymentType: 'momo_direct'
        })
      });

      const initData = await initRes.json();
      if (initData.status !== 'success') {
        showToast(initData.message || 'Failed to create order', 'error');
        return;
      }

      // Step 2: Direct MoMo charge
      const chargeRes = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: initData.data.transactionId, momoPhone: cleanMomoPhone })
      });

      const chargeData = await chargeRes.json();

      if (chargeData.status === 'success') {
        if (chargeData.action === 'send_otp') {
          setOtpModal({ show: true, reference: chargeData.reference, message: chargeData.message });
          return;
        }
        if (chargeData.action === 'pending') {
          setPaymentStatus('pending');
          setStatusMessage(chargeData.message);
          pollPaymentStatus(chargeData.reference);
          return;
        }
        if (chargeData.action === 'completed') {
          setPaymentStatus('completed');
          setStatusMessage('Payment successful! Your order is being processed.');
          return;
        }
      }

      showToast(chargeData.message || 'Direct charge failed. Try Paystack checkout.', 'error');
    } catch {
      showToast('Direct charge failed. Try Paystack checkout.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackRedirect = async () => {
    const { product, phone, name } = paymentMethodModal;
    setIsProcessing(true);
    setPaymentMethodModal(prev => ({ ...prev, show: false }));

    try {
      const initRes = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          phoneNumber: phone,
          customerEmail: `customer_${phone}@datamartgh.shop`,
          customerName: name,
          quantity: 1
        })
      });

      const initData = await initRes.json();
      if (initData.status === 'success' && initData.data.authorizationUrl) {
        window.location.href = initData.data.authorizationUrl;
      } else {
        showToast(`${initData.message || 'Failed to initialize payment'}${initData.details ? ': ' + initData.details : ''}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitOtp = async () => {
    if (!otp.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim(), reference: otpModal.reference })
      });
      const data = await res.json();
      setOtpModal({ show: false, reference: '', message: '' });
      setOtp('');

      if (data.status === 'success') {
        if (data.action === 'completed') {
          setPaymentStatus('completed');
          setStatusMessage('Payment successful! Your order is being processed.');
        } else if (data.action === 'pending') {
          setPaymentStatus('pending');
          setStatusMessage(data.message || 'Please approve the payment on your phone');
          pollPaymentStatus(otpModal.reference);
        }
      } else {
        showToast(data.message || 'OTP verification failed', 'error');
      }
    } catch {
      showToast('Failed to verify OTP', 'error');
      setOtpModal({ show: false, reference: '', message: '' });
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = (reference) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 5s = 2.5 minutes
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/purchase/check-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        });
        const data = await res.json();
        if (data.data?.paymentStatus === 'success') {
          clearInterval(interval);
          setPaymentStatus('completed');
          setStatusMessage('Payment successful! Your order is being processed.');
        } else if (data.data?.paymentStatus === 'failed') {
          clearInterval(interval);
          setPaymentStatus(null);
          showToast('Payment failed. Please try again.', 'error');
        }
      } catch {}
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPaymentStatus(null);
        showToast('Payment verification timed out. Check your order status.', 'error');
      }
    }, 5000);
  };

  /* Fixed order: MTN, AirtelTigo, Telecel. Deriving it from the catalogue meant
     the bar reshuffled whenever the shop's product mix changed, so a regular
     customer could not build muscle memory for where their network sits. */
  const NETWORK_ORDER = ['YELLO', 'AT_PREMIUM', 'at', 'TELECEL'];
  const present = new Set(products.map((p) => p.network));
  const networks = [
    ...NETWORK_ORDER.filter((n) => present.has(n)),
    ...[...present].filter((n) => !NETWORK_ORDER.includes(n)),
  ];
  
  const getNetworkName = (n) => {
    if (n === 'YELLO') return 'MTN';
    if (n === 'TELECEL') return 'Telecel';
    if (n === 'AT_PREMIUM') return 'AirtelTigo';
    return n;
  };

  /* Colours for the segmented filter bar — inline values on a joined bar,
     rather than the Tailwind classes the bundle cards use. */
  const networkFilterColour = (n) => {
    if (n === 'YELLO') return { bg: '#FFCC00', ink: '#1A1A1A' };
    if (n === 'TELECEL') return { bg: '#E11D2E', ink: '#FFFFFF' };
    if (n === 'AT_PREMIUM' || n === 'at') return { bg: '#1E3A6B', ink: '#FFFFFF' };
    return { bg: 'var(--brand)', ink: 'var(--brand-ink)' };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-hairline border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
      )}
      
      {/* Confirm Modal */}
      {/* Payment Method Choice Modal */}
      {paymentMethodModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-paper rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-6 relative z-10">
            {/* Order Summary */}
            {(() => {
              const p = paymentMethodModal.product;
              const price = p?.isOnSale && p?.salePrice ? p.salePrice : p?.sellingPrice;
              const netName = p?.network === 'YELLO' ? 'MTN' : p?.network === 'TELECEL' ? 'Telecel' : 'AirtelTigo';
              const netColor = p?.network === 'YELLO' ? 'bg-yellow-400 text-black' : p?.network === 'TELECEL' ? 'bg-red-600 text-white' : 'bg-[#1E3A6B] text-white';
              return (
                <div className={`rounded-2xl p-4 mb-4 ${netColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black">{p?.capacity}GB</p>
                      <p className="text-xs opacity-70">{netName} Data Bundle</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">₵{price?.toFixed(2)}</p>
                      <p className="text-xs opacity-70">to {paymentMethodModal.phone}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
            <h3 className="text-sm font-bold text-ink mb-3 text-center">How would you like to pay?</h3>

            <div className="space-y-3">
              {/* Direct MoMo */}
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">Pay with MoMo</p>
                    <p className="text-[10px] text-ink-3">Charge your MoMo directly — no redirect</p>
                  </div>
                </div>
                <input
                  type="tel"
                  placeholder="Enter MoMo number (e.g. 0241234567)"
                  value={momoPayPhone}
                  onChange={(e) => setMomoPayPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-paper text-ink text-sm font-medium placeholder:text-ink-4 focus:outline-none focus:border-amber-500 mb-3"
                />
                <button
                  onClick={handleDirectCharge}
                  disabled={isProcessing || !momoPayPhone.replace(/[\s\-]/g, '')}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Charging...</> : 'Pay Now'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-hairline"></div>
                <span className="text-xs text-ink-4 font-medium">OR</span>
                <div className="h-px flex-1 bg-hairline"></div>
              </div>

              {/* Paystack Checkout */}
              <button
                onClick={handlePaystackRedirect}
                disabled={isProcessing}
                className="w-full p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-left flex items-center gap-4 disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-ink text-sm">Paystack Checkout</p>
                  <p className="text-[10px] text-ink-3">Card, Bank, USSD, QR, MoMo & more</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setPaymentMethodModal(prev => ({ ...prev, show: false }))}
              className="w-full mt-4 py-2.5 text-ink-3 text-sm font-medium hover:text-ink-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-paper rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-ink">Enter OTP</h3>
              <p className="text-sm text-ink-3 mt-1">{otpModal.message || 'Enter the code sent to your phone'}</p>
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter OTP code"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl border-2 border-hairline text-center text-2xl font-bold tracking-[0.3em] focus:border-blue-500 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setOtpModal({ show: false, reference: '', message: '' }); setOtp(''); }}
                disabled={isProcessing}
                className="flex-1 py-3 bg-sunken text-ink-2 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOtp}
                disabled={isProcessing || !otp.trim()}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Overlay */}
      {paymentStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-paper rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-6 text-center">
            {paymentStatus === 'pending' ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Approve Payment</h3>
                <p className="text-sm text-ink-3 mb-4">{statusMessage || 'Please approve the payment on your phone'}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-ink-4">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Waiting for confirmation...
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Payment Successful!</h3>
                <p className="text-sm text-ink-3 mb-4">{statusMessage}</p>
                <button
                  onClick={() => setPaymentStatus(null)}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-[26px]">Data bundles</h1>
        <p className="mt-1 text-[14px] text-ink-3">Pick a size and pay by mobile money.</p>
      </div>

      {/* Live delivery ETA — same buckets as mtnup2u + /orders on DataMart */}
      <DeliveryEtaBanner />

      {/* Network filter — one joined segmented bar, each segment in its own
          network colour, sitting directly above the bundles it filters. It used
          to be a card of outlined pills up by the page title, separated from the
          grid by a notice and a banner, so the control and the thing it controls
          were never on screen together.

          Selection reads by dimming, not by moving: the chosen network sits at
          full colour and the rest fall back to a third. Nothing shifts, resizes
          or gains a border, so the bar never reflows as you tap across it. */}
      {networks.length > 1 && (
        <div className="space-y-2.5">
          <div className="flex justify-center">
            <div
              className="inline-flex overflow-hidden rounded-xl"
              role="group"
              aria-label="Filter by network"
            >
              {networks.map((n) => {
                const active = network === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setNetwork(n)}
                    className="px-5 py-3 text-[15px] font-bold transition-opacity sm:px-7"
                    style={{
                      background: networkFilterColour(n).bg,
                      color: networkFilterColour(n).ink,
                      opacity: active ? 1 : 0.34,
                    }}
                  >
                    {getNetworkName(n)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-ink-3">
            <span className="num">{filtered.length} bundles</span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" style={{ color: 'var(--warn)' }} /> Fast delivery
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" style={{ color: 'var(--ok)' }} /> Secure
            </span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <ProductCard 
            key={product._id} 
            product={product} 
            storeSlug={params.storeSlug}
            onBuy={handleBuy}
          />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="mx-auto mb-4 h-12 w-12 text-ink-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No bundles found</h3>
          <p className="text-ink-3 mb-4">Try changing your filters</p>
          {networks.filter((n) => n !== network).length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {networks
                .filter((n) => n !== network)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNetwork(n)}
                    className="btn btn-ghost"
                  >
                    Try {getNetworkName(n)}
                  </button>
                ))}
            </div>
          )}
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

// Export with Suspense wrapper for useSearchParams
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-hairline border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
