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
    ]
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
    ]
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
    ]
  }
]

export const getStudios = (): Studio[] => {
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
  localStorage.setItem("dynamic_studios", JSON.stringify(studios))
}

export const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const getStudioAvailability = (studioId: string): string[] => {
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
  localStorage.setItem(`studio_availability_${studioId}`, JSON.stringify(dates))
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
