import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Lightbulb, Mic } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '../lib/LanguageContext'
import { getEquipment, EquipmentItem } from '../lib/availability'

const mapCategory = (cat: string) => {
  if (!cat) return 'cameras';
  const c = cat.toLowerCase();
  if (c.includes('camera') || c.includes('lens') || c.includes('عدس') || c.includes('كامير')) return 'cameras';
  if (c.includes('light') || c.includes('grip') || c.includes('إضاء') || c.includes('اضاء')) return 'lighting';
  if (c.includes('audio') || c.includes('sound') || c.includes('mic') || c.includes('صوت')) return 'audio';
  return 'cameras';
}

export default function Equipment() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { t, language } = useLanguage()
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getEquipment()
        // Only show available equipment
        const active = data.filter(item => item.status === 'Available')
        setEquipmentList(active)
      } catch (err) {
        console.error("Failed to load equipment:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const EQUIPMENT_CATEGORIES = [
    { id: 'all', name: t('eq.all') },
    { id: 'cameras', name: t('eq.cameras'), icon: Camera },
    { id: 'lighting', name: t('eq.lighting'), icon: Lightbulb },
    { id: 'audio', name: t('eq.audio'), icon: Mic }
  ]

  const filteredItems = selectedCategory === 'all' 
    ? equipmentList 
    : equipmentList.filter(item => mapCategory(item.category) === selectedCategory)

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
                    alt={language === 'ar' ? (item.nameAr || item.name) : item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 right-4 z-20 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold border border-border text-white">
                    {language === 'ar' ? `${item.price} ر.س / ${t('eq.day')}` : `${item.price} SAR / ${t('eq.day')}`}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold font-cinematic mb-2 text-foreground group-hover:text-primary transition-colors">
                    {language === 'ar' ? (item.nameAr || item.name) : item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {language === 'ar' ? (item.descAr || item.desc) : item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-16 flex justify-center">
          <Link href="/book-equipment">
            <span className="bg-primary hover:bg-primary-velvet text-white rounded-full px-8 py-4 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer inline-block">
              {language === 'ar' ? 'حجز المعدات الآن' : 'Book Equipment Now'}
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
