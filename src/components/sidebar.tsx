'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Page {
  id: string
  title: string
  url: string
  content: string
  folder: string | null
}

interface FolderStructure {
  [key: string]: Page[]
}

interface SidebarProps {
  pages: Page[]
  onPageSelect: (page: Page) => void
  selectedPageId?: string
}

export function Sidebar({ pages, onPageSelect, selectedPageId }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // 将页面按文件夹分组
  const folderStructure = pages.reduce<FolderStructure>((acc, page) => {
    const folder = page.folder || '未分类'
    if (!acc[folder]) {
      acc[folder] = []
    }
    acc[folder].push(page)
    return acc
  }, {})

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  if (isCollapsed) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-4 bg-white border-r">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          title="展开侧边栏"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-white flex flex-col border-r">
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="font-semibold text-gray-900">页面列表</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          title="收起侧边栏"
        >
          <Menu className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(folderStructure).map(([folder, folderPages]) => (
          <div key={folder} className="mb-2">
            <button
              onClick={() => toggleFolder(folder)}
              className="flex items-center w-full p-2 hover:bg-gray-50 rounded-lg text-sm group transition-colors"
            >
              {expandedFolders.has(folder) ? (
                <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" />
              )}
              <Folder className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <span className="truncate text-gray-700">{folder}</span>
              <span className="ml-auto text-xs text-gray-400 group-hover:text-gray-500">
                {folderPages.length}
              </span>
            </button>
            {expandedFolders.has(folder) && (
              <div className="ml-4 mt-1 space-y-1">
                {folderPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => onPageSelect(page)}
                    className={cn(
                      "w-full p-2 text-left text-sm rounded-lg transition-all",
                      "hover:bg-gray-50 text-gray-600",
                      selectedPageId === page.id && "bg-gray-50 text-gray-900 border"
                    )}
                  >
                    <span className="line-clamp-1">{page.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 