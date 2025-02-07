'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          className="w-full p-2 border rounded"
        />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-x-4">
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          登录
        </button>
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          注册
        </button>
      </div>
    </form>
  )
} 