import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Meridian ships ESM with explicit .js specifiers and no runtime deps, so it
  // needs no transpilation. Listed here only so a per-component import graph
  // is optimised rather than treated as an opaque external.
  experimental: { optimizePackageImports: ['@efolusi/meridian'] },
  // nginx used to add these in front of the old app; on the Worker the site sends them.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    // src/lib/contracts keeps the `./api.js` import style of the package it was
    // copied from; the files on disk are .ts.
    webpackConfig.resolve.extensionAlias = {
      ...webpackConfig.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    }
    return webpackConfig
  },
}

if (process.env.NODE_ENV === 'development') initOpenNextCloudflareForDev()

export default config
