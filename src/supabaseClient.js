
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.error('CRITICAL: VITE_SUPABASE_URL is missing or invalid in .env file')
}
if (!supabasePublishableKey) {
    console.error('CRITICAL: VITE_SUPABASE_PUBLISHABLE_KEY is missing in .env file')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabasePublishableKey || 'placeholder-key')
