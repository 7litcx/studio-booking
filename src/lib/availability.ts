import { supabase, isSupabaseConfigured } from './supabaseClient'

export interface Studio {
  id: string
  name: string
  nameAr: string
  category: string
  categoryAr: string
  desc: string
  descAr: string
  price: number
  capacity: number
  rating: number
  images: string[]
  amenities: string[]
  amenitiesAr: string[]
  equipment: string[]
  equipmentAr: string[]
  location?: string
  locationAr?: string
}

const DEFAULT_STUDIOS: Studio[] = [
  {
    id: "1",
    name: "The Velvet Room",
    nameAr: "غرفة المخمل",
    category: "Photography",
    categoryAr: "التصوير الفوتوغرافي",
    desc: "A luxurious photographic space equipped with premium velvet backdrops, vintage furniture, and state-of-the-art strobe lighting. Perfect for high-fashion portraits, editorial shoots, and fine art photography.",
    descAr: "مساحة تصوير فوتوغرافي فاخرة مجهزة بخلفيات مخملية راقية، وأثاث كلاسيكي، وإضاءة فلاش حديثة للغاية. مثالية للبورتريهات الراقية والمجلات الفنية.",
    price: 150,
    capacity: 15,
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603993097397-89c963e325c7?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop"
    ],
    amenities: [
      "Vintage Velvet Backdrops",
      "Dedicated Makeup Station",
      "Private Dressing Room",
      "High-speed WiFi",
      "Complimentary Coffee & Tea"
    ],
    amenitiesAr: [
      "خلفيات مخملية كلاسيكية",
      "محطة مكياج مخصصة",
      "غرفة تبديل ملابس خاصة",
      "إنترنت عالي السرعة",
      "قهوة وشاي مجاني"
    ],
    equipment: [
      "3x Profoto D2 1000Ws Strobes",
      "V-Flats & Reflector Panels",
      "Vanguard Alta Pro Carbon Tripod",
      "Elinchrom Octabox 135cm"
    ],
    equipmentAr: [
      "3 أجهزة فلاش Profoto D2 1000Ws",
      "ألواح عاكسة V-Flats",
      "حامل ثلاثي Vanguard Alta Pro Carbon",
      "موزع إضاءة Elinchrom Octabox 135سم"
    ],
    location: "Downtown",
    locationAr: "وسط البلد"
  },
  {
    id: "2",
    name: "Lumière Stage A",
    nameAr: "مسرح لوميير أ",
    category: "Video Production",
    categoryAr: "الإنتاج السينمائي والـ Video",
    desc: "A massive soundstage designed for professional cinema production, music videos, and commercial shoots. Features a huge three-wall green screen cyclorama, acoustic treatment, and heavy-duty grid systems.",
    descAr: "مسرح صوتي ضخم مصمم لإنتاج السينما الاحترافية، والفيديو كليب، والإعلانات التجارية. يتميز بسيكلوراما كروما خضراء ثلاثية الجوانب، ومعالجة صوتية ممتازة.",
    price: 250,
    capacity: 40,
    rating: 5.0,
    images: [
      "https://images.unsplash.com/photo-1603993097397-89c963e325c7?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
    ],
    amenities: [
      "Huge Cyclorama (Green/White)",
      "High-Clearance Ceiling Grid",
      "Production Client Lounge",
      "Heavy Power Outlets (3-Phase)",
      "Dedicated Restrooms & Showers"
    ],
    amenitiesAr: [
      "سيكلوراما ضخمة (خضراء/بيضاء)",
      "شبكة أسقف بارتفاع عالٍ",
      "صالة عملاء الإنتاج",
      "مخارج كهرباء عالية الجهد",
      "حمامات واستحمام مخصصة"
    ],
    equipment: [
      "ARRI Alexa Mini LF Cinema Package",
      "Full Nanlite Forza LED Light Kit",
      "DJI Ronin 2 Professional Gimbal"
    ],
    equipmentAr: [
      "حزمة كاميرا ARRI Alexa Mini LF السينمائية",
      "مجموعة إضاءة LED كاملة Nanlite Forza",
      "مثبت اهتزاز DJI Ronin 2 الاحترافي"
    ],
    location: "Al Serkal",
    locationAr: "السركال"
  },
  {
    id: "3",
    name: "Echo Podcast Suite",
    nameAr: "جناح بودكاست إيكو",
    category: "Podcast",
    categoryAr: "البودكاست والصوتيات",
    desc: "A cozy, acoustically treated studio optimized for audio recording, interviews, and live streaming. Equipped with professional broadcast microphones, multi-cam video setup, and custom LED lighting scenes.",
    descAr: "استوديو مريح معالج صوتياً بالكامل، ومناسب للتسجيل الصوتي والمقابلات والبث المباشر. مجهز بميكروفونات إذاعية احترافية وتصوير متعدد الكاميرات.",
    price: 85,
    capacity: 4,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
    ],
    amenities: [
      "Soundproof Broadcast Booth",
      "Customizable Philips Hue Lighting",
      "Control Room with Engineer desk",
      "Comfortable Seating for 4"
    ],
    amenitiesAr: [
      "غرفة بث عازلة للصوت",
      "إضاءة Philips Hue قابلة للتعديل",
      "غرفة تحكم مع مكتب مهندس الصوت",
      "مقاعد مريحة تتسع لـ 4 أشخاص"
    ],
    equipment: [
      "4x Shure SM7B Broadcast Mics",
      "Rødecaster Pro II Audio Mixer",
      "3x Sony FX30 Podcast Cameras"
    ],
    equipmentAr: [
      "4 ميكروفونات بث Shure SM7B",
      "مكسر صوت Rødecaster Pro II",
      "3 كاميرات بودكاست Sony FX30"
    ],
    location: "Business Bay",
    locationAr: "خليج الأعمال"
  }
]

