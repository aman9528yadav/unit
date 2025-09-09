
import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production'

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Cache pages and static assets with a Stale While Revalidate strategy.
    // This ensures users get cached content immediately while the app fetches updates in the background.
    {
      urlPattern: ({ request, url }: { request: Request; url: URL }) =>
        // Exclude API routes and internal Next.js requests.
        !url.pathname.startsWith('/api/') &&
        !url.pathname.startsWith('/_next/static/webpack/'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages-and-assets',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
     // Cache Google Fonts stylesheets with a Cache First strategy for performance.
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-stylesheets",
      },
    },
    // Cache Google Fonts webfonts with a long-lived Cache First strategy.
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
  ]
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
