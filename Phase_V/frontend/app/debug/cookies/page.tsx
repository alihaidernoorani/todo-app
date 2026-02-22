'use client'

import { useEffect, useState } from 'react'

export default function CookieDebugPage() {
  const [cookies, setCookies] = useState<string>('')
  const [session, setSession] = useState<any>(null)
  const [sessionError, setSessionError] = useState<string>('')

  useEffect(() => {
    // Get all cookies
    setCookies(document.cookie)

    // Fetch session
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(err => setSessionError(err.message))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Cookie & Session Debug</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Browser Cookies</h2>
          <pre className="bg-slate-100 p-4 rounded overflow-x-auto text-sm">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Session API Response</h2>
          {sessionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
              Error: {sessionError}
            </div>
          )}
          <pre className="bg-slate-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Application → Cookies → http://localhost:3000</li>
            <li>Look for cookies named "better-auth.session_token" or similar</li>
            <li>Compare with what's shown above</li>
            <li>Check the server console for [Session API] logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
