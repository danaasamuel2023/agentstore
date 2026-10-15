import AboutPageClient from './AboutPageClient';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

async function getStoreData(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`, {
      next: { revalidate: 60 }
    });
    const data = await res.json();
    if (data.status === 'success') return data.data;
    return null;
  } catch {
    return null;
  }
}

export default async function AboutPage({ params }) {
  const { storeSlug } = await params;
  const store = await getStoreData(storeSlug);

  return <AboutPageClient store={store} />;
}
