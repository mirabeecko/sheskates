/**
 * SheSkates — Longboard víkend pro ženy
 * Countdown, spots, exit intent, Meta Pixel, FAQ, reveal
 */

/* ---- Shoptet spots count ---------------------------------------- */
// Napojit na Shoptet API: nahradit SHOPTET_PRODUCT_CODE a endpoint
const SHOPTET_PRODUCT_CODE = 'longboard-kemp-jaro-2027';
const CAMP_MAX_SPOTS = 12;

async function fetchRemainingSpots() {
  try {
    // TODO: nahradit skutečnou URL Shoptet API endpointu
    // Shoptet Product Availability API: https://api.myshoptet.com/api/products/{code}
    // Příklad: const res = await fetch(`/api/spots?product=${SHOPTET_PRODUCT_CODE}`);
    // const data = await res.json();
    // const spots = data.availableQuantity ?? CAMP_MAX_SPOTS;
    // updateSpots(spots);
  } catch (_) {
    // fallback — hodnota zůstane z HTML
  }
}

function updateSpots(count) {
  document.querySelectorAll('.js-spots-count').forEach(el => {
    el.textContent = count;
  });
}

/* ---- Countdown timer -------------------------------------------- */
function startCountdown() {
  const target = new Date('2027-04-09T23:59:59');
  const el = document.getElementById('countdown');
  if (!el) return;

  function tick() {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      el.textContent = 'Přihlášky skončily';
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.textContent = d > 0
      ? `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`
      : `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  tick();
  setInterval(tick, 1000);
}

/* ---- Meta Pixel — InitiateCheckout na klik CTA ------------------ */
function bindPixelCta() {
  document.querySelectorAll('[data-cta="longboard-kemp-buy"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Meta Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
          content_name: 'Longboard víkend jaro 2027',
          currency: 'CZK',
          value: 4900
        });
      }

      // GTM DataLayer push
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'cta_click',
        cta_type: 'longboard-kemp-buy',
        section: btn.closest('[data-section]')?.dataset.section || 'unknown'
      });
    });
  });
}

/* ---- Exit intent popup ------------------------------------------ */
const EXIT_POPUP_KEY = 'sheskates_exit_lk_shown';
const EXIT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 dní

function shouldShowExitPopup() {
  const last = localStorage.getItem(EXIT_POPUP_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) > EXIT_COOLDOWN_MS;
}

function setupExitPopup() {
  if (window.innerWidth < 768) return; // jen desktop

  const overlay = document.getElementById('exitPopup');
  const closeBtn = document.getElementById('exitPopupClose');
  const form = document.getElementById('exitForm');
  if (!overlay) return;

  function showPopup() {
    overlay.removeAttribute('aria-hidden');
    overlay.classList.add('visible');
    overlay.querySelector('.exit-popup-email')?.focus();
    localStorage.setItem(EXIT_POPUP_KEY, Date.now());
  }

  function hidePopup() {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('visible');
  }

  if (shouldShowExitPopup()) {
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0) showPopup();
    }, { once: true });
  }

  closeBtn?.addEventListener('click', hidePopup);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hidePopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopup();
  });

  // Submit — e-mail jde na Form Gateway (tam se ULOŽÍ a odešle e-mailem).
  // Dřív tu byl jen TODO na Ecomail: formulář sice ukázal „PDF je na cestě",
  // ale e-mail se NIKAM neuložil ani neodeslal.
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value?.trim();
    if (!email) return;

    try {
      const res = await fetch('https://forms.webyprobyznys.cz/api/forms/sheskates/leadmagnet/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: 'sheskates',
          formId: 'leadmagnet',
          idempotencyKey: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('klik-' + Date.now()),
          fields: {
            email: email,
            lead_magnet: '5 cviků na stabilitu před Longboard víkendem'
          },
          meta: {
            url: location.href,
            referrer: document.referrer || undefined,
            device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          }
        })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.ok !== true) throw new Error(out.error || ('HTTP ' + res.status));

      // GTM event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'exit_popup_submit', email_domain: email.split('@')[1] });

      form.innerHTML = '<p style="color:#4ade80; font-weight:600; text-align:center; padding:1rem;">PDF je na cestě! 📬</p>';
    } catch (err) {
      console.warn('[ExitForm] odeslání selhalo:', err && err.message);
      form.innerHTML = '<p style="color:var(--accent); text-align:center;">Zkus to prosím znovu nebo napiš na ahoj@sheskates.cz</p>';
    }
  });
}

/* ---- Reveal animations ------------------------------------------ */
function setupReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ---- FAQ accordion ---------------------------------------------- */
function setupFaq() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ---- Header scroll effect --------------------------------------- */
function setupHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ---- Parallax hero ---------------------------------------------- */
function setupParallax() {
  const heroImg = document.getElementById('heroParallax');
  if (!heroImg) return;
  window.addEventListener('scroll', () => {
    heroImg.style.transform = `translateY(${window.scrollY * 0.4}px) scale(1.1)`;
  }, { passive: true });
}

/* ---- Video fallback: skryj bg img pokud video běží -------------- */
function setupVideoFallback() {
  const video = document.querySelector('.hero-video');
  const fallback = document.getElementById('heroBgFallback');
  if (!video || !fallback) return;

  video.addEventListener('playing', () => {
    fallback.style.display = 'none';
  }, { once: true });

  // Pokud video nenačte do 2s, fallback zůstane viditelný
  setTimeout(() => {
    if (video.paused || video.readyState < 3) {
      fallback.style.display = 'block';
    }
  }, 2000);
}

/* ---- Photo carousel --------------------------------------------- */
/* ---- Duo price toggle ------------------------------------------- */
function toggleDuoPrice() {
  const card = document.getElementById('duoPriceCard');
  const btn = document.getElementById('btnRevealDuo');
  if (!card || !btn) return;
  const isVisible = card.classList.contains('visible');
  if (isVisible) {
    card.classList.remove('visible');
    btn.innerHTML = '<span>+ Mám kámošku — ukaž akci za půlku</span>';
  } else {
    card.classList.add('visible');
    btn.innerHTML = '<span>− Skrýt akci pro dvě</span>';
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }
}

/* ---- Footer year ------------------------------------------------ */
function setupFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = `© ${new Date().getFullYear()} sheskates.cz · Vyrobeno s 🔥 pro ženy.`;
}

/* ---- Sticky CTA — zobrazí se až po scrollnutí za hero ----------- */
function setupStickyCta() {
  const sticky = document.getElementById('stickyCta');
  if (!sticky) return;

  // zobrazí se až po scrollnutí ~600px (za hero / u druhého bloku)
  const threshold = 600;

  function checkScroll() {
    if (window.scrollY > threshold) {
      sticky.classList.remove('is-hidden');
    } else {
      sticky.classList.add('is-hidden');
    }
  }

  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll(); // initial check
}

/* ---- Smooth scroll for anchor CTAs ------------------------------ */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 64; // header only (urgency bar je skrytý)
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ---- Init ------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  fetchRemainingSpots();
  bindPixelCta();
  setupExitPopup();
  setupReveal();
  setupFaq();
  setupHeader();
  setupParallax();
  setupVideoFallback();
  setupFooterYear();
  setupSmoothScroll();
  setupStickyCta();
});
