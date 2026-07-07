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
  Filter, 
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
  formatDate 
} from '../lib/availability'
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
  const [selectedStudioForAvailability, setSelectedStudioForAvailability] = useState<{ id: string; nameKey: string } | null>(null)
  const [selectedStudioAvailability, setSelectedStudioAvailability] = useState<string[]>([])
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

  // Studios dynamic state
  const [studios, setStudios] = useState<{ id: string; name: string; nameKey?: string; category: string; categoryKey?: string; price: number }[]>([
    { id: "1", name: "غرفة المخمل (The Velvet Room)", nameKey: "studio.1.name", category: "Photography", categoryKey: "cat.photography", price: 150 },
    { id: "2", name: "مسرح لوميير أ (Lumière Stage A)", nameKey: "studio.2.name", category: "Video Production", categoryKey: "cat.video", price: 250 },
    { id: "3", name: "جناح بودكاست إيكو (Echo Podcast Suite)", nameKey: "studio.3.name", category: "Podcast", categoryKey: "cat.podcast", price: 85 }
  ])

  // Studio Add/Edit Modal states
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false)
  const [editingStudio, setEditingStudio] = useState<{ id: string; name: string; nameKey?: string; category: string; categoryKey?: string; price: number } | null>(null)
  const [studioName, setStudioName] = useState('')
  const [studioCategory, setStudioCategory] = useState('Photography')
  const [studioPrice, setStudioPrice] = useState(100)

  const handleAddStudioClick = () => {
    setEditingStudio(null)
    setStudioName('')
    setStudioCategory('Photography')
    setStudioPrice(100)
    setIsStudioModalOpen(true)
  }

  const handleEditStudioClick = (studio: typeof studios[0]) => {
    setEditingStudio(studio)
    setStudioName(studio.nameKey ? t(studio.nameKey) : studio.name)
    setStudioCategory(studio.categoryKey ? t(studio.categoryKey) : studio.category)
    setStudioPrice(studio.price)
    setIsStudioModalOpen(true)
  }

  const handleDeleteStudio = (studioId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الاستوديو؟' : 'Are you sure you want to delete this studio?')) {
      setStudios(prev => prev.filter(s => s.id !== studioId))
    }
  }

  const handleSaveStudio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioName.trim()) return

    if (editingStudio) {
      // Edit mode
      setStudios(prev => prev.map(s => s.id === editingStudio.id ? {
        ...s,
        name: studioName,
        category: studioCategory,
        price: Number(studioPrice),
        nameKey: undefined,
        categoryKey: undefined
      } : s))
    } else {
      // Add mode
      const newStudio = {
        id: String(Date.now()),
        name: studioName,
        category: studioCategory,
        price: Number(studioPrice)
      }
      setStudios(prev => [...prev, newStudio])
    }
    setIsStudioModalOpen(false)
  }

  const getStudioName = (studio: typeof studios[0]) => {
    if (studio.nameKey) {
      const translated = t(studio.nameKey)
      if (translated && translated !== studio.nameKey) return translated
    }
    return studio.name
  }

  const getStudioCategory = (studio: typeof studios[0]) => {
    if (studio.categoryKey) {
      const translated = t(studio.categoryKey)
      if (translated && translated !== studio.categoryKey) return translated
    }
    return studio.category
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

  const handleOpenAvailability = (studioId: string, nameKey: string) => {
    setSelectedStudioForAvailability({ id: studioId, nameKey })
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
    // Make next 30 days available
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

  // Generate calendar elements
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
                  
                  {/* Premium Dark Theme Chart */}
                  <div className="h-64 w-full flex items-end justify-between gap-4 pt-10 relative">
                    {/* Y Axis Guide Lines */}
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
                    <button className="glass p-2 rounded-full hover:bg-foreground/5 cursor-pointer">
                      <Filter className="w-5 h-5 text-muted-foreground" />
                    </button>
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
                  {studios.map((studio) => (
                    <div key={studio.id} className="glass-card p-6 rounded-2xl flex justify-between items-center gap-4 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border border-border/50">
                      <div>
                        <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">
                          {getStudioCategory(studio)}
                        </span>
                        <h3 className="text-xl font-bold font-cinematic mb-2 text-foreground">
                          {getStudioName(studio)}
                        </h3>
                        <span className="text-sm font-semibold text-muted-foreground">${studio.price} / hour</span>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button 
                          onClick={() => handleOpenAvailability(studio.id, studio.nameKey || studio.name)}
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
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl glass border border-border bg-background p-6 md:p-8 space-y-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-cinematic font-bold text-foreground">
                    {t('admin.manageAvailability')}
                  </h3>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {t(selectedStudioForAvailability.nameKey) === selectedStudioForAvailability.nameKey 
                      ? selectedStudioForAvailability.nameKey 
                      : t(selectedStudioForAvailability.nameKey)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStudioForAvailability(null)}
                  className="p-2 rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleMakeAllAvailable}
                  className="flex-1 text-xs md:text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-full h-11 flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('admin.makeAll')}
                </Button>
                <Button 
                  onClick={handleBlockAllDays}
                  className="flex-1 text-xs md:text-sm bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-full h-11 flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  <AlertCircle className="w-4 h-4" />
                  {t('admin.blockAll')}
                </Button>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between border-t border-b border-border py-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-foreground/5 cursor-pointer">
                  <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                <span className="font-bold text-foreground font-cinematic text-lg">
                  {MONTH_NAMES[language as 'en' | 'ar'][currentMonth]} {currentYear}
                </span>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-foreground/5 cursor-pointer">
                  <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3 text-center text-xs">
                {WEEKDAY_NAMES[language as 'en' | 'ar'].map((day) => (
                  <span key={day} className="text-muted-foreground font-bold py-1">
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
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20' 
                          : 'bg-rose-500/5 border-rose-500/25 text-rose-500/60 dark:text-rose-400/50 hover:bg-rose-500/10'
                      }`}
                    >
                      <span className="text-base font-cinematic font-bold">{dayNum}</span>
                      <span className={`text-[9px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full mt-1.5 transition-all ${
                        isAvailable 
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-rose-500/10 text-rose-600/80 dark:text-rose-400/80'
                      }`}>
                        {isAvailable ? (language === 'ar' ? 'متاح' : 'Available') : (language === 'ar' ? 'مغلق' : 'Blocked')}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  onClick={() => setSelectedStudioForAvailability(null)}
                  className="bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-11 font-semibold cursor-pointer shadow-lg shadow-primary/20"
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
              className="relative w-full max-w-md overflow-hidden rounded-3xl glass border border-border bg-background p-6 md:p-8 space-y-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-cinematic font-bold text-foreground">
                  {editingStudio 
                    ? (language === 'ar' ? 'تعديل الاستوديو' : 'Edit Studio') 
                    : (language === 'ar' ? 'إضافة استوديو جديد' : 'Add New Studio')}
                </h3>
                <button 
                  onClick={() => setIsStudioModalOpen(false)}
                  className="p-2 rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveStudio} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground block">
                    {language === 'ar' ? 'اسم الاستوديو' : 'Studio Name'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={studioName}
                    onChange={e => setStudioName(e.target.value)}
                    className="w-full bg-foreground/[0.03] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                    placeholder={language === 'ar' ? 'مثال: مسرح لوميير د' : 'e.g. Lumiere Stage D'}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground block">
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </label>
                  <select 
                    value={studioCategory}
                    onChange={e => setStudioCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                  >
                    <option value="Photography">{language === 'ar' ? 'التصوير الفوتوغرافي' : 'Photography'}</option>
                    <option value="Video Production">{language === 'ar' ? 'الإنتاج السينمائي والـ Video' : 'Video Production'}</option>
                    <option value="Podcast">{language === 'ar' ? 'البودكاست والصوتيات' : 'Podcast'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground block">
                    {language === 'ar' ? 'السعر بالساعة ($)' : 'Price Per Hour ($)'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={studioPrice}
                    onChange={e => setStudioPrice(Number(e.target.value))}
                    className="w-full bg-foreground/[0.03] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsStudioModalOpen(false)}
                    className="border border-border rounded-full px-6 h-11 text-foreground cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-6 h-11 cursor-pointer font-semibold shadow-lg shadow-primary/20"
                  >
                    {language === 'ar' ? 'حفظ' : 'Save'}
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
