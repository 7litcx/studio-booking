import { motion } from 'framer-motion'
import { Camera, Video, Mic, Component, Smartphone, Building2, Music, Sparkles } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function Categories() {
  const { t } = useLanguage()

  const CATEGORIES = [
    { name: t('cat.photography'), icon: Camera, desc: t('cat.photographyDesc') },
    { name: t('cat.video'), icon: Video, desc: t('cat.videoDesc') },
    { name: t('cat.podcast'), icon: Mic, desc: t('cat.podcastDesc') },
    { name: t('cat.cyclorama'), icon: Component, desc: t('cat.cycloramaDesc') },
    { name: t('cat.content'), icon: Smartphone, desc: t('cat.contentDesc') },
    { name: t('cat.sets'), icon: Building2, desc: t('cat.setsDesc') },
    { name: t('cat.music'), icon: Music, desc: t('cat.musicDesc') },
    { name: t('cat.creative'), icon: Sparkles, desc: t('cat.creativeDesc') },
  ]

  return (
    <section className="py-32 bg-background relative overflow-hidden" id="categories">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-glow/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-cinematic font-bold mb-4">{t('cat.browseTitle')}</h2>
          <p className="text-muted-foreground text-lg">
            {t('cat.browseDesc')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors duration-500 relative z-10 h-full cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-500">
                    <Icon className="w-8 h-8 text-foreground group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.desc}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
