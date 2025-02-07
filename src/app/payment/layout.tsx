import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '支付页面',
  description: '网站转电子书支付页面',
}

export default function PaymentLayout({
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