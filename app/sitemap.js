const API_BASE = 'https://api.datamartgh.shop';

export default async function sitemap() {
  // Static pages
  const staticPages = [
    {
      url: 'https://www.cheapdata.shop',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Fetch all active store slugs from backend
  let storePages = [];
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent-stores/stores/public/all-slugs`, {
      next: { revalidate: 3600 } // Regenerate sitemap every hour
    });
    const data = await res.json();

    if (data.status === 'success' && data.data) {
      storePages = data.data.flatMap((store) => [
        {
          url: `https://www.cheapdata.shop/shop/${store.slug}`,
          lastModified: store.updatedAt ? new Date(store.updatedAt) : new Date(),
          changeFrequency: 'daily',
          priority: 0.9,
        },
        {
          url: `https://www.cheapdata.shop/shop/${store.slug}/products`,
          lastModified: store.updatedAt ? new Date(store.updatedAt) : new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        },
        {
          url: `https://www.cheapdata.shop/shop/${store.slug}/about`,
          lastModified: store.updatedAt ? new Date(store.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        },
      ]);
    }
  } catch (error) {
    console.error('Sitemap: Failed to fetch stores', error);
  }

  return [...staticPages, ...storePages];
}
