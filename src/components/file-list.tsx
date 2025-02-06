'use client'

import { useState, useEffect, useCallback } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { cn } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

interface Page {
  id: string
  title: string
  url: string
  content: string
}

export function FileList() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [supabase] = useState(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  const fetchPages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('Error fetching pages:', error)
      setError('加载页面失败')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const formatPageContent = (page: Page) => {
    const cleanContent = page.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')

    return [
      `# ${page.title}`,
      '',
      `> 原始链接：${page.url}`,
      '',
      cleanContent
    ].join('\n')
  }

  const handleExport = async (pagesToExport: Page[]) => {
    try {
      setError('')
      
      if (pagesToExport.length === 0) {
        throw new Error('没有可导出的内容')
      }

      // 准备导出数据
      const content = pagesToExport.map(formatPageContent).join('\n\n---\n\n')
      const title = pagesToExport.length === 1 
        ? pagesToExport[0].title 
        : `网站内容合集 (${pagesToExport.length}个页面)`

      // 创建 Blob 对象
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      
      // 创建下载链接
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.md`
      document.body.appendChild(a)
      a.click()
      
      // 清理
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : '导出失败')
    }
  }

  if (loading) {
    return <div className="text-center">加载中...</div>
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">已抓取的页面</h2>
        {pages.length > 0 && (
          <button
            onClick={() => handleExport(pages)}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            导出全部
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {pages.length === 0 ? (
        <p className="text-muted-foreground text-center">暂无内容</p>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <ContextMenu.Root key={page.id}>
              <ContextMenu.Trigger>
                <div
                  className={cn(
                    "w-full p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <h3 className="font-medium">{page.title}</h3>
                  <p className="text-sm text-muted-foreground">{page.url}</p>
                </div>
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Content
                  className="min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80"
                >
                  <ContextMenu.Item
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onSelect={() => handleExport([page])}
                  >
                    导出为Markdown
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          ))}
        </div>
      )}
    </div>
  )
} 