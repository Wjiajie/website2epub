import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import TurndownService from 'turndown'
import { createClient } from '@supabase/supabase-js'
import { URL } from 'url'
import puppeteer from 'puppeteer'

/* eslint-disable @typescript-eslint/no-unused-vars */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

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
  let browser
  try {
    console.log(`Fetching page: ${url}`)
    
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    // 创建新页面
    const page = await browser.newPage()
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 800 })
    
    // 导航到URL
    await page.goto(url, {
      waitUntil: 'networkidle0', // 等待网络请求完成
      timeout: 30000 // 30秒超时
    })
    
    // 等待主要内容加载
    await page.waitForSelector('#main-content, main, [role="main"], article, .markdown-section, .content', {
      timeout: 10000
    }).catch(() => console.log('No specific content selector found, proceeding with body content'))
    
    // 额外等待一段时间确保动态内容加载完成
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 获取页面HTML
    const html = await page.content()
    console.log(`Page fetched, HTML length: ${html.length}`)
    
    const $ = cheerio.load(html)
    
    // 移除不需要的元素
    $('script').remove()
    $('style').remove()
    $('iframe').remove()
    $('noscript').remove()
    $('.sidebar').remove()
    $('nav').remove()
    $('header').remove()
    $('footer').remove()
    $('.search').remove()
    
    // 获取主要内容
    let content = ''
    const mainContent = $('#main-content, main, [role="main"], article, .markdown-section, .content')
    
    if (mainContent.length > 0) {
      content = mainContent.html() || ''
    } else {
      // 如果找不到主要内容容器，获取 body 内容
      content = $('body').html() || ''
    }
    
    // 转换为 Markdown
    const markdown = turndown.turndown(content)
      .replace(/\n{3,}/g, '\n\n') // 移除多余的空行
      .trim()
    
    console.log(`Markdown content length: ${markdown.length}`)
    
    // 获取标题
    const title = await page.title() || 'Untitled Page'
    
    return {
      url,
      title,
      content: markdown,
      links: [] // 暂时不抓取链接
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
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

export async function POST(request: Request) {
  try {
    console.log('Received crawl request')
    const { url } = await request.json()
    console.log(`Starting crawl for URL: ${url}`)

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    try {
      new URL(url) // 验证URL格式
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const page = await fetchAndConvertPage(url)
    if (!page) {
      return NextResponse.json(
        { error: 'Failed to extract content from the provided URL' },
        { status: 400 }
      )
    }

    // 只保存单个页面
    console.log(`Saving page to Supabase`)
    const { data, error } = await supabase
      .from('pages')
      .insert([{
        url: page.url,
        title: page.title,
        content: page.content
      }])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Successfully saved to Supabase')
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST handler:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process the URL' },
      { status: 500 }
    )
  }
} 