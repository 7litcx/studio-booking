'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import Lenis from 'lenis'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Setup smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Handle hash scrolling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        const id = hash.replace('#', '')
        const element = document.getElementById(id)
        if (element) {
          const timer = setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' })
          }, 150)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}
