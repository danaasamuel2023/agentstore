import HowToBuyClient from './HowToBuyClient';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

async function getStore(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.status === 'success' ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug);
  const name = store?.storeName || 'our shop';
  return {
    title: `How to buy data from ${name}`,
    description: `A one-minute video: pick your network and bundle, pay with Mobile Money, and get your data. No internet? Buy by SMS.`,
    openGraph: { images: ['/videos/how-to-buy.jpg'] },
  };
}

export default async function HowToBuyPage({ params }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug);
  return <HowToBuyClient storeSlug={storeSlug} storeName={store?.storeName || ''} />;
}
