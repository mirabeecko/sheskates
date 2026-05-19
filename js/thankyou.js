/**
 * Thank You / Success page logika
 * - Načte checkout data z localStorage
 * - Ověří platbu přes Stripe API (pokud je payment_intent v URL)
 * - Aktualizuje objednávku v Supabase
 * - Zobrazí detaily
 */

// ═══════════════════════════════════════════════════════════════
// KONFIGURACE
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL       = '';  // např. 'https://ai.majlajf.cz/supabase' nebo tvůj Supabase project URL
const SUPABASE_ANON_KEY  = '';  // anon/public key
const USE_SUPABASE       = SUPABASE_URL && SUPABASE_ANON_KEY;
const STRIPE_GATEWAY     = 'https://ai.majlajf.cz/stripe';
const GATEWAY_TOKEN      = '';  // Bearer token pro Stripe gateway (nepovinné, pokud je public)

// ═══════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════
async function supabaseUpdate(table, id, changes) {
  if (!USE_SUPABASE || !id) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(changes),
  });
  if (!res.ok) {
    console.warn('Supabase update failed:', await res.text());
    return null;
  }
  return await res.json();
}

// ═══════════════════════════════════════════════════════════════
// STRIPE HELPERS
// ═══════════════════════════════════════════════════════════════
async function fetchStripePaymentIntent(piId) {
  const headers = { 'Content-Type': 'application/json' };
  if (GATEWAY_TOKEN) headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;

  const res = await fetch(`${STRIPE_GATEWAY}/payment_intents/${piId}`, { headers });
  if (!res.ok) return null;
  return await res.json();
}

async function fetchStripeSession(sessionId) {
  const headers = { 'Content-Type': 'application/json' };
  if (GATEWAY_TOKEN) headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;

  const res = await fetch(`${STRIPE_GATEWAY}/checkout/sessions/${sessionId}`, { headers });
  if (!res.ok) return null;
  return await res.json();
}

// ═══════════════════════════════════════════════════════════════
// UI LOGIC
// ═══════════════════════════════════════════════════════════════
function formatPrice(n) {
  return n.toLocaleString('cs-CZ') + ' Kč';
}

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function init() {
  // 1. Načíst checkout data z localStorage
  let checkoutData = null;
  try {
    checkoutData = JSON.parse(localStorage.getItem('sheskates_checkout'));
  } catch (e) {
    // ignore
  }

  // 2. Získat Stripe parametry z URL
  const paymentIntentId = getUrlParam('payment_intent');
  const sessionId       = getUrlParam('session_id');
  const checkoutSessionId = getUrlParam('checkout_session_id');

  // 3. Ověřit platbu a aktualizovat Supabase
  let stripeVerified = false;
  let stripeEmail = null;

  if (paymentIntentId) {
    const pi = await fetchStripePaymentIntent(paymentIntentId);
    if (pi && pi.status === 'succeeded') {
      stripeVerified = true;
      stripeEmail = pi.receipt_email || pi.charges?.data?.[0]?.billing_details?.email;
    }
  } else if (sessionId || checkoutSessionId) {
    const sid = sessionId || checkoutSessionId;
    const session = await fetchStripeSession(sid);
    if (session && session.payment_status === 'paid') {
      stripeVerified = true;
      stripeEmail = session.customer_email || session.customer_details?.email;
    }
  }

  // 4. Aktualizovat objednávku v Supabase
  if (USE_SUPABASE && checkoutData?.orderId) {
    await supabaseUpdate('orders', checkoutData.orderId, {
      status: stripeVerified ? 'paid' : 'completed',
      stripe_payment_intent_id: paymentIntentId || null,
    });
  }

  // 5. Zobrazit detaily
  const detailsEl = document.getElementById('orderDetails');
  const variantEl = document.getElementById('detailVariant');
  const emailEl   = document.getElementById('detailEmail');
  const totalEl   = document.getElementById('detailTotal');
  const leadEl    = document.getElementById('thankyouLead');

  if (checkoutData) {
    const variantLabel = checkoutData.variant === 'duo' ? 'Já a kámoška' : '1 osoba';
    const price = checkoutData.variant === 'duo' ? 9435 : 6290;

    variantEl.textContent = variantLabel;
    emailEl.textContent   = checkoutData.email || stripeEmail || '—';
    totalEl.textContent   = formatPrice(price);
    detailsEl.style.display = 'block';

    if (checkoutData.firstName) {
      leadEl.textContent = `Děkujeme, ${checkoutData.firstName}! Brzy ti přijde potvrzovací e-mail se všemi detaily.`;
    }

    // Vyčistit localStorage
    localStorage.removeItem('sheskates_checkout');
  } else if (stripeEmail) {
    emailEl.textContent = stripeEmail;
    detailsEl.style.display = 'block';
  }

  // 6. GA4 conversion event (pokud je dostupné)
  if (typeof gtag === 'function') {
    gtag('event', 'purchase', {
      transaction_id: checkoutData?.orderId || paymentIntentId || Date.now().toString(),
      value: checkoutData?.variant === 'duo' ? 9435 : 6290,
      currency: 'CZK',
    });
  }
}

init().catch(console.error);
