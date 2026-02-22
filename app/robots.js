export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/shop/',
        disallow: '/api/',
      },
    ],
    sitemap: 'https://www.cheapdata.shop/sitemap.xml',
  };
}
