import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('Checking users...');

const { data: users } = await supabase
  .from('users')
  .select('*')
  .order('created_at', { ascending: false });

console.log(JSON.stringify(users, null, 2));
