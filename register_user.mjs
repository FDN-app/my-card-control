import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbzrgxuwtdcsqoenkvms.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienJneHV3dGRjc3FvZW5rdm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDg1NzEsImV4cCI6MjA5MDQ4NDU3MX0.MLWDvmruGpQQsejuJai-mmuVyiM-m3tfRU6efbmp79w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function register() {
  const { data, error } = await supabase.auth.signUp({
    email: 'tanomanfer@gmail.com',
    password: 'chicha33',
  });

  if (error) {
    console.error('Error signing up:', error.message);
  } else {
    console.log('User registered:', data.user.id);
  }
}

register();
