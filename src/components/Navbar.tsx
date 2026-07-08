import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X, Sun, Moon, Globe } from 'lucide-react'
import { Button } from './ui/button'
import { useLanguage } from '../lib/LanguageContext'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string, closeMobileMenu = false) => {
    e.preventDefault()
    if (closeMobileMenu) {
      setIsMobileMenuOpen(false)
    }
    if (pathname === '/') {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      window.history.pushState(null, '', `/#${id}`)
    } else {
      navigate(`/#${id}`)
    }
  }
  
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between md:justify-between justify-end">
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { name: t('nav.studios'), id: 'studios' },
            { name: t('nav.equipment'), id: 'equipment' },
            { name: t('nav.pricing'), id: 'pricing' },
            { name: t('nav.faq'), id: 'faq' }
          ].map((item) => (
            <Link
              key={item.id}
              to={`/#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id)}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-foreground/5 transition-colors text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="p-2 rounded-full hover:bg-foreground/5 transition-colors text-foreground flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-cinematic">{t('nav.langToggle')}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                className="text-sm font-semibold hover:text-primary transition-colors px-2 text-foreground font-cinematic"
              >
                {user.role === 'admin' ? t('login.adminPanel') : t('login.dashboard')}
              </Link>
              <button 
                onClick={logout} 
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors px-2 cursor-pointer font-cinematic"
              >
                {t('login.signOut')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors px-2">
              {t('nav.signIn')}
            </Link>
          )}
          <Button className="bg-primary hover:bg-primary-velvet text-white rounded-full px-6">
            {t('nav.bookNow')}
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground p-2 rounded-full hover:bg-foreground/5"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-6 flex flex-col gap-6"
        >
          {[
            { name: t('nav.studios'), id: 'studios' },
            { name: t('nav.equipment'), id: 'equipment' },
            { name: t('nav.pricing'), id: 'pricing' },
            { name: t('nav.faq'), id: 'faq' }
          ].map((item) => (
            <Link
              key={item.id}
              to={`/#${item.id}`}
              className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
              onClick={(e) => handleNavClick(e, item.id, true)}
            >
              {item.name}
            </Link>
          ))}
          <div className="h-px w-full bg-border" />
          
          {/* Theme Row */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-foreground/80">{t('nav.theme')}</span>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-foreground/5 transition-colors text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Language Row */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-foreground/80">اللغة / Language</span>
            <button 
              onClick={() => {
                setLanguage(language === 'en' ? 'ar' : 'en')
                setIsMobileMenuOpen(false)
              }} 
              className="px-4 py-2 rounded-full border border-border hover:bg-foreground/5 transition-colors text-foreground flex items-center gap-2 text-sm font-semibold font-cinematic"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4 text-primary" />
              {t('nav.langToggle')}
            </button>
          </div>
          
          <div className="h-px w-full bg-border" />
          {user ? (
            <>
              <Link 
                to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                className="text-lg font-semibold hover:text-primary transition-colors font-cinematic" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user.role === 'admin' ? t('login.adminPanel') : t('login.dashboard')}
              </Link>
              <button 
                onClick={() => {
                  logout()
                  setIsMobileMenuOpen(false)
                }} 
                className="text-lg font-medium text-red-500 hover:text-red-600 transition-colors text-left font-cinematic cursor-pointer"
              >
                {t('login.signOut')}
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="text-lg font-medium hover:text-primary transition-colors" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.signIn')}
            </Link>
          )}
          <Button className="bg-primary hover:bg-primary-velvet text-white w-full rounded-full">
            {t('nav.bookNow')}
          </Button>
        </motion.div>
      )}
    </motion.header>
  )
}
