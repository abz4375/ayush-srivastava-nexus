import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'team-up-one.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default withPayload(nextConfig)
