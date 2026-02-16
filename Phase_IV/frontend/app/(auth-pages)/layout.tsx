import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TaskFlow - Authentication',
  description: 'Sign in or create your TaskFlow account',
}

export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  )
}
