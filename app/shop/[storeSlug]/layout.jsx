import StoreLayoutClient from './StoreLayoutClient';

const API_BASE = 'https://api.datamartgh.shop';

// Fetch store data server-side for SEO metadata
async function getStoreData(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent-stores/store/${storeSlug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await res.json();
    if (data.status === 'success') return data.data;
    return null;
  } catch {
    return null;
  }
}

// Dynamic SEO metadata for each store
export async function generateMetadata({ params }) {
  const { storeSlug } = await params;
  const store = await getStoreData(storeSlug);

  if (!store) {
    return {
      title: 'Store Not Found',
      description: 'This store does not exist or has been removed.',
    };
  }

  const storeName = store.storeName || storeSlug;
  const description = store.storeDescription ||
    `Buy affordable MTN, Telecel, and AirtelTigo data bundles from ${storeName}. Fast delivery, best prices, secure payment.`;
  const storeUrl = `https://www.cheapdata.shop/shop/${storeSlug}`;

  return {
    title: `${storeName} - Buy Affordable Data Bundles`,
    description,
    keywords: [
      storeName,
      'buy data Ghana',
      'cheap data bundles',
      'MTN data',
      'Telecel data',
      'AirtelTigo data',
      'mobile data Ghana',
      `${storeName} data`,
    ],
    alternates: {
      canonical: storeUrl,
    },
    openGraph: {
      title: `${storeName} - Buy Affordable Data Bundles`,
      description,
      url: storeUrl,
      siteName: storeName,
      type: 'website',
      locale: 'en_GH',
      ...(store.storeLogo && {
        images: [
          {
            url: store.storeLogo,
            width: 200,
            height: 200,
            alt: storeName,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${storeName} - Buy Affordable Data Bundles`,
      description,
      ...(store.storeLogo && { images: [store.storeLogo] }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function StoreLayout({ children, params }) {
  const { storeSlug } = await params;
  const store = await getStoreData(storeSlug);

  // JSON-LD structured data for search engines
  const jsonLd = store ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: store.storeName,
    description: store.storeDescription || `Buy affordable data bundles from ${store.storeName}`,
    url: `https://www.cheapdata.shop/shop/${storeSlug}`,
    ...(store.storeLogo && { logo: store.storeLogo, image: store.storeLogo }),
    ...(store.contactInfo?.phoneNumber && { telephone: store.contactInfo.phoneNumber }),
    ...(store.contactInfo?.email && { email: store.contactInfo.email }),
    ...(store.contactInfo?.address?.city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: store.contactInfo.address.city,
        addressRegion: store.contactInfo.address.region || 'Ghana',
        addressCountry: 'GH',
      },
    }),
    priceRange: 'GH₵1 - GH₵500',
    currenciesAccepted: 'GHS',
    paymentAccepted: 'Mobile Money',
    ...(store.metrics?.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: store.metrics.rating,
        reviewCount: store.metrics.totalReviews || 1,
      },
    }),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <StoreLayoutClient>{children}</StoreLayoutClient>
    </>
  );
}
