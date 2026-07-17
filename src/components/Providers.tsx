'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '../lib/LanguageContext'
import { AuthProvider } from '../lib/AuthContext'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
