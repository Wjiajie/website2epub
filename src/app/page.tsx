import { UrlInput } from '@/components/url-input'
import { FileList } from '@/components/file-list'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Website to EPUB Converter</h1>
        <div className="space-y-8">
          <UrlInput />
          <FileList />
        </div>
      </div>
    </main>
  )
}
