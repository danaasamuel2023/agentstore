// app/layout.jsx - Root Layout with Global SEO (UPDATED FOR NEXT.JS CONVENTIONS)
import './globals.css'

export const metadata = {
  metadataBase: new URL('https://www.cheapdata.shop'),
  title: {
    default: 'CheapData Shop - Buy Affordable Data Bundles in Ghana',
    template: '%s | CheapData Shop'
  },
  description: 'Buy affordable MTN, Telecel, and AirtelTigo data bundles in Ghana. Fast delivery in 10-60 minutes, best prices, secure mobile money payment. Save up to 40% on data.',
  keywords: [
    'cheap data Ghana',
    'data bundles Ghana',
    'MTN data',
    'Telecel data',
    'AirtelTigo bundles',
    'mobile data Ghana',
    'buy data online',
    'affordable internet Ghana',
    'Ghana data vendor',
    'mobile money data',
    'Accra data bundles',
    'Kumasi data bundles'
  ],
  authors: [{ name: 'CheapData Shop' }],
  creator: 'CheapData Shop',
  publisher: 'CheapData Shop',
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://www.cheapdata.shop',
    siteName: 'CheapData Shop',
    title: 'CheapData Shop - Buy Affordable Data Bundles in Ghana',
    description: 'Buy affordable MTN, Telecel, and AirtelTigo data bundles in Ghana. Fast delivery, best prices, secure payment.',
    // Next.js will automatically use /opengraph-image.png if it exists
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'CheapData Shop - Buy Affordable Data Bundles in Ghana',
    description: 'Buy affordable MTN, Telecel, and AirtelTigo data bundles. Fast delivery, best prices.',
    creator: '@cheapdatashop',
    // Next.js will automatically use /twitter-image.png if it exists
  },
  
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  
  // Next.js automatically detects these files in /app directory:
  // - favicon.ico
  // - icon.png (or icon.jpg, icon.svg)
  // - apple-icon.png (or apple-icon.jpg)
  // No need to manually specify icons!
  
  manifest: '/manifest.json',
  
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'CheapData',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en-GH">
      <head>
        <link rel="canonical" href="https://www.cheapdata.shop" />
        {/* Preconnect to external domains for better performance */}
        {/* <link rel="preconnect" href="https://api.datamartgh.shop" />
        <link rel="dns-prefetch" href="https://api.datamartgh.shop" /> */}
      </head>
      <body>{children}</body>
    </html>
  )
}