export const getStudios = (): Studio[] => {
  if (typeof window === 'undefined') {
    return DEFAULT_STUDIOS
  }
  const stored = localStorage.getItem("dynamic_studios")
  if (stored) {
    try {
      return JSON.parse(stored) as Studio[]
    } catch (e) {
      console.error("Error parsing stored studios", e)
    }
  }
  localStorage.setItem("dynamic_studios", JSON.stringify(DEFAULT_STUDIOS))
  return DEFAULT_STUDIOS
}

export const saveStudios = (studios: Studio[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem("dynamic_studios", JSON.stringify(studios))
  }
}

export const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const getStudioAvailability = (studioId: string): string[] => {
  if (typeof window === 'undefined') {
    return []
  }
  const stored = localStorage.getItem(`studio_availability_${studioId}`)
  if (stored) {
    try {
      return JSON.parse(stored) as string[]
    } catch (e) {
      console.error("Error parsing stored availability", e)
    }
  }

  // If no stored value, initialize with default available dates:
  // Today and the next 14 days
  const defaultDates: string[] = []
  const today = new Date()
  for (let i = 0; i < 20; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayOfWeek = d.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      defaultDates.push(formatDate(d))
    }
  }

  localStorage.setItem(`studio_availability_${studioId}`, JSON.stringify(defaultDates))
  return defaultDates
}

export const setStudioAvailability = (studioId: string, dates: string[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`studio_availability_${studioId}`, JSON.stringify(dates))
  }
}

export const toggleDateAvailability = (studioId: string, dateStr: string): string[] => {
  const current = getStudioAvailability(studioId)
  let updated: string[]
  if (current.includes(dateStr)) {
    updated = current.filter(d => d !== dateStr)
  } else {
    updated = [...current, dateStr]
  }
  setStudioAvailability(studioId, updated)
  return updated
}

export interface Booking {
  id?: string
  studio_id: string
  studio_name: string
  studio_name_ar: string
  booking_date: string
  time_slots: string[]
  customer_name: string
  customer_email: string
  total_price: number
  status: string
  created_at?: string
}

