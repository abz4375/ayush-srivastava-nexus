/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@/payload.config'
import '@payloadcms/next/css'
import { RootLayout } from '@payloadcms/next/layouts'
import { ReactNode } from 'react'
import { importMap } from './admin/importMap.js'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return RootLayout({
    config,
    importMap,
    children,
    serverFunction: {} as any,
  })
}
