'use client';
import Link from 'next/link';
import { ChevronRight, Star, Zap } from 'lucide-react';

// Network Logos
const MTNLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#FFCC00"/>
    <path d="M12 18 L18 30 L24 18 L30 30 L36 18" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#DC2626"/>
    <text x="24" y="30" textAnchor="middle" fontFamily="system-ui" fontWeight="bold" fontSize="18" fill="#fff">T</text>
  </svg>
);

const ATLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#7C3AED"/>
    <text x="24" y="30" textAnchor="middle" fontFamily="system-ui" fontWeight="bold" fontSize="14" fill="#fff">AT</text>
  </svg>
);

const getNetworkStyle = (network) => {
  if (network === 'YELLO') return {
    bg: 'bg-yellow-400',
    hover: 'hover:bg-yellow-300',
    text: 'text-black',
    name: 'MTN',
    logo: <MTNLogo size={32} />
  };
  if (network === 'TELECEL') return {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-500',
    text: 'text-white',
    name: 'Telecel',
    logo: <TelecelLogo size={32} />
  };
  if (network === 'AT_PREMIUM') return {
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-500',
    text: 'text-white',
    name: 'AirtelTigo',
    logo: <ATLogo size={32} />
  };
  return { bg: 'bg-gray-600', hover: 'hover:bg-gray-500', text: 'text-white', name: network, logo: null };
};

/**
 * Default Display Style - Colorful network cards
 */
const DefaultDisplay = ({ products, storeSlug }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {products.map((product) => {
        const style = getNetworkStyle(product.network);
        const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;

        return (
          <Link
            key={product._id}
            href={`/shop/${storeSlug}/products?network=${product.network}`}
            className="group"
          >
            <div className={`${style.bg} ${style.hover} ${style.text} rounded-2xl p-4 transition-all group-hover:shadow-lg group-hover:-translate-y-1 relative`}>
              {product.isOnSale && (
                <span className="absolute top-2 right-2 bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">
                  SALE
                </span>
              )}
              <div className="mb-2">{style.logo}</div>
              <h3 className="text-2xl font-bold">{product.capacity}GB</h3>
              <p className="text-xs opacity-70 mb-2">{style.name}</p>
              <p className="text-lg font-bold">₵{price.toFixed(2)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/**
 * Cards Display Style - Elevated cards with shadows
 */
const CardsDisplay = ({ products, storeSlug }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const style = getNetworkStyle(product.network);
        const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;

        return (
          <Link
            key={product._id}
            href={`/shop/${storeSlug}/products?network=${product.network}`}
            className="group"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-2">
              <div className={`${style.bg} p-4 flex items-center justify-between`}>
                <div className={style.text}>
                  <h3 className="text-3xl font-bold">{product.capacity}GB</h3>
                  <p className="text-sm opacity-80">{style.name}</p>
                </div>
                {style.logo}
              </div>
              <div className="p-4">
                {product.isOnSale && (
                  <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded mb-2">
                    ON SALE
                  </span>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₵{price.toFixed(2)}</p>
                    {product.isOnSale && product.sellingPrice && (
                      <p className="text-sm text-gray-400 line-through">₵{product.sellingPrice.toFixed(2)}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    Buy Now
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/**
 * Grid Display Style - Clean grid layout
 */
const GridDisplay = ({ products, storeSlug }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {products.map((product) => {
        const style = getNetworkStyle(product.network);
        const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;

        return (
          <Link
            key={product._id}
            href={`/shop/${storeSlug}/products?network=${product.network}`}
            className="group"
          >
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all relative">
              {product.isOnSale && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="scale-75">{style.logo}</div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{style.name}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{product.capacity}GB</h3>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">₵{price.toFixed(2)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/**
 * Compact Display Style - Small compact items
 */
const CompactDisplay = ({ products, storeSlug }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {products.map((product) => {
        const style = getNetworkStyle(product.network);
        const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;

        return (
          <Link
            key={product._id}
            href={`/shop/${storeSlug}/products?network=${product.network}`}
            className="group"
          >
            <div className={`${style.bg} ${style.hover} ${style.text} rounded-xl px-4 py-2 transition-all group-hover:shadow-md flex items-center gap-3`}>
              <div className="scale-75">{style.logo}</div>
              <div>
                <span className="font-bold">{product.capacity}GB</span>
                <span className="mx-2 opacity-50">•</span>
                <span className="font-semibold">₵{price.toFixed(2)}</span>
              </div>
              {product.isOnSale && (
                <Zap className="w-4 h-4 text-yellow-300" />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/**
 * List Display Style - Horizontal list items
 */
const ListDisplay = ({ products, storeSlug }) => {
  return (
    <div className="space-y-3">
      {products.map((product) => {
        const style = getNetworkStyle(product.network);
        const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;

        return (
          <Link
            key={product._id}
            href={`/shop/${storeSlug}/products?network=${product.network}`}
            className="group"
          >
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all">
              <div className="flex items-center gap-4 flex-1">
                {style.logo}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{product.capacity}GB {style.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Data Bundle</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {product.isOnSale && (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </span>
                )}
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">₵{price.toFixed(2)}</p>
                  {product.isOnSale && product.sellingPrice && (
                    <p className="text-sm text-gray-400 line-through">₵{product.sellingPrice.toFixed(2)}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/**
 * Main PackageDisplay Component - Renders based on style
 */
export default function PackageDisplay({ style = 'default', products, storeSlug, title = 'Popular Bundles' }) {
  if (!products || products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <Link
          href={`/shop/${storeSlug}/products`}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition"
        >
          See All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {style === 'cards' && <CardsDisplay products={products} storeSlug={storeSlug} />}
      {style === 'grid' && <GridDisplay products={products} storeSlug={storeSlug} />}
      {style === 'compact' && <CompactDisplay products={products} storeSlug={storeSlug} />}
      {style === 'list' && <ListDisplay products={products} storeSlug={storeSlug} />}
      {(style === 'default' || !['cards', 'grid', 'compact', 'list'].includes(style)) && <DefaultDisplay products={products} storeSlug={storeSlug} />}
    </section>
  );
}
