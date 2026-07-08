import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  CreditCard, 
  Ticket, 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit3
} from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'
import { 
  getStudioAvailability, 
  setStudioAvailability, 
  toggleDateAvailability, 
  formatDate,
  getStudios,
  saveStudios
} from '../lib/availability'
import type { Studio } from '../lib/availability'
import { Button } from '../components/ui/button'

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
}

const WEEKDAY_NAMES = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  ar: ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب']
}

export default function Admin() {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Availability Modal states
  const [selectedStudioForAvailability, setSelectedStudioForAvailability] = useState<{ id: string; name: string } | null>(null)
  const [selectedStudioAvailability, setSelectedStudioAvailability] = useState<string[]>([])
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

  // Studios dynamic state loaded from localStorage
  const [studios, setStudios] = useState<Studio[]>(() => getStudios())

  // Studio Add/Edit Modal states
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false)
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null)
  
  // Advanced form states
  const [studioName, setStudioName] = useState('')
  const [studioNameAr, setStudioNameAr] = useState('')
  const [studioCategory, setStudioCategory] = useState('Photography')
  const [studioCategoryAr, setStudioCategoryAr] = useState('التصوير الفوتوغرافي')
  const [studioDesc, setStudioDesc] = useState('')
  const [studioDescAr, setStudioDescAr] = useState('')
  const [studioPrice, setStudioPrice] = useState(100)
  const [studioCapacity, setStudioCapacity] = useState(15)
  const [amenitiesText, setAmenitiesText] = useState('')
  const [amenitiesArText, setAmenitiesArText] = useState('')
  const [equipmentText, setEquipmentText] = useState('')
  const [equipmentArText, setEquipmentArText] = useState('')
  
  const [modalSubTab, setModalSubTab] = useState<'basic' | 'media' | 'details'>('basic')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages(prev => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Customers state
  const [customers, setCustomers] = useState([
    { id: "CUST-9021", name: "Marcus Chen", email: "marcus@example.com", phone: "+1 555-0199", bookings: 15, joined: "Jan 12, 2026", status: "Active" },
    { id: "CUST-9022", name: "Elena Rodriguez", email: "elena@example.com", phone: "+1 555-0188", bookings: 8, joined: "Feb 05, 2026", status: "Active" },
    { id: "CUST-9023", name: "Sarah Jenkins", email: "sarah@example.com", phone: "+1 555-0177", bookings: 2, joined: "Mar 18, 2026", status: "Active" },
    { id: "CUST-9024", name: "Khalid Al-Otaibi", email: "khalid@example.com", phone: "+966 50 123 4567", bookings: 22, joined: "Oct 15, 2025", status: "Active" },
    { id: "CUST-9025", name: "Layla Mansour", email: "layla@example.com", phone: "+966 55 987 6543", bookings: 5, joined: "Dec 03, 2025", status: "Suspended" }
  ])

  // Payments state
  const [payments, setPayments] = useState([
    { id: "TXN-8821", invoice: "INV-2026-089", customer: "Marcus Chen", amount: 2000, date: "June 29, 2026", method: "Apple Pay", status: "Paid" },
    { id: "TXN-8822", invoice: "INV-2026-090", customer: "Elena Rodriguez", amount: 600, date: "July 02, 2026", method: "Credit Card", status: "Paid" },
    { id: "TXN-8823", invoice: "INV-2026-091", customer: "Sarah Jenkins", amount: 170, date: "July 04, 2026", method: "PayPal", status: "Pending" },
    { id: "TXN-8824", invoice: "INV-2026-092", customer: "Khalid Al-Otaibi", amount: 1200, date: "July 06, 2026", method: "Apple Pay", status: "Paid" },
    { id: "TXN-8825", invoice: "INV-2026-093", customer: "Layla Mansour", amount: 350, date: "July 07, 2026", method: "Credit Card", status: "Refunded" }
  ])

  // Coupons state with persistence
  const [coupons, setCoupons] = useState<{ code: string; discount: number; usage: number; limit: number; expiry: string; status: string }[]>(() => {
    const stored = localStorage.getItem("dynamic_coupons")
    if (stored) {
      try { return JSON.parse(stored) } catch(e) {}
    }
    const defaults = [
      { code: "LUMIERE10", discount: 10, usage: 45, limit: 100, expiry: "2026-12-31", status: "Active" },
      { code: "CREATIVE25", discount: 25, usage: 12, limit: 50, expiry: "2026-09-30", status: "Active" },
      { code: "VIP50", discount: 50, usage: 3, limit: 10, expiry: "2026-08-15", status: "Active" }
    ]
    localStorage.setItem("dynamic_coupons", JSON.stringify(defaults))
    return defaults
  })

  // Coupon modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(15)
  const [couponExpiry, setCouponExpiry] = useState("2026-12-31")
  const [couponLimit, setCouponLimit] = useState(100)

  const handleToggleCustomerStatus = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" } : c))
  }

  const handleRefundPayment = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Refunded" } : p))
  }

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    const newCoupon = {
      code: couponCode.trim().toUpperCase(),
      discount: Number(couponDiscount),
      usage: 0,
      limit: Number(couponLimit),
      expiry: couponExpiry,
      status: "Active"
    }
    const updated = [...coupons, newCoupon]
    setCoupons(updated)
    localStorage.setItem("dynamic_coupons", JSON.stringify(updated))
    setIsCouponModalOpen(false)
    setCouponCode('')
  }

  const handleDeleteCoupon = (code: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الكوبون؟' : 'Are you sure you want to delete this coupon?')) {
      const updated = coupons.filter(c => c.code !== code)
      setCoupons(updated)
      localStorage.setItem("dynamic_coupons", JSON.stringify(updated))
    }
  }

  const handleAddStudioClick = () => {
    setEditingStudio(null)
    setStudioName('')
    setStudioNameAr('')
    setStudioCategory('Photography')
    setStudioCategoryAr('التصوير الفوتوغرافي')
    setStudioDesc('')
    setStudioDescAr('')
    setStudioPrice(100)
    setStudioCapacity(15)
    setUploadedImages([])
    setAmenitiesText('')
    setAmenitiesArText('')
    setEquipmentText('')
    setEquipmentArText('')
    setModalSubTab('basic')
    setIsStudioModalOpen(true)
  }

  const handleEditStudioClick = (studio: Studio) => {
    setEditingStudio(studio)
    setStudioName(studio.name)
    setStudioNameAr(studio.nameAr || '')
    setStudioCategory(studio.category)
    setStudioCategoryAr(studio.categoryAr || '')
    setStudioDesc(studio.desc || '')
    setStudioDescAr(studio.descAr || '')
    setStudioPrice(studio.price)
    setStudioCapacity(studio.capacity || 15)
    setUploadedImages(studio.images || [])
    setAmenitiesText((studio.amenities || []).join('\n'))
    setAmenitiesArText((studio.amenitiesAr || []).join('\n'))
    setEquipmentText((studio.equipment || []).join('\n'))
    setEquipmentArText((studio.equipmentAr || []).join('\n'))
    setModalSubTab('basic')
    setIsStudioModalOpen(true)
  }

  const handleDeleteStudio = (studioId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الاستوديو؟' : 'Are you sure you want to delete this studio?')) {
      const updated = studios.filter(s => s.id !== studioId)
      setStudios(updated)
      saveStudios(updated)
    }
  }

  const handleSaveStudio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioName.trim()) return

    const parsedAmenities = amenitiesText.split('\n').map(l => l.trim()).filter(Boolean)
    const parsedAmenitiesAr = amenitiesArText.split('\n').map(l => l.trim()).filter(Boolean)
    const parsedEquipment = equipmentText.split('\n').map(l => l.trim()).filter(Boolean)
    const parsedEquipmentAr = equipmentArText.split('\n').map(l => l.trim()).filter(Boolean)

    const finalImages = uploadedImages.length > 0 ? uploadedImages : [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
    ]

    if (editingStudio) {
      // Edit mode
      const updated = studios.map(s => s.id === editingStudio.id ? {
        ...s,
        name: studioName,
        nameAr: studioNameAr,
        category: studioCategory,
        categoryAr: studioCategoryAr,
        desc: studioDesc,
        descAr: studioDescAr,
        price: Number(studioPrice),
        capacity: Number(studioCapacity),
        images: finalImages,
        amenities: parsedAmenities,
        amenitiesAr: parsedAmenitiesAr,
        equipment: parsedEquipment,
        equipmentAr: parsedEquipmentAr,
      } : s)
      setStudios(updated)
      saveStudios(updated)
    } else {
      // Add mode
      const newStudio: Studio = {
        id: String(Date.now()),
        name: studioName,
        nameAr: studioNameAr,
        category: studioCategory,
        categoryAr: studioCategoryAr,
        desc: studioDesc,
        descAr: studioDescAr,
        price: Number(studioPrice),
        capacity: Number(studioCapacity),
        rating: 5.0,
        images: finalImages,
        amenities: parsedAmenities,
        amenitiesAr: parsedAmenitiesAr,
        equipment: parsedEquipment,
        equipmentAr: parsedEquipmentAr
      }
      const updated = [...studios, newStudio]
      setStudios(updated)
      saveStudios(updated)
    }
    setIsStudioModalOpen(false)
  }

  const ANALYTICS = {
    revenue: "$48,500",
    bookings: "154",
    utilization: "72%",
    customers: "92"
  }

  const BOOKINGS = [
    { id: "BK-1002", customer: "Marcus Chen", studio: "Lumière Stage A", date: "June 29, 2026", revenue: 2000, status: "Confirmed" },
    { id: "BK-1003", customer: "Elena Rodriguez", studio: "The Velvet Room", date: "July 02, 2026", revenue: 600, status: "Confirmed" },
    { id: "BK-1004", customer: "Sarah Jenkins", studio: "Echo Podcast Suite", date: "July 04, 2026", revenue: 170, status: "Pending" }
  ]

  const filteredBookings = BOOKINGS.filter(b => 
    b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.studio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenAvailability = (studioId: string, studioNameField: string) => {
    setSelectedStudioForAvailability({ id: studioId, name: studioNameField })
    setSelectedStudioAvailability(getStudioAvailability(studioId))
    setCurrentCalendarDate(new Date())
  }

  const handleToggleDay = (dateStr: string) => {
    if (!selectedStudioForAvailability) return
    const updated = toggleDateAvailability(selectedStudioForAvailability.id, dateStr)
    setSelectedStudioAvailability(updated)
  }

  const handleMakeAllAvailable = () => {
    if (!selectedStudioForAvailability) return
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      dates.push(formatDate(d))
    }
    setStudioAvailability(selectedStudioForAvailability.id, dates)
    setSelectedStudioAvailability(dates)
  }

  const handleBlockAllDays = () => {
    if (!selectedStudioForAvailability) return
    setStudioAvailability(selectedStudioForAvailability.id, [])
    setSelectedStudioAvailability([])
  }

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
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-2">
            {[
              { id: 'overview', label: t('admin.overview'), icon: LayoutDashboard },
              { id: 'bookings', label: t('admin.bookings'), icon: CalendarIcon },
              { id: 'studios', label: t('admin.studios'), icon: Video },
              { id: 'customers', label: t('admin.customers'), icon: Users },
              { id: 'billing', label: t('admin.payments'), icon: CreditCard },
              { id: 'coupons', label: t('admin.coupons'), icon: Ticket }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-medium transition-all cursor-pointer ${
                    language === 'ar' ? 'text-right' : 'text-left'
                  } ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-[0_0_30px_rgba(177,18,38,0.2)]' 
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Main Content */}
          <div className="flex-grow space-y-12">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: t('admin.totalRevenue'), value: ANALYTICS.revenue, change: "+14.2% vs last month" },
                    { label: t('admin.bookings'), value: ANALYTICS.bookings, change: "+8.3% vs last month" },
                    { label: t('admin.avgUtilization'), value: ANALYTICS.utilization, change: "+2.1% vs last month" },
                    { label: t('admin.activeCustomers'), value: ANALYTICS.customers, change: "+12.5% vs last month" }
                  ].map((stat, idx) => (
                    <div key={idx} className="glass-card p-6 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-glow/10 rounded-full blur-3xl pointer-events-none" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{stat.label}</span>
                      <span className="text-3xl font-cinematic font-bold block mb-1 text-foreground">{stat.value}</span>
                      <span className="text-xs text-green-400 font-medium">{stat.change}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated Revenue Chart */}
                <div className="glass-card p-8 rounded-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold font-cinematic">{t('admin.revenueStream')}</h3>
                    <span className="text-xs text-muted-foreground">{t('admin.updatedHourly')}</span>
                  </div>
                  
                  <div className="h-64 w-full flex items-end justify-between gap-4 pt-10 relative">
                    <div className={`absolute top-10 border-t border-foreground/5 text-[10px] text-muted-foreground pt-1 ${language === 'ar' ? 'right-0 left-0' : 'left-0 right-0'}`}>$15k</div>
                    <div className={`absolute top-28 border-t border-foreground/5 text-[10px] text-muted-foreground pt-1 ${language === 'ar' ? 'right-0 left-0' : 'left-0 right-0'}`}>$10k</div>
                    <div className={`absolute top-44 border-t border-foreground/5 text-[10px] text-muted-foreground pt-1 ${language === 'ar' ? 'right-0 left-0' : 'left-0 right-0'}`}>$5k</div>
                    
                    {[
                      { month: "Jan", val: 40 },
                      { month: "Feb", val: 55 },
                      { month: "Mar", val: 45 },
                      { month: "Apr", val: 70 },
                      { month: "May", val: 85 },
                      { month: "Jun", val: 95 }
                    ].map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-3 z-10">
                        <div className="w-full bg-foreground/5 rounded-t-lg relative overflow-hidden group h-40 flex items-end">
                          <div 
                            className="w-full bg-gradient-to-t from-primary-velvet to-primary group-hover:to-primary-accent transition-all duration-1000 ease-out" 
                            style={{ height: `${data.val}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Table */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold font-cinematic">{t('admin.activeBookings')}</h3>
                  <div className="glass-card p-6 rounded-3xl overflow-x-auto">
                    <table className={`w-full text-sm min-w-[600px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="pb-4">{t('admin.bookingId')}</th>
                          <th className="pb-4">{t('admin.customer')}</th>
                          <th className="pb-4">{t('admin.studioSpace')}</th>
                          <th className="pb-4">{t('admin.date')}</th>
                          <th className="pb-4">{t('admin.revenue')}</th>
                          <th className="pb-4 text-right">{t('admin.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {BOOKINGS.map((booking) => (
                          <tr key={booking.id} className="hover:bg-foreground/5 transition-colors">
                            <td className="py-4 font-mono">{booking.id}</td>
                            <td className="py-4 font-semibold text-foreground">{booking.customer}</td>
                            <td className="py-4 text-muted-foreground">{booking.studio}</td>
                            <td className="py-4">{booking.date}</td>
                            <td className="py-4 font-bold text-foreground">${booking.revenue}</td>
                            <td className="py-4 text-right">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                booking.status === 'Confirmed' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'
                              }`}>
                                {booking.status === 'Confirmed' ? t('admin.confirmed') : t('admin.pending')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <h2 className="text-3xl font-cinematic font-bold">{t('admin.bookings')}</h2>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder={t('admin.searchPlaceholder')} 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-foreground/[0.03] border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl overflow-x-auto">
                  <table className={`w-full text-sm min-w-[600px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-4">{t('admin.bookingId')}</th>
                        <th className="pb-4">{t('admin.customer')}</th>
                        <th className="pb-4">{t('admin.studioSpace')}</th>
                        <th className="pb-4">{t('admin.date')}</th>
                        <th className="pb-4">{t('admin.revenue')}</th>
                        <th className="pb-4 text-right">{t('admin.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-foreground/5 transition-colors">
                          <td className="py-4 font-mono">{booking.id}</td>
                          <td className="py-4 font-semibold text-foreground">{booking.customer}</td>
                          <td className="py-4 text-muted-foreground">{booking.studio}</td>
                          <td className="py-4">{booking.date}</td>
                          <td className="py-4 font-bold text-foreground">${booking.revenue}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              booking.status === 'Confirmed' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'
                            }`}>
                              {booking.status === 'Confirmed' ? t('admin.confirmed') : t('admin.pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'studios' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-cinematic font-bold">{t('admin.studios')}</h2>
                  <button 
                    onClick={handleAddStudioClick}
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-primary/10"
                  >
                    <Plus className="w-4 h-4" /> {t('admin.addStudio')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studios.map((studio) => {
                    const nameDisplay = language === 'ar' ? (studio.nameAr || studio.name) : studio.name
                    const catDisplay = language === 'ar' ? (studio.categoryAr || studio.category) : studio.category
                    return (
                      <div key={studio.id} className="glass-card p-6 rounded-2xl flex justify-between items-center gap-4 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border border-border/50">
                        <div>
                          <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">
                            {catDisplay}
                          </span>
                          <h3 className="text-xl font-bold font-cinematic mb-2 text-foreground">
                            {nameDisplay}
                          </h3>
                          <span className="text-sm font-semibold text-muted-foreground">${studio.price} / hour</span>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button 
                            onClick={() => handleOpenAvailability(studio.id, nameDisplay)}
                            className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-4 h-9 cursor-pointer"
                          >
                            {t('admin.manageAvailability')}
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleEditStudioClick(studio)}
                              className="flex-1 text-xs font-semibold border border-border rounded-full h-9 hover:bg-foreground/5 text-foreground cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {t('admin.edit')}
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => handleDeleteStudio(studio.id)}
                              className="text-xs font-semibold border border-rose-500/20 text-rose-500 hover:text-white rounded-full w-9 h-9 p-0 hover:bg-rose-500 hover:border-rose-500 cursor-pointer flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Customers Tab Content */}
            {activeTab === 'customers' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <h2 className="text-3xl font-cinematic font-bold">{t('admin.customers')}</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder={language === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'} 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-foreground/[0.03] border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground w-64"
                    />
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl overflow-x-auto">
                  <table className={`w-full text-sm min-w-[600px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-4">{language === 'ar' ? 'معرف العميل' : 'Customer ID'}</th>
                        <th className="pb-4">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="pb-4">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                        <th className="pb-4">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                        <th className="pb-4">{language === 'ar' ? 'عدد الحجوزات' : 'Bookings'}</th>
                        <th className="pb-4">{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</th>
                        <th className="pb-4 text-right">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())).map((cust) => (
                        <tr key={cust.id} className="hover:bg-foreground/5 transition-colors">
                          <td className="py-4 font-mono text-xs">{cust.id}</td>
                          <td className="py-4 font-semibold text-foreground">{cust.name}</td>
                          <td className="py-4 text-muted-foreground">{cust.email}</td>
                          <td className="py-4">{cust.phone}</td>
                          <td className="py-4 font-bold">{cust.bookings}</td>
                          <td className="py-4 text-muted-foreground">{cust.joined}</td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleToggleCustomerStatus(cust.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                cust.status === 'Active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                              }`}
                            >
                              {cust.status === 'Active' 
                                ? (language === 'ar' ? 'نشط' : 'Active') 
                                : (language === 'ar' ? 'موقوف' : 'Suspended')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Payments Tab Content */}
            {activeTab === 'billing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <h2 className="text-3xl font-cinematic font-bold">{t('admin.payments')}</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder={language === 'ar' ? 'بحث بالاسم أو الفاتورة...' : 'Search by name or invoice...'} 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-foreground/[0.03] border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground w-64"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'إجمالي المبالغ المستلمة' : 'Total Revenue'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-emerald-400">$48,500</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'جميع المعاملات المكتملة' : 'All completed transactions'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-yellow-400">$170</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'في انتظار استلام الأموال' : 'Awaiting payment confirmation'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'المبالغ المستردة' : 'Total Refunded'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-rose-400">$350</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تمت إعادتها للعملاء' : 'Returned to client accounts'}</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl overflow-x-auto">
                  <table className={`w-full text-sm min-w-[600px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-4">{language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</th>
                        <th className="pb-4">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice'}</th>
                        <th className="pb-4">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th className="pb-4">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        <th className="pb-4">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                        <th className="pb-4">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="pb-4 text-right">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.filter(p => p.customer.toLowerCase().includes(searchQuery.toLowerCase()) || p.invoice.toLowerCase().includes(searchQuery.toLowerCase())).map((pay) => (
                        <tr key={pay.id} className="hover:bg-foreground/5 transition-colors">
                          <td className="py-4 font-mono text-xs">{pay.id}</td>
                          <td className="py-4 font-semibold text-foreground">{pay.invoice}</td>
                          <td className="py-4 text-muted-foreground">{pay.customer}</td>
                          <td className="py-4 font-bold text-foreground">${pay.amount}</td>
                          <td className="py-4">{pay.method}</td>
                          <td className="py-4">{pay.date}</td>
                          <td className="py-4 text-right flex items-center justify-end gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              pay.status === 'Paid' ? 'text-green-400 bg-green-400/10' :
                              pay.status === 'Pending' ? 'text-yellow-400 bg-yellow-400/10' : 'text-rose-400 bg-rose-400/10'
                            }`}>
                              {pay.status === 'Paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') :
                               pay.status === 'Pending' ? (language === 'ar' ? 'انتظار' : 'Pending') :
                               (language === 'ar' ? 'مسترد' : 'Refunded')}
                            </span>
                            {pay.status !== 'Refunded' && (
                              <button
                                onClick={() => handleRefundPayment(pay.id)}
                                className="text-xs text-rose-400 border border-rose-500/20 px-2 py-1 rounded-md hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                              >
                                {language === 'ar' ? 'استرداد' : 'Refund'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Coupons Tab Content */}
            {activeTab === 'coupons' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-cinematic font-bold">{t('admin.coupons')}</h2>
                  <button 
                    onClick={() => setIsCouponModalOpen(true)}
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-primary/10"
                  >
                    <Plus className="w-4 h-4" /> {language === 'ar' ? 'إنشاء كوبون' : 'Add Coupon'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {coupons.map((coupon) => (
                    <div key={coupon.code} className="glass-card p-6 rounded-2xl border border-border/50 flex flex-col justify-between hover:shadow-xl transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-mono text-xl font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg">
                            {coupon.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            coupon.status === 'Active' ? 'text-green-400 bg-green-400/10' : 'text-rose-400 bg-rose-400/10'
                          }`}>
                            {coupon.status === 'Active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'منتهي' : 'Expired')}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === 'ar' ? 'نسبة الخصم' : 'Discount'}</span>
                            <span className="font-bold text-foreground">{coupon.discount}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === 'ar' ? 'الاستخدام' : 'Usage'}</span>
                            <span className="font-semibold text-foreground">{coupon.usage} / {coupon.limit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                            <span className="text-muted-foreground">{coupon.expiry}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.code)}
                        className="mt-6 w-full py-2 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        {language === 'ar' ? 'حذف الكوبون' : 'Delete Coupon'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Available Dates Toggle Modal (Manage Booking Time) */}
      <AnimatePresence>
        {selectedStudioForAvailability && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#ffffff] border border-zinc-200 text-zinc-900 p-6 space-y-5 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-cinematic font-bold text-zinc-900">
                    {t('admin.manageAvailability')}
                  </h3>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {selectedStudioForAvailability.name}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStudioForAvailability(null)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                </button>
              </div>

              {/* Status Legend */}
              <div className="flex items-center justify-start gap-6 bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-xs font-medium text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300" />
                  {language === 'ar' ? '🟢 متاح للحجز' : '🟢 Available for Booking'}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300" />
                  {language === 'ar' ? '🔴 مغلق ومغلق للصيانة' : '🔴 Closed / Blocked'}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleMakeAllAvailable}
                  className="flex-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-full h-10 flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('admin.makeAll')}
                </Button>
                <Button 
                  onClick={handleBlockAllDays}
                  className="flex-1 text-xs bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-full h-10 flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  <AlertCircle className="w-4 h-4" />
                  {t('admin.blockAll')}
                </Button>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between border-t border-b border-zinc-100 py-3">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 cursor-pointer">
                  <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                <span className="font-bold text-zinc-800 font-cinematic text-base">
                  {MONTH_NAMES[language as 'en' | 'ar'][currentMonth]} {currentYear}
                </span>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 cursor-pointer">
                  <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3 text-center text-xs">
                {WEEKDAY_NAMES[language as 'en' | 'ar'].map((day) => (
                  <span key={day} className="text-zinc-400 font-bold py-1">
                    {day}
                  </span>
                ))}
                
                {daysArray.map((dayData, idx) => {
                  if (dayData === null) {
                    return <div key={`empty-${idx}`} />
                  }

                  const dayNum = idx + 1 - firstDayIndex
                  const isAvailable = selectedStudioAvailability.includes(dayData)

                  return (
                    <button
                      key={dayData}
                      onClick={() => handleToggleDay(dayData)}
                      className={`group aspect-square rounded-2xl font-bold flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        isAvailable 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                          : 'bg-rose-50/50 border-rose-100 text-rose-400 hover:bg-rose-50'
                      }`}
                    >
                      <span className="text-base font-cinematic font-bold">{dayNum}</span>
                      <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full transition-all ${
                        isAvailable 
                          ? 'bg-emerald-500' 
                          : 'bg-rose-500'
                      }`} />
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button 
                  onClick={() => setSelectedStudioForAvailability(null)}
                  className="bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-10 font-semibold cursor-pointer shadow-lg shadow-primary/10"
                >
                  {t('admin.save')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Studio Modal */}
      <AnimatePresence>
        {isStudioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#ffffff] border border-zinc-200 text-zinc-900 p-6 md:p-8 space-y-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h3 className="text-xl font-cinematic font-bold text-zinc-900">
                  {editingStudio 
                    ? (language === 'ar' ? 'تعديل بيانات الاستوديو' : 'Edit Studio Details') 
                    : (language === 'ar' ? 'إضافة استوديو جديد بالكامل' : 'Create New Studio')}
                </h3>
                <button 
                  onClick={() => setIsStudioModalOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                </button>
              </div>

              {/* Segmented Sub-tab bar */}
              <div className="flex border-b border-zinc-100 gap-2">
                {[
                  { id: 'basic', label: language === 'ar' ? '1. البيانات الأساسية' : '1. Basic Info' },
                  { id: 'media', label: language === 'ar' ? '2. الوصف والصور' : '2. Description & Images' },
                  { id: 'details', label: language === 'ar' ? '3. الخدمات والمعدات' : '3. Amenities & Equipment' }
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    type="button"
                    onClick={() => setModalSubTab(subTab.id as any)}
                    className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                      modalSubTab === subTab.id 
                        ? 'border-primary text-primary font-bold' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSaveStudio} className="space-y-6">
                
                {modalSubTab === 'basic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'الاسم بالإنجليزية' : 'Studio Name (English)'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={studioName}
                        onChange={e => setStudioName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                        placeholder="e.g. The Velvet Room"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'الاسم بالعربية' : 'Studio Name (Arabic)'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={studioNameAr}
                        onChange={e => setStudioNameAr(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                        placeholder="مثال: غرفة المخمل"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'الفئة بالإنجليزية' : 'Category (English)'}
                      </label>
                      <select 
                        value={studioCategory}
                        onChange={e => setStudioCategory(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      >
                        <option value="Photography">Photography</option>
                        <option value="Video Production">Video Production</option>
                        <option value="Podcast">Podcast</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'الفئة بالعربية' : 'Category (Arabic)'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={studioCategoryAr}
                        onChange={e => setStudioCategoryAr(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                        placeholder="مثال: التصوير الفوتوغرافي"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'السعر بالساعة ($)' : 'Price Per Hour ($)'}
                      </label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={studioPrice}
                        onChange={e => setStudioPrice(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'السعة (عدد الأشخاص)' : 'Capacity (Persons)'}
                      </label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={studioCapacity}
                        onChange={e => setStudioCapacity(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {modalSubTab === 'media' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          {language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}
                        </label>
                        <textarea 
                          rows={4}
                          value={studioDesc}
                          onChange={e => setStudioDesc(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900 resize-none"
                          placeholder="Provide a luxurious description of the studio..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}
                        </label>
                        <textarea 
                          rows={4}
                          value={studioDescAr}
                          onChange={e => setStudioDescAr(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900 resize-none"
                          placeholder="اكتب وصفاً مميزاً للمساحة باللغة العربية..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                        {language === 'ar' ? 'صور الاستوديو' : 'Studio Images'}
                      </label>
                      
                      {/* Upload Area */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-primary/50 rounded-2xl p-6 bg-zinc-50 cursor-pointer transition-colors relative group">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="text-center space-y-1">
                          <Plus className="w-8 h-8 text-zinc-400 mx-auto group-hover:text-primary transition-colors" />
                          <p className="text-sm font-semibold text-zinc-700">
                            {language === 'ar' ? 'اضغط لرفع الصور من جهازك' : 'Click to upload images from your device'}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {language === 'ar' ? 'يدعم صيغ JPG, PNG, WEBP' : 'Supports JPG, PNG, WEBP'}
                          </p>
                        </div>
                      </div>

                      {/* Image Previews */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                          {uploadedImages.map((imgSrc, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100">
                              <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer hover:bg-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modalSubTab === 'details' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                          {language === 'ar' ? 'الخدمات بالإنجليزية (خدمة واحدة في كل سطر)' : 'Amenities (English - One per line)'}
                        </label>
                        <textarea 
                          rows={4}
                          value={amenitiesText}
                          onChange={e => setAmenitiesText(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                          placeholder="Private Dressing Room&#10;High-speed WiFi"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                          {language === 'ar' ? 'الخدمات بالعربية (خدمة واحدة في كل سطر)' : 'Amenities (Arabic - One per line)'}
                        </label>
                        <textarea 
                          rows={4}
                          value={amenitiesArText}
                          onChange={e => setAmenitiesArText(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                          placeholder="غرفة تبديل ملابس خاصة&#10;إنترنت عالي السرعة"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                          {language === 'ar' ? 'المعدات بالإنجليزية (معدة واحدة في كل سطر)' : 'Equipment (English - One per line)'}
                        </label>
                        <textarea 
                          rows={4}
                          value={equipmentText}
                          onChange={e => setEquipmentText(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                          placeholder="Profoto D2 Strobes&#10;Reflector Panels"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                          {language === 'ar' ? 'المعدات بالعربية (معدة واحدة في كل سطر)' : 'Equipment (Arabic - One per line)'}
                        </label>
                        <textarea 
                          rows={4}
                          value={equipmentArText}
                          onChange={e => setEquipmentArText(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                          placeholder="أجهزة فلاش Profoto D2&#10;ألواح عاكسة"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                  <div className="flex gap-2">
                    {modalSubTab !== 'basic' && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setModalSubTab(modalSubTab === 'details' ? 'media' : 'basic')}
                        className="border border-zinc-200 rounded-full px-5 h-10 text-zinc-700 hover:bg-zinc-100 cursor-pointer text-xs"
                      >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </Button>
                    )}
                    {modalSubTab !== 'details' && (
                      <Button
                        type="button"
                        onClick={() => setModalSubTab(modalSubTab === 'basic' ? 'media' : 'details')}
                        className="bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-5 h-10 cursor-pointer text-xs font-semibold"
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={() => setIsStudioModalOpen(false)}
                      className="border border-zinc-200 rounded-full px-6 h-10 text-zinc-700 hover:bg-zinc-100 cursor-pointer text-xs"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-11 cursor-pointer text-xs font-semibold shadow-lg shadow-primary/20"
                    >
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#ffffff] border border-zinc-200 text-zinc-900 p-6 md:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h3 className="text-xl font-cinematic font-bold text-zinc-900">
                  {language === 'ar' ? 'إنشاء كوبون جديد' : 'Create New Coupon'}
                </h3>
                <button 
                  onClick={() => setIsCouponModalOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                </button>
              </div>

              <form onSubmit={handleAddCouponSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {language === 'ar' ? 'رمز الكوبون' : 'Coupon Code'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900 font-mono uppercase"
                    placeholder="e.g. SUMMER50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {language === 'ar' ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="100"
                    value={couponDiscount}
                    onChange={e => setCouponDiscount(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {language === 'ar' ? 'حد الاستخدام الأقصى' : 'Max Usage Limit'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={couponLimit}
                    onChange={e => setCouponLimit(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={couponExpiry}
                    onChange={e => setCouponExpiry(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCouponModalOpen(false)}
                    className="border border-zinc-200 rounded-full px-6 h-10 text-zinc-700 hover:bg-zinc-100 cursor-pointer text-xs"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-10 cursor-pointer text-xs font-semibold shadow-lg shadow-primary/10"
                  >
                    {language === 'ar' ? 'إنشاء' : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
