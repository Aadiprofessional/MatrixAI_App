import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://sjrrlfmlrgtgysgutoee.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcnJsZm1scmd0Z3lzZ3V0b2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MTM4ODgsImV4cCI6MjA1NDA4OTg4OH0.osu-8LUtpr0LnE_gCoI66cQAqf-Exv6XhiMw7G1Rkd4'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true, // Ensures session persistence
    detectSessionInUrl: false, // Disable URL session detection for mobile apps
  },
});
