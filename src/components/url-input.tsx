'use client'

import { useState, useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface Page {
  id: string
  title: string
  url: string
  content: string
  folder: string
}

interface UrlInputProps {
  onPagesUpdate: (pages: Page[]) => void
}

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (folderName: string) => void
  pages: Page[]
}

function FolderNameDialog({ isOpen, onClose, onConfirm, pages }: DialogProps) {
  const [folderName, setFolderName] = useState('')
  const [existingFolders, setExistingFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [isNewFolder, setIsNewFolder] = useState(true)
  const [supabase] = useState(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  useEffect(() => {
    async function fetchFolders() {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('folder')
          .not('folder', 'is', null)
          .order('folder')

        if (error) throw error

        // 提取唯一的文件夹名称
        const uniqueFolders = Array.from(new Set(data.map(item => item.folder))).filter(Boolean)
        setExistingFolders(uniqueFolders as string[])
      } catch (error) {
        console.error('Error fetching folders:', error)
      }
    }

    if (isOpen) {
      fetchFolders()
      setFolderName('')
      setSelectedFolder('')
      setIsNewFolder(true)
    }
  }, [isOpen, supabase])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg w-[480px] space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">为抓取的页面选择文件夹</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          <p>成功抓取 {pages.length} 个页面：</p>
          <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
            {pages.map(page => (
              <li key={page.id} className="truncate text-muted-foreground">
                {page.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setIsNewFolder(true)}
              className={`px-4 py-2 rounded-md ${
                isNewFolder ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
            >
              新建文件夹
            </button>
            <button
              onClick={() => setIsNewFolder(false)}
              className={`px-4 py-2 rounded-md ${
                !isNewFolder ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
            >
              选择已有文件夹
            </button>
          </div>

          {isNewFolder ? (
            <div className="space-y-2">
              <label htmlFor="folderName" className="text-sm font-medium">
                新文件夹名称
              </label>
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="请输入文件夹名称..."
                className="w-full px-3 py-2 border rounded-md"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="existingFolder" className="text-sm font-medium">
                选择文件夹
              </label>
              <select
                id="existingFolder"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">请选择文件夹...</option>
                {existingFolders.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            取消
          </button>
          <button
            onClick={() => {
              const finalFolder = isNewFolder ? folderName.trim() : selectedFolder
              if (finalFolder) {
                onConfirm(finalFolder)
              }
            }}
            disabled={isNewFolder ? !folderName.trim() : !selectedFolder}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

export function UrlInput({ onPagesUpdate }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [newPages, setNewPages] = useState<Page[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '抓取失败')
      }

      const pages = await response.json()
      setNewPages(pages)
      setShowDialog(true)
      setUrl('')
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderNameConfirm = async (folderName: string) => {
    try {
      // 更新数据库中的 folder 字段
      await Promise.all(newPages.map(async (page: Page) => {
        await fetch('/api/pages', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: page.id,
            folder: folderName 
          }),
        })
      }))

      // 更新页面状态
      const pagesWithFolder = newPages.map(page => ({
        ...page,
        folder: folderName
      }))
      onPagesUpdate(pagesWithFolder)
      setShowDialog(false)
      setNewPages([])
    } catch (error) {
      console.error('Error updating folder:', error)
      setError('更新文件夹名称失败')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网站URL..."
            className="flex-1 px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '开始抓取'
            )}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </form>

      <FolderNameDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleFolderNameConfirm}
        pages={newPages}
      />
    </>
  )
} 