import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Shield, ArrowLeft, Check, Users, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useLanguage } from '../lib/LanguageContext'
import { getStudios } from '../lib/availability'

export default function StudioDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  
  const studioId = id || "1"
  const studios = getStudios()
  const studioInfo = studios.find(s => s.id === studioId) || studios[0]
  
  const [activeImage, setActiveImage] = useState(studioInfo.images && studioInfo.images[0] ? studioInfo.images[0] : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop")

  // Generate lists based on language
  const amenities = language === 'ar' 
    ? (studioInfo.amenitiesAr && studioInfo.amenitiesAr.length > 0 ? studioInfo.amenitiesAr : studioInfo.amenities)
    : studioInfo.amenities
    
  const equipment = language === 'ar'
    ? (studioInfo.equipmentAr && studioInfo.equipmentAr.length > 0 ? studioInfo.equipmentAr : studioInfo.equipment)
    : studioInfo.equipment

  const studioName = language === 'ar' ? (studioInfo.nameAr || studioInfo.name) : studioInfo.name
  const studioCategory = language === 'ar' ? (studioInfo.categoryAr || studioInfo.category) : studioInfo.category
  const studioDesc = language === 'ar' ? (studioInfo.descAr || studioInfo.desc) : studioInfo.desc

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
                alt={studioName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {studioInfo.images && studioInfo.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-[4/3] w-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
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
                {studioCategory}
              </span>
              <h1 className="text-4xl md:text-5xl font-cinematic font-bold mb-4">{studioName}</h1>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  {studioInfo.rating || 5.0} {t('details.rating')}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {t('featured.capacity').replace('{capacity}', String(studioInfo.capacity || 10))}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {studioDesc}
            </p>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-bold font-cinematic mb-4">{t('details.spaceAmenities')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {amenities && amenities.map((amenity: string, idx: number) => (
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
                {equipment && equipment.map((eq: string, idx: number) => (
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
