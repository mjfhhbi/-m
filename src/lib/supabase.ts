import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default public Supabase project credentials provided by user
const DEFAULT_SUPABASE_URL = 'https://ywcattnuyfeemwwlslyc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_7vl7zsRujqrJfvfN_6c5xA_H9nUWU1z';

// Get credentials from environment variables, custom localStorage settings, or defaults
export function getSupabaseCredentials(): { url: string; key: string } {
  const metaEnv = (import.meta as any)?.env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('supabase_url') || '';
  const localKey = localStorage.getItem('supabase_key') || '';

  return {
    url: localUrl || envUrl || DEFAULT_SUPABASE_URL,
    key: localKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }

  // Check if key is a valid key format (JWT starting with eyJ, or Supabase publishable key starting with sb_)
  if (!key.startsWith('eyJ') && !key.startsWith('sb_')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// SQL Script for setting up Supabase tables easily in 1 click in Supabase SQL Editor
export const SUPABASE_SQL_SCRIPT = `
-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and set public policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write products" ON products;
DROP POLICY IF EXISTS "Allow public read/write orders" ON orders;
DROP POLICY IF EXISTS "Allow public read/write store_settings" ON store_settings;

CREATE POLICY "Allow public read/write products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime safely for all tables (prevents error if already added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
  END IF;
END $$;
`;

