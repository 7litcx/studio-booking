import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { useLanguage } from '../lib/LanguageContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { t, isRtl } = useLanguage()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error(t('login.errorFill'))
      return
    }

    // Direct redirection for demo
    if (email === 'admin@lumiere.com') {
      toast.success(t('login.successAdmin'))
      setTimeout(() => navigate('/admin'), 1000)
    } else {
      toast.success(t('login.successUser'))
      setTimeout(() => navigate('/dashboard'), 1000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{t('login.desc')}</p>
        </div>

        <div className={`glass-card p-8 md:p-10 rounded-3xl border border-border ${isRtl ? 'text-right' : 'text-left'}`}>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('login.email')}</label>
              <Input 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground">{t('login.password')}</label>
                <a href="#" className="text-xs text-primary hover:underline">{t('login.forgot')}</a>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 h-12"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary-velvet h-12 rounded-full flex items-center justify-center gap-2 font-bold shadow-[0_0_40px_rgba(177,18,38,0.3)]">
              {t('login.signInBtn')}
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed">
          {t('login.tipAdmin')}
        </div>
      </div>
    </div>
  )
}
