import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'

const selectorsToRemove = [
  // 基础干扰元素
  'script', 'style', 'iframe', 
  
  // 导航和页面结构
  'nav:not(article nav)',           // 保留文章内的导航
  'header:not(article header)',     // 保留文章内的标题
  'footer:not(article footer)',     // 保留文章内的页脚
  '[role="banner"]',               // 网站横幅
  '[role="complementary"]',        // 侧边栏
  '[role="navigation"]',           // 导航区域
  
  // 广告和推广
  '.advertisement', '.ad', '.ads', '.adsense',
  '[id*="ad-"]', '[class*="ad-"]',
  '[id*="google"]', '[class*="google"]',
  
  // 社交元素
  '.social-share', '.share-buttons', '.social-media',
  '.follow-us', '.subscribe',
  
  // 用户交互
  '.comments', '.comment-section', '#comments',
  '.reactions', '.rating',
  
  // 相关内容
  '.related-articles', '.recommended', '.suggestions',
  '.more-from', '.similar-posts',
  
  // 弹窗和通知
  '.popup', '.modal', '.overlay',
  '.cookie-notice', '.gdpr',
  '.newsletter-signup', '.subscription',
  
  // 工具栏和控件
  '.toolbar', '.controls',
  '.print-button', '.font-settings',
  
  // 作者和元数据（可选，取决于需求）
  '.author-bio:not(article .author-bio)',
  '.publish-date:not(article .publish-date)',
  
  // 站点特定元素
  '.site-header', '.site-footer',
  '.page-navigation', '.breadcrumbs',
  
  // 动态内容
  '[data-ad]', '[data-analytics]',
  '[data-tracking]', '[data-sponsored]'
] 

function preprocessDocument(document: Document): void {
  // 移除隐藏元素
  document.querySelectorAll('*').forEach(element => {
    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') {
      element.remove()
    }
  })

  // 清理空白节点
  document.querySelectorAll('p, div, span').forEach(element => {
    if (element.textContent?.trim() === '') {
      element.remove()
    }
  })

  // 规范化链接
  document.querySelectorAll('a').forEach(link => {
    if (link.getAttribute('href')?.startsWith('#')) {
      link.remove() // 移除页内锚点链接
    }
  })

  // 清理属性
  document.querySelectorAll('*').forEach(element => {
    const attrsToKeep = ['src', 'href', 'alt', 'title', 'class', 'id']
    Array.from(element.attributes).forEach(attr => {
      if (!attrsToKeep.includes(attr.name)) {
        element.removeAttribute(attr.name)
      }
    })
  })
} 

// 定义 Article 接口来匹配 Readability 的返回类型
interface Article {
  title: string
  content: string
  textContent: string
  length: number
  excerpt: string | null
  byline: string | null
  siteName: string | null
  dir: string | null
}

function validateContent(article: Article): void {
  if (!article.content || article.content.length < 100) {
    throw new Error('提取的内容过短或为空')
  }

  const contentElement = new JSDOM(article.content).window.document.body
  const paragraphs = contentElement.querySelectorAll('p')
  const meaningfulParagraphs = Array.from(paragraphs).filter(p => 
    p.textContent!.trim().length > 20
  )

  if (meaningfulParagraphs.length < 2) {
    throw new Error('提取的内容缺少足够的段落')
  }
} 

interface ExtractedContent {
  title: string
  content: string
  excerpt: string | null
  byline: string | null
  siteName: string | null
  markdown: string
  length: number
  textContent: string
}

// 添加新的预处理函数来处理标题和列表
function preprocessMarkdownStructure(document: Document): void {
  // 处理标题结构
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    // 保留标题的层级信息
    const level = parseInt(heading.tagName[1])
    heading.setAttribute('data-heading-level', level.toString())
  })

  // 处理列表结构
  document.querySelectorAll('ul, ol').forEach(list => {
    // 标记列表类型
    list.setAttribute('data-list-type', list.tagName.toLowerCase())
    // 处理嵌套列表的缩进
    const nestingLevel = getNestingLevel(list)
    list.setAttribute('data-nesting-level', nestingLevel.toString())
  })

  // 处理引用块
  document.querySelectorAll('blockquote').forEach(quote => {
    quote.setAttribute('data-is-quote', 'true')
  })
}

function getNestingLevel(element: Element): number {
  let level = 0
  let parent = element.parentElement
  while (parent) {
    if (parent.matches('ul, ol')) {
      level++
    }
    parent = parent.parentElement
  }
  return level
}

// 扩展 Turndown 的配置
function configureTurndown(): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    bulletListMarker: '-',
    hr: '---',
    linkStyle: 'referenced'
  })

  // 自定义标题处理规则
  turndownService.addRule('headings', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: function(content, node) {
      const element = node as HTMLElement
      const level = element.getAttribute('data-heading-level') || element.tagName[1]
      return `\n${'#'.repeat(parseInt(level))} ${content}\n`
    }
  })

  // 自定义列表处理规则
  turndownService.addRule('lists', {
    filter: ['ul', 'ol'],
    replacement: function(content, node) {
      const element = node as HTMLElement
      const listType = element.getAttribute('data-list-type')
      const nestingLevel = parseInt(element.getAttribute('data-nesting-level') || '0')
      const indent = '  '.repeat(nestingLevel)
      
      return content.split('\n').map(line => {
        if (line.trim()) {
          if (listType === 'ol') {
            return `${indent}1. ${line.trim()}`
          }
          return `${indent}- ${line.trim()}`
        }
        return line
      }).join('\n')
    }
  })

  // 自定义引用块处理规则
  turndownService.addRule('blockquotes', {
    filter: 'blockquote',
    replacement: function(content, node) {
      const element = node as HTMLElement
      if (element.getAttribute('data-is-quote')) {
        return content.split('\n').map(line => 
          line.trim() ? `> ${line}` : ''
        ).join('\n')
      }
      return content
    }
  })

  return turndownService
}

export async function extractContent(html: string, url: string): Promise<ExtractedContent> {
  const dom = new JSDOM(html, { url })
  const document = dom.window.document

  // 预处理文档
  preprocessDocument(document)
  preprocessMarkdownStructure(document)
  
  // 移除干扰元素
  selectorsToRemove.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.remove()
    })
  })

  // 使用 Readability
  const reader = new Readability(document, {
    charThreshold: 100,
    classesToPreserve: [
      'code',
      'prettyprint',
      'highlight',
      'language-*',
      'math',
      'theorem',
      'table',
      'figure',
      'katex',
      'mermaid',
      'markdown-structure'
    ],
    keepClasses: true,
    nbTopCandidates: 5,
    disableJSONLD: true
  })

  const article = reader.parse()
  if (!article) {
    throw new Error('无法提取文章内容')
  }

  validateContent(article)

  // 使用配置好的 Turndown
  const turndownService = configureTurndown()
  const markdown = turndownService.turndown(article.content)

  // 后处理 Markdown，保持列表和标题的格式
  const formattedMarkdown = markdown
    .replace(/\n{3,}/g, '\n\n')     // 将多个空行替换为两个
    .replace(/\n\s+\n/g, '\n\n')    // 清理包含空格的空行
    .replace(/^([^#\n][^\n]+)\n={3,}$/gm, '# $1') // 处理标题下划线样式
    .replace(/^([^#\n][^\n]+)\n-{3,}$/gm, '## $1') // 处理二级标题下划线样式
    .trim()

  return {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    byline: article.byline,
    siteName: article.siteName,
    markdown: formattedMarkdown,
    length: article.length,
    textContent: article.textContent
  }
} 