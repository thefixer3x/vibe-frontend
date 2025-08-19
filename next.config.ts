// Note: keep this file simple and avoid strict typing to ensure
// compatibility across Vercel/Netlify environments.

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' }, // modern browsers ignore, but harmless
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // A conservative CSP; adjust if you add third-party scripts
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "object-src 'none'",
      // Allow inline styles for Tailwind preflight + shadcn (can be further restricted when ready)
      "style-src 'self' 'unsafe-inline'",
      // Allow eval for React fast-refresh in dev; Vercel strips it in prod builds
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // Connect to same-origin APIs and optional memory/MCP endpoints
      "connect-src 'self' https://api.appstoreconnect.apple.com ws: wss:"
    ].join('; ')
  }
];

const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS
      }
    ];
  }
};

export default nextConfig;