export const getBookings = async (): Promise<Booking[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          studio_id,
          booking_date,
          time_slots,
          customer_name,
          customer_email,
          total_price,
          status,
          created_at,
          studios (name, name_ar)
        `)
        .order('created_at', { ascending: false })
      if (data && !error) {
        return data.map((b: any) => ({
          id: b.id,
          studio_id: b.studio_id,
          studio_name: b.studios?.name || 'Studio Room',
          studio_name_ar: b.studios?.name_ar || 'غرفة استوديو',
          booking_date: b.booking_date,
          time_slots: b.time_slots,
          customer_name: b.customer_name,
          customer_email: b.customer_email,
          total_price: Number(b.total_price),
          status: b.status,
          created_at: b.created_at
        }))
      }
    } catch (e) {
      console.error("Error fetching bookings from Supabase:", e)
    }
  }

  // Fallback to LocalStorage
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem("dynamic_bookings")
  if (stored) {
    try {
      return JSON.parse(stored) as Booking[]
    } catch(e) {}
  }
  const defaultBookings = [
    { id: "BK-9021", studio_id: "1", studio_name: "The Velvet Room", studio_name_ar: "غرفة المخمل", customer_name: "Marcus Chen", customer_email: "marcus@example.com", booking_date: "2026-07-12", time_slots: ["10:00", "10:30", "11:00", "11:30"], total_price: 600, status: "Confirmed" },
    { id: "BK-9022", studio_id: "2", studio_name: "Lumière Stage A", studio_name_ar: "مسرح لوميير أ", customer_name: "Elena Rodriguez", customer_email: "elena@example.com", booking_date: "2026-07-28", time_slots: ["09:00", "09:30", "10:00", "10:30"], total_price: 2000, status: "Pending Setup" },
    { id: "BK-9023", studio_id: "3", studio_name: "Echo Podcast Suite", studio_name_ar: "جناح بودكاست إيكو", customer_name: "Sarah Jenkins", customer_email: "sarah@example.com", booking_date: "2026-06-15", time_slots: ["10:00", "10:30", "11:00", "11:30"], total_price: 170, status: "Completed" }
  ]
  localStorage.setItem("dynamic_bookings", JSON.stringify(defaultBookings))
  return defaultBookings
}

export const createBooking = async (booking: Booking): Promise<string | boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('bookings').insert({
        studio_id: booking.studio_id,
        booking_date: booking.booking_date,
        time_slots: booking.time_slots,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        total_price: booking.total_price,
        status: booking.status || 'Confirmed'
      }).select('id')
      
      if (!error && data && data.length > 0) return data[0].id
      console.error("Supabase insert booking error:", error)
    } catch (e) {
      console.error("Supabase insert booking exception:", e)
    }
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const list = await getBookings()
    const generatedId = `BK-${Math.floor(1000 + Math.random() * 9000)}`
    const newBooking = {
      ...booking,
      id: generatedId
    }
    const updated = [newBooking, ...list]
    localStorage.setItem("dynamic_bookings", JSON.stringify(updated))
    return generatedId
  }
  return false
}

export interface Coupon {
  code: string
  discount: number
  usage: number
  limit: number
  expiry: string
  status: string
}

export const getCoupons = async (): Promise<Coupon[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('coupons').select('*').order('code', { ascending: true })
      if (data && !error) {
        return data.map((c: any) => ({
          code: c.code,
          discount: Number(c.discount),
          usage: Number(c.usage || 0),
          limit: Number(c.limit),
          expiry: c.expiry,
          status: c.status
        }))
      }
    } catch (e) {
      console.error("Error fetching coupons from Supabase:", e)
    }
  }

  // Fallback
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem("dynamic_coupons")
  if (stored) {
    try { return JSON.parse(stored) as Coupon[] } catch(e) {}
  }
  const defaults = [
    { code: "LUMIERE10", discount: 10, usage: 45, limit: 100, expiry: "2026-12-31", status: "Active" },
    { code: "CREATIVE25", discount: 25, usage: 12, limit: 50, expiry: "2026-09-30", status: "Active" },
    { code: "VIP50", discount: 50, usage: 3, limit: 10, expiry: "2026-08-15", status: "Active" }
  ]
  localStorage.setItem("dynamic_coupons", JSON.stringify(defaults))
  return defaults
}

export const saveCoupon = async (coupon: Coupon): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('coupons').upsert({
        code: coupon.code,
        discount: coupon.discount,
        usage: coupon.usage || 0,
        limit: coupon.limit,
        expiry: coupon.expiry,
        status: coupon.status || 'Active'
      })
      if (!error) return true
    } catch (e) {
      console.error("Error saving coupon to Supabase:", e)
    }
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const list = await getCoupons()
    const updated = list.some(c => c.code === coupon.code)
      ? list.map(c => c.code === coupon.code ? coupon : c)
      : [...list, coupon]
    localStorage.setItem("dynamic_coupons", JSON.stringify(updated))
    return true
  }
  return false
}

export interface EquipmentItem {
  id: string
  name: string
  nameAr: string
  category: string
  categoryAr: string
  desc: string
  descAr: string
  price: number
  image: string
  status: string
}

export const normalizeEquipmentId = (id: string): string => {
  if (!id) return id
  if (id.startsWith('EQ-')) {
    const num = id.replace('EQ-', '')
    if (num === '101') return 'e80a0a01-0000-0000-0000-000000000101'
    if (num === '102') return 'e80a0a02-0000-0000-0000-000000000102'
    if (num === '103') return 'e80a0a03-0000-0000-0000-000000000103'
    if (num === '104') return 'e80a0a04-0000-0000-0000-000000000104'
    if (num === '105') return 'e80a0a05-0000-0000-0000-000000000105'
    if (num === '106') return 'e80a0a06-0000-0000-0000-000000000106'
    return 'e80a0b' + num.padStart(2, '0') + '-0000-0000-0000-000000000000'
  }
  return id
}

export const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  {
    id: "e80a0a01-0000-0000-0000-000000000101",
    name: "RED V-Raptor 8K VV",
    nameAr: "كاميرا RED V-Raptor 8K VV",
    category: "Cameras & Lenses",
    categoryAr: "الكاميرات والعدسات",
    desc: "Cinema camera for ultra-high resolution videography.",
    descAr: "كاميرا سينمائية فائقة الدقة لإنتاج الفيديو بأعلى جودة واحترافية.",
    price: 150,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop",
    status: "Available"
  },
  {
    id: "e80a0a02-0000-0000-0000-000000000102",
    name: "Aputure LS 600d Pro",
    nameAr: "إضاءة Aputure LS 600d Pro",
    category: "Lighting & Grip",
    categoryAr: "الإضاءة والمعدات المساندة",
    desc: "Daylight-balanced point-source LED light kit.",
    descAr: "منظومة إضاءة LED نقطية احترافية متوازنة مع ضوء النهار.",
    price: 80,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
    status: "Available"
  },
  {
    id: "e80a0a03-0000-0000-0000-000000000103",
    name: "Shure SM7B Vocal Mic",
    nameAr: "ميكروفون Shure SM7B Vocal Mic",
    category: "Audio & Sound",
    categoryAr: "الصوت والتسجيل",
    desc: "Dynamic microphone ideal for broadcasting and podcasts.",
    descAr: "ميكروفون ديناميكي قياسي ومثالي للبث الصوتي والبودكاست.",
    price: 25,
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop",
    status: "Available"
  },
  {
    id: "e80a0a04-0000-0000-0000-000000000104",
    name: "Sony FX3 Cinema Line",
    nameAr: "كاميرا Sony FX3 Cinema Line",
    category: "Cameras & Lenses",
    categoryAr: "الكاميرات والعدسات",
    desc: "Compact cinema line full-frame camera.",
    descAr: "كاميرا سينمائية مدمجة كاملة الإطار لتصوير الأفلام والوثائقيات المرنة.",
    price: 110,
    image: "https://images.unsplash.com/photo-1620283085439-39620a1e21c4?q=80&w=600&auto=format&fit=crop",
    status: "Available"
  },
  {
    id: "e80a0a05-0000-0000-0000-000000000105",
    name: "Profoto D2 Studio Flash",
    nameAr: "فلاش Profoto D2 Studio Flash",
    category: "Lighting & Grip",
    categoryAr: "الإضاءة والمعدات المساندة",
    desc: "Monolight with TTL and HSS for fashion and product photography.",
    descAr: "إضاءة فلاش فوتوغرافي سريعة جداً ومثالية لتصوير الأزياء والأزياء الراقية.",
    price: 60,
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=600&auto=format&fit=crop",
    status: "Available"
  },
  {
    id: "e80a0a06-0000-0000-0000-000000000106",
    name: "Sennheiser MKH416",
    nameAr: "ميكروفون Sennheiser MKH416",
    category: "Audio & Sound",
    categoryAr: "الصوت والتسجيل",
    desc: "RF condenser shotgun microphone for pristine audio.",
    descAr: "ميكروفون بندقية مكثف RF فائق الجودة للتسجيل الخارجي النقي.",
    price: 30,
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop",
    status: "Available"
  }
]

export const getEquipment = async (): Promise<EquipmentItem[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('equipment').select('*').order('name', { ascending: true })
      if (data && !error) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          nameAr: item.name_ar || item.nameAr || item.name,
          category: item.category,
          categoryAr: item.category_ar || item.categoryAr || item.category,
          desc: item.desc || item.description || '',
          descAr: item.desc_ar || item.descAr || item.description_ar || '',
          price: Number(item.rate_per_session || item.price || 0),
          image: item.image || item.image_url || '',
          status: item.status || 'Available'
        }))
      }
    } catch (e) {
      console.error("Error fetching equipment from Supabase:", e)
    }
  }

  // Fallback
  if (typeof window === 'undefined') return DEFAULT_EQUIPMENT
  const stored = localStorage.getItem("dynamic_equipment")
  if (stored) {
    try {
      return JSON.parse(stored) as EquipmentItem[]
    } catch (e) {}
  }
  localStorage.setItem("dynamic_equipment", JSON.stringify(DEFAULT_EQUIPMENT))
  return DEFAULT_EQUIPMENT
}

export const saveEquipmentItem = async (item: EquipmentItem): Promise<boolean> => {
  const finalId = normalizeEquipmentId(item.id)
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try to upsert with all fields using correct database column mappings
      const fullPayload = {
        id: finalId,
        name: item.name,
        name_ar: item.nameAr,
        category: item.category,
        category_ar: item.categoryAr,
        description: item.desc,
        description_ar: item.descAr,
        price: item.price,
        rate_per_session: item.price, // Map price to rate_per_session to satisfy not-null constraint
        image_url: item.image,
        status: item.status
      }

      const { error } = await supabase.from('equipment').upsert(fullPayload)
      if (!error) return true

      // 2. If it fails due to column missing (42703), retry with only the basic columns we know exist
      if (error.code === '42703' || error.message?.includes('column')) {
        console.warn("Retrying equipment upsert with basic columns due to schema mismatch...")
        const basicPayload = {
          id: finalId,
          name: item.name,
          category: item.category,
          description: item.desc,
          rate_per_session: item.price, // Also include here
          image_url: item.image
        }
        const { error: retryError } = await supabase.from('equipment').upsert(basicPayload)
        if (!retryError) return true
        console.error("Error saving basic equipment payload to Supabase:", retryError)
      } else {
        console.error("Error saving equipment to Supabase:", error)
      }
      return false
    } catch (e) {
      console.error("Error saving equipment to Supabase:", e)
      return false
    }
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const list = await getEquipment()
    const updatedItem = { ...item, id: finalId }
    const updated = list.some(i => i.id === finalId)
      ? list.map(i => i.id === finalId ? updatedItem : i)
      : [...list, updatedItem]
    localStorage.setItem("dynamic_equipment", JSON.stringify(updated))
    return true
  }
  return false
}

export const deleteEquipmentItem = async (itemId: string): Promise<boolean> => {
  const finalId = normalizeEquipmentId(itemId)
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('equipment').delete().eq('id', finalId)
      if (!error) return true
      console.error("Error deleting equipment from Supabase:", error)
      return false
    } catch (e) {
      console.error("Error deleting equipment from Supabase:", e)
      return false
    }
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const list = await getEquipment()
    const updated = list.filter(i => i.id !== finalId)
    localStorage.setItem("dynamic_equipment", JSON.stringify(updated))
    return true
  }
  return false
}

export interface EquipmentBooking {
  id?: string
  equipment_ids: string[]
  equipment_names: string[]
  equipment_names_ar: string[]
  booking_date: string
  end_date: string
  start_time?: string
  end_time?: string
  customer_name: string
  customer_email: string
  total_price: number
  status: string
  created_at?: string
}

export const getEquipmentBookings = async (): Promise<EquipmentBooking[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('booking_equipment')
        .select('*')
        .order('created_at', { ascending: false })
      if (data && !error) {
        return data.map((b: any) => ({
          id: b.id,
          equipment_ids: b.equipment_ids || [],
          equipment_names: b.equipment_names || [],
          equipment_names_ar: b.equipment_names_ar || [],
          booking_date: b.booking_date,
          end_date: b.end_date,
          start_time: b.start_time || '',
          end_time: b.end_time || '',
          customer_name: b.customer_name,
          customer_email: b.customer_email,
          total_price: Number(b.total_price),
          status: b.status,
          created_at: b.created_at
        }))
      }
    } catch (e) {
      console.error("Error fetching equipment bookings from Supabase:", e)
    }
  }

  // Fallback to LocalStorage
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem("dynamic_equipment_bookings")
  if (stored) {
    try {
      return JSON.parse(stored) as EquipmentBooking[]
    } catch(e) {}
  }
  const defaultBookings: EquipmentBooking[] = [
    {
      id: "EQB-501",
      equipment_ids: ["e80a0a01-0000-0000-0000-000000000101"],
      equipment_names: ["RED V-Raptor 8K VV"],
      equipment_names_ar: ["كاميرا RED V-Raptor 8K VV"],
      booking_date: "2026-07-20",
      end_date: "2026-07-22",
      start_time: "10:00",
      end_time: "18:00",
      customer_name: "Ahmed Al-Mansouri",
      customer_email: "ahmed@example.com",
      total_price: 300,
      status: "Confirmed",
      created_at: "2026-07-14T05:00:00Z"
    }
  ]
  localStorage.setItem("dynamic_equipment_bookings", JSON.stringify(defaultBookings))
  return defaultBookings
}

export const createEquipmentBooking = async (booking: EquipmentBooking): Promise<string | boolean> => {
  const normalizedEquipmentIds = (booking.equipment_ids || []).map(normalizeEquipmentId)
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try to insert with separate start_time and end_time
      const payloadWithTimes = {
        booking_id: null,
        equipment_id: null,
        price: booking.total_price,
        equipment_ids: normalizedEquipmentIds,
        equipment_names: booking.equipment_names,
        equipment_names_ar: booking.equipment_names_ar,
        booking_date: booking.booking_date,
        end_date: booking.end_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        total_price: booking.total_price,
        status: booking.status || 'Confirmed'
      }

      const { data, error } = await supabase.from('booking_equipment').insert(payloadWithTimes).select('id')
      if (!error && data && data.length > 0) return data[0].id

      // 2. If it fails due to column missing (Postgres error code 42703), fallback to combined strings in date columns
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        console.warn("Retrying equipment booking insert using combined date-time format...")
        const combinedBookingDate = booking.start_time 
          ? `${booking.booking_date} (${booking.start_time})` 
          : booking.booking_date
        const combinedEndDate = booking.end_time 
          ? `${booking.end_date} (${booking.end_time})` 
          : booking.end_date

        const fallbackPayload = {
          booking_id: null,
          equipment_id: null,
          price: booking.total_price,
          equipment_ids: normalizedEquipmentIds,
          equipment_names: booking.equipment_names,
          equipment_names_ar: booking.equipment_names_ar,
          booking_date: combinedBookingDate,
          end_date: combinedEndDate,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          total_price: booking.total_price,
          status: booking.status || 'Confirmed'
        }
        const { data: retryData, error: retryError } = await supabase.from('booking_equipment').insert(fallbackPayload).select('id')
        if (!retryError && retryData && retryData.length > 0) return retryData[0].id
        console.error("Supabase insert equipment booking fallback error:", retryError)
      } else {
        console.error("Supabase insert equipment booking error:", error)
      }
      return false
    } catch (e) {
      console.error("Supabase insert equipment booking exception:", e)
      return false
    }
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const list = await getEquipmentBookings()
    const generatedId = `EQB-${Math.floor(1000 + Math.random() * 9000)}`
    const newBooking = {
      ...booking,
      equipment_ids: normalizedEquipmentIds,
      id: generatedId,
      created_at: new Date().toISOString()
    }
    const updated = [newBooking, ...list]
    localStorage.setItem("dynamic_equipment_bookings", JSON.stringify(updated))
    return generatedId
  }
  return false
}

