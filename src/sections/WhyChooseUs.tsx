import { motion } from 'framer-motion'
import ReactCountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'
import { useLanguage } from '../lib/LanguageContext'

const CountUp = (ReactCountUp as any).default || ReactCountUp

export default function WhyChooseUs() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  const { t } = useLanguage()

  const STATS = [
    { value: 500, suffix: '+', label: t('why.statBookings') },
    { value: 120, suffix: '+', label: t('why.statStudios') },
    { value: 4.9, suffix: '★', label: t('why.statRating'), decimals: 1 },
    { value: 98, suffix: '%', label: t('why.statSatisfaction') },
  ]

  return (
    <section className="py-32 bg-background relative border-y border-border" id="about">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] grayscale mix-blend-overlay" />
      
      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-cinematic font-bold leading-tight mb-6">
              {t('why.title1')} <br />
              <span className="text-primary italic font-serif">{t('why.title2')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mb-8">
              {t('why.desc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-foreground/5 transition-colors duration-300"
              >
                <div className="text-4xl md:text-5xl font-cinematic font-bold text-foreground mb-2">
                  {inView ? (
                    <CountUp 
                      end={stat.value} 
                      duration={2.5} 
                      decimals={stat.decimals || 0}
                      separator=","
                    />
                  ) : '0'}
                  <span className="text-primary">{stat.suffix}</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground font-cinematic">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
