/**
 * Checkout logika pro SkeSkates
 * - Aktualizace ceny podle varianty
 * - Validace formuláře
 * - Uložení objednávky do Supabase (volitelné)
 * - Redirect na Stripe Payment Link
 */

// ═══════════════════════════════════════════════════════════════
// KONFIGURACE — doplň své údaje
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL      = '';  // např. 'https://ai.majlajf.cz/supabase' nebo tvůj Supabase project URL
const SUPABASE_ANON_KEY = '';  // anon/public key z Supabase
const USE_SUPABASE      = SUPABASE_URL && SUPABASE_ANON_KEY;

// Stripe Payment Links (získané z setup skriptu)
const PAYMENT_LINKS = {
  solo: 'https://buy.stripe.com/00w14mfSjbHZ6Pi5IJ9EI04',
  duo:  'https://buy.stripe.com/7sY00i9tVbHZ6Pi6MN9EI05',
};

// ═══════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════
async function supabaseInsert(table, record) {
  if (!USE_SUPABASE) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn('Supabase insert failed:', err);
    return null;
  }
  return await res.json();
}

// ═══════════════════════════════════════════════════════════════
// UI LOGIC
// ═══════════════════════════════════════════════════════════════
const form       = document.getElementById('checkoutForm');
const submitBtn  = document.getElementById('submitBtn');
const formError  = document.getElementById('formError');
const variantInputs = document.querySelectorAll('input[name="variant"]');

// Cenové formátování
function formatPrice(n) {
  return n.toLocaleString('cs-CZ') + ' Kč';
}

// Aktualizace UI podle varianty
function updateVariantUI() {
  const selected = document.querySelector('input[name="variant"]:checked');
  if (!selected) return;
  const price  = parseInt(selected.dataset.price, 10);
  const label  = selected.value === 'solo' ? '1 osoba' : 'Já a kámoška';
  const isDuo  = selected.value === 'duo';

  document.getElementById('btnPrice').textContent       = formatPrice(price);
  document.getElementById('summaryVariant').textContent = label;
  document.getElementById('summaryPrice').textContent   = formatPrice(isDuo ? 12580 : price);
  document.getElementById('summaryTotal').textContent   = formatPrice(price);
  document.getElementById('discountLine').style.display = isDuo ? 'flex' : 'none';
}

variantInputs.forEach(input => {
  input.addEventListener('change', updateVariantUI);
});
// Předvybrat variantu z URL (?variant=solo|duo)
const urlParams = new URLSearchParams(window.location.search);
const urlVariant = urlParams.get('variant');
if (urlVariant && (urlVariant === 'solo' || urlVariant === 'duo')) {
  const target = document.querySelector(`input[name="variant"][value="${urlVariant}"]`);
  if (target) {
    target.checked = true;
    updateVariantUI();
  }
}
updateVariantUI();

// Validace
function validate(data) {
  const errors = [];
  if (!data.firstName.trim()) errors.push('Vyplň jméno.');
  if (!data.lastName.trim())  errors.push('Vyplň příjmení.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Zadej platný e-mail.');
  if (!data.phone.trim())     errors.push('Vyplň telefon.');
  return errors;
}

// Odeslání
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.remove('visible');

  const selected = document.querySelector('input[name="variant"]:checked');
  const data = {
    variant:   selected.value,
    firstName: document.getElementById('firstName').value.trim(),
    lastName:  document.getElementById('lastName').value.trim(),
    email:     document.getElementById('email').value.trim().toLowerCase(),
    phone:     document.getElementById('phone').value.trim(),
    notes:     document.getElementById('notes').value.trim(),
  };

  const errors = validate(data);
  if (errors.length) {
    formError.textContent = errors[0];
    formError.classList.add('visible');
    return;
  }

  // Loading state
  submitBtn.classList.add('btn-loading');
  submitBtn.disabled = true;

  try {
    // 1. Uložit do Supabase (pokud je nakonfigurováno)
    const orderRecord = {
      variant: data.variant,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      notes: data.notes || null,
      status: 'pending',
      amount: data.variant === 'solo' ? 629000 : 943500,
    };

    let orderId = null;
    if (USE_SUPABASE) {
      const inserted = await supabaseInsert('sheskates_orders', orderRecord);
      if (inserted && inserted[0]) orderId = inserted[0].id;
    }

    // Fallback: uložit do localStorage pro thankyou page
    localStorage.setItem('sheskates_checkout', JSON.stringify({
      ...data,
      orderId,
      timestamp: Date.now(),
    }));

    // 2. Připravit Stripe Payment Link s prefilled email
    const paymentLink = PAYMENT_LINKS[data.variant];
    const url = new URL(paymentLink);
    url.searchParams.set('prefilled_email', data.email);
    if (orderId) url.searchParams.set('client_reference_id', orderId);

    // 3. Redirect na Stripe
    window.location.href = url.toString();

  } catch (err) {
    console.error(err);
    formError.textContent = 'Něco se pokazilo. Zkus to znovu nebo nám napiš na info@sheskates.cz';
    formError.classList.add('visible');
    submitBtn.classList.remove('btn-loading');
    submitBtn.disabled = false;
  }
});

// Sticky header (stejné jako main.js)
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}
