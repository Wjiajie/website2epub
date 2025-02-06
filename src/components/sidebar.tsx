'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Page {
  id: string
  title: string
  url: string
  content: string
  folder: string
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

  return (
    <div className="w-64 h-full bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">页面列表</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(folderStructure).map(([folder, folderPages]) => (
          <div key={folder} className="mb-2">
            <button
              onClick={() => toggleFolder(folder)}
              className="flex items-center w-full p-2 hover:bg-accent rounded-lg text-sm"
            >
              {expandedFolders.has(folder) ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <Folder className="w-4 h-4 mr-2" />
              <span>{folder}</span>
              <span className="ml-auto text-xs text-muted-foreground">
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
                      "w-full p-2 text-left text-sm rounded-lg hover:bg-accent",
                      selectedPageId === page.id && "bg-accent"
                    )}
                  >
                    {page.title}
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