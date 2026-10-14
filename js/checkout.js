/**
 * Checkout logika pro SheSkates (jaro 2027)
 * - výběr termínu (3 jarní víkendy) + varianty (solo / duo)
 * - validace formuláře
 * - objednávka se ULOŽÍ do TURBOW Form Gateway (forms.webyprobyznys.cz)
 *   → majiteli chodí e-mail s objednávkou i obsazeností všech termínů
 * - redirect na Stripe Payment Link (client_reference_id = submissionId)
 */

// ═══════════════════════════════════════════════════════════════
// KONFIGURACE
// ═══════════════════════════════════════════════════════════════
// Objednávky jdou do REZERVAČNÍ SLUŽBY (vlastní systém, mimo TURBOW).
const GATEWAY_URL = 'https://rezervace.webyprobyznys.cz/api/orders';
const EVENT_ID = 'sheskates-longboard-2027';
const GATEWAY_TIMEOUT_MS = 4500;

const PAYMENT_LINKS = {
  solo: 'https://buy.stripe.com/bJe6oGbC37rJb5ygnn9EI08',
  duo:  'https://buy.stripe.com/00wfZggWn8vNa1udbb9EI09',
};

// Termíny — musí odpovídat konfiguraci gateway (data/form-gateway.json)
const TERMS = {
  '2027-04-16': { label: '16.–18. 4. 2027', closes: '9. 4. 2027' },
  '2027-05-14': { label: '14.–16. 5. 2027', closes: '7. 5. 2027' },
  '2027-06-11': { label: '11.–13. 6. 2027', closes: '4. 6. 2027' },
};

// ═══════════════════════════════════════════════════════════════
// UI LOGIC
// ═══════════════════════════════════════════════════════════════
const form            = document.getElementById('checkoutForm');
const submitBtn       = document.getElementById('submitBtn');
const formError       = document.getElementById('formError');
const variantInputs   = document.querySelectorAll('input[name="variant"]');
const termInputs      = document.querySelectorAll('input[name="term"]');

function formatPrice(n) {
  return n.toLocaleString('cs-CZ') + ' Kč';
}

function selectedTermInput() {
  return document.querySelector('input[name="term"]:checked');
}

function termLabel(value) {
  return (TERMS[value] && TERMS[value].label) || value || '';
}

function updateSummaryTerm() {
  const el = document.getElementById('summaryTerm');
  if (!el) return;
  const t = selectedTermInput();
  el.textContent = t ? termLabel(t.value) : 'vyber termín';
  el.style.color = t ? '' : 'var(--accent)';
}

function updateVariantUI() {
  const selected = document.querySelector('input[name="variant"]:checked');
  if (!selected) return;
  const price  = parseInt(selected.dataset.price, 10);
  const label  = selected.value === 'solo' ? '1 osoba' : 'Já a kámoška';
  const isDuo  = selected.value === 'duo';

  document.getElementById('btnPrice').textContent       = formatPrice(price);
  document.getElementById('summaryVariant').textContent = label;
  document.getElementById('summaryPrice').textContent   = formatPrice(isDuo ? 9800 : price);
  document.getElementById('summaryTotal').textContent   = formatPrice(price);
  document.getElementById('discountLine').style.display = isDuo ? 'flex' : 'none';

  const friendFields = document.getElementById('friendFields');
  if (friendFields) {
    friendFields.style.display = isDuo ? 'block' : 'none';
  }
}

variantInputs.forEach(input => input.addEventListener('change', updateVariantUI));
termInputs.forEach(input => input.addEventListener('change', updateSummaryTerm));

// Předvybrat z URL (?term=2027-04-16&variant=solo), jinak z paměti prohlížeče
const urlParams = new URLSearchParams(window.location.search);
const urlTerm = urlParams.get('term') || localStorage.getItem('sheskates_term');
if (urlTerm && TERMS[urlTerm]) {
  const t = document.querySelector(`input[name="term"][value="${urlTerm}"]`);
  if (t) t.checked = true;
}
const urlVariant = urlParams.get('variant');
if (urlVariant && (urlVariant === 'solo' || urlVariant === 'duo')) {
  const target = document.querySelector(`input[name="variant"][value="${urlVariant}"]`);
  if (target) target.checked = true;
}
updateVariantUI();
updateSummaryTerm();

function detectDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

function validate(data) {
  const errors = [];
  if (!data.term)             errors.push('Vyber termín.');
  if (!data.firstName.trim()) errors.push('Vyplň jméno.');
  if (!data.lastName.trim())  errors.push('Vyplň příjmení.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Zadej platný e-mail.');
  if (!data.phone.trim())     errors.push('Vyplň telefon.');
  return errors;
}

// Objednávku uloží do Form Gateway. Když se to nepovede, NEBLOKUJE prodej —
// návrat null znamená „pokračuj na platbu, data zkusíme znovu později".
async function sendOrder(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return (json && (json.orderId || json.submissionId)) || null;
  } catch (err) {
    console.warn('Objednávku se nepodařilo uložit do rezervační služby:', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.remove('visible');

  const selected   = document.querySelector('input[name="variant"]:checked');
  const termSel    = selectedTermInput();
  const friendName = document.getElementById('friendName')?.value.trim();
  const promoCode  = document.getElementById('promoCode')?.value.trim();
  const data = {
    variant:    selected ? selected.value : '',
    term:       termSel ? termSel.value : '',
    termLabel:  termSel ? termLabel(termSel.value) : '',
    firstName:  document.getElementById('firstName').value.trim(),
    lastName:   document.getElementById('lastName').value.trim(),
    email:      document.getElementById('email').value.trim().toLowerCase(),
    phone:      document.getElementById('phone').value.trim(),
    notes:      document.getElementById('notes').value.trim(),
    friendName: friendName || null,
    promoCode:  promoCode || null,
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
    const osob   = data.variant === 'duo' ? 2 : 1;
    const amount = data.variant === 'solo' ? 4900 : 7350;

    const notesParts = [];
    if (data.notes) notesParts.push(data.notes);
    if (data.friendName) notesParts.push(`Kámoška: ${data.friendName}`);

    const fields = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      term: data.term,
      term_label: data.termLabel,
      osob: String(osob),
      variant: data.variant,
      amount: String(amount),
    };
    if (notesParts.length) fields.notes = notesParts.join(' | ');
    if (data.promoCode)    fields.promo = data.promoCode;

    const payload = {
      eventId: EVENT_ID,
      idempotencyKey: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('obj-' + Date.now()),
      fields: fields,
      meta: {
        url: window.location.href,
        referrer: document.referrer || '',
        device: detectDevice(),
        utm_source:   urlParams.get('utm_source')   || '',
        utm_medium:   urlParams.get('utm_medium')   || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content:  urlParams.get('utm_content')  || '',
        utm_term:     urlParams.get('utm_term')     || '',
        gclid:        urlParams.get('gclid')        || '',
        fbclid:       urlParams.get('fbclid')       || '',
      },
    };

    const submissionId = await sendOrder(payload);

    // Záloha v prohlížeči (kdyby služba neodpovídala, data zůstanou)
    localStorage.setItem('sheskates_checkout', JSON.stringify({
      ...data, orderId: submissionId, gatewaySaved: Boolean(submissionId), timestamp: Date.now(),
    }));
    localStorage.setItem('sheskates_term', data.term);

    // GTM dataLayer — begin_checkout
    const checkoutValue = amount;
    const checkoutItem = {
      item_name: data.variant === 'solo' ? 'Longboard kemp — 1 osoba' : 'Longboard kemp — Já a kámoška',
      item_id: 'longboard_' + data.variant,
      item_variant: data.termLabel,
      price: checkoutValue,
      quantity: 1,
    };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'begin_checkout',
      transaction_id: submissionId || null,
      value: checkoutValue,
      currency: 'CZK',
      term: data.termLabel,
      items: [checkoutItem],
      ecommerce: {
        transaction_id: submissionId || null,
        value: checkoutValue,
        currency: 'CZK',
        items: [checkoutItem],
      },
    });

    // Stripe Payment Link (musí mít nastavený redirect na /thank-you.html)
    const url = new URL(PAYMENT_LINKS[data.variant]);
    url.searchParams.set('prefilled_email', data.email);
    if (submissionId) url.searchParams.set('client_reference_id', submissionId);
    if (data.promoCode) url.searchParams.set('prefilled_promo_code', data.promoCode);

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
