import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录',
  description: '用户登录页面',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
} 