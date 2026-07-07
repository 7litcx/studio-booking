import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Shield, ArrowLeft, Check, Users, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useLanguage } from '../lib/LanguageContext'

const STUDIO_DATA: Record<string, any> = {
  "1": {
    id: "1",
    price: 150,
    rating: 4.9,
    capacity: 15,
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603993097397-89c963e325c7?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop"
    ],
    amenityCount: 5,
    equipmentCount: 4
  },
  "2": {
    id: "2",
    price: 250,
    rating: 5.0,
    capacity: 40,
    images: [
      "https://images.unsplash.com/photo-1603993097397-89c963e325c7?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
    ],
    amenityCount: 5,
    equipmentCount: 3
  },
  "3": {
    id: "3",
    price: 85,
    rating: 4.8,
    capacity: 4,
    images: [
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
    ],
    amenityCount: 4,
    equipmentCount: 3
  }
}

export default function StudioDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  
  const studioId = id || "1"
  const studioInfo = STUDIO_DATA[studioId] || STUDIO_DATA["1"]
  const [activeImage, setActiveImage] = useState(studioInfo.images[0])

  // Generate lists based on the count in info
  const amenities = Array.from({ length: studioInfo.amenityCount }, (_, idx) => 
    t(`studio.${studioId}.amenity.${idx}`)
  )
  const equipment = Array.from({ length: studioInfo.equipmentCount }, (_, idx) => 
    t(`studio.${studioId}.eq.${idx}`)
  )

  return (
    <div className="pt-32 pb-32 min-h-screen bg-background">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group font-medium cursor-pointer"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${language === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
          {t('details.backToExploration')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Gallery Section */}
          <div className="space-y-6">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border">
              <img 
                src={activeImage} 
                alt={t(`studio.${studioId}.name`)} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-4">
              {studioInfo.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-[4/3] w-24 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === img ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            <div>
              <span className="text-primary font-medium tracking-widest text-xs uppercase mb-2 block">
                {t(`studio.${studioId}.category`)}
              </span>
              <h1 className="text-4xl md:text-5xl font-cinematic font-bold mb-4">{t(`studio.${studioId}.name`)}</h1>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  {studioInfo.rating} {t('details.rating')}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {t('featured.capacity').replace('{capacity}', String(studioInfo.capacity))}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {t(`studio.${studioId}.desc`)}
            </p>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-bold font-cinematic mb-4">{t('details.spaceAmenities')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {amenities.map((amenity: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h3 className="text-xl font-bold font-cinematic mb-4">{t('details.includedGear')}</h3>
              <div className="grid grid-cols-1 gap-3">
                {equipment.map((eq: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-xl glass border border-border">
                    <Shield className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm">{eq}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Card */}
            <div className="p-6 rounded-3xl glass border border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-muted-foreground text-sm font-medium">{t('details.hourlyRate')}</span>
                <div className="text-3xl font-cinematic font-bold text-foreground">
                  {language === 'ar' ? (
                    <>
                      {studioInfo.price} دولار <span className="text-lg font-normal text-muted-foreground">{t('details.perHr')}</span>
                    </>
                  ) : (
                    <>
                      ${studioInfo.price} <span className="text-lg font-normal text-muted-foreground">{t('details.perHr')}</span>
                    </>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => navigate(`/book/${studioId}`)}
                className="w-full md:w-auto bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-12 gap-2 font-semibold"
              >
                {t('details.reserveSpace')}
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
