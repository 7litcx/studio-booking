import { motion } from 'framer-motion'
import { LayoutGrid, CalendarRange, KeyRound } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function HowItWorks() {
  const { t } = useLanguage()

  const STEPS = [
    {
      num: '01',
      title: t('how.step1Title'),
      icon: LayoutGrid,
      desc: t('how.step1Desc')
    },
    {
      num: '02',
      title: t('how.step2Title'),
      icon: CalendarRange,
      desc: t('how.step2Desc')
    },
    {
      num: '03',
      title: t('how.step3Title'),
      icon: KeyRound,
      desc: t('how.step3Desc')
    }
  ]

  return (
    <section className="py-32 bg-background relative overflow-hidden border-t border-border">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-24">
          <span className="text-primary font-cinematic uppercase tracking-widest text-sm font-semibold mb-2 block">
            {t('how.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-cinematic font-bold">
            {t('how.title')}
          </h2>
          <p className="text-muted-foreground text-lg mt-4">
            {t('how.desc')}
          </p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 blur-[1px]" />
          </div>

          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                {/* Icon wrapper */}
                <div className="w-28 h-28 relative mb-8 flex items-center justify-center">
                  {/* Glow Backdrop */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500 scale-90 group-hover:scale-110" />
                  
                  {/* Outer circle */}
                  <div className="absolute inset-0 rounded-full border border-border bg-card/40 backdrop-blur-md flex items-center justify-center transition-all duration-500 group-hover:border-primary/50 group-hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.05)] group-hover:shadow-[0_12px_40px_rgba(120,28,46,0.15)]">
                    {/* Inner circle */}
                    <div className="w-20 h-20 rounded-full bg-background border border-border flex items-center justify-center transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5">
                      <Icon className="w-8 h-8 text-primary transition-all duration-500 group-hover:scale-110 filter drop-shadow-[0_2px_6px_rgba(120,28,46,0.3)]" />
                    </div>
                  </div>

                  {/* Step Number Badge */}
                  <span className="absolute top-0 right-0 text-xs font-bold font-cinematic text-white bg-primary shadow-[0_2px_10px_rgba(120,28,46,0.3)] rounded-full w-6 h-6 flex items-center justify-center z-20">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-2xl font-bold font-cinematic text-foreground mb-4 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm">
                  {step.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
