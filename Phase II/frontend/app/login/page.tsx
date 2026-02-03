import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* TaskFlow Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">
            TaskFlow
          </h1>
          <p className="text-slate-600 mt-2">
            Sign in to manage your tasks
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <LoginForm />
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
