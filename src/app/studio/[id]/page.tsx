"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Shield, ArrowLeft, Check, Users, ArrowRight, Heart } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { useLanguage } from '../../../lib/LanguageContext'
import { getStudios, Studio } from '../../../lib/availability'
import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient'
import { toast } from 'sonner'

interface Review {
  id: string
  studio_id: string
  author_name: string
  rating: number
  comment: string
  created_at: string
}

const DEFAULT_REVIEWS: Record<string, Review[]> = {
  "1": [
    { id: "rev_1", studio_id: "1", author_name: "Sarah M.", rating: 5, comment: "Absolutely stunning setup. The lighting options are world-class, and the crew was helpful.", created_at: "2026-06-15T12:00:00Z" },
    { id: "rev_2", studio_id: "1", author_name: "احمد العتيبي", rating: 4, comment: "تجربة ممتازة والمكان مجهز بالكامل بأحدث الكاميرات والإضاءة. سأعود بالتأكيد.", created_at: "2026-06-20T14:30:00Z" }
  ],
  "2": [
    { id: "rev_3", studio_id: "2", author_name: "David K.", rating: 5, comment: "Perfect acoustics. Recorded our season finale podcast here and the sound quality is crisp.", created_at: "2026-07-01T09:15:00Z" }
  ],
  "3": [
    { id: "rev_4", studio_id: "3", author_name: "ليلى حسن", rating: 5, comment: "مكان رائع لتصوير الفيديوهات الإعلانية. الديكورات راقية جداً والخدمة ممتازة.", created_at: "2026-07-05T16:45:00Z" }
  ]
}

