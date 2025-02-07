import { AuthForm } from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">登录/注册</h1>
      <AuthForm />
    </div>
  )
} 