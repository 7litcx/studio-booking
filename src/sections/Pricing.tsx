import { Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import { useLanguage } from '../lib/LanguageContext'

export default function Pricing() {
  const { t, language } = useLanguage()

  const PLANS = [
    {
      name: t('pricing.plan1Name'),
      price: t('pricing.plan1Price'),
      period: t('pricing.plan1Period'),
      desc: t('pricing.plan1Desc'),
      features: [
        t('pricing.plan1F1'),
        t('pricing.plan1F2'),
        t('pricing.plan1F3'),
        t('pricing.plan1F4'),
        t('pricing.plan1F5')
      ],
      popular: false,
      cta: t('pricing.plan1Cta')
    },
    {
      name: t('pricing.plan2Name'),
      price: t('pricing.plan2Price'),
      period: t('pricing.plan2Period'),
      desc: t('pricing.plan2Desc'),
      features: [
        t('pricing.plan2F1'),
        t('pricing.plan2F2'),
        t('pricing.plan2F3'),
        t('pricing.plan2F4'),
        t('pricing.plan2F5')
      ],
      popular: true,
      cta: t('pricing.plan2Cta')
    },
    {
      name: t('pricing.plan3Name'),
      price: t('pricing.plan3Price'),
      period: t('pricing.plan3Period'),
      desc: t('pricing.plan3Desc'),
      features: [
        t('pricing.plan3F1'),
        t('pricing.plan3F2'),
        t('pricing.plan3F3'),
        t('pricing.plan3F4'),
        t('pricing.plan3F5')
      ],
      popular: false,
      cta: t('pricing.plan3Cta')
    }
  ]

  return (
    <section className="py-32 bg-background relative overflow-hidden" id="pricing">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-primary font-cinematic uppercase tracking-widest text-sm font-semibold mb-2 block">
            {t('pricing.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-cinematic font-bold">
            {t('pricing.title')}
          </h2>
          <p className="text-muted-foreground text-lg mt-4">
            {t('pricing.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`glass-card p-10 rounded-3xl flex flex-col justify-between relative ${
                plan.popular 
                  ? 'border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_50px_rgba(120,28,46,0.15)]' 
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(120,28,46,0.4)]">
                  {t('pricing.popular')}
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-cinematic font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.desc}</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold font-cinematic text-foreground">
                    {language === 'ar' ? `${plan.price} ر.س` : `${plan.price} SAR`}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {plan.period}</span>
                </div>
                
                <div className="h-px bg-border w-full" />
                
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button 
                  className={`w-full h-12 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? 'bg-primary hover:bg-primary-velvet text-white shadow-[0_0_30px_rgba(120,28,46,0.3)]'
                      : 'border border-primary/20 hover:bg-primary/5 text-foreground'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