export default function StudioDetails() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const studioId = id || "1"
  
  const [studioInfo, setStudioInfo] = useState<Studio | null>(null)
  const [activeImage, setActiveImage] = useState("")
  
  // Favorites and Reviews state
  const [isFavorited, setIsFavorited] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  
  // Form state
  const [newAuthor, setNewAuthor] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Generate visitor ID to identify user anonymous favorites/actions
  const getVisitorId = () => {
    if (typeof window === 'undefined') return 'server'
    let vid = localStorage.getItem('booking_visitor_id')
    if (!vid) {
      vid = 'vis_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('booking_visitor_id', vid)
    }
    return vid
  }

  // Translations helper
  const tr = {
    en: {
      reviewsTitle: "User Reviews & Ratings",
      noReviews: "No reviews yet. Be the first to share your experience!",
      addReview: "Write a Review",
      yourName: "Your Name",
      yourNamePlaceholder: "e.g. John Doe",
      ratingStars: "Your Rating",
      commentLabel: "Your Review",
      commentPlaceholder: "Share your experience with this studio space...",
      submitBtn: "Submit Review",
      submitting: "Submitting...",
      favoriteBtnAdded: "Saved to Favorites",
      favoriteBtnAdd: "Add to Favorites",
      ratingsCount: "based on {count} reviews"
    },
    ar: {
      reviewsTitle: "تقييمات وآراء العملاء",
      noReviews: "لا توجد تقييمات بعد. كن أول من يشارك تجربته الإبداعية!",
      addReview: "كتابة تقييم جديد",
      yourName: "اسمك الكريم",
      yourNamePlaceholder: "مثال: محمد أحمد",
      ratingStars: "تقييمك بالنجوم",
      commentLabel: "رأيك وتجربتك بالتفصيل",
      commentPlaceholder: "شاركنا تفاصيل تجربتك الفنية في هذا الاستوديو...",
      submitBtn: "إرسال التقييم",
      submitting: "جاري الإرسال...",
      favoriteBtnAdded: "محفوظ في المفضلة",
      favoriteBtnAdd: "إضافة إلى المفضلة",
      ratingsCount: "بناءً على {count} تقييمات"
    }
  }[language as 'en' | 'ar'] || {
    reviewsTitle: "User Reviews & Ratings",
    noReviews: "No reviews yet. Be the first to share your experience!",
    addReview: "Write a Review",
    yourName: "Your Name",
    yourNamePlaceholder: "e.g. John Doe",
    ratingStars: "Your Rating",
    commentLabel: "Your Review",
    commentPlaceholder: "Share your experience...",
    submitBtn: "Submit Review",
    submitting: "Submitting...",
    favoriteBtnAdded: "Saved to Favorites",
    favoriteBtnAdd: "Add to Favorites",
    ratingsCount: "based on {count} reviews"
  }

  useEffect(() => {
    async function loadStudioAndData() {
      // 1. Fetch Studio details
      let currentStudio: Studio | null = null
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('studios').select('*').eq('id', studioId).single()
          if (data && !error) {
            currentStudio = {
              id: String(data.id),
              name: data.name,
              nameAr: data.name_ar,
              category: data.category,
              categoryAr: data.category_ar,
              desc: data.desc,
              descAr: data.desc_ar,
              price: Number(data.price),
              capacity: Number(data.capacity),
              rating: Number(data.rating || 5.0),
              images: data.images || [],
              amenities: data.amenities || [],
              amenitiesAr: data.amenities_ar || [],
              equipment: data.equipment || [],
              equipmentAr: data.equipment_ar || [],
              location: data.location || '',
              locationAr: data.location_ar || ''
            }
          }
        } catch (e) {
          console.error("Error fetching studio details from Supabase:", e)
        }
      }
      
      if (!currentStudio) {
        const localStudios = getStudios()
        currentStudio = localStudios.find(s => s.id === studioId) || localStudios[0]
      }
      
      setStudioInfo(currentStudio)
      setActiveImage(currentStudio.images[0] || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop")

      // 2. Load Favorite status
      const localFavorites = JSON.parse(localStorage.getItem('saved_studios') || '[]')
      let favorited = localFavorites.includes(studioId)
      
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('favorites')
            .select('*')
            .eq('studio_id', studioId)
            .eq('visitor_id', getVisitorId())
            .limit(1)
          if (data && data.length > 0) {
            favorited = true
          }
        } catch (err) {
          // Table might not exist yet
          console.warn("Could not check favorites table in Supabase:", err)
        }
      }
      setIsFavorited(favorited)

      // 3. Load Reviews
      let loadedReviews: Review[] = []
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false })
            
          if (data && !error) {
            loadedReviews = data.map((r: any) => ({
              id: String(r.id),
              studio_id: String(r.studio_id),
              author_name: r.author_name || 'Anonymous',
              rating: Number(r.rating || 5),
              comment: r.comment || '',
              created_at: r.created_at || new Date().toISOString()
            }))
          }
        } catch (e) {
          console.warn("Could not check reviews table in Supabase:", e)
        }
      }

      // Check localStorage reviews
      const localReviewsStr = localStorage.getItem(`reviews_${studioId}`)
      if (localReviewsStr) {
        const parsed = JSON.parse(localReviewsStr)
        loadedReviews = [...parsed, ...loadedReviews]
      }

      // Default reviews fallback
      if (loadedReviews.length === 0) {
        loadedReviews = DEFAULT_REVIEWS[studioId] || []
      }

      setReviews(loadedReviews)
    }

    loadStudioAndData()
  }, [studioId])

  const handleToggleFavorite = async () => {
    const localFavorites = JSON.parse(localStorage.getItem('saved_studios') || '[]')
    let nextFavorites: string[]
    const nextState = !isFavorited
    
    if (localFavorites.includes(studioId)) {
      nextFavorites = localFavorites.filter((id: string) => id !== studioId)
    } else {
      nextFavorites = [...localFavorites, studioId]
    }
    localStorage.setItem('saved_studios', JSON.stringify(nextFavorites))
    setIsFavorited(nextState)

    // Trigger window event so other components (like Navigation or Dashboard) can update
    window.dispatchEvent(new Event('storage'))

    if (isSupabaseConfigured && supabase) {
      try {
        const vid = getVisitorId()
        if (nextState) {
          await supabase.from('favorites').insert({
            studio_id: studioId,
            visitor_id: vid
          })
        } else {
          await supabase.from('favorites').delete().eq('studio_id', studioId).eq('visitor_id', vid)
        }
      } catch (err) {
        console.warn("Failed to update favorites table in Supabase:", err)
      }
    }

    toast.success(
      nextState 
        ? (language === 'ar' ? 'تم الحفظ في مفضلتك!' : 'Saved to favorites!')
        : (language === 'ar' ? 'تمت الإزالة من المفضلة!' : 'Removed from favorites!')
    )
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAuthor.trim() || !newComment.trim()) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
      return
    }

    setIsSubmittingReview(true)

    const reviewObj: Review = {
      id: 'rev_' + Date.now(),
      studio_id: studioId,
      author_name: newAuthor,
      rating: newRating,
      comment: newComment,
      created_at: new Date().toISOString()
    }

    // Save locally
    const localReviewsStr = localStorage.getItem(`reviews_${studioId}`)
    const localReviews = localReviewsStr ? JSON.parse(localReviewsStr) : []
    const updatedLocal = [reviewObj, ...localReviews]
    localStorage.setItem(`reviews_${studioId}`, JSON.stringify(updatedLocal))

    // Prepend to UI state
    setReviews(prev => [reviewObj, ...prev])

    // Save to Supabase reviews table
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reviews').insert({
          studio_id: studioId,
          author_name: newAuthor,
          rating: newRating,
          comment: newComment
        })
        if (error) {
          console.warn("Failed to insert review in Supabase:", error.message)
          toast.warning(
            language === 'ar'
              ? 'تم الحفظ محلياً. يرجى إعداد جدول المراجعات (reviews) في قاعدة البيانات.'
              : 'Saved locally. Please ensure the reviews table is set up in your database.'
          )
        } else {
          // Try to update the average studio rating in Supabase as well
          const updatedAvg = (
            [reviewObj, ...reviews].reduce((acc, curr) => acc + curr.rating, 0) / 
            ([reviewObj, ...reviews].length)
          ).toFixed(1)
          await supabase.from('studios').update({ rating: Number(updatedAvg) }).eq('id', studioId)
        }
      } catch (err) {
        console.error("Supabase review insert error:", err)
      }
    }

    toast.success(language === 'ar' ? 'تم تقديم تقييمك بنجاح!' : 'Your review was submitted successfully!')
    setNewAuthor('')
    setNewRating(5)
    setNewComment('')
    setIsSubmittingReview(false)
  }

  if (!studioInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate average rating dynamically
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "5.0"

  const amenities = language === 'ar' 
    ? (studioInfo.amenitiesAr && studioInfo.amenitiesAr.length > 0 ? studioInfo.amenitiesAr : studioInfo.amenities)
    : studioInfo.amenities
    
  const equipment = language === 'ar'
    ? (studioInfo.equipmentAr && studioInfo.equipmentAr.length > 0 ? studioInfo.equipmentAr : studioInfo.equipment)
    : studioInfo.equipment

  const studioName = language === 'ar' ? (studioInfo.nameAr || studioInfo.name) : studioInfo.name
  const studioCategory = language === 'ar' ? (studioInfo.categoryAr || studioInfo.category) : studioInfo.category
  const studioDesc = language === 'ar' ? (studioInfo.descAr || studioInfo.desc) : studioInfo.desc
  const studioLocation = language === 'ar' 
    ? (studioInfo.locationAr || studioInfo.location || "وسط البلد") 
    : (studioInfo.location || "Downtown")

  return (
    <div className="pt-32 pb-32 min-h-screen bg-background">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className={`w-fit flex items-center gap-2 px-4 py-2 rounded-full border border-transparent hover:border-zinc-800 hover:bg-zinc-900/50 text-muted-foreground hover:text-white transition-all duration-300 group font-medium cursor-pointer ${
            language === 'ar' ? '-mr-4' : '-ml-4'
          }`}
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
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-2 border-b border-border/40">
              <div>
                <span className="text-primary font-medium tracking-widest text-xs uppercase mb-2 block">
                  {studioCategory}
                </span>
                <h1 className="text-4xl md:text-5xl font-cinematic font-bold mb-4">{studioName}</h1>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    {averageRating} {t('details.rating')} <span className="text-muted-foreground font-normal">({tr.ratingsCount.replace('{count}', String(reviews.length))})</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {t('featured.capacity').replace('{capacity}', String(studioInfo.capacity || 10))}
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 transform active:scale-95 cursor-pointer text-sm font-bold shadow-lg shrink-0 ${
                  isFavorited
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    : 'bg-primary border-primary text-white hover:bg-primary-velvet shadow-primary/10'
                }`}
              >
                <Heart className={`w-4 h-4 transition-colors duration-300 ${isFavorited ? 'fill-primary text-primary' : 'text-white'}`} />
                {isFavorited ? tr.favoriteBtnAdded : tr.favoriteBtnAdd}
              </button>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {studioDesc}
            </p>

            {/* Location Section */}
            <div className="p-4 rounded-2xl glass border border-border/80 flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Star className="w-5 h-5 fill-primary" />
              </span>
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">{t('details.location')}</span>
                <span className="text-sm font-bold text-foreground">{studioLocation}</span>
              </div>
            </div>

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
                      {studioInfo.price} ر.س <span className="text-lg font-normal text-muted-foreground">{t('details.perHr')}</span>
                    </>
                  ) : (
                    <>
                      {studioInfo.price} SAR <span className="text-lg font-normal text-muted-foreground">{t('details.perHr')}</span>
                    </>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => router.push(`/book/${studioId}`)}
                className="w-full md:w-auto bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-12 gap-2 font-semibold"
              >
                {t('details.reserveSpace')}
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 pt-16 border-t border-border/60">
          <h2 className="text-3xl font-cinematic font-bold mb-12 flex items-center gap-3">
            <Star className="w-8 h-8 text-primary fill-primary" />
            {tr.reviewsTitle}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Submit Review Form */}
            <div className="lg:col-span-1 p-8 rounded-3xl glass border border-border/80 space-y-6 self-start">
              <h3 className="text-xl font-cinematic font-bold text-foreground">{tr.addReview}</h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr.yourName}</label>
                  <input 
                    type="text" 
                    required
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                    placeholder={tr.yourNamePlaceholder}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{tr.ratingStars}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          className={`w-6 h-6 transition-colors ${
                            star <= newRating ? 'text-primary fill-primary' : 'text-zinc-700'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr.commentLabel}</label>
                  <textarea 
                    rows={4}
                    required
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                    placeholder={tr.commentPlaceholder}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-primary hover:bg-primary-velvet text-white rounded-full h-11 font-semibold transition-all duration-300 cursor-pointer shadow-lg shadow-primary/15"
                >
                  {isSubmittingReview ? tr.submitting : tr.submitBtn}
                </Button>
              </form>
            </div>
            
            {/* Reviews list */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border border-dashed border-border text-muted-foreground bg-zinc-900/20">
                  {tr.noReviews}
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-6 rounded-2xl glass border border-border/80 space-y-4 bg-zinc-950/30">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{rev.author_name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rev.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${
                              star <= rev.rating ? 'text-primary fill-primary' : 'text-zinc-700'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
