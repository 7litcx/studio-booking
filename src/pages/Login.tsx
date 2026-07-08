import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Globe, Sun, Moon } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { useLanguage } from '../lib/LanguageContext'
import { useAuth } from '../lib/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Login() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { t, isRtl, language, setLanguage } = useLanguage()
  const { user, login, signup, loginWithSocial, loading } = useAuth()

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

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, loading, navigate])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || (activeTab === 'signup' && !name)) {
      toast.error(t('login.errorFill'))
      return
    }

    if (activeTab === 'login') {
      const success = await login(email, password)
      if (success) {
        if (email === 'admin@lumiere.com') {
          toast.success(t('login.successAdmin'))
          setTimeout(() => navigate('/admin'), 1000)
        } else {
          toast.success(t('login.successUser'))
          setTimeout(() => navigate('/dashboard'), 1000)
        }
      } else {
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول. يرجى التحقق من البيانات.' : 'Login failed. Please verify credentials.')
      }
    } else {
      const success = await signup(name, email, password)
      if (success) {
        toast.success(t('login.successSignUp'))
        setTimeout(() => navigate('/dashboard'), 1000)
      } else {
        toast.error(t('login.errorUserExists'))
      }
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      await loginWithSocial(provider)
      toast.success(language === 'ar' ? `تم الدخول بواسطة ${provider === 'google' ? 'قوقل' : 'ابل'} بنجاح` : `Logged in via ${provider === 'google' ? 'Google' : 'Apple'} successfully`)
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (error) {
      toast.error('Social auth failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header controls (Language, Theme, Back to Home) */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="text-foreground hover:bg-foreground/5 rounded-full flex items-center gap-2 text-sm font-semibold"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {language === 'ar' ? 'الرئيسية' : 'Home'}
        </Button>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} 
            className="p-2.5 rounded-full hover:bg-foreground/5 transition-colors text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="p-2.5 rounded-full hover:bg-foreground/5 transition-colors text-foreground flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-cinematic"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span>{t('nav.langToggle')}</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 text-center mt-12">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl font-cinematic font-bold text-foreground">
            {activeTab === 'login' ? t('login.title') : t('login.signUpTitle')}
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            {activeTab === 'login' ? t('login.desc') : t('login.signUpDesc')}
          </p>
        </div>

        {/* Auth Box */}
        <div className={`glass-card p-6 md:p-8 rounded-3xl border border-border/80 shadow-xl ${isRtl ? 'text-right' : 'text-left'}`}>
          
          {/* Tab headers */}
          <div className="flex bg-foreground/[0.04] p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login' 
                  ? 'bg-[#ffffff] text-zinc-950 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('login.signInBtn')}
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signup' 
                  ? 'bg-[#ffffff] text-zinc-950 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('login.signUpBtn')}
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('login.fullName')}
                  </label>
                  <Input 
                    type="text" 
                    placeholder={t('login.namePlaceholder')} 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-white/5 dark:bg-black/20 border-border h-11 text-sm rounded-xl focus:border-primary/50"
                    required={activeTab === 'signup'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('login.email')}
              </label>
              <Input 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/5 dark:bg-black/20 border-border h-11 text-sm rounded-xl focus:border-primary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('login.password')}
                </label>
                {activeTab === 'login' && (
                  <a href="#" className="text-xs text-primary hover:underline font-medium">
                    {t('login.forgot')}
                  </a>
                )}
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/5 dark:bg-black/20 border-border h-11 text-sm rounded-xl focus:border-primary/50"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary-velvet text-white h-11 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-primary/20 mt-6 text-sm">
              {activeTab === 'login' ? t('login.signInBtn') : t('login.signUpBtn')}
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-3 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              {t('login.orContinueWith')}
            </span>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 bg-foreground/[0.03] hover:bg-foreground/[0.07] border border-border/80 rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors cursor-pointer text-foreground"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.64 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {t('login.googleBtn')}
            </button>

            {/* Apple */}
            <button
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center gap-2 bg-foreground/[0.03] hover:bg-foreground/[0.07] border border-border/80 rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors cursor-pointer text-foreground"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39z"/>
              </svg>
              {t('login.appleBtn')}
            </button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed">
          {t('login.tipAdmin')}
        </div>
      </div>
    </div>
  )
}
