import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { useLanguage } from '../lib/LanguageContext'
import { getStudioAvailability, formatDate, getStudios } from '../lib/availability'

const EQUIPMENT_OPTIONS = [
  { id: 'sony-fx3', price: 75 },
  { id: 'aputure-600d', price: 40 },
  { id: 'dji-rs3', price: 25 },
  { id: 'rode-mic-pack', price: 15 },
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

export default function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [step, setStep] = useState(1)
  
  const studios = getStudios()
  const currentStudio = studios.find(s => s.id === id) || studios[0]

  // State for Booking
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('2')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error(t('book.errorContact'))
      return
    }
    toast.success(t('book.successMessage'))
    setTimeout(() => {
      navigate('/dashboard')
    }, 1500)
  }

  const calculateTotal = () => {
    const baseRate = currentStudio ? currentStudio.price : 150
    const equipmentCost = selectedEquipment.reduce((acc, eqId) => {
      const eq = EQUIPMENT_OPTIONS.find(o => o.id === eqId)
      return acc + (eq ? eq.price : 0)
    }, 0)
    return (baseRate * parseInt(duration)) + equipmentCost
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
                    <div className="grid grid-cols-4 gap-2">
                      {['2', '4', '8', '12'].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDuration(hours)}
                          className={`h-12 rounded-xl border transition-all text-sm font-semibold cursor-pointer ${
                            duration === hours 
                              ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(177,18,38,0.2)]' 
                              : 'border-border glass hover:bg-foreground/5 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t('book.hoursCount').replace('{hours}', hours)}
                        </button>
                      ))}
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
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <div 
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={`p-6 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                      selectedEquipment.includes(eq.id) ? 'border-primary bg-primary/5 text-foreground' : 'border-border glass hover:bg-foreground/5 text-muted-foreground'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-primary block uppercase tracking-wider mb-1">{t(`eq.${eq.id}.cat`)}</span>
                      <h3 className="font-bold text-lg mb-1 text-foreground transition-colors group-hover:text-primary">{t(`eq.${eq.id}.name`)}</h3>
                      <span className="text-muted-foreground text-sm">
                        {language === 'ar' ? `+ ${eq.price} دولار / الجلسة` : `+$${eq.price} / session`}
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
                          const eq = EQUIPMENT_OPTIONS.find(o => o.id === eqId)
                          return (
                            <div key={eqId} className="flex justify-between text-xs text-muted-foreground">
                              <span>{t(`eq.${eqId}.name`)}</span>
                              <span>${eq?.price}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="pt-4 border-t border-border flex justify-between items-center text-lg font-bold">
                      <span>{t('book.summaryTotal')}</span>
                      <span className="text-primary">${calculateTotal()}</span>
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
