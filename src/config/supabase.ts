import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://rusgfnlgiuelgjtwkemu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1c2dmbmxnaXVlbGdqdHdrZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzQzNzQsImV4cCI6MjA1NTI1MDM3NH0.qNZ1H0W0V_2kQDiqhmKhFzEbFTfLAodo1QOINXTOkG4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 