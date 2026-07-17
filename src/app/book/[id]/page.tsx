"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, Minus, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { toast } from 'sonner'
import { useLanguage } from '../../../lib/LanguageContext'
import { getStudioAvailability, formatDate, getStudios, createBooking, Studio, getEquipment } from '../../../lib/availability'
import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient'
import { useAuth } from '../../../lib/AuthContext'

const FALLBACK_EQUIPMENT_OPTIONS = [
  { id: 'e80a0a01-0000-0000-0000-000000000101', name: 'RED V-Raptor 8K VV', nameAr: 'كاميرا RED V-Raptor 8K VV', category: 'Cameras & Lenses', categoryAr: 'الكاميرات والعدسات', desc: 'Cinema camera', descAr: 'كاميرا سينمائية', price: 150, image: '', status: 'Available' },
  { id: 'e80a0a02-0000-0000-0000-000000000102', name: 'Aputure LS 600d Pro', nameAr: 'إضاءة Aputure LS 600d Pro', category: 'Lighting & Grip', categoryAr: 'الإضاءة والمعدات المساندة', desc: 'Light', descAr: 'إضاءة', price: 80, image: '', status: 'Available' },
  { id: 'e80a0a03-0000-0000-0000-000000000103', name: 'Shure SM7B Vocal Mic', nameAr: 'ميكروفون Shure SM7B Vocal Mic', category: 'Audio & Sound', categoryAr: 'الصوت والتسجيل', desc: 'Mic', descAr: 'ميكروفون', price: 25, image: '', status: 'Available' }
]

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
}

const WEEKDAY_NAMES = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  ar: ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب']
}

const getTimeSlots = (lang: string) => {
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    for (let min of [0, 30]) {
      if (hour === 22 && min === 30) continue
      const time24 = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      const isPM = hour >= 12
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const period = lang === 'ar' 
        ? (isPM ? 'م' : 'ص') 
        : (isPM ? 'PM' : 'AM')
      const displayHourStr = String(displayHour).padStart(2, '0')
      const minutesStr = String(min).padStart(2, '0')
      slots.push({
        value: time24,
        label: `${displayHourStr}:${minutesStr} ${period}`
      })
    }
  }
  return slots
}

const generateTimeSlots = (startTime: string, durationHours: string): string[] => {
  if (!startTime) return []
  const slots: string[] = []
  const [hourStr, minStr] = startTime.split(':')
  let hour = parseInt(hourStr, 10)
  let min = parseInt(minStr, 10)
  
  const totalHalfHours = Math.round(parseFloat(durationHours) * 2)
  for (let i = 0; i < totalHalfHours; i++) {
    slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    min += 30
    if (min >= 60) {
      min -= 60
      hour += 1
    }
  }
  return slots
}

