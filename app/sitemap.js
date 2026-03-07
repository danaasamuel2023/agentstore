const API_BASE = 'https://api.datamartgh.shop';
// 3 URLs per store, so 15000 stores = 45000 URLs (under 50k limit)
const STORES_PER_SITEMAP = 15000;

async function fetchAllSlugs() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent-stores/stores/public/all-slugs`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data.status === 'success' && data.data) {
      return data.data;
    }
  } catch (error) {
    console.error('Sitemap: Failed to fetch stores', error);
  }
  return [];
}

export async function generateSitemaps() {
  const stores = await fetchAllSlugs();
  const count = Math.max(1, Math.ceil(stores.length / STORES_PER_SITEMAP));
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }) {
  const stores = await fetchAllSlugs();
  const start = id * STORES_PER_SITEMAP;
  const chunk = stores.slice(start, start + STORES_PER_SITEMAP);

  const urls = [];

  // Static page only in the first sitemap
  if (id === 0) {
    urls.push({
      url: 'https://www.cheapdata.shop',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  for (const store of chunk) {
    const lastModified = store.updatedAt ? new Date(store.updatedAt) : new Date();
    urls.push(
      {
        url: `https://www.cheapdata.shop/shop/${store.slug}`,
        lastModified,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `https://www.cheapdata.shop/shop/${store.slug}/products`,
        lastModified,
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `https://www.cheapdata.shop/shop/${store.slug}/about`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    );
  }

  return urls;
}
