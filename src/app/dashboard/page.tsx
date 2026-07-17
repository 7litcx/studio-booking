"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CreditCard, Heart, Bell, User, Clock, ArrowUpRight, Camera } from 'lucide-react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { getBookings, Booking, getStudios, Studio, getEquipmentBookings, EquipmentBooking } from '../../lib/availability'
import { useAuth } from '../../lib/AuthContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import Link from 'next/link'
import { useLanguage } from '../../lib/LanguageContext'

export default function Dashboard() {
  const { t, isRtl, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookingsList, setBookingsList] = useState<Booking[]>([])
  const [eqBookingsList, setEqBookingsList] = useState<EquipmentBooking[]>([])
  const { user } = useAuth()
  
  // Profile settings state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Favorites state
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

  const handleRemoveFavorite = async (studioId: string) => {
    const updated = favorites.filter(fid => fid !== studioId)
    setFavorites(updated)
    localStorage.setItem('saved_studios', JSON.stringify(updated))

    // Dispatch storage event to keep other pages in sync
    window.dispatchEvent(new Event('storage'))

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('favorites')
          .delete()
          .eq('studio_id', studioId)
          .eq('visitor_id', getVisitorId())
      } catch (err) {
        console.warn("Failed to remove favorite from database:", err)
      }
    }
  }

  const getLocalizedStudioName = (name: string) => {
    if (language === 'ar') {
      if (name === 'The Velvet Room') return 'غرفة المخمل (The Velvet Room)'
      if (name === 'Lumière Stage A') return 'مسرح لوميير أ (Lumière Stage A)'
      if (name === 'Echo Podcast Suite') return 'جناح بودكاست إيكو (Echo Podcast Suite)'
    }
    return name
  }

  const getLocalizedCategory = (cat: string) => {
    if (language === 'ar') {
      if (cat === 'Photography') return 'التصوير الفوتوغرافي'
      if (cat === 'Video Production') return 'الإنتاج السينمائي والـ Video'
      if (cat === 'Podcast') return 'البودكاست والصوتيات'
    }
    return cat
  }

  const getLocalizedStatus = (status: string) => {
    if (language === 'ar') {
      if (status.toLowerCase() === 'confirmed') return 'مؤكد ومقبول'
      if (status.toLowerCase() === 'pending') return 'تحت المعالجة'
      if (status.toLowerCase() === 'cancelled') return 'ملغى ومسترجع'
      return status
    }
    return status
  }

  useEffect(() => {
    async function loadRawUser() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { user: rawUser } } = await supabase.auth.getUser()
          if (rawUser) {
            setFirstName(rawUser.user_metadata?.first_name || rawUser.user_metadata?.name?.split(' ')[0] || '')
            setLastName(rawUser.user_metadata?.last_name || rawUser.user_metadata?.name?.split(' ').slice(1).join(' ') || '')
            setCompany(rawUser.user_metadata?.company || '')
          }
        } catch (e) {
          console.error("Error loading user metadata from Supabase:", e)
        }
      } else if (user) {
        const names = user.name.split(' ')
        setFirstName(names[0] || '')
        setLastName(names.slice(1).join(' ') || '')
      }
    }
    loadRawUser()
  }, [user])

  useEffect(() => {
    async function load() {
      const data = await getBookings()
      const eqData = await getEquipmentBookings()
      if (user) {
        setBookingsList(data.filter(b => b.customer_email === user.email))
        setEqBookingsList(eqData.filter(b => b.customer_email === user.email || b.customer_email.includes(user.email)))
      } else {
        setBookingsList(data)
        setEqBookingsList(eqData)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    async function loadStudios() {
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
              equipmentAr: s.equipment_ar || []
            }))
            setStudios(mapped)
            return
          }
        } catch (err) {
          console.error('Error loading studios:', err)
        }
      }
      setStudios(getStudios())
    }
    loadStudios()

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
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileMessage('')
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({
          data: {
            first_name: firstName,
            last_name: lastName,
            company: company,
            full_name: `${firstName} ${lastName}`.trim()
          }
        })
        if (error) throw error
        setProfileMessage(t('dash.profileSuccess'))
      } else {
        setProfileMessage(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profile updated successfully!')
      }
    } catch (err: any) {
      setProfileMessage(language === 'ar' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const savedSpaces = studios.filter(s => favorites.includes(s.id))

  // derive notifications dynamically
  const notifications = bookingsList.map(booking => ({
    id: booking.id || `notif-${Math.random()}`,
    title: language === 'ar' ? 'تم تأكيد الحجز' : 'Booking Confirmed',
    message: language === 'ar' 
      ? `تم تأكيد حجزك لـ "${getLocalizedStudioName(booking.studio_name)}" بتاريخ ${booking.booking_date}.`
      : `Your booking for "${booking.studio_name}" on ${booking.booking_date} is confirmed.`,
    time: language === 'ar' ? 'الآن' : 'Just now'
  }))

  const upcomingBookings = bookingsList.filter(b => b.status !== 'Completed')
  const pastBookings = bookingsList.filter(b => b.status === 'Completed')

  return (
    <ProtectedRoute>
      <div className="pt-28 pb-32 min-h-screen bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-2">
            {[
              { id: 'bookings', label: t('dash.myBookings'), icon: Calendar },
              { id: 'equipment_bookings', label: language === 'ar' ? 'حجوزات المعدات' : 'Equipment Bookings', icon: Camera },
              { id: 'payments', label: t('dash.paymentsInvoices'), icon: CreditCard },
              { id: 'favorites', label: t('dash.savedStudios'), icon: Heart },
              { id: 'notifications', label: t('dash.notifications'), icon: Bell },
              { id: 'profile', label: t('dash.profileSettings'), icon: User }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-start font-medium transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-[0_0_30px_rgba(177,18,38,0.2)]' 
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Main Area */}
          <div className="flex-grow space-y-8">
            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-cinematic font-bold">{t('dash.upcomingBookings')}</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="glass-card p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
                      <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} w-2 h-full bg-primary`} />
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold">
                            {getLocalizedStatus(booking.status)}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {t('dash.sessionScheduled')}
                          </span>
                        </div>
                        <h3 className="text-2xl font-cinematic font-bold">{getLocalizedStudioName(booking.studio_name)}</h3>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <div>
                            <span className="block text-xs uppercase tracking-wider mb-1">{t('dash.date')}</span>
                            <span className="text-foreground font-medium">{booking.booking_date}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wider mb-1">{t('dash.time')}</span>
                            <span className="text-foreground font-medium">{booking.time_slots.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('dash.estimatedFee')}</span>
                        <span className="text-3xl font-cinematic font-bold text-foreground">
                          {language === 'ar' ? `${booking.total_price} ر.س` : `${booking.total_price} SAR`}
                        </span>
                      </div>
                    </div>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">{t('dash.noUpcoming')}</div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-cinematic font-bold mb-6">{t('dash.pastSessions')}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {pastBookings.map((booking) => (
                      <div key={booking.id} className="glass p-6 rounded-2xl flex justify-between items-center text-sm">
                        <div>
                          <h4 className="font-bold text-foreground mb-1">{getLocalizedStudioName(booking.studio_name)}</h4>
                          <p className="text-muted-foreground">{booking.booking_date} {language === 'ar' ? 'في' : 'at'} {booking.time_slots.join(', ')}</p>
                        </div>
                        <span className="text-foreground font-bold">
                          {language === 'ar' ? `${booking.total_price} ر.س` : `${booking.total_price} SAR`}
                        </span>
                      </div>
                    ))}
                    {pastBookings.length === 0 && (
                      <div className="text-muted-foreground text-sm">{t('dash.noPast')}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'equipment_bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-cinematic font-bold">
                    {language === 'ar' ? 'حجوزات المعدات الخاصة بي' : 'My Equipment Bookings'}
                  </h2>
                  <Link 
                    href="/book-equipment"
                    className="bg-primary hover:bg-primary-velvet text-white rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-primary/10"
                  >
                    {language === 'ar' ? 'حجز معدات جديدة' : 'Book New Equipment'}
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {eqBookingsList.map((booking) => (
                    <div key={booking.id || Math.random()} className="glass-card p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
                      <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} w-2 h-full bg-emerald-500`} />
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                            {language === 'ar' ? 'مؤكد' : 'Confirmed'}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-mono">
                            {booking.id}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            {language === 'ar' ? 'المعدات المحجوزة' : 'Rented Equipment'}
                          </span>
                          <p className="text-lg font-bold text-foreground">
                            {language === 'ar' 
                              ? (booking.equipment_names_ar || booking.equipment_names || []).join(' ، ')
                              : (booking.equipment_names || []).join(', ')}
                          </p>
                        </div>

                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <div>
                            <span className="block text-xs uppercase tracking-wider mb-1">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</span>
                            <span className="text-foreground font-medium">
                              {booking.booking_date} {booking.start_time ? `(${booking.start_time})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wider mb-1">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</span>
                            <span className="text-foreground font-medium">
                              {booking.end_date} {booking.end_time ? `(${booking.end_time})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'التكلفة الإجمالية' : 'Total Price'}</span>
                        <span className="text-3xl font-cinematic font-bold text-foreground">
                          {language === 'ar' ? `${booking.total_price} ر.س` : `${booking.total_price} SAR`}
                        </span>
                      </div>
                    </div>
                  ))}
                  {eqBookingsList.length === 0 && (
                    <div className="glass-card p-12 text-center text-muted-foreground rounded-3xl border border-border">
                      <Camera className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>{language === 'ar' ? 'ليس لديك أي حجوزات معدات حالياً.' : 'You have no equipment bookings at the moment.'}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-cinematic font-bold">{t('dash.paymentsReceipts')}</h2>
                <div className="glass-card p-6 rounded-2xl overflow-x-auto">
                  <table className="w-full text-start">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-4 text-start">{t('dash.invoiceId')}</th>
                        <th className="pb-4 text-start">{t('dash.studio')}</th>
                        <th className="pb-4 text-start">{t('dash.date')}</th>
                        <th className="pb-4 text-start">{t('dash.amount')}</th>
                        <th className="pb-4 text-start">{t('dash.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                      {bookingsList.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 font-mono">INV-{booking.id?.substring(0, 8).toUpperCase() || 'TEMP'}</td>
                          <td className="py-4 font-semibold">{getLocalizedStudioName(booking.studio_name)}</td>
                          <td className="py-4">{booking.booking_date}</td>
                          <td className="py-4 text-foreground font-semibold">
                            {language === 'ar' ? `${booking.total_price} ر.س` : `${booking.total_price} SAR`}
                          </td>
                          <td className="py-4">
                            <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs font-medium">
                              {t('dash.paid')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookingsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">{t('dash.noInvoices')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-cinematic font-bold">{t('dash.savedSpaces')}</h2>
                {savedSpaces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedSpaces.map(studio => (
                      <div key={studio.id} className="glass p-6 rounded-2xl flex gap-4 items-center justify-between">
                        <Link href={`/studio/${studio.id}`} className="flex gap-4 items-center hover:opacity-80 transition-opacity">
                          <img src={studio.images[0] || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=256"} alt="" className="w-20 h-20 object-cover rounded-xl" />
                          <div>
                            <h3 className="font-bold">{getLocalizedStudioName(studio.name)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getLocalizedCategory(studio.category)} • {language === 'ar' ? 'السعة' : 'Capacity'} {studio.capacity}
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(studio.id)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          {t('dash.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">{t('dash.noSaved')}</div>
                )}
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-cinematic font-bold">{t('dash.notifications')}</h2>
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="glass p-5 rounded-2xl flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-foreground">{notif.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">{t('dash.noNotifications')}</div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-cinematic font-bold">{t('dash.profileSettings')}</h2>
                <form onSubmit={handleSaveProfile} className="glass-card p-8 rounded-3xl space-y-6 max-w-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                      {(firstName.substring(0,1) || user?.email?.substring(0,1) || 'U').toUpperCase()}
                      {(lastName.substring(0,1) || user?.email?.substring(1,2) || '').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {firstName || lastName ? `${firstName} ${lastName}` : (user?.name || (language === 'ar' ? 'مستخدم' : 'User'))}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">{t('dash.firstName')}</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                          placeholder={t('dash.firstName')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">{t('dash.lastName')}</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                          placeholder={t('dash.lastName')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">{t('dash.company')}</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                        placeholder={t('dash.company')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-primary hover:bg-primary/95 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProfile ? t('dash.saving') : t('dash.saveSettings')}
                    </button>
                    {profileMessage && (
                      <span className={`text-sm ${profileMessage.startsWith('Error') || profileMessage.startsWith('خطأ') ? 'text-red-400' : 'text-green-400'}`}>
                        {profileMessage}
                      </span>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  </ProtectedRoute>
  )
}
