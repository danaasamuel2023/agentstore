'use client';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Clock, Star, Sparkles } from 'lucide-react';

/**
 * Default Hero Style - Gradient background with pattern
 */
const DefaultHero = ({ storeSlug, theme }) => (
  <section
    className="relative rounded-3xl overflow-hidden animate-fadeIn"
    style={{ backgroundColor: theme.primary }}
  >
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
      }}
    ></div>
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>
    </div>

    <div className="relative px-6 py-12 md:px-10 md:py-16">
      <div className="max-w-xl">
        <span
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-4 animate-pulse-slow bg-yellow-400 text-black"
        >
          <Zap className="w-3 h-3" />
          Instant Delivery
        </span>

        <h1
          className="text-3xl md:text-4xl font-bold mb-4 leading-tight animate-slideUp"
          style={{ color: theme.text }}
        >
          Buy Data Bundles<br />
          <span className="text-yellow-400">At Unbeatable Prices</span>
        </h1>

        <p
          className="text-lg mb-8 animate-slideUp opacity-80"
          style={{ color: theme.text, animationDelay: '100ms' }}
        >
          MTN, Telecel & AirtelTigo bundles delivered to your phone within minutes. Safe, fast, and reliable.
        </p>

        <div className="flex flex-wrap gap-3 animate-slideUp" style={{ animationDelay: '200ms' }}>
          <Link
            href={`/shop/${storeSlug}/products`}
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Shop Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/shop/${storeSlug}/orders/search`}
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: theme.text
            }}
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  </section>
);

/**
 * Gradient Hero Style - Bold gradient with floating elements
 */
const GradientHero = ({ storeSlug, theme }) => (
  <section className="relative rounded-3xl overflow-hidden animate-fadeIn">
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary}, ${theme.primary})`
      }}
    ></div>

    {/* Floating circles */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-float-delayed"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-yellow-400/20 rounded-full blur-lg"></div>
    </div>

    <div className="relative px-6 py-14 md:px-10 md:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          Best Prices Guaranteed
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
          Your One-Stop Shop for
          <span className="block text-yellow-400 mt-2">Affordable Data</span>
        </h1>

        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto">
          Get instant data bundles for all networks at prices you'll love. Fast, secure, reliable.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={`/shop/${storeSlug}/products`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl bg-white text-gray-900 hover:bg-yellow-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            Browse Bundles
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={`/shop/${storeSlug}/orders/search`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-300"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  </section>
);

/**
 * Minimal Hero Style - Clean and simple
 */
const MinimalHero = ({ storeSlug, theme }) => (
  <section className="py-12 md:py-16">
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
        Affordable Data Bundles
        <span
          className="block mt-2"
          style={{ color: theme.primary }}
        >
          Delivered Instantly
        </span>
      </h1>

      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
        Buy MTN, Telecel & AirtelTigo bundles at the best prices. Fast delivery within minutes.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href={`/shop/${storeSlug}/products`}
          className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          style={{ backgroundColor: theme.primary }}
        >
          View Bundles
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          href={`/shop/${storeSlug}/orders/search`}
          className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
        >
          Track Order
        </Link>
      </div>

      {/* Trust indicators */}
      <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Instant Delivery
        </span>
        <span className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          100% Secure
        </span>
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-500" />
          Best Prices
        </span>
      </div>
    </div>
  </section>
);

/**
 * Wave Hero Style - With wave pattern at bottom
 */
const WaveHero = ({ storeSlug, theme }) => (
  <section className="relative overflow-hidden">
    <div
      className="px-6 py-14 md:px-10 md:py-20"
      style={{ backgroundColor: theme.primary }}
    >
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Clock className="w-4 h-4" />
          10-60 Min Delivery
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">
          Get Data Bundles<br />
          <span className="text-yellow-400">At Wholesale Prices</span>
        </h1>

        <p className="text-lg text-white/80 mb-8">
          All networks available. Fast, reliable delivery. Best prices guaranteed.
        </p>

        <Link
          href={`/shop/${storeSlug}/products`}
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black hover:shadow-lg transition-all duration-300"
        >
          Buy Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>

    {/* Wave SVG */}
    <div className="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <path
          d="M0 120V60C240 20 480 0 720 0C960 0 1200 20 1440 60V120H0Z"
          className="fill-gray-50 dark:fill-gray-950"
        />
      </svg>
    </div>
  </section>
);

/**
 * Split Hero Style - Image/Content split
 */
const SplitHero = ({ storeSlug, theme }) => (
  <section className="rounded-3xl overflow-hidden">
    <div className="grid md:grid-cols-2">
      {/* Content Side */}
      <div
        className="px-6 py-12 md:px-10 md:py-16 flex items-center"
        style={{ backgroundColor: theme.primary }}
      >
        <div>
          <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full mb-4">
            SPECIAL OFFER
          </span>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">
            Unlimited Data
            <span className="block text-yellow-400">Endless Possibilities</span>
          </h1>

          <p className="text-white/80 mb-6">
            Get connected with our affordable data bundles. MTN, Telecel & AirtelTigo all available.
          </p>

          <Link
            href={`/shop/${storeSlug}/products`}
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl bg-white text-gray-900 hover:bg-yellow-400 hover:shadow-lg transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Visual Side */}
      <div
        className="px-6 py-12 md:px-10 md:py-16 flex items-center justify-center"
        style={{ backgroundColor: theme.secondary }}
      >
        <div className="grid grid-cols-2 gap-4 text-white">
          {/* Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold">10+</div>
            <div className="text-sm opacity-80">Networks</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold">1K+</div>
            <div className="text-sm opacity-80">Happy Customers</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold">10m</div>
            <div className="text-sm opacity-80">Avg Delivery</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-sm opacity-80">Support</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/**
 * Main HeroSection Component - Renders based on style
 */
export default function HeroSection({ style = 'default', storeSlug, theme }) {
  switch (style) {
    case 'gradient':
      return <GradientHero storeSlug={storeSlug} theme={theme} />;
    case 'minimal':
      return <MinimalHero storeSlug={storeSlug} theme={theme} />;
    case 'wave':
      return <WaveHero storeSlug={storeSlug} theme={theme} />;
    case 'split':
      return <SplitHero storeSlug={storeSlug} theme={theme} />;
    default:
      return <DefaultHero storeSlug={storeSlug} theme={theme} />;
  }
}
