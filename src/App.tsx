import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import Lenis from 'lenis'

import Layout from './layouts/Layout'
import Home from './pages/Home'
import StudioDetails from './pages/StudioDetails'
import Booking from './pages/Booking'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Login from './pages/Login'

function App() {
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

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="studio/:id" element={<StudioDetails />} />
          <Route path="book/:id" element={<Booking />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
      <Toaster theme="dark" position="bottom-right" />
    </>
  )
}

export default App
