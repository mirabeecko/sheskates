/**
 * Thank You / Success page logika
 * - Načte checkout data z localStorage
 * - Aktualizuje objednávku přes Supabase Edge Function
 * - Zobrazí detaily + GA4 konverze
 */

// ═══════════════════════════════════════════════════════════════
// KONFIGURACE
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://tvuj-project.supabase.co'; // ← ZMĚŇ
const USE_SUPABASE = SUPABASE_URL && !SUPABASE_URL.includes('tvuj-project');

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION
// ═══════════════════════════════════════════════════════════════
async function updateOrder(orderId, changes) {
  if (!USE_SUPABASE || !orderId) return null;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/update-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, ...changes }),
  });
  if (!res.ok) {
    console.warn('Edge function error:', await res.text());
    return null;
  }
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
  let checkoutData = null;
  try {
    checkoutData = JSON.parse(localStorage.getItem('sheskates_checkout'));
  } catch (e) {}

  const paymentIntentId = getUrlParam('payment_intent');
  const sessionId       = getUrlParam('session_id');

  // Aktualizovat objednávku v Supabase
  if (USE_SUPABASE && checkoutData?.orderId) {
    const updates = { status: paymentIntentId || sessionId ? 'paid' : 'completed' };
    if (paymentIntentId) updates.stripe_payment_intent_id = paymentIntentId;
    await updateOrder(checkoutData.orderId, updates);
  }

  // Zobrazit detaily
  const detailsEl = document.getElementById('orderDetails');
  const variantEl = document.getElementById('detailVariant');
  const emailEl   = document.getElementById('detailEmail');
  const totalEl   = document.getElementById('detailTotal');
  const leadEl    = document.getElementById('thankyouLead');

  if (checkoutData) {
    const variantLabel = checkoutData.variant === 'duo' ? 'Já a kámoška' : '1 osoba';
    const price = checkoutData.variant === 'duo' ? 9435 : 6290;

    variantEl.textContent = variantLabel;
    emailEl.textContent   = checkoutData.email || '—';
    totalEl.textContent   = formatPrice(price);
    detailsEl.style.display = 'block';

    if (checkoutData.firstName) {
      leadEl.textContent = `Děkujeme, ${checkoutData.firstName}! Brzy ti přijde potvrzovací e-mail se všemi detaily.`;
    }

    localStorage.removeItem('sheskates_checkout');
  }

  // GA4 konverze
  if (typeof gtag === 'function') {
    gtag('event', 'purchase', {
      transaction_id: checkoutData?.orderId || paymentIntentId || Date.now().toString(),
      value: checkoutData?.variant === 'duo' ? 9435 : 6290,
      currency: 'CZK',
    });
  }
}

init().catch(console.error);

// Reveal animations
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.delay || '0', 10);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
