'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase/client'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function PaymentForm({ amount }: { amount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      const { clientSecret } = await response.json()
      const stripe = await stripePromise

      if (!stripe) throw new Error('Stripe 加载失败')

      const { error: stripeError } = await stripe.confirmPayment({
        elements: {
          clientSecret,
        },
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      })

      if (stripeError) throw stripeError
    } catch (err) {
      setError(err instanceof Error ? err.message : '支付失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xl">支付金额: ${amount}</div>
      {error && <div className="text-red-500">{error}</div>}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? '处理中...' : '支付'}
      </button>
    </div>
  )
} 