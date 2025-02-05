import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website to EPUB Converter',
  description: '将网站内容转换为EPUB电子书',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
}
