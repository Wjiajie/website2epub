import { PaymentForm } from '@/components/payment/PaymentForm'

export default function PaymentPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">支付页面</h1>
      <PaymentForm amount={9.99} />
    </div>
  )
}