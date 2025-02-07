'use client'

import { useState, useEffect } from 'react'
import { UrlInput } from '@/components/url-input'
import { Sidebar } from '@/components/sidebar'
import { MarkdownContent } from '@/components/markdown-content'
import { createClient } from '@supabase/supabase-js'

interface Page {
  id: string
  title: string
  url: string
  content: string
  folder: string
}

export function HomePage() {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  useEffect(() => {
    async function fetchPages() {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPages(data || [])
      } catch (error) {
        console.error('Error fetching pages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [supabase])

  const handlePageSelect = (page: Page) => {
    setSelectedPage(page)
  }

  const handlePagesUpdate = (newPages: Page[]) => {
    setPages(prevPages => [...newPages, ...prevPages])
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        pages={pages}
        onPageSelect={handlePageSelect}
        selectedPageId={selectedPage?.id}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8">Website to EPUB Converter</h1>
        <UrlInput onPagesUpdate={handlePagesUpdate} />
        
        {selectedPage && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">{selectedPage.title}</h2>
            <div className="prose max-w-none">
              <MarkdownContent content={selectedPage.content} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 