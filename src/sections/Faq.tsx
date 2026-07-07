import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { t } = useLanguage()

  const FAQS = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1')
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2')
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3')
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4')
    },
    {
      question: t('faq.q5'),
      answer: t('faq.a5')
    }
  ]

  return (
    <section className="py-32 bg-background relative overflow-hidden" id="faq">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <div className="text-center mb-20">
          <span className="text-primary font-cinematic uppercase tracking-widest text-sm font-semibold mb-2 block">
            {t('faq.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-cinematic font-bold">
            {t('faq.title')}
          </h2>
          <p className="text-muted-foreground text-lg mt-4">
            {t('faq.desc')}
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div 
                key={index} 
                className="glass-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:border-primary/20"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-6 px-8 flex items-center justify-between gap-4 text-left font-semibold text-lg text-foreground transition-colors hover:text-primary"
                >
                  <span className="font-cinematic">{faq.question}</span>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center border border-border group">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-primary" />
                     ) : (
                      <Plus className="w-4 h-4 text-foreground group-hover:text-primary" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-8 pb-6 text-muted-foreground text-sm md:text-base leading-relaxed border-t border-border pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
