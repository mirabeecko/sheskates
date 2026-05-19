# SkeSkates — Supabase Setup

## 1. Schema
Spusť `schema.sql` v Supabase SQL Editoru (New query → Run).

## 2. Edge Functions — Deploy

### Nastavení prostředí v Supabase Dashboard
Jdi do **Project Settings → Functions** a přidej tyto secrets:
- `SUPABASE_URL` = tvůj Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service role key (z API settings)

### Deploy přes Supabase CLI
```bash
# Instalace CLI (pokud nemáš)
npm install -g supabase

# Login
supabase login

# Link project (nahraď project-ref)
supabase link --project-ref tvuj-project-ref

# Deploy funkcí
supabase functions deploy create-order
supabase functions deploy update-order
```

## 3. Frontend konfigurace
V `js/checkout.js` a `js/thankyou.js` nahraď:
```js
const SUPABASE_URL = 'https://tvuj-project.supabase.co';
```

## 4. Bezpečnost
- **Service role key** je pouze v Edge Function prostředí (server-side)
- Frontend zná jen veřejný project URL
- Žádný tajný klíč není v browseru
