import { SignupForm } from '@/components/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - TaskFlow',
  description: 'Create your TaskFlow account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* TaskFlow Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">
            TaskFlow
          </h1>
          <p className="text-slate-600 mt-2">
            Create your account to get started
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <SignupForm />
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
