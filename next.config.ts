import type { NextConfig } from 'next'

// Static export only. Server Actions, intercepting routes, middleware,
// runtime headers/redirects/rewrites, and i18n config are all incompatible
// and are deliberately absent. See spec section 5.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typedRoutes: true,
}

export default nextConfig
