'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const components: Components = {
    // 自定义链接样式
    a: (props) => (
      <a {...props} className="text-blue-500 hover:text-blue-700" target="_blank" rel="noopener noreferrer" />
    ),
    // 自定义代码块样式
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      return (
        <code
          {...props}
          className={match ? `bg-gray-100 p-4 rounded block` : `bg-gray-100 rounded px-1 inline`}
        >
          {children}
        </code>
      )
    },
    // 自定义标题样式
    h1: (props) => (
      <h1 {...props} className="text-3xl font-bold mt-8 mb-4" />
    ),
    h2: (props) => (
      <h2 {...props} className="text-2xl font-bold mt-6 mb-3" />
    ),
    h3: (props) => (
      <h3 {...props} className="text-xl font-bold mt-4 mb-2" />
    ),
  }

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}