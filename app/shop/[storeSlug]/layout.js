// app/shop/[storeSlug]/layout.jsx
import { Metadata } from 'next';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

export async function generateMetadata({ params }) {
  try {
    const response = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await response.json();
    
    if (data.status === 'success' && data.data) {
      const store = data.data;
      const title = `${store.storeName} - Buy Affordable Data Bundles | MTN, Telecel, AirtelTigo Ghana`;
      const description = store.storeDescription || 
        `Shop affordable data bundles from ${store.storeName}. Fast delivery in 10-60 minutes. Best prices on MTN, Telecel, and AirtelTigo bundles in Ghana. Save up to 40% on your data purchases.`;
      
      const imageUrl = store.storeLogo || store.bannerImage || 'https://www.cheapdata.shop/opengraph-image.png';
      const url = `https://www.cheapdata.shop/shop/${params.storeSlug}`;
      
      return {
        title,
        description,
        keywords: [
          'cheap data Ghana',
          'data bundles Ghana',
          'MTN data bundles',
          'Telecel data Ghana',
          'AirtelTigo bundles',
          store.storeName,
          'affordable internet Ghana',
          'mobile data Ghana',
          'buy data online Ghana',
          'Ghana data vendor',
          'fast data delivery Ghana',
          'mobile money data purchase',
          'Accra data bundles',
          'Kumasi data bundles'
        ].join(', '),
        authors: [{ name: store.storeName }],
        creator: store.storeName,
        publisher: 'CheapData Shop',
        
        // Open Graph
        openGraph: {
          type: 'website',
          locale: 'en_GH',
          url,
          title,
          description,
          siteName: `${store.storeName} | CheapData Shop`,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${store.storeName} - Cheap Data Bundles in Ghana`,
            }
          ],
        },
        
        // Twitter Card
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
          creator: '@cheapdatashop',
        },
        
        // Additional Meta
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
        
        // Canonical URL
        alternates: {
          canonical: url,
        },
        
        // App Links
        other: {
          'mobile-web-app-capable': 'yes',
          'apple-mobile-web-app-capable': 'yes',
          'apple-mobile-web-app-status-bar-style': 'default',
          'format-detection': 'telephone=no',
        },
        
        // Category
        category: 'E-commerce',
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback metadata
  return {
    title: 'Buy Affordable Data Bundles in Ghana | CheapData Shop',
    description: 'Shop affordable MTN, Telecel, and AirtelTigo data bundles in Ghana. Fast delivery, best prices, secure payment. Save up to 40% on data.',
    openGraph: {
      images: ['https://www.cheapdata.shop/opengraph-image.png'],
    },
  };
}

export default function StoreLayout({ children }) {
  return children;
}