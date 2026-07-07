import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Lightbulb, Mic } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function Equipment() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { t } = useLanguage()

  const EQUIPMENT_CATEGORIES = [
    { id: 'all', name: t('eq.all') },
    { id: 'cameras', name: t('eq.cameras'), icon: Camera },
    { id: 'lighting', name: t('eq.lighting'), icon: Lightbulb },
    { id: 'audio', name: t('eq.audio'), icon: Mic }
  ]

  const EQUIPMENT_ITEMS = [
    {
      id: 1,
      name: t('eq.item.1.name'),
      category: 'cameras',
      price: 150,
      desc: t('eq.item.1.desc'),
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 2,
      name: t('eq.item.2.name'),
      category: 'lighting',
      price: 45,
      desc: t('eq.item.2.desc'),
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 3,
      name: t('eq.item.3.name'),
      category: 'audio',
      price: 15,
      desc: t('eq.item.3.desc'),
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 4,
      name: t('eq.item.4.name'),
      category: 'cameras',
      price: 80,
      desc: t('eq.item.4.desc'),
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 5,
      name: t('eq.item.5.name'),
      category: 'lighting',
      price: 35,
      desc: t('eq.item.5.desc'),
      image: 'https://images.unsplash.com/photo-1520390138845-126468fc7d0a?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 6,
      name: t('eq.item.6.name'),
      category: 'audio',
      price: 25,
      desc: t('eq.item.6.desc'),
      image: 'https://images.unsplash.com/photo-1583244532610-2a234e7c3eca?q=80&w=600&auto=format&fit=crop'
    }
  ]

  const filteredItems = selectedCategory === 'all' 
    ? EQUIPMENT_ITEMS 
    : EQUIPMENT_ITEMS.filter(item => item.category === selectedCategory)

  return (
    <section className="py-32 bg-background relative overflow-hidden" id="equipment">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-glow/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <span className="text-primary font-cinematic uppercase tracking-widest text-sm font-semibold mb-2 block">
              {t('eq.badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-cinematic font-bold">
              {t('eq.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mt-4">
              {t('eq.desc')}
            </p>
          </div>
          
          {/* Category Tabs */}
          <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto bg-foreground/5 p-1.5 rounded-full border border-border flex-nowrap shrink-0">
            {EQUIPMENT_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shrink-0 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(120,28,46,0.4)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                key={item.id}
                className="glass-card rounded-2xl overflow-hidden group hover:border-primary/40 transition-colors duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 z-10 transition-opacity duration-300 group-hover:opacity-20" />
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 right-4 z-20 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold border border-border text-white">
                    ${item.price}/{t('eq.day')}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold font-cinematic mb-2 text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
