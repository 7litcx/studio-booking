import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthContextProps {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  loginWithSocial: (provider: 'google' | 'apple') => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for persistent session
    const storedUser = localStorage.getItem('lumiere_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('lumiere_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    if (email === 'admin@lumiere.com') {
      const adminUser: User = {
        email,
        name: 'Lumière Admin',
        role: 'admin'
      }
      localStorage.setItem('lumiere_user', JSON.stringify(adminUser))
      setUser(adminUser)
      return true
    } else {
      // General user login
      const registeredUsers = JSON.parse(localStorage.getItem('lumiere_registered_users') || '[]')
      const foundUser = registeredUsers.find((u: any) => u.email === email && u.password === password)

      const loggedUser: User = {
        email,
        name: foundUser ? foundUser.name : email.split('@')[0],
        role: 'user'
      }
      localStorage.setItem('lumiere_user', JSON.stringify(loggedUser))
      setUser(loggedUser)
      return true
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Save to local list of registered users
    const registeredUsers = JSON.parse(localStorage.getItem('lumiere_registered_users') || '[]')
    
    // Check if user already exists
    if (registeredUsers.some((u: any) => u.email === email)) {
      return false
    }

    registeredUsers.push({ name, email, password })
    localStorage.setItem('lumiere_registered_users', JSON.stringify(registeredUsers))

    // Automatically log in
    const newUser: User = {
      email,
      name,
      role: email === 'admin@lumiere.com' ? 'admin' : 'user'
    }
    localStorage.setItem('lumiere_user', JSON.stringify(newUser))
    setUser(newUser)
    return true
  }

  const loginWithSocial = async (provider: 'google' | 'apple'): Promise<void> => {
    // Mock social login
    const providerName = provider === 'google' ? 'Google User' : 'Apple User'
    const email = `${provider}_${Math.floor(Math.random() * 1000)}@example.com`
    const socialUser: User = {
      email,
      name: providerName,
      role: 'user'
    }
    localStorage.setItem('lumiere_user', JSON.stringify(socialUser))
    setUser(socialUser)
  }

  const logout = () => {
    localStorage.removeItem('lumiere_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithSocial, logout, loading }}>
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