export default function Booking() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { t, language } = useLanguage()
  const [step, setStep] = useState(1)
  
  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null)

  useEffect(() => {
    async function loadStudio() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('studios').select('*').eq('id', id || '1').single()
          if (data && !error) {
            setCurrentStudio({
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
              equipmentAr: data.equipment_ar || []
            })
            return
          }
        } catch (e) {
          console.error("Error loading studio in booking:", e)
        }
      }
      const localStudios = getStudios()
      setCurrentStudio(localStudios.find(s => s.id === id) || localStudios[0])
    }
    loadStudio()
  }, [id])

  // State for Booking
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('1')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<any[]>(FALLBACK_EQUIPMENT_OPTIONS)

  useEffect(() => {
    async function loadEquipment() {
      try {
        const list = await getEquipment()
        const active = list.filter(item => item.status === 'Available')
        if (active.length > 0) {
          setEquipmentOptions(active)
        }
      } catch (err) {
        console.error("Failed to load equipment:", err)
      }
    }
    loadEquipment()
  }, [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name)
      if (user.email) setEmail(user.email)
      if ((user as any).phone) setPhone((user as any).phone)
    }
  }, [user])

  // Calendar navigation states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

  const availableDates = getStudioAvailability(id || '1')
  const todayStr = formatDate(new Date())

  const isPast = (dateStr: string) => {
    return dateStr < todayStr
  }

  const toggleEquipment = (eqId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(eqId) ? prev.filter(item => item !== eqId) : [...prev, eqId]
    )
  }

  const handleNextStep = () => {
    if (step === 1 && (!date || !time)) {
      toast.error(t('book.errorDateTime'))
      return
    }
    if (step === 2 && selectedEquipment.length === 0) {
      toast.warning(t('book.warnNoEquipment'))
    }
    setStep(prev => prev + 1)
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError('')
    const code = couponCode.trim().toUpperCase()
    if (!code) return

    if (code === 'LUMIERE20') {
      setAppliedCoupon('LUMIERE20')
      setCouponDiscount(20)
      toast.success(language === 'ar' ? 'تم تطبيق كوبون الخصم بنجاح (خصم 20%)!' : 'Coupon applied successfully (20% off)!')
    } else if (code === 'SAVE10') {
      setAppliedCoupon('SAVE10')
      setCouponDiscount(10)
      toast.success(language === 'ar' ? 'تم تطبيق كوبون الخصم بنجاح (خصم 10%)!' : 'Coupon applied successfully (10% off)!')
    } else if (code === 'WELCOME50') {
      setAppliedCoupon('WELCOME50')
      setCouponDiscount(50)
      toast.success(language === 'ar' ? 'تم تطبيق كوبون الخصم بنجاح (خصم 50%)!' : 'Coupon applied successfully (50% off)!')
    } else {
      setCouponError(language === 'ar' ? 'كوبون الخصم غير صالح' : 'Invalid coupon code')
      toast.error(language === 'ar' ? 'كوبون الخصم غير صالح' : 'Invalid coupon code')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone) {
      toast.error(t('book.errorContact'))
      return
    }

    const total = calculateTotal()
    createBooking({
      studio_id: id || '1',
      studio_name: currentStudio?.name || 'Studio Room',
      studio_name_ar: currentStudio?.nameAr || 'غرفة استوديو',
      booking_date: date,
      time_slots: generateTimeSlots(time, duration),
      customer_name: phone ? `${name} | ${phone}` : name,
      customer_email: email,
      total_price: total,
      status: 'Confirmed'
    }).then((success) => {
      if (success) {
        toast.success(t('book.successMessage'))
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        toast.error('Failed to create booking')
      }
    })
  }

  const calculateTotal = () => {
    const baseRate = currentStudio ? currentStudio.price : 150
    const equipmentCost = selectedEquipment.reduce((acc, eqId) => {
      const eq = equipmentOptions.find(o => o.id === eqId)
      return acc + (eq ? eq.price : 0)
    }, 0)
    const subtotal = (baseRate * parseInt(duration)) + equipmentCost
    if (couponDiscount > 0) {
      return Math.round(subtotal * (1 - couponDiscount / 100))
    }
    return subtotal
  }

  // Calendar calculations
  const currentMonth = currentCalendarDate.getMonth()
  const currentYear = currentCalendarDate.getFullYear()
  
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  const daysArray = []
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null)
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`)
  }

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <div className="pt-28 pb-32 min-h-screen bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-16 border-b border-border pb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s ? 'bg-primary text-white shadow-[0_0_15px_rgba(177,18,38,0.3)]' : 'bg-foreground/5 text-muted-foreground'
              }`}>
                {s}
              </div>
              <span className={`text-sm hidden sm:inline ${
                step >= s ? 'text-foreground font-bold' : 'text-muted-foreground'
              }`}>
                {s === 1 ? t('book.step1') : s === 2 ? t('book.step2') : t('book.step3')}
              </span>
              {s < 3 && <ChevronRight className={`w-4 h-4 text-muted-foreground hidden sm:block ${language === 'ar' ? 'rotate-180' : ''}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-cinematic font-bold text-foreground flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-primary" />
                <span>{t('book.step1Title')}</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Premium Custom Calendar */}
                <div className="space-y-4 glass-card p-6 rounded-3xl border border-border">
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-2">
                    <button type="button" onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-foreground/10 text-foreground transition-colors cursor-pointer">
                      <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </button>
                    <span className="font-bold text-foreground font-cinematic text-lg">
                      {MONTH_NAMES[language as 'en' | 'ar'][currentMonth]} {currentYear}
                    </span>
                    <button type="button" onClick={handleNextMonth} className="p-2 rounded-full hover:bg-foreground/10 text-foreground transition-colors cursor-pointer">
                      <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {WEEKDAY_NAMES[language as 'en' | 'ar'].map((day) => (
                      <span key={day} className="text-muted-foreground font-semibold py-1">
                        {day}
                      </span>
                    ))}
                    
                    {daysArray.map((dayData, idx) => {
                      if (dayData === null) {
                        return <div key={`empty-${idx}`} />
                      }

                      const dayNum = idx + 1 - firstDayIndex
                      const isAvailable = availableDates.includes(dayData) && !isPast(dayData)
                      const isSelected = date === dayData

                      return (
                        <button
                          key={dayData}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setDate(dayData)}
                          className={`aspect-square rounded-xl font-bold flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(177,18,38,0.4)]'
                              : isAvailable
                                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/25 hover:border-green-500/40 cursor-pointer'
                                : 'bg-red-500/5 text-red-500/30 border-red-500/10 cursor-not-allowed opacity-40'
                          }`}
                          title={isAvailable ? 'Available' : 'Unavailable'}
                        >
                          {dayNum}
                        </button>
                      )}
                    )}
                  </div>

                  {date && (
                    <div className="pt-4 border-t border-border/50 text-xs flex justify-between items-center text-muted-foreground">
                      <span>{t('book.selectDate')}:</span>
                      <span className="font-semibold text-primary font-cinematic text-sm">{date}</span>
                    </div>
                  )}
                </div>

                {/* Time & Duration Setup */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-muted-foreground block flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {t('book.startTime')}
                    </label>
                    <div className="relative">
                      <select
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full bg-foreground/[0.03] border border-border h-12 rounded-xl text-foreground focus:border-primary/50 px-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer appearance-none"
                      >
                        <option value="" disabled className="bg-background text-muted-foreground">
                          {language === 'ar' ? 'اختر وقت البدء' : 'Select start time'}
                        </option>
                        {getTimeSlots(language).map((slot) => (
                          <option key={slot.value} value={slot.value} className="bg-background text-foreground">
                            {slot.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-muted-foreground block">{t('book.duration')}</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-foreground/[0.03] border border-border h-12 rounded-xl px-2 w-full max-w-[200px] justify-between shadow-inner">
                        <button
                          type="button"
                          onClick={() => setDuration(prev => {
                            const val = parseInt(prev) || 1
                            return String(Math.max(1, val - 1))
                          })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/75 hover:text-white hover:bg-primary cursor-pointer transition-all active:scale-90"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={duration}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1
                            setDuration(String(Math.max(1, val)))
                          }}
                          className="bg-transparent text-center font-bold text-foreground w-12 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setDuration(prev => {
                            const val = parseInt(prev) || 1
                            return String(Math.min(24, val + 1))
                          })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/75 hover:text-white hover:bg-primary cursor-pointer transition-all active:scale-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'ساعة / ساعات' : 'Hour(s)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleNextStep} className="w-full bg-primary hover:bg-primary-velvet h-12 rounded-full mt-6 shadow-[0_0_30px_rgba(177,18,38,0.3)] text-white">
                {t('book.continueToEquipment')}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-cinematic font-bold text-foreground">{t('book.step2Title')}</h2>
                <p className="text-muted-foreground mt-2">{t('book.step2Desc')}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipmentOptions.map((eq) => (
                  <div 
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={`p-6 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                      selectedEquipment.includes(eq.id) ? 'border-primary bg-primary/5 text-foreground' : 'border-border glass hover:bg-foreground/5 text-muted-foreground'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-primary block uppercase tracking-wider mb-1">
                        {language === 'ar' ? (eq.categoryAr || eq.category) : eq.category}
                      </span>
                      <h3 className="font-bold text-lg mb-1 text-foreground transition-colors group-hover:text-primary">
                        {language === 'ar' ? (eq.nameAr || eq.name) : eq.name}
                      </h3>
                      <span className="text-muted-foreground text-sm">
                        {language === 'ar' ? `+ ${eq.price} ر.س / الجلسة` : `+${eq.price} SAR / session`}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedEquipment.includes(eq.id) ? 'bg-primary border-primary text-white' : 'border-border'
                    }`}>
                      {selectedEquipment.includes(eq.id) && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-12 rounded-full border border-border text-foreground">
                  {t('book.back')}
                </Button>
                <Button onClick={handleNextStep} className="flex-1 bg-primary hover:bg-primary-velvet h-12 rounded-full text-white">
                  {t('book.confirmDetails')}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-cinematic font-bold text-foreground">{t('book.step3Title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details Summary */}
                <div className="p-6 rounded-3xl glass border border-border space-y-6">
                  <h3 className="text-xl font-bold font-cinematic border-b border-border pb-4 text-foreground">{t('book.summaryTitle')}</h3>
                  <div className="space-y-3 text-sm text-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('book.summaryDate')}</span>
                      <span className="font-semibold">{date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('book.summaryTime')}</span>
                      <span className="font-semibold">{time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('book.summaryDuration')}</span>
                      <span className="font-semibold">{t('book.hoursCount').replace('{hours}', duration)}</span>
                    </div>
                    {selectedEquipment.length > 0 && (
                      <div className="pt-3 border-t border-border space-y-2">
                        <span className="text-xs text-primary font-bold uppercase tracking-wider block">{t('book.summaryAddons')}</span>
                        {selectedEquipment.map(eqId => {
                          const eq = equipmentOptions.find(o => o.id === eqId)
                          return (
                            <div key={eqId} className="flex justify-between text-xs text-muted-foreground">
                              <span>{language === 'ar' ? (eq?.nameAr || eq?.name) : eq?.name}</span>
                              <span>{language === 'ar' ? `${eq?.price} ر.س` : `${eq?.price} SAR`}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Subtotal & Discount Breakdown */}
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>
                          {language === 'ar' 
                            ? `${(currentStudio ? currentStudio.price : 150) * parseInt(duration) + selectedEquipment.reduce((acc, eqId) => acc + (equipmentOptions.find(o => o.id === eqId)?.price || 0), 0)} ر.س` 
                            : `${(currentStudio ? currentStudio.price : 150) * parseInt(duration) + selectedEquipment.reduce((acc, eqId) => acc + (equipmentOptions.find(o => o.id === eqId)?.price || 0), 0)} SAR`}
                        </span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-xs text-green-500 font-semibold">
                          <span>{language === 'ar' ? 'الخصم المطبق' : 'Applied Discount'} ({couponDiscount}%)</span>
                          <span>
                            {language === 'ar'
                              ? `-${Math.round(((currentStudio ? currentStudio.price : 150) * parseInt(duration) + selectedEquipment.reduce((acc, eqId) => acc + (equipmentOptions.find(o => o.id === eqId)?.price || 0), 0)) * couponDiscount / 100)} ر.س`
                              : `-${Math.round(((currentStudio ? currentStudio.price : 150) * parseInt(duration) + selectedEquipment.reduce((acc, eqId) => acc + (equipmentOptions.find(o => o.id === eqId)?.price || 0), 0)) * couponDiscount / 100)} SAR`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-border flex justify-between items-center text-lg font-bold">
                      <span>{t('book.summaryTotal')}</span>
                      <span className="text-primary">
                        {language === 'ar' ? `${calculateTotal()} ر.س` : `${calculateTotal()} SAR`}
                      </span>
                    </div>

                    {/* Coupon Input Form Element */}
                    <div className="pt-4 border-t border-border/50 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        {language === 'ar' ? 'كوبون الخصم' : 'Discount Coupon'}
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder={language === 'ar' ? 'مثال: SAVE10' : 'e.g. SAVE10'} 
                          value={couponCode} 
                          onChange={e => {
                            setCouponCode(e.target.value)
                            setCouponError('')
                          }}
                          className="bg-foreground/[0.03] border-border h-10 rounded-xl text-foreground text-xs focus:border-primary/50"
                        />
                        <Button 
                          type="button" 
                          onClick={handleApplyCoupon}
                          className="bg-primary hover:bg-primary-velvet text-white rounded-xl h-10 px-4 text-xs font-semibold shrink-0"
                        >
                          {language === 'ar' ? 'تطبيق' : 'Apply'}
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-red-500 font-semibold">{couponError}</p>}
                      {appliedCoupon && (
                        <p className="text-xs text-green-500 font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {language === 'ar' ? `كوبون فعال: ${appliedCoupon}` : `Coupon active: ${appliedCoupon}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{t('book.fullName')}</label>
                    <Input 
                      placeholder={t('book.namePlaceholder')} 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="bg-foreground/[0.03] border-border h-12 rounded-xl text-foreground focus:border-primary/50 focus-visible:ring-primary focus-visible:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{t('book.emailAddress')}</label>
                    <Input 
                      type="email"
                      placeholder={t('book.emailPlaceholder')} 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      className="bg-foreground/[0.03] border-border h-12 rounded-xl text-foreground focus:border-primary/50 focus-visible:ring-primary focus-visible:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{t('book.phoneNumber')}</label>
                    <Input 
                      type="tel"
                      placeholder={t('book.phonePlaceholder')} 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="bg-foreground/[0.03] border-border h-12 rounded-xl text-foreground focus:border-primary/50 focus-visible:ring-primary focus-visible:border-primary"
                      required
                    />
                  </div>
                  <div className="pt-4 flex gap-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1 h-12 rounded-full border border-border text-foreground">
                      {t('book.back')}
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary-velvet h-12 rounded-full shadow-[0_0_40px_rgba(177,18,38,0.3)] text-white">
                      {t('book.reserveNow')}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
