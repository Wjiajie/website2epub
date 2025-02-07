'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { UrlInput } from './url-input'
import { MarkdownContent } from './markdown-content'
import { FolderNameDialog } from './folder-name-dialog'
import { supabase } from '@/lib/supabase/client'

interface Page {
  id: string
  title: string
  url: string
  content: string
  folder: string | null
}

export default function HomePage() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page>()
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [fetchedPages, setFetchedPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  // 从 Supabase 加载所有页面数据
  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('加载页面数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
  }, [])

  const handlePagesUpdate = async (newPages: Page[]) => {
    // 直接更新状态，不需要显示对话框
    setPages(prevPages => [...prevPages, ...newPages])
  }

  const handleFolderSelect = async (folderName: string) => {
    try {
      // 更新数据库中的 folder 字段
      const updatePromises = fetchedPages.map(async (page) => {
        const { error } = await supabase
          .from('pages')
          .update({ folder: folderName })
          .eq('id', page.id)

        if (error) {
          console.error('更新页面失败:', error)
          throw error
        }
      })

      await Promise.all(updatePromises)

      // 重新加载所有页面数据以确保显示最新状态
      await loadPages()
      
      // 清理状态并关闭对话框
      setFetchedPages([])
      setShowFolderDialog(false)
    } catch (error) {
      console.error('更新文件夹失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-600">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        pages={pages}
        onPageSelect={setSelectedPage}
        selectedPageId={selectedPage?.id}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">网页转电子书</h1>
          <UrlInput onPagesUpdate={handlePagesUpdate} />
        </div>
        <div className="flex-1 overflow-auto p-6">
          {selectedPage ? (
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedPage.title}
              </h2>
              <MarkdownContent content={selectedPage.content} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              请从左侧选择要查看的页面
            </div>
          )}
        </div>
      </div>
      <FolderNameDialog
        isOpen={showFolderDialog}
        onClose={() => {
          setShowFolderDialog(false)
          setFetchedPages([])
        }}
        onConfirm={handleFolderSelect}
        pages={fetchedPages}
      />
    </div>
  )
} 