import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function Testimonials() {
  const { t } = useLanguage()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const TESTIMONIALS = [
    {
      id: 1,
      quote: t('test.item1Quote'),
      name: t('test.item1Name'),
      role: t('test.item1Role'),
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop"
    },
    {
      id: 2,
      quote: t('test.item2Quote'),
      name: t('test.item2Name'),
      role: t('test.item2Role'),
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop"
    },
    {
      id: 3,
      quote: t('test.item3Quote'),
      name: t('test.item3Name'),
      role: t('test.item3Role'),
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop"
    },
    {
      id: 4,
      quote: t('test.item4Quote'),
      name: t('test.item4Name'),
      role: t('test.item4Role'),
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop"
    }
  ]

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  // Autoplay
  useEffect(() => {
    if (!emblaApi) return
    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [emblaApi])

  return (
    <section className="py-32 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-primary font-cinematic uppercase tracking-widest text-sm font-semibold mb-2 block">
            {t('test.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-cinematic font-bold mb-4">{t('test.title')}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('test.desc')}
          </p>
        </motion.div>
      </div>

      <div className="relative max-w-[100vw] overflow-hidden">
        {/* Gradients to hide edges */}
        <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden md:block" />
        <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden md:block" />
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4 touch-pan-y">
            {TESTIMONIALS.map((testimonial, index) => (
              <div 
                key={testimonial.id} 
                className={`flex-[0_0_85%] md:flex-[0_0_50%] lg:flex-[0_0_35%] min-w-0 pl-4 transition-all duration-500 ${
                  index === selectedIndex ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
                }`}
              >
                <div className="glass-card p-8 md:p-12 rounded-3xl h-full flex flex-col justify-between gap-8 relative">
                  <Quote className="absolute top-8 right-8 w-12 h-12 text-primary/20" />
                  
                  <p className="text-lg md:text-xl text-foreground leading-relaxed relative z-10 font-cinematic italic">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4 mt-8">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-primary">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-3 mt-12">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === selectedIndex 
                  ? 'bg-primary w-8' 
                  : 'bg-foreground/20 hover:bg-foreground/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
