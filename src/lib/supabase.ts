import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and Key
const supabaseUrl = 'https://ydsmrdztqvtepjqoqdod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc21yZHp0cXZ0ZXBqcW9xZG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODgzNTUsImV4cCI6MjA5Mjg2NDM1NX0.EKpnNPyDUJMLFLnBmBE3gVyGjFxUrIMQSGpf122QxJE';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for Real-time Canon Sync
export const syncCanon = (callback: (data: any) => void) => {
  console.log("Initializing Canon Sync...");
  
  // 1. Initial Fetch
  supabase
    .from('canon_state')
    .select('data')
    .eq('id', 'main')
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("Initial fetch error:", error);
        // If row doesn't exist, we might be stuck
        if (error.code === 'PGRST116') {
          console.error("Row 'main' not found in canon_state table.");
        }
      }
      if (data) {
        console.log("Initial data received:", data.data);
        callback(data.data);
      }
    });

  // 2. Real-time Subscription
  const channel = supabase
    .channel('canon-changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'canon_state', filter: 'id=eq.main' },
      (payload) => {
        callback(payload.new.data);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Helper to Update Canon
export const updateCanon = async (newState: any) => {
  const { error } = await supabase
    .from('canon_state')
    .update({ data: newState })
    .eq('id', 'main');
    
  if (error) console.error('Error updating canon:', error);
};
