import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '支付成功',
  description: '支付成功页面',
}

export default function PaymentSuccessLayout({
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