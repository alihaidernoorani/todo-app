"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth/better-auth-client'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (options: any) => Promise<any>
  signOut: () => Promise<void>
  signUp: (options: any) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          const userData = session.data.user
          setUser({
            id: userData.id,
            name: userData.name || 'User',
            email: userData.email || '',
            createdAt: userData.createdAt.toString(),
            updatedAt: userData.updatedAt.toString(),
          })
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signIn: authClient.signIn.email,
    signOut: async () => {
      await authClient.signOut()
      setUser(null)
    },
    signUp: authClient.signUp.email,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }