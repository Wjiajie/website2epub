import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'
import TurndownService from 'turndown'
import { createClient } from '@supabase/supabase-js'
import { URL } from 'url'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import fetch from 'node-fetch'

/* eslint-disable @typescript-eslint/no-unused-vars */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const turndownService = new TurndownService()

// 用于存储已访问的URL
const visitedUrls = new Set<string>()

// 修改类型定义，将 any[] 改为具体类型
interface CrawledPage {
  url: string;
  title: string;
  content: string;
}

// 获取页面内容并转换为Markdown
async function fetchAndConvertPage(url: string) {
  try {
    console.log(`Fetching page: ${url}`)
    
    // 使用 fetch 直接获取页面内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`)
    }

    const html = await response.text()
    console.log(`Page fetched, HTML length: ${html.length}`)

    // 使用 JSDOM 创建 DOM
    const dom = new JSDOM(html, { url })
    const document = dom.window.document

    // 使用 Readability 解析内容
    const reader = new Readability(document)
    const article = reader.parse()

    if (!article) {
      throw new Error('Failed to parse article content')
    }

    // 使用 cheerio 清理内容
    const $ = cheerio.load(article.content)
    
    // 移除不需要的元素
    $('script, style, iframe, noscript').remove()
    
    // 转换为 Markdown
    const markdown = turndownService.turndown($.html())
      .replace(/\n{3,}/g, '\n\n') // 移除多余的空行
      .trim()
    
    console.log(`Markdown content length: ${markdown.length}`)
    
    return {
      url,
      title: article.title || url.split('/').pop() || 'Untitled Page',
      content: markdown,
      links: [] // 暂时不抓取链接
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  }
}

// 查找页面中的所有链接
function findLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  try {
    const urlObj = new URL(baseUrl)
    const domain = urlObj.hostname
    const links = new Set<string>()

    $('a').each((_, element) => {
      const href = $(element).attr('href')
      if (!href) return

      try {
        const absoluteUrl = new URL(href, baseUrl)
        // 只收集同域名的链接
        if (absoluteUrl.hostname === domain && !visitedUrls.has(absoluteUrl.href)) {
          links.add(absoluteUrl.href)
        }
      } catch (error) {
        console.warn(`Invalid URL: ${href}`)
      }
    })

    const linkArray = Array.from(links)
    console.log(`Found ${linkArray.length} links on page ${baseUrl}`)
    return linkArray
  } catch (error) {
    console.error(`Error finding links on ${baseUrl}:`, error)
    return []
  }
}

// 递归抓取页面
async function crawlPages(startUrl: string, maxPages = 20): Promise<CrawledPage[]> {
  console.log(`Starting crawl from ${startUrl}`)
  const pages: CrawledPage[] = []
  const queue = [startUrl]
  visitedUrls.clear() // 清除之前的记录

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()
    if (!url || visitedUrls.has(url)) continue

    console.log(`Processing URL (${pages.length + 1}/${maxPages}): ${url}`)
    visitedUrls.add(url)
    const page = await fetchAndConvertPage(url)
    
    if (page) {
      // 只保留有意义的内容
      if (page.content.trim().length > 100) {
        pages.push({
          url: page.url,
          title: page.title,
          content: page.content
        })
      }

      // 将新的链接添加到队列
      if (page.links && page.links.length > 0) {
        queue.push(...page.links.slice(0, maxPages))
        console.log(`Queue size after adding new links: ${queue.length}`)
      }
    }
  }

  console.log(`Crawl completed. Total pages: ${pages.length}`)
  return pages
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    console.log('Received crawl request')
    console.log('Starting crawl for URL:', url)

    // 抓取页面
    const response = await fetch(url)
    const html = await response.text()
    console.log('Page fetched, HTML length:', html.length)

    // 解析 HTML
    const $ = cheerio.load(html)
    const title = $('title').text()
    
    // 获取主要内容
    const content = turndownService.turndown($('main').html() || '')
    console.log('Markdown content length:', content.length)

    // 只返回解析后的数据，不保存到数据库
    return Response.json({
      title,
      url,
      content
    })
  } catch (error) {
    console.error('Error in crawl:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '抓取失败' },
      { status: 500 }
    )
  }
} 