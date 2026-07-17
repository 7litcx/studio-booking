import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'your-supabase-project-url' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  isValidUrl(supabaseUrl)
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
