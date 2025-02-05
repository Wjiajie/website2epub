import { NextResponse } from 'next/server'
import Epub from 'epub-gen-memory'

interface EpubOptions {
  title: string
  author: string
  content: Array<{
    title: string
    data: string
  }>
  appendChapterTitles: boolean
  tocTitle: string
  css?: string
}

export async function POST(request: Request) {
  try {
    const { file } = await request.json()
    
    // 确保至少有一些内容
    if (!file?.content) {
      throw new Error('No content provided')
    }

    // 创建 EPUB 选项
    const options: EpubOptions = {
      title: file.name || 'Website Content',
      author: 'Website to EPUB Converter',
      content: [{
        title: file.name || 'Content',
        data: file.content
      }],
      appendChapterTitles: false,
      tocTitle: '目录',
      css: `
        body {
          font-family: "Noto Serif", "Noto Serif CJK SC", serif;
          line-height: 1.6;
          padding: 20px;
        }
        h1 { font-size: 2em; margin: 1em 0; }
        h2 { font-size: 1.5em; margin: 0.83em 0; }
        h3 { font-size: 1.17em; margin: 0.83em 0; }
        p { margin: 1em 0; }
        blockquote {
          margin: 1em 0;
          padding: 0.5em 1em;
          border-left: 4px solid #ddd;
          color: #666;
          background: #f9f9f9;
        }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code { 
          background: #f6f8fa; 
          padding: 0.2em 0.4em; 
          border-radius: 3px;
          font-family: Consolas, Monaco, 'Andale Mono', monospace;
        }
        pre {
          background: #f6f8fa;
          padding: 1em;
          border-radius: 3px;
          overflow-x: auto;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em auto;
        }
      `
    }

    console.log('Creating EPUB with options:', {
      title: options.title,
      contentLength: options.content[0].data.length
    })

    // 创建 EPUB
    const epub = new Epub(options)
    const epubContent = await epub.promise

    return new NextResponse(epubContent, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(options.title)}.epub"`,
      },
    })
  } catch (error) {
    console.error('Error generating EPUB:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate EPUB' },
      { status: 500 }
    )
  }
} 