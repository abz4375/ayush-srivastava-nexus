/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@/payload.config'
import '@payloadcms/next/css'
import { RootPage } from '@payloadcms/next/views'

interface Props {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: Props) {
  return RootPage({
    config,
    importMap: {
      baseDir: process.cwd(),
    },
    params,
    searchParams,
  })
}
