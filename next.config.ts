import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // output: 'export',
  experimental: {
    reactCompiler: false,
  },
}

export default withPayload(nextConfig)
