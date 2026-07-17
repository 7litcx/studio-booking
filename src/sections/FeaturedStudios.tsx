'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Users, Star, ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { useLanguage } from '../lib/LanguageContext'
import { getStudios, Studio } from '../lib/availability'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export default function FeaturedStudios() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [studios, setStudios] = useState<Studio[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  const getVisitorId = () => {
    if (typeof window === 'undefined') return 'server'
    let vid = localStorage.getItem('booking_visitor_id')
    if (!vid) {
      vid = 'vis_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('booking_visitor_id', vid)
    }
    return vid
  }

  useEffect(() => {
    async function loadFavorites() {
      const local = localStorage.getItem('saved_studios')
      let favList: string[] = []
      if (local) {
        try {
          favList = JSON.parse(local)
        } catch (e) {}
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('studio_id')
            .eq('visitor_id', getVisitorId())
          if (data && !error) {
            const dbFavs = data.map((f: any) => String(f.studio_id))
            favList = Array.from(new Set([...favList, ...dbFavs]))
            localStorage.setItem('saved_studios', JSON.stringify(favList))
          }
        } catch (err) {
          console.warn("Could not load favorites from database:", err)
        }
      }
      setFavorites(favList)
    }
    loadFavorites()

    // Sync on local storage change
    const syncLocal = () => {
      const stored = localStorage.getItem('saved_studios')
      if (stored) {
        try {
          setFavorites(JSON.parse(stored))
        } catch (e) {}
      }
    }
    window.addEventListener('storage', syncLocal)
    return () => window.removeEventListener('storage', syncLocal)
  }, [])

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    let updated = [...favorites]
    const isAdding = !favorites.includes(id)
    
    if (!isAdding) {
      updated = updated.filter(fid => fid !== id)
    } else {
      updated.push(id)
    }
    setFavorites(updated)
    localStorage.setItem('saved_studios', JSON.stringify(updated))

    // Dispatch storage event to keep other pages in sync
    window.dispatchEvent(new Event('storage'))

    if (isSupabaseConfigured && supabase) {
      try {
        const vid = getVisitorId()
        if (isAdding) {
          await supabase.from('favorites').insert({
            studio_id: id,
            visitor_id: vid
          })
        } else {
          await supabase.from('favorites').delete().eq('studio_id', id).eq('visitor_id', vid)
        }
      } catch (err) {
        console.warn("Failed to sync favorite with database:", err)
      }
    }
  }

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('studios').select('*').order('id', { ascending: true })
          if (data && !error && data.length > 0) {
            const mapped: Studio[] = data.map((s: any) => ({
              id: String(s.id),
              name: s.name,
              nameAr: s.name_ar,
              category: s.category,
              categoryAr: s.category_ar,
              desc: s.desc,
              descAr: s.desc_ar,
              price: Number(s.price),
              capacity: Number(s.capacity),
              rating: Number(s.rating || 5.0),
              images: s.images || [],
              amenities: s.amenities || [],
              amenitiesAr: s.amenities_ar || [],
              equipment: s.equipment || [],
              equipmentAr: s.equipment_ar || [],
              location: s.location || '',
              locationAr: s.location_ar || ''
            }))
            setStudios(mapped)
            return
          }
        } catch (err) {
          console.error('Error loading studios from Supabase:', err)
        }
      }
      setStudios(getStudios())
    }
    load()
  }, [])

  return (
    <section className="py-32 bg-background relative" id="studios">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-cinematic font-bold mb-4">{t('featured.title')}</h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              {t('featured.desc')}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button 
              variant="outline"
              onClick={() => {
                const element = document.getElementById('categories');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group border border-primary/40 hover:border-primary text-foreground hover:bg-primary/5 hover:text-primary transition-all duration-300 rounded-full px-6 py-2.5 font-semibold flex items-center gap-2"
            >
              {t('featured.viewAll')} 
              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studios.map((studio, index) => {
            const studioName = language === 'ar' ? (studio.nameAr || studio.name) : studio.name
            const studioCategory = language === 'ar' ? (studio.categoryAr || studio.category) : studio.category
            const studioImg = studio.images && studio.images[0] ? studio.images[0] : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
            const location = language === 'ar' 
              ? (studio.locationAr || studio.location || "وسط البلد") 
              : (studio.location || "Downtown")
            const isAvailable = index !== 1 // Simulate availability status

            return (
              <motion.div
                key={studio.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative cursor-pointer"
              >
                <Link href={`/studio/${studio.id}`} className="block">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/5] mb-6">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                    <img 
                      src={studioImg} 
                      alt={studioName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Top left badge (Category) */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="glass px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-black/40 text-white">
                        {studioCategory}
                      </span>
                    </div>

                    {/* Bottom details on hover */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                      <span className="w-full bg-primary hover:bg-primary-velvet text-white rounded-full py-2 text-center text-sm font-semibold transition-colors block">
                        {t('featured.bookNowPrice')
                          .replace('${price}', String(studio.price))
                          .replace('{price}', String(studio.price))}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-cinematic font-bold group-hover:text-primary transition-colors">{studioName}</h3>
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        {studio.rating || 5.0}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {location}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {t('featured.capacity').replace('{capacity}', String(studio.capacity || 10))}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Favorite & Availability absolute sibling overlay */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
                  {isAvailable ? (
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {t('featured.available')}
                    </span>
                  ) : (
                    <span className="glass px-3 py-1.5 rounded-full text-xs font-medium text-white/70 backdrop-blur-md bg-black/40">
                      {t('featured.booked')}
                    </span>
                  )}
                  <button
                    onClick={(e) => toggleFavorite(studio.id, e)}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all duration-300 transform active:scale-95 cursor-pointer relative z-40"
                    title="Save Studio"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${favorites.includes(studio.id) ? 'fill-primary text-primary' : 'text-white'}`} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

