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
  // Today and the next 14 days (excluding weekends to simulate active admin management)
  const defaultDates: string[] = []
  const today = new Date()
  for (let i = 0; i < 20; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayOfWeek = d.getDay()
    // Exclude Sunday (0) and Saturday (6) by default just to show blocked days in action
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
