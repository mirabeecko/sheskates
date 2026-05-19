-- Supabase schema pro SkeSkates objednávky
-- Spusť v Supabase SQL Editoru (New query → Run)

-- Vytvořit tabulku objednávek
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Základní údaje
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,

  -- Objednávka
  variant TEXT NOT NULL CHECK (variant IN ('solo', 'duo')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  amount INTEGER NOT NULL, -- v haléřích (CZK * 100)

  -- Stripe reference
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,

  -- Konverze / tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT
);

-- Indexy pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Automatická aktualizace updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS politiky (povolit INSERT/UPDATE z frontendu bez autentizace pro checkout)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Povolit INSERT z anon klíče (pro ukládání objednávek z checkout stránky)
CREATE POLICY "Allow anonymous insert" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);

-- Povolit SELECT/UPDATE pro thankyou page
CREATE POLICY "Allow select by id" ON public.orders
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow update by id" ON public.orders
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Dashboard view
CREATE OR REPLACE VIEW public.orders_summary AS
SELECT
  variant,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM public.orders
GROUP BY variant, status;
