-- SheSkates — Supabase schema pro objednávky
-- Spusť celé najednou v Supabase SQL Editoru

-- 1. Vytvořit tabulku (pokud neexistuje)
CREATE TABLE IF NOT EXISTS public.sheskates_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,

  variant TEXT NOT NULL CHECK (variant IN ('solo', 'duo')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  amount INTEGER NOT NULL,

  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT
);

-- 2. Indexy
CREATE INDEX IF NOT EXISTS idx_sheskates_orders_email ON public.sheskates_orders(email);
CREATE INDEX IF NOT EXISTS idx_sheskates_orders_status ON public.sheskates_orders(status);
CREATE INDEX IF NOT EXISTS idx_sheskates_orders_created_at ON public.sheskates_orders(created_at DESC);

-- 3. Funkce pro auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger
DROP TRIGGER IF EXISTS update_sheskates_orders_updated_at ON public.sheskates_orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.sheskates_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS
ALTER TABLE public.sheskates_orders ENABLE ROW LEVEL SECURITY;

-- 6. Politiky (nejprve dropnout staré, pokud existují)
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.sheskates_orders;
DROP POLICY IF EXISTS "Allow select by id" ON public.sheskates_orders;
DROP POLICY IF EXISTS "Allow update by id" ON public.sheskates_orders;

CREATE POLICY "Allow anonymous insert" ON public.sheskates_orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select by id" ON public.sheskates_orders
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow update by id" ON public.sheskates_orders
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 7. Dashboard view
DROP VIEW IF EXISTS public.sheskates_orders_summary;
CREATE VIEW public.sheskates_orders_summary AS
SELECT
  variant,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM public.sheskates_orders
GROUP BY variant, status;
