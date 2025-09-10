/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
};

export default nextConfig;