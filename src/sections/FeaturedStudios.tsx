import { motion } from 'framer-motion'
import { MapPin, Users, Star, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useLanguage } from '../lib/LanguageContext'

const STUDIOS_DATA = [
  {
    id: 1,
    nameKey: "studio.1.name",
    categoryKey: "cat.photography",
    location: "Downtown LA",
    price: 150,
    rating: 4.9,
    capacity: 15,
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
    available: true
  },
  {
    id: 2,
    nameKey: "studio.2.name",
    categoryKey: "cat.video",
    location: "Brooklyn, NY",
    price: 250,
    rating: 5.0,
    capacity: 40,
    image: "https://images.unsplash.com/photo-1603993097397-89c963e325c7?q=80&w=2070&auto=format&fit=crop",
    available: false
  },
  {
    id: 3,
    nameKey: "studio.3.name",
    categoryKey: "cat.podcast",
    location: "Austin, TX",
    price: 85,
    rating: 4.8,
    capacity: 4,
    image: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop",
    available: true
  }
]

export default function FeaturedStudios() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()

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
          {STUDIOS_DATA.map((studio, index) => (
            <motion.div
              key={studio.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Link to={`/studio/${studio.id}`} className="block">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/5] mb-6">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img 
                    src={studio.image} 
                    alt={t(studio.nameKey)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Top badges */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                    <span className="glass px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-black/40 text-white">
                      {t(studio.categoryKey)}
                    </span>
                    {studio.available ? (
                      <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {t('featured.available')}
                      </span>
                    ) : (
                      <span className="glass px-3 py-1.5 rounded-full text-xs font-medium text-white/70 backdrop-blur-md bg-black/40">
                        {t('featured.booked')}
                      </span>
                    )}
                  </div>

                  {/* Bottom details on hover */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/book/${studio.id}`);
                      }}
                      className="w-full bg-primary hover:bg-primary-velvet text-white rounded-full"
                    >
                      {t('featured.bookNowPrice')
                        .replace('${price}', String(studio.price))
                        .replace('{price}', String(studio.price))}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-cinematic font-bold group-hover:text-primary transition-colors">{t(studio.nameKey)}</h3>
                    <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      {studio.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {studio.location}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {t('featured.capacity').replace('{capacity}', String(studio.capacity))}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
