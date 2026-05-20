/**
 * Checkout logika pro SkeSkates
 * - Aktualizace ceny podle varianty
 * - Validace formuláře
 * - Uložení objednávky přes Supabase Edge Function
 * - Redirect na Stripe Payment Link
 */

// ═══════════════════════════════════════════════════════════════
// KONFIGURACE — doplň svůj Supabase project URL
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://tvuj-project.supabase.co'; // ← ZMĚŇ

// Stripe Payment Links (vygenerované z setup skriptu)
const PAYMENT_LINKS = {
  solo: 'https://buy.stripe.com/00w14mfSjbHZ6Pi5IJ9EI04',
  duo:  'https://buy.stripe.com/7sY00i9tVbHZ6Pi6MN9EI05',
};

const USE_SUPABASE = SUPABASE_URL && !SUPABASE_URL.includes('tvuj-project');

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION
// ═══════════════════════════════════════════════════════════════
async function createOrder(record) {
  if (!USE_SUPABASE) return null;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn('Edge function error:', err);
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

function formatPrice(n) {
  return n.toLocaleString('cs-CZ') + ' Kč';
}

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

  const friendFields = document.getElementById('friendFields');
  if (friendFields) {
    friendFields.style.display = isDuo ? 'block' : 'none';
  }
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

function validate(data) {
  const errors = [];
  if (!data.firstName.trim()) errors.push('Vyplň jméno.');
  if (!data.lastName.trim())  errors.push('Vyplň příjmení.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Zadej platný e-mail.');
  if (!data.phone.trim())     errors.push('Vyplň telefon.');
  return errors;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.remove('visible');

  const selected = document.querySelector('input[name="variant"]:checked');
  const friendName = document.getElementById('friendName')?.value.trim();
  const data = {
    variant:    selected.value,
    firstName:  document.getElementById('firstName').value.trim(),
    lastName:   document.getElementById('lastName').value.trim(),
    email:      document.getElementById('email').value.trim().toLowerCase(),
    phone:      document.getElementById('phone').value.trim(),
    notes:      document.getElementById('notes').value.trim(),
    friendName: friendName || null,
  };

  const errors = validate(data);
  if (errors.length) {
    formError.textContent = errors[0];
    formError.classList.add('visible');
    return;
  }

  submitBtn.classList.add('btn-loading');
  submitBtn.disabled = true;

  try {
    const notesParts = [];
    if (data.notes) notesParts.push(data.notes);
    if (data.friendName) notesParts.push(`Kámoška: ${data.friendName}`);

    const orderRecord = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      notes: notesParts.join(' | ') || null,
      variant: data.variant,
      amount: data.variant === 'solo' ? 629000 : 943500,
      utm_source: urlParams.get('utm_source') || null,
      utm_medium: urlParams.get('utm_medium') || null,
      utm_campaign: urlParams.get('utm_campaign') || null,
      referrer: document.referrer || null,
    };

    let orderId = null;
    if (USE_SUPABASE) {
      const result = await createOrder(orderRecord);
      if (result && result.orderId) orderId = result.orderId;
    }

    localStorage.setItem('sheskates_checkout', JSON.stringify({
      ...data,
      orderId,
      timestamp: Date.now(),
    }));

    const paymentLink = PAYMENT_LINKS[data.variant];
    const url = new URL(paymentLink);
    url.searchParams.set('prefilled_email', data.email);
    if (orderId) url.searchParams.set('client_reference_id', orderId);

    window.location.href = url.toString();

  } catch (err) {
    console.error(err);
    formError.textContent = 'Něco se pokazilo. Zkus to znovu nebo nám napiš na info@sheskates.cz';
    formError.classList.add('visible');
    submitBtn.classList.remove('btn-loading');
    submitBtn.disabled = false;
  }
});

// Sticky header
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Reveal animations (kopie z main.js)
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
