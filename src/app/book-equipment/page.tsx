"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  Calendar as CalendarIcon, 
  ShoppingCart, 
  Trash2, 
  Camera, 
  Sliders, 
  Mic, 
  X, 
  ArrowRight,
  Info
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { toast } from 'sonner'
import { useLanguage } from '../../lib/LanguageContext'
import { getEquipment, createEquipmentBooking, EquipmentItem } from '../../lib/availability'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthContext'

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

export default function BookEquipment() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user } = useAuth()

  // Equipment List state
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Selected gear
  const [cart, setCart] = useState<EquipmentItem[]>([])

  // Booking Period
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [days, setDays] = useState(1)

  // Customer details
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')

  // Booking success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [confirmedBookingId, setConfirmedBookingId] = useState('')

  // Load equipment
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getEquipment()
        setEquipmentList(data)
      } catch (err) {
        console.error("Failed to load equipment:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-populate user info
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name)
      if (user.email) setEmail(user.email)
      if ((user as any).phone) setPhone((user as any).phone)
    }
  }, [user])

  // Calculate rental duration in days
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = end.getTime() - start.getTime()
      if (diffTime >= 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setDays(diffDays)
      } else {
        setDays(1)
      }
    } else {
      setDays(1)
    }
  }, [startDate, endDate])

  const toggleCartItem = (item: EquipmentItem) => {
    if (item.status === 'Maintenance') {
      toast.error(language === 'ar' ? 'هذه المعدة تحت الصيانة حالياً' : 'This equipment is currently undergoing maintenance')
      return
    }
    if (item.status === 'Unavailable') {
      toast.error(language === 'ar' ? 'هذه المعدة غير متوفرة حالياً' : 'This equipment is currently unavailable')
      return
    }
    setCart(prev => {
      const exists = prev.some(i => i.id === item.id)
      if (exists) {
        return prev.filter(i => i.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError('')
    const code = couponCode.trim().toUpperCase()
    if (!code) return

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code)
          .single()
        if (data && !error) {
          const todayStr = new Date().toISOString().split('T')[0]
          if (data.expiry_date && data.expiry_date < todayStr) {
            setCouponError(language === 'ar' ? 'منتهي الصلاحية' : 'Coupon has expired')
            toast.error(language === 'ar' ? 'منتهي الصلاحية' : 'Coupon has expired')
            return
          }
          if (data.max_usage && data.used_count >= data.max_usage) {
            setCouponError(language === 'ar' ? 'تم الوصول للحد الأقصى لاستخدام الكوبون' : 'Coupon usage limit reached')
            toast.error(language === 'ar' ? 'تم الوصول للحد الأقصى لاستخدام الكوبون' : 'Coupon usage limit reached')
            return
          }
          setAppliedCoupon(code)
          setCouponDiscount(Number(data.discount_percent))
          toast.success(language === 'ar' ? `تم تطبيق الكوبون (خصم ${data.discount_percent}%)!` : `Coupon applied (${data.discount_percent}% off)!`)
          return
        }
      } catch (e) {
        console.error("Database coupon validation error:", e)
      }
    }

    // Static code fallbacks
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

  const calculateSubtotal = () => {
    const dailyCost = cart.reduce((sum, item) => sum + item.price, 0)
    return dailyCost * days
  }

  const calculateTotal = () => {
    const sub = calculateSubtotal()
    if (couponDiscount > 0) {
      return Math.round(sub * (1 - couponDiscount / 100))
    }
    return sub
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      toast.error(language === 'ar' ? 'الرجاء اختيار معدة واحدة على الأقل' : 'Please select at least one item of equipment')
      return
    }

    if (!startDate || !endDate) {
      toast.error(language === 'ar' ? 'الرجاء تحديد تاريخ البدء وتاريخ الانتهاء' : 'Please select a start and end date')
      return
    }

    if (!startTime || !endTime) {
      toast.error(language === 'ar' ? 'الرجاء تحديد وقت البدء ووقت الانتهاء' : 'Please select a start and end time')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error(language === 'ar' ? 'تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء' : 'Start date cannot be after end date')
      return
    }

    if (!name || !email || !phone) {
      toast.error(language === 'ar' ? 'الرجاء إدخال بيانات الاتصال كاملة' : 'Please complete your contact details')
      return
    }

    const total = calculateTotal()
    const equipmentIds = cart.map(i => i.id)
    const equipmentNames = cart.map(i => i.name)
    const equipmentNamesAr = cart.map(i => i.nameAr || i.name)

    const dateVal = `${startDate} (${startTime})`
    const endDateVal = `${endDate} (${endTime})`
    const customerNameVal = `${name} | ${phone}`

    const result = await createEquipmentBooking({
      equipment_ids: equipmentIds,
      equipment_names: equipmentNames,
      equipment_names_ar: equipmentNamesAr,
      booking_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      customer_name: customerNameVal,
      customer_email: email,
      total_price: total,
      status: 'Confirmed'
    })

    if (result) {
      toast.success(language === 'ar' ? 'تم حجز المعدات بنجاح!' : 'Equipment booked successfully!')
      const displayId = typeof result === 'string'
        ? (result.startsWith('EQ-') || result.startsWith('EQB-') ? result : `EQ-${result.substring(0, 8).toUpperCase()}`)
        : `EQ-${Math.floor(1000 + Math.random() * 9000)}`
      setConfirmedBookingId(displayId)
      setShowSuccessModal(true)
    } else {
      toast.error(language === 'ar' ? 'حدث خطأ أثناء حجز المعدات' : 'Failed to book equipment')
    }
  }

  const categories = [
    { value: 'All', labelEn: 'All Gear', labelAr: 'كل المعدات' },
    { value: 'Cameras & Lenses', labelEn: 'Cameras & Lenses', labelAr: 'الكاميرات والعدسات' },
    { value: 'Lighting & Grip', labelEn: 'Lighting & Grip', labelAr: 'الإضاءة والمعدات المساندة' },
    { value: 'Audio & Sound', labelEn: 'Audio & Sound', labelAr: 'الصوت والتسجيل' }
  ]

  const filteredEquipment = selectedCategory === 'All'
    ? equipmentList
    : equipmentList.filter(item => item.category === selectedCategory)

  return (
    <div className="pt-28 pb-32 min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 max-w-7xl space-y-8">
        
        {/* Banner Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-bold uppercase tracking-widest text-xs">
              {language === 'ar' ? 'أفضل المعدات لإنتاجك' : 'Premium Gear for Your Production'}
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-cinematic font-bold"
          >
            {language === 'ar' ? 'حجز وتأجير المعدات' : 'Studio Equipment Rental'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base"
          >
            {language === 'ar' 
              ? 'اختر من بين تشكيلتنا الفاخرة من كاميرات السينما، الإضاءة الاحترافية، ومعدات الصوت للتسجيل الداخلي أو الخارجي.' 
              : 'Choose from our elite selection of cinema cameras, professional lighting rigs, and audio equipment for studio use or external rental.'}
          </motion.p>
        </div>

        {/* Main Grid Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Grid: Catalog & Selection */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                  }`}
                >
                  {language === 'ar' ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="h-72 rounded-2xl bg-foreground/5 animate-pulse" />
                ))}
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="glass-card p-12 text-center text-muted-foreground rounded-3xl border border-border">
                <Info className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p>{language === 'ar' ? 'لا يوجد معدات متوفرة في هذه الفئة حالياً.' : 'No gear available in this category at the moment.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredEquipment.map((item) => {
                  const isSelected = cart.some(i => i.id === item.id)
                  const isMaintenance = item.status === 'Maintenance'
                  const isUnavailable = item.status === 'Unavailable'
                  const isNotBookable = isMaintenance || isUnavailable

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      className={`glass-card overflow-hidden rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                        isNotBookable 
                          ? 'opacity-60 border-border'
                          : isSelected 
                            ? 'border-primary shadow-xl shadow-primary/5 bg-primary/[0.02]' 
                            : 'border-border hover:border-foreground/20'
                      }`}
                    >
                      <div className="relative h-44 bg-zinc-950 overflow-hidden group">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                          {language === 'ar' ? item.categoryAr : item.category}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-lg text-foreground line-clamp-1">
                              {language === 'ar' ? item.nameAr || item.name : item.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              item.status === 'Available' ? 'text-green-400 bg-green-400/10' :
                              item.status === 'Unavailable' ? 'text-rose-400 bg-rose-400/10' :
                              'text-yellow-400 bg-yellow-400/10'
                            }`}>
                              {item.status === 'Available' 
                                ? (language === 'ar' ? 'متوفر' : 'Avail.') 
                                : item.status === 'Unavailable'
                                ? (language === 'ar' ? 'غير متوفر' : 'Unavail.')
                                : (language === 'ar' ? 'صيانة' : 'Maint.')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {language === 'ar' ? item.descAr || item.desc : item.desc}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                              {language === 'ar' ? 'السعر اليومي' : 'Daily Price'}
                            </span>
                            <span className="font-bold text-lg text-primary">
                              {language === 'ar' ? `${item.price} ر.س` : `${item.price} SAR`}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleCartItem(item)}
                            disabled={isNotBookable}
                            className={`rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-foreground/5 text-foreground hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                {language === 'ar' ? 'تم الاختيار' : 'Selected'}
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                {language === 'ar' ? 'إضافة للطلب' : 'Add to Rental'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Grid: Checkout Form & Receipt Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            
            {/* Booking Form Card */}
            <div className="glass-card p-6 rounded-3xl border border-border space-y-6 shadow-xl">
              <h2 className="text-xl font-bold font-cinematic border-b border-border pb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span>{language === 'ar' ? 'تفاصيل الطلب' : 'Rental Summary'}</span>
              </h2>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {/* Selected Items List Mini Summary */}
                {cart.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center gap-2 text-xs bg-foreground/5 p-2.5 rounded-xl border border-border/30">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          <span className="font-bold truncate text-foreground">
                            {language === 'ar' ? item.nameAr || item.name : item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold text-primary">
                            {language === 'ar' ? `${item.price} ر.س / يوم` : `${item.price} SAR/d`}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCartItem(item)}
                            className="p-1 hover:bg-rose-500/10 rounded text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-foreground/5 border border-dashed border-border rounded-xl">
                    {language === 'ar' ? 'لم يتم اختيار أي معدات بعد' : 'No items selected yet'}
                  </div>
                )}

                {/* Rental Period Selection */}
                <div className="space-y-3 pt-2">
                  {/* Start Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                      </label>
                      <input 
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'ar' ? 'وقت البدء' : 'Start Time'}
                      </label>
                      <select
                        required
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 text-zinc-900 appearance-none font-sans"
                      >
                        <option value="" disabled>
                          {language === 'ar' ? 'اختر الوقت' : 'Select Time'}
                        </option>
                        {getTimeSlots(language).map(slot => (
                          <option key={slot.value} value={slot.value} className="text-zinc-900">
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
                      </label>
                      <input 
                        type="date"
                        required
                        min={startDate || new Date().toISOString().split('T')[0]}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'ar' ? 'وقت الانتهاء' : 'End Time'}
                      </label>
                      <select
                        required
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 text-zinc-900 appearance-none font-sans"
                      >
                        <option value="" disabled>
                          {language === 'ar' ? 'اختر الوقت' : 'Select Time'}
                        </option>
                        {getTimeSlots(language).map(slot => (
                          <option key={slot.value} value={slot.value} className="text-zinc-900">
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Info Form */}
                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder={language === 'ar' ? 'مثال: احمد المنسور' : 'e.g. John Doe'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {language === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                    </label>
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder="+966 50 000 0000"
                    />
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-1.5 pt-2 border-t border-border/30">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {language === 'ar' ? 'كوبون الخصم' : 'Discount Coupon'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="e.g. WELCOME50"
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 text-zinc-900 font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-primary hover:bg-primary-velvet text-white text-xs font-bold rounded-xl px-4 cursor-pointer transition-colors"
                    >
                      {language === 'ar' ? 'تطبيق' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-rose-500 font-semibold">{couponError}</p>}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-4 border-t border-border/40 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>{language === 'ar' ? 'مدة الحجز' : 'Rental Duration'}</span>
                    <span className="font-semibold text-foreground">
                      {days} {language === 'ar' ? 'أيام' : 'days'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span className="font-semibold text-foreground">
                      {language === 'ar' ? `${calculateSubtotal()} ر.س` : `${calculateSubtotal()} SAR`}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-400 font-semibold">
                      <span>{language === 'ar' ? 'الخصم المطبق' : 'Coupon Discount'}</span>
                      <span>
                        {language === 'ar' 
                          ? `-${Math.round(calculateSubtotal() * (couponDiscount / 100))} ر.س` 
                          : `-${Math.round(calculateSubtotal() * (couponDiscount / 100))} SAR`} ({couponDiscount}%)
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-border/30 text-sm font-bold">
                    <span>{language === 'ar' ? 'المجموع النهائي' : 'Total Price'}</span>
                    <span className="text-primary text-lg font-cinematic">
                      {language === 'ar' ? `${calculateTotal()} ر.س` : `${calculateTotal()} SAR`}
                    </span>
                  </div>
                </div>

                {/* Action Submit Booking */}
                <Button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full bg-primary hover:bg-primary-velvet text-white py-3 rounded-full font-semibold transition-all mt-4 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'ar' ? 'احجز المعدات الآن' : 'Book Equipment Now'}
                </Button>

              </form>
            </div>

          </div>

        </div>

      </div>

      {/* Booking Success Modal Overlay */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#ffffff] border border-zinc-200 text-zinc-900 p-8 space-y-6 text-center shadow-2xl"
            >
              
              {/* Premium CSS Checkmark Success Circle Animation */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-cinematic font-bold text-zinc-950">
                  {language === 'ar' ? 'تم الحجز بنجاح!' : 'Booking Confirmed!'}
                </h3>
                <p className="text-sm text-zinc-500">
                  {language === 'ar' 
                    ? 'شكراً لك، تم استلام طلب حجز المعدات الخاص بك وتأكيده بنجاح.' 
                    : 'Thank you! Your equipment rental request has been received and confirmed.'}
                </p>
              </div>

              {/* Receipt Details Mini Badge */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'}</span>
                  <span className="font-mono font-bold text-zinc-800">{confirmedBookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{language === 'ar' ? 'تاريخ الحجز:' : 'Dates:'}</span>
                  <span className="font-semibold text-zinc-800">
                    {startDate} ({startTime}) {language === 'ar' ? 'إلى' : 'to'} {endDate} ({endTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{language === 'ar' ? 'القطع المحجوزة:' : 'Gear Count:'}</span>
                  <span className="font-bold text-primary">{cart.length} {language === 'ar' ? 'قطع' : 'items'}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200/50 pt-2 text-sm">
                  <span className="font-bold text-zinc-700">{language === 'ar' ? 'المجموع المدفوع:' : 'Total Amount:'}</span>
                  <span className="font-bold text-primary font-cinematic">${calculateTotal()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push('/dashboard')
                  }}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push('/')
                  }}
                  className="flex-1 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-full py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'الرئيسية' : 'Explore Studios'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
