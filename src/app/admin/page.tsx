"use client"

import { useState, useEffect } from 'react'
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
  Edit3,
  Camera,
  BarChart2,
  Download,
  Clock
} from 'lucide-react'
import { useLanguage } from '../../lib/LanguageContext'
import * as XLSX from 'xlsx'
import { 
  getStudioAvailability, 
  setStudioAvailability, 
  toggleDateAvailability, 
  formatDate,
  getStudios,
  saveStudios,
  getBookings,
  getCoupons,
  saveCoupon,
  getEquipment,
  saveEquipmentItem,
  deleteEquipmentItem,
  getEquipmentBookings
} from '../../lib/availability'
import type { Studio, Booking, Coupon, EquipmentItem, EquipmentBooking } from '../../lib/availability'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { Button } from '../../components/ui/button'
import ProtectedRoute from '../../components/ProtectedRoute'
import { toast } from 'sonner'

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
}

const WEEKDAY_NAMES = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  ar: ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب']
}

const getSlotEndTime = (slot: string): string => {
  if (!slot) return ''
  const [hourStr, minStr] = slot.split(':')
  let hour = parseInt(hourStr, 10)
  let min = parseInt(minStr, 10) + 30
  if (min >= 60) {
    min -= 60
    hour += 1
  }
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function Admin() {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')

  // Availability Modal states
  const [selectedStudioForAvailability, setSelectedStudioForAvailability] = useState<{ id: string; name: string } | null>(null)
  const [selectedStudioAvailability, setSelectedStudioAvailability] = useState<string[]>([])
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

  // Studios dynamic state loaded from localStorage/Supabase
  const [studios, setStudios] = useState<Studio[]>([])
  
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([])

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
  const [studioLocation, setStudioLocation] = useState('')
  const [studioLocationAr, setStudioLocationAr] = useState('')
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

  const handleEquipmentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEqImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveEquipmentImage = () => {
    setEqImage('')
  }

  // Customers state
  const [suspendedEmails, setSuspendedEmails] = useState<string[]>([])
  const [customers, setCustomers] = useState<{
    id: string
    name: string
    email: string
    phone: string
    bookings: number
    joined: string
    status: string
    isVip?: boolean
  }[]>([])

  // Payments state
  const [payments, setPayments] = useState<{
    id: string
    invoice: string
    customer: string
    amount: number
    date: string
    dateRaw: string
    method: string
    status: string
  }[]>([])

  // Coupons state with persistence
  const [coupons, setCoupons] = useState<Coupon[]>([])

  // Equipment bookings state
  const [equipmentBookings, setEquipmentBookings] = useState<EquipmentBooking[]>([])
  const [bookingSubTab, setBookingSubTab] = useState<'studio' | 'equipment'>('studio')

  // Equipment states
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null)
  const [eqId, setEqId] = useState('')
  const [eqName, setEqName] = useState('')
  const [eqNameAr, setEqNameAr] = useState('')
  const [eqCategory, setEqCategory] = useState('Cameras & Lenses')
  const [eqCategoryAr, setEqCategoryAr] = useState('الكاميرات والعدسات')
  const [eqDesc, setEqDesc] = useState('')
  const [eqDescAr, setEqDescAr] = useState('')
  const [eqPrice, setEqPrice] = useState(50)
  const [eqImage, setEqImage] = useState('')
  const [eqStatus, setEqStatus] = useState('Available')

  useEffect(() => {
    async function loadAllData() {
      // 1. Load bookings
      const bList = await getBookings()
      setBookings(bList)

      // 2. Load coupons
      const cList = await getCoupons()
      setCoupons(cList)

      // 4. Load equipment
      const eqList = await getEquipment()
      setEquipment(eqList)

      // 5. Load equipment bookings
      const eqBList = await getEquipmentBookings()
      setEquipmentBookings(eqBList)

      // 3. Load studios
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
        } catch (e) {
          console.error("Error loading studios in admin:", e)
        }
      }
      setStudios(getStudios())
    }
    loadAllData()
  }, [])

  // Calculate dynamic customers and payments based on bookings
  useEffect(() => {
    if (bookings.length === 0) {
      // Fallback defaults if bookings are empty
      setCustomers([
        { id: "CUST-9021", name: "Marcus Chen", email: "marcus@example.com", phone: "+1 555-0199", bookings: 15, joined: "Jan 12, 2026", status: suspendedEmails.includes("marcus@example.com") ? "Suspended" : "Active", isVip: true },
        { id: "CUST-9022", name: "Elena Rodriguez", email: "elena@example.com", phone: "+1 555-0188", bookings: 8, joined: "Feb 05, 2026", status: suspendedEmails.includes("elena@example.com") ? "Suspended" : "Active", isVip: true },
        { id: "CUST-9023", name: "Sarah Jenkins", email: "sarah@example.com", phone: "+1 555-0177", bookings: 2, joined: "Mar 18, 2026", status: suspendedEmails.includes("sarah@example.com") ? "Suspended" : "Active", isVip: true },
        { id: "CUST-9024", name: "Khalid Al-Otaibi", email: "khalid@example.com", phone: "+966 50 123 4567", bookings: 22, joined: "Oct 15, 2025", status: suspendedEmails.includes("khalid@example.com") ? "Suspended" : "Active", isVip: true },
        { id: "CUST-9025", name: "Layla Mansour", email: "layla@example.com", phone: "+966 55 987 6543", bookings: 5, joined: "Dec 03, 2025", status: suspendedEmails.includes("layla@example.com") ? "Suspended" : "Active", isVip: true }
      ])
      setPayments([
        { id: "TXN-8821", invoice: "INV-2026-089", customer: "Marcus Chen", amount: 2000, date: "June 29, 2026", dateRaw: "2026-06-29", method: "Apple Pay", status: "Paid" },
        { id: "TXN-8822", invoice: "INV-2026-090", customer: "Elena Rodriguez", amount: 600, date: "July 02, 2026", dateRaw: "2026-07-02", method: "Credit Card", status: "Paid" },
        { id: "TXN-8823", invoice: "INV-2026-091", customer: "Sarah Jenkins", amount: 170, date: "July 04, 2026", dateRaw: "2026-07-04", method: "PayPal", status: "Pending" },
        { id: "TXN-8824", invoice: "INV-2026-092", customer: "Khalid Al-Otaibi", amount: 1200, date: "July 06, 2026", dateRaw: "2026-07-06", method: "Apple Pay", status: "Paid" },
        { id: "TXN-8825", invoice: "INV-2026-093", customer: "Layla Mansour", amount: 350, date: "July 07, 2026", dateRaw: "2026-07-07", method: "Credit Card", status: "Refunded" }
      ])
      return
    }

    // Derive from real bookings
    const customerMap = new Map<string, {
      id: string
      name: string
      email: string
      phone: string
      bookings: number
      joined: string
      status: string
      isVip: boolean
    }>()

    // 1. Process studio bookings
    bookings.forEach(b => {
      const email = (b.customer_email || 'guest@example.com').toLowerCase()
      const dateObj = b.created_at ? new Date(b.created_at) : new Date()
      const dateStr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      let parsedName = b.customer_name || 'Guest User'
      let parsedPhone = '+966 50 123 4567'
      if (parsedName.includes(' | ')) {
        const parts = parsedName.split(' | ')
        parsedName = parts[0]
        parsedPhone = parts[1]
      }

      const existing = customerMap.get(email)
      if (existing) {
        existing.bookings += 1
        if (parsedPhone !== '+966 50 123 4567') {
          existing.phone = parsedPhone
        }
      } else {
        const codeNum = Math.floor(1000 + Math.random() * 9000)
        customerMap.set(email, {
          id: `CUST-${codeNum}`,
          name: parsedName,
          email: b.customer_email || 'guest@example.com',
          phone: parsedPhone,
          bookings: 1,
          joined: dateStr,
          status: suspendedEmails.includes(email) ? "Suspended" : "Active",
          isVip: false
        })
      }
    })

    // 2. Process equipment bookings
    equipmentBookings.forEach(eb => {
      const email = (eb.customer_email || 'guest@example.com').toLowerCase()
      const dateObj = eb.created_at ? new Date(eb.created_at) : new Date()
      const dateStr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      let parsedName = eb.customer_name || 'Guest User'
      let parsedPhone = '+966 50 123 4567'
      if (parsedName.includes(' | ')) {
        const parts = parsedName.split(' | ')
        parsedName = parts[0]
        parsedPhone = parts[1]
      }

      const existing = customerMap.get(email)
      if (existing) {
        existing.bookings += 1
        if (parsedPhone !== '+966 50 123 4567') {
          existing.phone = parsedPhone
        }
      } else {
        const codeNum = Math.floor(1000 + Math.random() * 9000)
        customerMap.set(email, {
          id: `CUST-${codeNum}`,
          name: parsedName,
          email: eb.customer_email || 'guest@example.com',
          phone: parsedPhone,
          bookings: 1,
          joined: dateStr,
          status: suspendedEmails.includes(email) ? "Suspended" : "Active",
          isVip: false
        })
      }
    })

    // 3. Mark VIP customers (who have repeat/frequent bookings, i.e., total bookings >= 2)
    customerMap.forEach(cust => {
      cust.isVip = cust.bookings >= 2
    })

    setCustomers(Array.from(customerMap.values()))

    // 4. Derive payments from bookings
    const derivedPayments = bookings.map((b, idx) => {
      const dateObj = b.created_at ? new Date(b.created_at) : new Date()
      const dateStr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      const cleanId = b.id ? (b.id.length > 8 ? b.id.substring(0, 8) : b.id) : String(idx).padStart(4, '0')

      let parsedName = b.customer_name || 'Guest User'
      if (parsedName.includes(' | ')) {
        parsedName = parsedName.split(' | ')[0]
      }

      return {
        id: `TXN-${cleanId.toUpperCase()}`,
        invoice: `INV-${cleanId.toUpperCase()}`,
        customer: parsedName,
        amount: b.total_price || 0,
        date: dateStr,
        dateRaw: b.booking_date || (b.created_at ? new Date(b.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
        method: idx % 3 === 0 ? "Apple Pay" : idx % 3 === 1 ? "Credit Card" : "PayPal",
        status: b.status === "Confirmed" || b.status === "Completed" ? "Paid" : b.status === "Cancelled" ? "Refunded" : "Pending"
      }
    })

    setPayments(derivedPayments)
  }, [bookings, equipmentBookings, language, suspendedEmails])

  // Coupon modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(15)
  const [couponExpiry, setCouponExpiry] = useState("2026-12-31")
  const [couponLimit, setCouponLimit] = useState(100)

  const handleToggleCustomerStatus = (id: string) => {
    const cust = customers.find(c => c.id === id)
    if (!cust) return
    const email = cust.email.toLowerCase()
    setSuspendedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

  const handleRefundPayment = async (id: string) => {
    const txnId = id.replace('TXN-', '')
    const targetBooking = bookings.find(b => {
      const cleanId = b.id ? (b.id.length > 8 ? b.id.substring(0, 8) : b.id) : ''
      return cleanId.toUpperCase() === txnId || b.id === txnId
    })

    if (!targetBooking || !targetBooking.id) {
      // Mock payment refund fallback if target booking doesn't exist (mock payment list)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Refunded" } : p))
      return
    }

    setBookings(prev => prev.map(b => b.id === targetBooking.id ? { ...b, status: 'Cancelled' } : b))

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'Cancelled' })
          .eq('id', targetBooking.id)
        if (error) {
          toast.error(language === 'ar' ? 'فشل تحديث الحالة في قاعدة البيانات' : 'Failed to update status in database')
        } else {
          toast.success(language === 'ar' ? 'تم استرداد المبلغ وتحديث حالة الحجز' : 'Payment refunded and booking status updated')
        }
      } catch (e) {
        console.error("Error refunding payment:", e)
      }
    } else {
      toast.success(language === 'ar' ? 'تم استرداد المبلغ بنجاح!' : 'Payment refunded successfully!')
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    // Update local state first
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId)
        if (error) {
          console.error("Error updating status in Supabase:", error.message)
          toast.error(language === 'ar' ? 'فشل تحديث الحالة في قاعدة البيانات' : 'Failed to update status in database')
          const originalBookings = await getBookings()
          setBookings(originalBookings)
        } else {
          toast.success(language === 'ar' ? 'تم تحديث حالة الحجز بنجاح!' : 'Booking status updated successfully!')
        }
      } catch (e) {
        console.error("Error updating booking status:", e)
        const originalBookings = await getBookings()
        setBookings(originalBookings)
      }
    } else {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem("dynamic_bookings")
        if (stored) {
          try {
            const list = JSON.parse(stored) as Booking[]
            const updated = list.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
            localStorage.setItem("dynamic_bookings", JSON.stringify(updated))
          } catch(e) {}
        }
      }
      toast.success(language === 'ar' ? 'تم تحديث حالة الحجز بنجاح!' : 'Booking status updated successfully!')
    }
  }

  const handleAddCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    const newCoupon: Coupon = {
      code: couponCode.trim().toUpperCase(),
      discount: Number(couponDiscount),
      usage: 0,
      limit: Number(couponLimit),
      expiry: couponExpiry,
      status: "Active"
    }
    const originalCoupons = [...coupons]
    const updated = [...coupons, newCoupon]
    setCoupons(updated)
    
    const success = await saveCoupon(newCoupon)
    if (success) {
      toast.success(language === 'ar' ? "تم إنشاء الكوبون بنجاح!" : "Coupon created successfully!")
      setIsCouponModalOpen(false)
      setCouponCode('')
    } else {
      toast.error(
        language === 'ar' 
          ? "فشل حفظ الكوبون في قاعدة البيانات. تحقق من الصلاحيات والـ RLS." 
          : "Failed to save coupon to database. Check permissions and RLS."
      )
      setCoupons(originalCoupons)
    }
  }

  const handleDeleteCoupon = (code: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الكوبون؟' : 'Are you sure you want to delete this coupon?')) {
      const updated = coupons.filter(c => c.code !== code)
      setCoupons(updated)
      
      if (isSupabaseConfigured && supabase) {
        supabase.from('coupons').delete().eq('code', code).then(({ error }) => {
          if (error) {
            console.error("Error deleting coupon in Supabase:", error.message)
            toast.error(language === 'ar' ? "فشل حذف الكوبون من قاعدة البيانات" : "Failed to delete coupon from database")
            setCoupons(coupons)
          } else {
            toast.success(language === 'ar' ? "تم حذف الكوبون بنجاح!" : "Coupon deleted successfully!")
          }
        })
      } else {
        localStorage.setItem("dynamic_coupons", JSON.stringify(updated))
        toast.success(language === 'ar' ? "تم حذف الكوبون محلياً بنجاح!" : "Coupon deleted locally successfully!")
      }
    }
  }

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eqName || !eqNameAr || !eqPrice) {
      toast.error(language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة!" : "Please fill all required fields!")
      return
    }

    const itemToSave: EquipmentItem = {
      id: editingEquipment ? editingEquipment.id : (eqId || generateUUID()),
      name: eqName,
      nameAr: eqNameAr,
      category: eqCategory,
      categoryAr: eqCategoryAr,
      desc: eqDesc,
      descAr: eqDescAr,
      price: Number(eqPrice),
      image: eqImage || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
      status: eqStatus
    }

    const success = await saveEquipmentItem(itemToSave)
    if (success) {
      toast.success(language === 'ar' ? "تم حفظ المعدة بنجاح!" : "Equipment saved successfully!")
      const updatedList = await getEquipment()
      setEquipment(updatedList)
      setIsEquipmentModalOpen(false)
      // Reset form
      setEditingEquipment(null)
      setEqId('')
      setEqName('')
      setEqNameAr('')
      setEqDesc('')
      setEqDescAr('')
      setEqPrice(50)
      setEqImage('')
      setEqStatus('Available')
    } else {
      toast.error(language === 'ar' ? "فشل حفظ المعدة في قاعدة البيانات." : "Failed to save equipment to database.")
    }
  }

  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المعدة؟' : 'Are you sure you want to delete this equipment?')) {
      const success = await deleteEquipmentItem(id)
      if (success) {
        toast.success(language === 'ar' ? "تم حذف المعدة بنجاح!" : "Equipment deleted successfully!")
        const updatedList = await getEquipment()
        setEquipment(updatedList)
      } else {
        toast.error(language === 'ar' ? "فشل حذف المعدة من قاعدة البيانات" : "Failed to delete equipment from database")
      }
    }
  }

  const openAddEquipmentModal = () => {
    setEditingEquipment(null)
    setEqId(generateUUID())
    setEqName('')
    setEqNameAr('')
    setEqCategory('Cameras & Lenses')
    setEqCategoryAr('الكاميرات والعدسات')
    setEqDesc('')
    setEqDescAr('')
    setEqPrice(50)
    setEqImage('')
    setEqStatus('Available')
    setIsEquipmentModalOpen(true)
  }

  const openEditEquipmentModal = (item: EquipmentItem) => {
    setEditingEquipment(item)
    setEqId(item.id)
    setEqName(item.name)
    setEqNameAr(item.nameAr)
    setEqCategory(item.category)
    setEqCategoryAr(item.categoryAr)
    setEqDesc(item.desc)
    setEqDescAr(item.descAr)
    setEqPrice(item.price)
    setEqImage(item.image)
    setEqStatus(item.status)
    setIsEquipmentModalOpen(true)
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
    setStudioLocation('')
    setStudioLocationAr('')
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
    setStudioLocation(studio.location || '')
    setStudioLocationAr(studio.locationAr || '')
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
      
      if (isSupabaseConfigured && supabase) {
        supabase.from('studios').delete().eq('id', studioId).then(({ error }) => {
          if (error) {
            console.error("Error deleting studio in Supabase:", error.message)
            toast.error(language === 'ar' ? "فشل حذف الاستوديو من قاعدة البيانات" : "Failed to delete studio from database")
            setStudios(studios)
            saveStudios(studios)
          } else {
            toast.success(language === 'ar' ? "تم حذف الاستوديو بنجاح!" : "Studio deleted successfully!")
          }
        })
      } else {
        toast.success(language === 'ar' ? "تم حذف الاستوديو محلياً بنجاح!" : "Studio deleted locally successfully!")
      }
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

    const targetId = editingStudio ? editingStudio.id : String(Date.now())
    const updatedStudio: Studio = {
      id: targetId,
      name: studioName,
      nameAr: studioNameAr,
      category: studioCategory,
      categoryAr: studioCategoryAr,
      desc: studioDesc,
      descAr: studioDescAr,
      price: Number(studioPrice),
      capacity: Number(studioCapacity),
      rating: editingStudio?.rating || 5.0,
      images: finalImages,
      amenities: parsedAmenities,
      amenitiesAr: parsedAmenitiesAr,
      equipment: parsedEquipment,
      equipmentAr: parsedEquipmentAr,
      location: studioLocation,
      locationAr: studioLocationAr
    }

    const nextStudios = editingStudio 
      ? studios.map(s => s.id === editingStudio.id ? updatedStudio : s)
      : [...studios, updatedStudio]

    setStudios(nextStudios)
    saveStudios(nextStudios)

    if (isSupabaseConfigured && supabase) {
      supabase.from('studios').upsert({
        id: targetId,
        name: studioName,
        name_ar: studioNameAr,
        category: studioCategory,
        category_ar: studioCategoryAr,
        desc: studioDesc,
        desc_ar: studioDescAr,
        price: Number(studioPrice),
        capacity: Number(studioCapacity),
        rating: editingStudio?.rating || 5.0,
        images: finalImages,
        amenities: parsedAmenities,
        amenities_ar: parsedAmenitiesAr,
        equipment: parsedEquipment,
        equipment_ar: parsedEquipmentAr,
        location: studioLocation,
        location_ar: studioLocationAr
      }).then(({ error }) => {
        if (error) {
          console.error("Error upserting studio in Supabase:", error.message, error.details, error.hint)
          if (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('location')) {
            toast.warning(
              language === 'ar'
                ? "تنبيه: لم يتم العثور على أعمدة الموقع في قاعدة البيانات. تم الحفظ بدونها. يرجى تشغيل كود SQL لتفعيلها."
                : "Note: Location columns not found in database. Saved without them. Please run the SQL migration."
            )
            // Retry without location columns
            supabase.from('studios').upsert({
              id: targetId,
              name: studioName,
              name_ar: studioNameAr,
              category: studioCategory,
              category_ar: studioCategoryAr,
              desc: studioDesc,
              desc_ar: studioDescAr,
              price: Number(studioPrice),
              capacity: Number(studioCapacity),
              rating: editingStudio?.rating || 5.0,
              images: finalImages,
              amenities: parsedAmenities,
              amenities_ar: parsedAmenitiesAr,
              equipment: parsedEquipment,
              equipment_ar: parsedEquipmentAr
            }).then(({ error: retryErr }) => {
              if (retryErr) {
                console.error("Retry upsert error:", retryErr.message)
                setStudios(studios)
                saveStudios(studios)
              }
            })
          } else {
            toast.error(
              language === 'ar' 
                ? `فشل حفظ الاستوديو في قاعدة البيانات: ${error.message}` 
                : `Failed to save studio in database: ${error.message}`
            )
            setStudios(studios)
            saveStudios(studios)
          }
        } else {
          toast.success(
            language === 'ar'
              ? "تم حفظ الاستوديو بنجاح في قاعدة البيانات!"
              : "Studio saved successfully in the database!"
          )
        }
      })
    } else {
      toast.success(
        language === 'ar'
          ? "تم حفظ الاستوديو محلياً بنجاح!"
          : "Studio saved locally successfully!"
      )
    }
    setIsStudioModalOpen(false)
  }

  const getYearAndMonth = (dateStr?: string) => {
    if (!dateStr) return { year: null, month: null }
    const parts = dateStr.split('-')
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      if (!isNaN(y) && !isNaN(m)) {
        return { year: y, month: m }
      }
    }
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    }
    return { year: null, month: null }
  }

  // Calculate dynamic monthly revenue for the chart
  const getMonthlyRevenueData = () => {
    if (bookings.length === 0) {
      return [
        { month: language === 'ar' ? 'يناير' : 'Jan', pct: 40 },
        { month: language === 'ar' ? 'فبراير' : 'Feb', pct: 55 },
        { month: language === 'ar' ? 'مارس' : 'Mar', pct: 45 },
        { month: language === 'ar' ? 'أبريل' : 'Apr', pct: 70 },
        { month: language === 'ar' ? 'مايو' : 'May', pct: 85 },
        { month: language === 'ar' ? 'يونيو' : 'Jun', pct: 95 }
      ]
    }

    const monthlyMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
      'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
    }
    
    bookings.forEach(b => {
      if (b.booking_date) {
        const dateObj = new Date(b.booking_date)
        const monthShort = dateObj.toLocaleString('en-US', { month: 'short' })
        if (monthlyMap[monthShort] !== undefined) {
          monthlyMap[monthShort] += (b.total_price || 0)
        }
      }
    })
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const currentMonthIdx = new Date().getMonth()
    
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12
      const m = months[idx]
      const mAr = arMonths[idx]
      last6Months.push({
        month: language === 'ar' ? mAr : m,
        val: monthlyMap[m] || 0
      })
    }
    
    const maxVal = Math.max(...last6Months.map(d => d.val), 1)
    return last6Months.map(d => ({
      month: d.month,
      pct: (d.val / maxVal) * 100
    }))
  }

  const chartData = getMonthlyRevenueData()

  // Base filtered bookings list based on Month and Year (and search query below)
  const dateFilteredBookings = bookings.filter(b => {
    if (filterMonth !== 'all' || filterYear !== 'all') {
      const { year, month } = getYearAndMonth(b.booking_date)
      if (filterYear !== 'all' && String(year) !== filterYear) return false
      if (filterMonth !== 'all' && String(month) !== filterMonth) return false
    }
    return true
  })

  const dateFilteredEquipmentBookings = equipmentBookings.filter(eb => {
    if (filterMonth !== 'all' || filterYear !== 'all') {
      const { year, month } = getYearAndMonth(eb.booking_date)
      if (filterYear !== 'all' && String(year) !== filterYear) return false
      if (filterMonth !== 'all' && String(month) !== filterMonth) return false
    }
    return true
  })

  // Date-filtered payments for stats
  const dateFilteredPayments = payments.filter(p => {
    if (filterMonth !== 'all' || filterYear !== 'all') {
      const { year, month } = getYearAndMonth(p.dateRaw)
      if (filterYear !== 'all' && String(year) !== filterYear) return false
      if (filterMonth !== 'all' && String(month) !== filterMonth) return false
    }
    return true
  })

  const computedRevenue = dateFilteredBookings.reduce((sum, b) => sum + (b.total_price || 0), 0) + 
    dateFilteredEquipmentBookings.reduce((sum, eb) => sum + (eb.total_price || 0), 0)
  const uniqueCustomersCount = new Set(dateFilteredBookings.map(b => b.customer_email)).size

  const ANALYTICS = {
    revenue: language === 'ar' ? `${computedRevenue.toLocaleString()} ر.س` : `${computedRevenue.toLocaleString()} SAR`,
    bookings: String(dateFilteredBookings.length + dateFilteredEquipmentBookings.length),
    utilization: "72%",
    customers: String(uniqueCustomersCount || 92)
  }

  // Calculate payment stats based on derived payments
  const totalPaid = dateFilteredPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = dateFilteredPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0)
  const totalRefunded = dateFilteredPayments.filter(p => p.status === 'Refunded').reduce((sum, p) => sum + p.amount, 0)

  const filteredBookings = bookings.filter(b => {
    // Search query filter
    const matchesSearch = (b.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.studio_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    // Month/Year filter
    const { year, month } = getYearAndMonth(b.booking_date)
    if (filterYear !== 'all' && String(year) !== filterYear) return false
    if (filterMonth !== 'all' && String(month) !== filterMonth) return false
    return true
  }).map(b => {
    let parsedName = b.customer_name || 'Guest User'
    if (parsedName.includes(' | ')) {
      parsedName = parsedName.split(' | ')[0]
    }
    return {
      id: b.id || 'BK-NEW',
      customer: parsedName,
      studio: language === 'ar' ? b.studio_name_ar : b.studio_name,
      date: b.booking_date,
      bookingDate: b.booking_date,
      timeSlots: Array.isArray(b.time_slots) ? b.time_slots : [],
      revenue: b.total_price,
      status: b.status
    }
  })

  const filteredEquipmentBookings = equipmentBookings.filter(b => {
    // Search query filter
    const matchesSearch = (b.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    // Month/Year filter
    const { year, month } = getYearAndMonth(b.booking_date)
    if (filterYear !== 'all' && String(year) !== filterYear) return false
    if (filterMonth !== 'all' && String(month) !== filterMonth) return false
    return true
  }).map(b => {
    return {
      id: b.id || 'EQ-NEW',
      customer: b.customer_name || 'Guest User',
      email: b.customer_email || '',
      equipment: language === 'ar' ? (b.equipment_names_ar || b.equipment_names || []).join(' ، ') : (b.equipment_names || []).join(', '),
      equipmentNames: b.equipment_names || [],
      equipmentNamesAr: b.equipment_names_ar || [],
      date: b.start_time && b.end_time
        ? `${b.booking_date} (${b.start_time}) to ${b.end_date} (${b.end_time})`
        : `${b.booking_date} to ${b.end_date}`,
      bookingDate: b.booking_date,
      endDate: b.end_date,
      startTime: b.start_time || '',
      endTime: b.end_time || '',
      revenue: b.total_price,
      status: b.status || 'Confirmed'
    }
  })

  const filteredCustomers = customers.filter(c => {
    // Search query filter
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    // Month/Year filter: Only show customers active in the selected period
    if (filterMonth !== 'all' || filterYear !== 'all') {
      const email = c.email.toLowerCase()
      const hasStudioBooking = bookings.some(b => {
        if ((b.customer_email || '').toLowerCase() !== email) return false
        const { year, month } = getYearAndMonth(b.booking_date)
        if (filterYear !== 'all' && String(year) !== filterYear) return false
        if (filterMonth !== 'all' && String(month) !== filterMonth) return false
        return true
      })
      const hasEqBooking = equipmentBookings.some(eb => {
        if ((eb.customer_email || '').toLowerCase() !== email) return false
        const { year, month } = getYearAndMonth(eb.booking_date)
        if (filterYear !== 'all' && String(year) !== filterYear) return false
        if (filterMonth !== 'all' && String(month) !== filterMonth) return false
        return true
      })
      return hasStudioBooking || hasEqBooking
    }
    
    return true
  })

  const filteredPayments = dateFilteredPayments.filter(p => 
    p.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpdateEquipmentBookingStatus = async (bookingId: string, newStatus: string) => {
    // Update local state first
    setEquipmentBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('booking_equipment')
          .update({ status: newStatus })
          .eq('id', bookingId)
        if (error) {
          console.error("Error updating status in Supabase:", error.message)
          toast.error(language === 'ar' ? 'فشل تحديث الحالة في قاعدة البيانات' : 'Failed to update status in database')
          const original = await getEquipmentBookings()
          setEquipmentBookings(original)
        } else {
          toast.success(language === 'ar' ? 'تم تحديث حالة الحجز بنجاح!' : 'Booking status updated successfully!')
        }
      } catch (e) {
        console.error("Error updating equipment booking status:", e)
        const original = await getEquipmentBookings()
        setEquipmentBookings(original)
      }
    } else {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem("dynamic_equipment_bookings")
        if (stored) {
          try {
            const list = JSON.parse(stored) as EquipmentBooking[]
            const updated = list.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
            localStorage.setItem("dynamic_equipment_bookings", JSON.stringify(updated))
          } catch(e) {}
        }
      }
      toast.success(language === 'ar' ? 'تم تحديث حالة الحجز بنجاح!' : 'Booking status updated successfully!')
    }
  }

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

  // Reports and Statistics Calculations
  const getReportsData = () => {
    const studioRev = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
    const eqRev = equipmentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
    const totalRev = studioRev + eqRev
    
    const activeStudioBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length
    const activeEqBookings = equipmentBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length

    // Studio ranking
    const studioStats: { [name: string]: { name: string; nameAr: string; count: number; revenue: number } } = {}
    bookings.forEach(b => {
      const key = b.studio_name || 'Unknown'
      if (!studioStats[key]) {
        studioStats[key] = {
          name: b.studio_name || 'Unknown',
          nameAr: b.studio_name_ar || 'غرفة استوديو',
          count: 0,
          revenue: 0
        }
      }
      studioStats[key].count++
      studioStats[key].revenue += (b.total_price || 0)
    })
    const rankedStudios = Object.values(studioStats).sort((a, b) => b.revenue - a.revenue)

    // Equipment ranking
    const eqStats: { [name: string]: { name: string; nameAr: string; count: number; revenue: number } } = {}
    equipmentBookings.forEach(b => {
      const names = b.equipment_names || []
      const namesAr = b.equipment_names_ar || []
      names.forEach((name, idx) => {
        const arName = namesAr[idx] || name
        if (!eqStats[name]) {
          eqStats[name] = {
            name,
            nameAr: arName,
            count: 0,
            revenue: 0
          }
        }
        eqStats[name].count++
        eqStats[name].revenue += (b.total_price / names.length) || 0
      })
    })
    const rankedEquipment = Object.values(eqStats).sort((a, b) => b.revenue - a.revenue)

    // Customer spending ranking
    const customerStats: { [email: string]: { name: string; email: string; count: number; spend: number } } = {}
    bookings.forEach(b => {
      const key = b.customer_email || 'guest'
      if (!customerStats[key]) {
        customerStats[key] = {
          name: b.customer_name || 'Guest',
          email: key,
          count: 0,
          spend: 0
        }
      }
      customerStats[key].count++
      customerStats[key].spend += (b.total_price || 0)
    })
    equipmentBookings.forEach(b => {
      const key = b.customer_email || 'guest'
      if (!customerStats[key]) {
        customerStats[key] = {
          name: b.customer_name || 'Guest',
          email: key,
          count: 0,
          spend: 0
        }
      }
      customerStats[key].count++
      customerStats[key].spend += (b.total_price || 0)
    })
    const rankedCustomers = Object.values(customerStats).sort((a, b) => b.spend - a.spend).slice(0, 5)

    return {
      studioRev,
      eqRev,
      totalRev,
      activeStudioBookings,
      activeEqBookings,
      rankedStudios,
      rankedEquipment,
      rankedCustomers
    }
  }

  const reportsData = getReportsData()

  // Excel Exporter using SheetJS
  const downloadExcelReport = () => {
    const isAr = language === 'ar'
    
    // 1. Summary Sheet Data
    const summaryData = [
      {
        [isAr ? 'المؤشر' : 'Metric']: isAr ? 'عائدات الاستوديوهات' : 'Studio Revenue',
        [isAr ? 'القيمة' : 'Value']: `$${reportsData.studioRev.toLocaleString()}`
      },
      {
        [isAr ? 'المؤشر' : 'Metric']: isAr ? 'عائدات المعدات' : 'Equipment Revenue',
        [isAr ? 'القيمة' : 'Value']: `$${reportsData.eqRev.toLocaleString()}`
      },
      {
        [isAr ? 'المؤشر' : 'Metric']: isAr ? 'اجمالي العائدات' : 'Total Revenue',
        [isAr ? 'القيمة' : 'Value']: `$${reportsData.totalRev.toLocaleString()}`
      },
      {
        [isAr ? 'المؤشر' : 'Metric']: isAr ? 'اجمالي الحجوزات' : 'Total Bookings',
        [isAr ? 'القيمة' : 'Value']: reportsData.activeStudioBookings + reportsData.activeEqBookings
      }
    ]

    // 2. Studio Bookings Sheet Data
    const studioRows = bookings.map(b => ({
      [isAr ? 'رقم الحجز' : 'Booking ID']: b.id || '',
      [isAr ? 'اسم العميل' : 'Customer Name']: b.customer_name || '',
      [isAr ? 'البريد الإلكتروني' : 'Customer Email']: b.customer_email || '',
      [isAr ? 'الاستوديو' : 'Studio Name']: isAr ? b.studio_name_ar : b.studio_name || '',
      [isAr ? 'التاريخ' : 'Date']: b.booking_date || '',
      [isAr ? 'الأوقات' : 'Time Slots']: (b.time_slots || []).join(', '),
      [isAr ? 'المبلغ الإجمالي' : 'Total Price']: b.total_price || 0,
      [isAr ? 'الحالة' : 'Status']: b.status || ''
    }))

    // 3. Equipment Bookings Sheet Data
    const eqRows = equipmentBookings.map(eb => ({
      [isAr ? 'رقم الحجز' : 'Booking ID']: eb.id || '',
      [isAr ? 'اسم العميل' : 'Customer Name']: eb.customer_name || '',
      [isAr ? 'البريد الإلكتروني' : 'Customer Email']: eb.customer_email || '',
      [isAr ? 'المعدات' : 'Equipment Rented']: (isAr ? eb.equipment_names_ar || eb.equipment_names : eb.equipment_names || []).join(' | '),
      [isAr ? 'تاريخ البدء' : 'Start Date']: eb.booking_date || '',
      [isAr ? 'تاريخ الانتهاء' : 'End Date']: eb.end_date || '',
      [isAr ? 'وقت البدء' : 'Start Time']: eb.start_time || '',
      [isAr ? 'وقت الانتهاء' : 'End Time']: eb.end_time || '',
      [isAr ? 'المبلغ الإجمالي' : 'Total Price']: eb.total_price || 0,
      [isAr ? 'الحالة' : 'Status']: eb.status || ''
    }))

    // Create Sheets
    const wb = XLSX.utils.book_new()
    
    const summaryWS = XLSX.utils.json_to_sheet(summaryData)
    const studioWS = XLSX.utils.json_to_sheet(studioRows)
    const eqWS = XLSX.utils.json_to_sheet(eqRows)

    // Append sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWS, isAr ? 'الملخص' : 'Summary')
    XLSX.utils.book_append_sheet(wb, studioWS, isAr ? 'حجوزات الاستوديو' : 'Studio Bookings')
    XLSX.utils.book_append_sheet(wb, eqWS, isAr ? 'حجوزات المعدات' : 'Equipment Bookings')

    // Write file
    XLSX.writeFile(wb, `Lumiere_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Individual export reports for Bookings, Customers, Payments
  const handleExportReport = () => {
    const isAr = language === 'ar'
    
    if (activeTab === 'customers') {
      // Export Customers Report
      const dataToExport = filteredCustomers.map(c => ({
        [isAr ? 'معرف العميل' : 'Customer ID']: c.id,
        [isAr ? 'الاسم' : 'Name']: c.name,
        [isAr ? 'البريد الإلكتروني' : 'Email']: c.email,
        [isAr ? 'الهاتف' : 'Phone']: c.phone,
        [isAr ? 'عدد الحجوزات' : 'Bookings Count']: c.bookings,
        [isAr ? 'تاريخ الانضمام' : 'Joined Date']: c.joined,
        [isAr ? 'حالة VIP' : 'VIP Status']: c.isVip ? (isAr ? 'VIP (حجوزات متكررة)' : 'VIP (Repeat bookings)') : (isAr ? 'عادي' : 'Regular'),
        [isAr ? 'الحالة' : 'Status']: c.status === 'Active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Suspended')
      }))

      // Summary details to append
      const totalVipCount = filteredCustomers.filter(c => c.isVip).length
      const summaryRows = [
        {},
        {
          [isAr ? 'معرف العميل' : 'Customer ID']: isAr ? 'إجمالي العملاء' : 'Total Customers',
          [isAr ? 'الاسم' : 'Name']: filteredCustomers.length
        },
        {
          [isAr ? 'معرف العميل' : 'Customer ID']: isAr ? 'إجمالي عملاء VIP' : 'Total VIP Customers',
          [isAr ? 'الاسم' : 'Name']: totalVipCount
        }
      ]

      const ws = XLSX.utils.json_to_sheet([...dataToExport, ...summaryRows])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isAr ? 'تقرير العملاء' : 'Customers Report')
      XLSX.writeFile(wb, `Customers_Report_${filterMonth}_${filterYear}.xlsx`)

    } else if (activeTab === 'billing') {
      // Export Payments Report
      const dataToExport = filteredPayments.map(p => ({
        [isAr ? 'رقم المعاملة' : 'Transaction ID']: p.id,
        [isAr ? 'رقم الفاتورة' : 'Invoice Number']: p.invoice,
        [isAr ? 'العميل' : 'Customer']: p.customer,
        [isAr ? 'المبلغ' : 'Amount']: isAr ? `${p.amount} ر.س` : `${p.amount} SAR`,
        [isAr ? 'طريقة الدفع' : 'Payment Method']: p.method,
        [isAr ? 'التاريخ' : 'Date']: p.date,
        [isAr ? 'الحالة' : 'Status']: p.status === 'Paid' ? (isAr ? 'مدفوع' : 'Paid') : p.status === 'Pending' ? (isAr ? 'قيد الانتظار' : 'Pending') : (isAr ? 'مسترد' : 'Refunded')
      }))

      const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
      const summaryRows = [
        {},
        {
          [isAr ? 'رقم المعاملة' : 'Transaction ID']: isAr ? 'إجمالي المبالغ' : 'Total Amount',
          [isAr ? 'رقم الفاتورة' : 'Invoice Number']: isAr ? `${totalAmount} ر.س` : `${totalAmount} SAR`
        },
        {
          [isAr ? 'رقم المعاملة' : 'Transaction ID']: isAr ? 'إجمالي عدد العمليات' : 'Total Transactions',
          [isAr ? 'رقم الفاتورة' : 'Invoice Number']: filteredPayments.length
        }
      ]

      const ws = XLSX.utils.json_to_sheet([...dataToExport, ...summaryRows])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isAr ? 'تقرير المدفوعات' : 'Payments Report')
      XLSX.writeFile(wb, `Payments_Report_${filterMonth}_${filterYear}.xlsx`)

    } else if (activeTab === 'bookings') {
      if (bookingSubTab === 'studio') {
        // Export Studio Bookings Report
        const dataToExport = filteredBookings.map(b => ({
          [isAr ? 'رقم الحجز' : 'Booking ID']: b.id ? (b.id.startsWith('ST-') ? b.id : `ST-${b.id.substring(0, 8).toUpperCase()}`) : '',
          [isAr ? 'العميل' : 'Customer']: b.customer,
          [isAr ? 'الاستوديو' : 'Studio Space']: b.studio,
          [isAr ? 'التاريخ' : 'Booking Date']: b.bookingDate,
          [isAr ? 'الأوقات' : 'Time Slots']: b.timeSlots.join(', '),
          [isAr ? 'العائدات' : 'Revenue']: isAr ? `${b.revenue} ر.س` : `${b.revenue} SAR`,
          [isAr ? 'الحالة' : 'Status']: b.status || ''
        }))

        const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
        const summaryRows = [
          {},
          {
            [isAr ? 'رقم الحجز' : 'Booking ID']: isAr ? 'إجمالي العائدات' : 'Total Revenue',
            [isAr ? 'العميل' : 'Customer']: isAr ? `${totalRevenue} ر.س` : `${totalRevenue} SAR`
          },
          {
            [isAr ? 'رقم الحجز' : 'Booking ID']: isAr ? 'إجمالي الحجوزات' : 'Total Bookings',
            [isAr ? 'العميل' : 'Customer']: filteredBookings.length
          }
        ]

        const ws = XLSX.utils.json_to_sheet([...dataToExport, ...summaryRows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, isAr ? 'حجوزات الاستوديو' : 'Studio Bookings')
        XLSX.writeFile(wb, `Studio_Bookings_Report_${filterMonth}_${filterYear}.xlsx`)

      } else {
        // Export Equipment Bookings Report
        const dataToExport = filteredEquipmentBookings.map(eb => ({
          [isAr ? 'رقم الحجز' : 'Booking ID']: eb.id ? (eb.id.startsWith('EQ-') ? eb.id : `EQ-${eb.id.substring(0, 8).toUpperCase()}`) : '',
          [isAr ? 'العميل' : 'Customer']: eb.customer,
          [isAr ? 'البريد الإلكتروني' : 'Email']: eb.email,
          [isAr ? 'المعدات المحجوزة' : 'Rented Equipment']: eb.equipment,
          [isAr ? 'تاريخ الحجز' : 'Date/Time Range']: eb.date,
          [isAr ? 'التكلفة الإجمالية' : 'Total Price']: isAr ? `${eb.revenue} ر.س` : `${eb.revenue} SAR`,
          [isAr ? 'الحالة' : 'Status']: eb.status || 'Confirmed'
        }))

        const totalRevenue = filteredEquipmentBookings.reduce((sum, eb) => sum + (eb.revenue || 0), 0)
        const summaryRows = [
          {},
          {
            [isAr ? 'رقم الحجز' : 'Booking ID']: isAr ? 'إجمالي العائدات' : 'Total Revenue',
            [isAr ? 'العميل' : 'Customer']: isAr ? `${totalRevenue} ر.س` : `${totalRevenue} SAR`
          },
          {
            [isAr ? 'رقم الحجز' : 'Booking ID']: isAr ? 'إجمالي الحجوزات' : 'Total Bookings',
            [isAr ? 'العميل' : 'Customer']: filteredEquipmentBookings.length
          }
        ]

        const ws = XLSX.utils.json_to_sheet([...dataToExport, ...summaryRows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, isAr ? 'حجوزات المعدات' : 'Equipment Bookings')
        XLSX.writeFile(wb, `Equipment_Bookings_Report_${filterMonth}_${filterYear}.xlsx`)
      }
    }
  }

  // Filter rendering helper component
  const renderFiltersAndExport = () => {
    const isAr = language === 'ar'
    return (
      <div className="flex flex-wrap items-center gap-3">
        {/* Month Selector */}
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-foreground/[0.03] border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
        >
          <option value="all">{isAr ? 'جميع الأشهر' : 'All Months'}</option>
          <option value="1">{isAr ? 'يناير (01)' : 'January (01)'}</option>
          <option value="2">{isAr ? 'فبراير (02)' : 'February (02)'}</option>
          <option value="3">{isAr ? 'مارس (03)' : 'March (03)'}</option>
          <option value="4">{isAr ? 'أبريل (04)' : 'April (04)'}</option>
          <option value="5">{isAr ? 'مايو (05)' : 'May (05)'}</option>
          <option value="6">{isAr ? 'يونيو (06)' : 'June (06)'}</option>
          <option value="7">{isAr ? 'يوليو (07)' : 'July (07)'}</option>
          <option value="8">{isAr ? 'أغسطس (08)' : 'August (08)'}</option>
          <option value="9">{isAr ? 'سبتمبر (09)' : 'September (09)'}</option>
          <option value="10">{isAr ? 'أكتوبر (10)' : 'October (10)'}</option>
          <option value="11">{isAr ? 'نوفمبر (11)' : 'November (11)'}</option>
          <option value="12">{isAr ? 'ديسمبر (12)' : 'December (12)'}</option>
        </select>

        {/* Year Selector */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-foreground/[0.03] border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
        >
          <option value="all">{isAr ? 'جميع السنوات' : 'All Years'}</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
        </select>

        {/* Export Button */}
        <button
          onClick={handleExportReport}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(177,18,38,0.15)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>{isAr ? 'تصدير التقرير' : 'Export Report'}</span>
        </button>
      </div>
    )
  }


  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="pt-28 pb-32 min-h-screen bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-2">
            {[
              { id: 'overview', label: t('admin.overview'), icon: LayoutDashboard },
              { id: 'reports', label: language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Analytics', icon: BarChart2 },
              { id: 'bookings', label: t('admin.bookings'), icon: CalendarIcon },
              { id: 'studios', label: t('admin.studios'), icon: Video },
              { id: 'equipment', label: language === 'ar' ? 'المعدات' : 'Equipment', icon: Camera },
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
                    
                    {chartData.map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-3 z-10">
                        <div className="w-full bg-foreground/5 rounded-t-lg relative overflow-hidden group h-40 flex items-end">
                          <div 
                            className="w-full bg-gradient-to-t from-primary-velvet to-primary group-hover:to-primary-accent transition-all duration-1000 ease-out" 
                            style={{ height: `${data.pct}%` }} 
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
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-foreground/5 transition-colors">
                            <td className="py-4 font-mono text-xs" title={booking.id}>{booking.id ? (booking.id.startsWith('ST-') ? booking.id : `ST-${booking.id.substring(0, 8).toUpperCase()}`) : ''}</td>
                            <td className="py-4 font-semibold text-foreground">{booking.customer}</td>
                            <td className="py-4 text-muted-foreground">{booking.studio}</td>
                            <td className="py-4">
                              <div className="flex w-full justify-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                <div className="flex flex-col gap-1 text-xs text-foreground font-semibold items-start" dir="ltr">
                                  <span className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                    {booking.bookingDate}
                                  </span>
                                  {booking.timeSlots && booking.timeSlots.length > 0 && (
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                                      <Clock className="w-3.5 h-3.5 text-muted-foreground/75 shrink-0" />
                                      {booking.timeSlots[0]} - {getSlotEndTime(booking.timeSlots[booking.timeSlots.length - 1])}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 font-bold text-foreground">${booking.revenue}</td>
                            <td className="py-4 text-right">
                              <select
                                value={booking.status?.toLowerCase().includes('pend') ? 'Pending' : booking.status}
                                onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-transparent hover:bg-foreground/[0.03] focus:outline-none transition-colors cursor-pointer ${
                                  (booking.status || '').toLowerCase().includes('confirm') ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                                  (booking.status || '').toLowerCase().includes('complete') ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                  (booking.status || '').toLowerCase().includes('cancel') ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' :
                                  'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
                                }`}
                              >
                                <option value="Pending" className="bg-[#18181b] text-yellow-400">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                <option value="Confirmed" className="bg-[#18181b] text-green-400">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                                <option value="Completed" className="bg-[#18181b] text-blue-400">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="Cancelled" className="bg-[#18181b] text-rose-400">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                              </select>
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
                  <div className="flex items-center gap-3 flex-wrap">
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
                    {renderFiltersAndExport()}
                  </div>
                </div>

                {/* Sub-tabs segment selector */}
                <div className="flex gap-4 border-b border-border pb-3">
                  <button
                    onClick={() => setBookingSubTab('studio')}
                    className={`pb-2 px-1 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                      bookingSubTab === 'studio' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                    }`}
                  >
                    {language === 'ar' ? 'حجوزات الاستوديو' : 'Studio Bookings'}
                  </button>
                  <button
                    onClick={() => setBookingSubTab('equipment')}
                    className={`pb-2 px-1 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                      bookingSubTab === 'equipment' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                    }`}
                  >
                    {language === 'ar' ? 'حجوزات المعدات' : 'Equipment Bookings'}
                  </button>
                </div>
                {bookingSubTab === 'studio' ? (
                  <div className="glass-card p-6 rounded-3xl overflow-x-auto">
                    <table className={`w-full text-sm min-w-[600px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="pb-4 px-4 w-[15%]">{t('admin.bookingId')}</th>
                          <th className="pb-4 px-4 w-[25%]">{t('admin.customer')}</th>
                          <th className="pb-4 px-4 w-[25%]">{t('admin.studioSpace')}</th>
                          <th className="pb-4 px-4 w-[20%]">{t('admin.date')}</th>
                          <th className="pb-4 px-4 w-[10%]">{t('admin.revenue')}</th>
                          <th className="pb-4 px-4 w-[5%]">{t('admin.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-foreground/5 transition-colors">
                            <td className="py-4 px-4 font-mono text-xs" title={booking.id}>{booking.id ? (booking.id.startsWith('ST-') ? booking.id : `ST-${booking.id.substring(0, 8).toUpperCase()}`) : ''}</td>
                            <td className="py-4 px-4 font-semibold text-foreground">{booking.customer}</td>
                            <td className="py-4 px-4 text-muted-foreground">{booking.studio}</td>
                            <td className="py-4 px-4">
                              <div className="flex w-full justify-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                <div className="flex flex-col gap-1 text-xs text-foreground font-semibold items-start" dir="ltr">
                                  <span className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                    {booking.bookingDate}
                                  </span>
                                  {booking.timeSlots && booking.timeSlots.length > 0 && (
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                                      <Clock className="w-3.5 h-3.5 text-muted-foreground/75 shrink-0" />
                                      {booking.timeSlots[0]} - {getSlotEndTime(booking.timeSlots[booking.timeSlots.length - 1])}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-bold text-foreground">${booking.revenue}</td>
                            <td className="py-4 px-4">
                              <select
                                value={booking.status?.toLowerCase().includes('pend') ? 'Pending' : booking.status}
                                onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-transparent hover:bg-foreground/[0.03] focus:outline-none transition-colors cursor-pointer ${
                                  (booking.status || '').toLowerCase().includes('confirm') ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                                  (booking.status || '').toLowerCase().includes('complete') ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                  (booking.status || '').toLowerCase().includes('cancel') ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' :
                                  'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
                                }`}
                              >
                                <option value="Pending" className="bg-[#18181b] text-yellow-400">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                <option value="Confirmed" className="bg-[#18181b] text-green-400">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                                <option value="Completed" className="bg-[#18181b] text-blue-400">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="Cancelled" className="bg-[#18181b] text-rose-400">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-3xl overflow-x-auto">
                    <table className={`w-full text-sm min-w-[600px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="pb-4 px-4 w-[15%]">{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</th>
                          <th className="pb-4 px-4 w-[20%]">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className="pb-4 px-4 w-[30%]">{language === 'ar' ? 'المعدات المحجوزة' : 'Rented Equipment'}</th>
                          <th className="pb-4 px-4 w-[20%]">{language === 'ar' ? 'تاريخ الحجز' : 'Date Range'}</th>
                          <th className="pb-4 px-4 w-[10%]">{language === 'ar' ? 'التكلفة الإجمالية' : 'Total Revenue'}</th>
                          <th className="pb-4 px-4 w-[5%]">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredEquipmentBookings.map((booking) => {
                          const customerParts = booking.customer.split(' | ')
                          const customerName = customerParts[0]
                          const customerPhone = customerParts[1] || ''

                          return (
                            <tr key={booking.id} className="hover:bg-foreground/5 transition-colors">
                              {/* Booking ID */}
                              <td className="py-4 px-4 font-mono text-xs" title={booking.id}>
                                {booking.id ? (booking.id.startsWith('EQ-') || booking.id.startsWith('EQB-') ? booking.id : `EQ-${booking.id.substring(0, 8).toUpperCase()}`) : ''}
                              </td>
                              
                              {/* Customer */}
                              <td className="py-4 px-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-foreground text-sm">{customerName}</span>
                                  {customerPhone && (
                                    <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                                      {customerPhone}
                                    </span>
                                  )}
                                  {booking.email && (
                                    <span className="text-xs text-muted-foreground/60 font-mono">
                                      {booking.email}
                                    </span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Rented Equipment */}
                              <td className="py-4 px-4">
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {language === 'ar' ? (
                                    booking.equipmentNamesAr && booking.equipmentNamesAr.length > 0 ? (
                                      booking.equipmentNamesAr.map((name, idx) => (
                                        <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs font-medium">
                                          {name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground text-xs">{booking.equipment}</span>
                                    )
                                  ) : (
                                    booking.equipmentNames && booking.equipmentNames.length > 0 ? (
                                      booking.equipmentNames.map((name, idx) => (
                                        <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs font-medium">
                                          {name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground text-xs">{booking.equipment}</span>
                                    )
                                  )}
                                </div>
                              </td>
                              
                              {/* Date Range */}
                              <td className="py-4 px-4">
                                <div className="flex w-full justify-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                  <div className="flex flex-col gap-1 text-xs text-foreground font-semibold items-start" dir="ltr">
                                    <span className="flex items-center gap-1.5">
                                      <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                      {booking.bookingDate} {booking.bookingDate !== booking.endDate ? `${language === 'ar' ? ' إلى ' : ' to '}${booking.endDate}` : ''}
                                    </span>
                                    {booking.startTime && booking.endTime && (
                                      <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground/75 shrink-0" />
                                        {booking.startTime} - {booking.endTime}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Total Revenue */}
                              <td className="py-4 px-4 font-bold text-foreground">
                                ${booking.revenue ? Number(booking.revenue).toLocaleString() : '0'}
                              </td>
                              
                              {/* Status */}
                              <td className="py-4 px-4">
                                <select
                                  value={booking.status?.toLowerCase().includes('pend') ? 'Pending' : booking.status}
                                  onChange={(e) => handleUpdateEquipmentBookingStatus(booking.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-transparent hover:bg-foreground/[0.03] focus:outline-none transition-colors cursor-pointer ${
                                    (booking.status || '').toLowerCase().includes('confirm') ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                                    (booking.status || '').toLowerCase().includes('complete') ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                    (booking.status || '').toLowerCase().includes('cancel') ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' :
                                    'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
                                  }`}
                                >
                                  <option value="Pending" className="bg-[#18181b] text-yellow-400">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                  <option value="Confirmed" className="bg-[#18181b] text-green-400">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                                  <option value="Completed" className="bg-[#18181b] text-blue-400">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                  <option value="Cancelled" className="bg-[#18181b] text-rose-400">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                          <span className="text-sm font-semibold text-muted-foreground">{language === 'ar' ? `${studio.price} ر.س / ساعة` : `${studio.price} SAR / hour`}</span>
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
                  <div className="flex items-center gap-3 flex-wrap">
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
                    {renderFiltersAndExport()}
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
                      {filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-foreground/5 transition-colors">
                          <td className="py-4 font-mono text-xs">{cust.id}</td>
                          <td className="py-4 font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <span>{cust.name}</span>
                              {cust.isVip && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                  VIP
                                </span>
                              )}
                            </div>
                          </td>
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
                  <div className="flex items-center gap-3 flex-wrap">
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
                    {renderFiltersAndExport()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'إجمالي المبالغ المستلمة' : 'Total Revenue'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-emerald-400">{language === 'ar' ? `${totalPaid.toLocaleString()} ر.س` : `${totalPaid.toLocaleString()} SAR`}</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'جميع المعاملات المكتملة' : 'All completed transactions'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-yellow-400">{language === 'ar' ? `${totalPending.toLocaleString()} ر.س` : `${totalPending.toLocaleString()} SAR`}</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'في انتظار استلام الأموال' : 'Awaiting payment confirmation'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'المبالغ المستردة' : 'Total Refunded'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-rose-400">{language === 'ar' ? `${totalRefunded.toLocaleString()} ر.س` : `${totalRefunded.toLocaleString()} SAR`}</span>
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
                      {filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-foreground/5 transition-colors">
                          <td className="py-4 font-mono text-xs">{pay.id}</td>
                          <td className="py-4 font-semibold text-foreground">{pay.invoice}</td>
                          <td className="py-4 text-muted-foreground">{pay.customer}</td>
                          <td className="py-4 font-bold text-foreground">{language === 'ar' ? `${pay.amount} ر.س` : `${pay.amount} SAR`}</td>
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

            {/* Equipment Tab Content */}
            {activeTab === 'equipment' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-cinematic font-bold">
                    {language === 'ar' ? 'إدارة المعدات' : 'Equipment Management'}
                  </h2>
                  <button 
                    onClick={openAddEquipmentModal}
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-primary/10"
                  >
                    <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة معدة' : 'Add Equipment'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {equipment.map((item) => (
                    <div key={item.id} className="glass-card overflow-hidden rounded-2xl border border-border/50 flex flex-col hover:shadow-xl transition-all duration-300">
                      <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white">
                          {language === 'ar' ? item.categoryAr : item.category}
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-foreground">
                              {language === 'ar' ? item.nameAr : item.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.status === 'Available' ? 'text-green-400 bg-green-400/10' :
                              item.status === 'Unavailable' ? 'text-rose-400 bg-rose-400/10' :
                              'text-yellow-400 bg-yellow-400/10'
                            }`}>
                              {item.status === 'Available' 
                                ? (language === 'ar' ? 'متوفر' : 'Available') 
                                : item.status === 'Unavailable'
                                ? (language === 'ar' ? 'غير متوفر حالياً' : 'Not Available')
                                : (language === 'ar' ? 'تحت الصيانة' : 'Maintenance')}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {language === 'ar' ? item.descAr : item.desc}
                          </p>

                          <div className="mt-4 flex justify-between items-center text-sm font-semibold border-t border-border/40 pt-4">
                            <span className="text-muted-foreground">{language === 'ar' ? 'السعر اليومي' : 'Daily Price'}</span>
                            <span className="text-primary font-bold text-lg">{language === 'ar' ? `${item.price} ر.س / يوم` : `${item.price} SAR / day`}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => openEditEquipmentModal(item)}
                            className="flex-1 py-2 px-3 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(item.id)}
                            className="py-2 px-3 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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

            {/* Reports & Analytics Tab Content */}
            {activeTab === 'reports' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div>
                    <h2 className="text-3xl font-cinematic font-bold">
                      {language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Analytics'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'ar' ? 'تحليل الأداء المالي والتشغيلي للأستوديوهات والمعدات' : 'Financial and operational performance metrics.'}
                    </p>
                  </div>
                  <button 
                    onClick={downloadExcelReport}
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" /> {language === 'ar' ? 'تحميل التقارير' : 'Download Report'}
                  </button>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'اجمالي العائدات' : 'Total Revenue'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-emerald-400">${reportsData.totalRev.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'شامل حجوزات الاستوديو والمعدات' : 'Combined studio & gear rentals'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'عائدات الاستوديوهات' : 'Studio Revenue'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-foreground">${reportsData.studioRev.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'حجوزات المساحات والمواقع' : 'From space and stage bookings'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'عائدات المعدات' : 'Equipment Revenue'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-foreground">${reportsData.eqRev.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تأجير الكاميرات والإضاءة' : 'From gear and accessory rentals'}</span>
                  </div>
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-glow/5 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{language === 'ar' ? 'اجمالي الحجوزات' : 'Total Bookings'}</span>
                    <span className="text-3xl font-cinematic font-bold block mb-1 text-primary">${(reportsData.activeStudioBookings + reportsData.activeEqBookings).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'الحجوزات المؤكدة والمكتملة' : 'Confirmed and completed bookings'}</span>
                  </div>
                </div>

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Studio Performance */}
                  <div className="glass-card p-6 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold font-cinematic">{language === 'ar' ? 'أداء الاستوديوهات' : 'Studio Performance'}</h3>
                    <div className="space-y-4">
                      {reportsData.rankedStudios.map((s, idx) => {
                        const pct = reportsData.studioRev > 0 ? (s.revenue / reportsData.studioRev) * 100 : 0
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold">{language === 'ar' ? s.nameAr : s.name}</span>
                              <span className="text-muted-foreground">{s.count} {language === 'ar' ? 'حجوزات' : 'bookings'} | <span className="text-foreground font-bold">${s.revenue.toLocaleString()}</span></span>
                            </div>
                            <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-primary-accent rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      {reportsData.rankedStudios.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">{language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
                      )}
                    </div>
                  </div>

                  {/* Equipment Performance */}
                  <div className="glass-card p-6 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold font-cinematic">{language === 'ar' ? 'المعدات الأكثر طلباً' : 'Popular Equipment'}</h3>
                    <div className="space-y-4">
                      {reportsData.rankedEquipment.slice(0, 5).map((eq, idx) => {
                        const pct = reportsData.eqRev > 0 ? (eq.revenue / reportsData.eqRev) * 100 : 0
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold">{language === 'ar' ? eq.nameAr : eq.name}</span>
                              <span className="text-muted-foreground">{eq.count} {language === 'ar' ? 'مرات تأجير' : 'rents'} | <span className="text-foreground font-bold">${Math.round(eq.revenue).toLocaleString()}</span></span>
                            </div>
                            <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      {reportsData.rankedEquipment.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">{language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* VIP Customers Table */}
                <div className="glass-card p-6 rounded-3xl space-y-6">
                  <h3 className="text-xl font-bold font-cinematic">{language === 'ar' ? 'العملاء الأكثر إنفاقاً (VIP)' : 'VIP Customers'}</h3>
                  <div className="overflow-x-auto">
                    <table className={`w-full text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="pb-4">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className="pb-4">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                          <th className="pb-4">{language === 'ar' ? 'عدد الحجوزات الإجمالي' : 'Total Bookings'}</th>
                          <th className="pb-4 text-right">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Spend'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reportsData.rankedCustomers.map((c, idx) => (
                          <tr key={idx} className="hover:bg-foreground/5 transition-colors">
                            <td className="py-4 font-semibold text-foreground">{c.name}</td>
                            <td className="py-4 text-muted-foreground">{c.email}</td>
                            <td className="py-4">{c.count}</td>
                            <td className="py-4 font-bold text-emerald-400 text-right">${c.spend.toLocaleString()}</td>
                          </tr>
                        ))}
                        {reportsData.rankedCustomers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-muted-foreground">
                              {language === 'ar' ? 'لا توجد حجوزات مسجلة' : 'No booking data recorded'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                        {language === 'ar' ? 'السعر بالساعة (ر.س)' : 'Price Per Hour (SAR)'}
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

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'الموقع بالإنجليزية' : 'Location (English)'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={studioLocation}
                        onChange={e => setStudioLocation(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                        placeholder="e.g. Downtown, Al Serkal"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {language === 'ar' ? 'الموقع بالعربية' : 'Location (Arabic)'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={studioLocationAr}
                        onChange={e => setStudioLocationAr(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                        placeholder="مثال: وسط البلد، السركال"
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

      {/* Add / Edit Equipment Modal */}
      <AnimatePresence>
        {isEquipmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl my-8 overflow-hidden rounded-3xl bg-[#ffffff] border border-zinc-200 text-zinc-900 p-6 md:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h3 className="text-xl font-cinematic font-bold text-zinc-900">
                  {editingEquipment 
                    ? (language === 'ar' ? 'تعديل المعدة' : 'Edit Equipment') 
                    : (language === 'ar' ? 'إضافة معدة جديدة' : 'Add New Equipment')}
                </h3>
                <button 
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                </button>
              </div>

              <form onSubmit={handleSaveEquipment} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'معرف المعدة (مثال: EQ-101)' : 'Equipment ID (e.g. EQ-101)'}
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!!editingEquipment}
                      value={eqId}
                      onChange={e => setEqId(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900 font-mono disabled:opacity-50"
                      placeholder="EQ-101"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'السعر اليومي (ر.س)' : 'Daily Price (SAR)'}
                    </label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={eqPrice}
                      onChange={e => setEqPrice(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={eqName}
                      onChange={e => setEqName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder="e.g. RED V-Raptor 8K"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={eqNameAr}
                      onChange={e => setEqNameAr(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder="مثال: كاميرا RED V-Raptor 8K"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'الفئة' : 'Category'}
                    </label>
                    <select
                      value={eqCategory}
                      onChange={e => {
                        const val = e.target.value
                        setEqCategory(val)
                        if (val === 'Cameras & Lenses') setEqCategoryAr('الكاميرات والعدسات')
                        else if (val === 'Lighting & Grip') setEqCategoryAr('الإضاءة والمعدات المساندة')
                        else if (val === 'Audio & Sound') setEqCategoryAr('الصوت والتسجيل')
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                    >
                      <option value="Cameras & Lenses">{language === 'ar' ? 'الكاميرات والعدسات' : 'Cameras & Lenses'}</option>
                      <option value="Lighting & Grip">{language === 'ar' ? 'الإضاءة والمعدات المساندة' : 'Lighting & Grip'}</option>
                      <option value="Audio & Sound">{language === 'ar' ? 'الصوت والتسجيل' : 'Audio & Sound'}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'حالة التوفر' : 'Status'}
                    </label>
                    <select
                      value={eqStatus}
                      onChange={e => setEqStatus(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                    >
                      <option value="Available">{language === 'ar' ? 'متوفر' : 'Available'}</option>
                      <option value="Unavailable">{language === 'ar' ? 'غير متوفر حالياً' : 'Not Available Currently'}</option>
                      <option value="Maintenance">{language === 'ar' ? 'تحت الصيانة' : 'Under Maintenance'}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    {language === 'ar' ? 'صورة المعدة' : 'Equipment Image'}
                  </label>
                  
                  {eqImage ? (
                    <div className="relative aspect-video max-w-xs rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100 mx-auto">
                      <img src={eqImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveEquipmentImage}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer hover:bg-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-primary/50 rounded-2xl p-6 bg-zinc-50 cursor-pointer transition-colors relative group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleEquipmentImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="text-center space-y-1">
                        <Plus className="w-8 h-8 text-zinc-400 mx-auto group-hover:text-primary transition-colors" />
                        <p className="text-sm font-semibold text-zinc-700">
                          {language === 'ar' ? 'اضغط لرفع الصورة من جهازك' : 'Click to upload image from your device'}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {language === 'ar' ? 'يدعم صيغ JPG, PNG, WEBP' : 'Supports JPG, PNG, WEBP'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}
                    </label>
                    <textarea 
                      rows={3}
                      value={eqDesc}
                      onChange={e => setEqDesc(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder="Brief description of the gear..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}
                    </label>
                    <textarea 
                      rows={3}
                      value={eqDescAr}
                      onChange={e => setEqDescAr(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-zinc-900"
                      placeholder="وصف مختصر للمعدة..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEquipmentModalOpen(false)}
                    className="border border-zinc-200 rounded-full px-6 h-10 text-zinc-700 hover:bg-zinc-100 cursor-pointer text-xs"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-8 h-10 cursor-pointer text-xs font-semibold shadow-lg shadow-primary/10"
                  >
                    {editingEquipment ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة' : 'Add Gear')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </ProtectedRoute>
  )
}
