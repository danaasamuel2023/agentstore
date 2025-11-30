// app/shop/[storeSlug]/layout.jsx - WITH PROXY API
import { Metadata } from 'next';

// For server-side metadata generation, we need to use the direct API
// because the proxy is a client-side route. However, server components
// don't have CORS issues, so direct API works here.
// But if you want consistency, you can use an internal fetch.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop/api/v1';

// Helper function to fetch store data
async function getStoreData(storeSlug) {
  try {
    // For server-side fetching, we can use the direct API (no CORS in server components)
    // Or use absolute URL to your own API proxy
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cheapdata.shop';
    
    // Try proxy first (works in production), fallback to direct API
    let response;
    try {
      response = await fetch(`${baseUrl}/api/proxy/v1/agent-stores/store/${storeSlug}`, {
        next: { revalidate: 3600 }
      });
    } catch {
      // Fallback to direct API for server-side (no CORS issues)
      response = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`, {
        next: { revalidate: 3600 }
      });
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching store data:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  try {
    const data = await getStoreData(params.storeSlug);
    
    if (data?.status === 'success' && data.data) {
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
        
        // Robots
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