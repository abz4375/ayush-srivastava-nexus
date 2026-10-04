import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

/**
 * `unplugin-typegpu` is required by the ORB shaders in `components/orbs/`.
 *
 * Those shaders are written as TypeScript functions carrying a `'use gpu'`
 * directive, not as `.wgsl` files. Turning them into WGSL means parsing the JS
 * ahead of time, which only the build plugin can do — at runtime `tgpu.resolve()`
 * throws "Missing metadata for tgpu.fn function body".
 *
 * The plugin ships bundler entry points for esbuild, farm, rolldown, rollup,
 * rspack, vite and webpack. There is no Turbopack entry point, and this project
 * runs Turbopack by default, so `dev` and `build` are pinned to `--webpack` in
 * package.json. Re-enabling Turbopack means dropping the orbs.
 *
 * `withPayload` also augments the webpack config, so the two are composed here
 * rather than in separate wrappers.
 */
const nextConfig: NextConfig = {
  reactCompiler: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // Loaded with a static specifier on purpose. A dynamic import here is
    // evaluated while the config is being read, which the plugin cannot survive.
    const typegpu = require('unplugin-typegpu/webpack')
    const plugin = (typegpu.default ?? typegpu)

    config.plugins.push(
      plugin({
        // Only the orb shaders need transforming. Leaving the rest of the app
        // out keeps the plugin off the hot path for every other module.
        include: [/components[\\/]orbs[\\/].*\.[jt]sx?$/],
        // The plugin assigns names and AST metadata automatically; the shader
        // files already name their entry points via `.$name(...)`.
        autoNamingEnabled: true,
      }),
    )

    return config
  },
}

export default withPayload(nextConfig)
