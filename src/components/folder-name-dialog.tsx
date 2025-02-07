'use client'

import { useState, useEffect } from 'react'
import { X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface Page {
  id: string
  title: string
  url: string
  content: string
  folder: string | null
}

interface FolderNameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (folderName: string) => void
  pages: Page[]
}

export function FolderNameDialog({ isOpen, onClose, onConfirm, pages }: FolderNameDialogProps) {
  const [folderName, setFolderName] = useState('')
  const [existingFolders, setExistingFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [isNewFolder, setIsNewFolder] = useState(true)

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
        console.error('获取文件夹列表失败:', error)
      }
    }

    if (isOpen) {
      fetchFolders()
      // 只在对话框打开且是新建文件夹模式时重置输入
      if (isNewFolder) {
        setFolderName('')
      }
    }
  }, [isOpen, isNewFolder])

  // 切换模式时的处理
  const handleModeChange = (newMode: boolean) => {
    setIsNewFolder(newMode)
    // 清除另一个模式的输入
    if (newMode) {
      setSelectedFolder('')
    } else {
      setFolderName('')
    }
  }

  if (!isOpen) return null

  const finalFolder = isNewFolder ? folderName.trim() : selectedFolder
  const isValid = finalFolder !== ''

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">为抓取的页面选择文件夹</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 页面预览 */}
        <div className="px-6 py-4 bg-blue-50/50 border-b">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium">已抓取 {pages.length} 个页面</span>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {pages.map(page => (
              <div key={page.id} className="py-1 text-sm text-gray-600">
                • {page.title}
              </div>
            ))}
          </div>
        </div>

        {/* 文件夹选择区域 */}
        <div className="p-6 space-y-6">
          {/* 选择模式切换 */}
          <div className="flex rounded-lg overflow-hidden border p-1 bg-gray-50">
            <button
              onClick={() => handleModeChange(true)}
              className={cn(
                "flex-1 px-4 py-2 text-sm rounded-md transition-colors",
                isNewFolder
                  ? "bg-white border font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              新建文件夹
            </button>
            <button
              onClick={() => handleModeChange(false)}
              className={cn(
                "flex-1 px-4 py-2 text-sm rounded-md transition-colors",
                !isNewFolder
                  ? "bg-white border font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              选择已有文件夹
            </button>
          </div>

          {/* 文件夹输入/选择 */}
          {isNewFolder ? (
            <div className="space-y-2">
              <label htmlFor="folderName" className="text-sm font-medium text-gray-700">
                新文件夹名称
              </label>
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="请输入文件夹名称..."
                className="w-full px-3 py-2 border rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="existingFolder" className="text-sm font-medium text-gray-700">
                选择文件夹
              </label>
              <select
                id="existingFolder"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* 操作按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => isValid && onConfirm(finalFolder)}
            disabled={!isValid}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              isValid
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
} 