/* ================================================================
   SKE SKATES (sheskates.cz) — Main JS
   ================================================================ */

// ---- FAQ Accordion ------------------------------------------------
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('active');

    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('active');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ---- Scroll reveal (IntersectionObserver) -------------------------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

// ---- Smooth scroll + highlight for offer CTA ---------------------
document.getElementById('offerCta')?.addEventListener('click', function(e) {
  e.preventDefault();
  const target = document.querySelector(this.getAttribute('href'));
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Highlight the duo pricing card
    const highlight = target.querySelector('.pricing-highlight');
    if (highlight) {
      highlight.style.transition = 'box-shadow 0.5s ease';
      highlight.style.boxShadow = '0 0 0 4px rgba(255, 77, 46, 0.4), 0 8px 32px rgba(255, 77, 46, 0.30)';
      setTimeout(() => {
        highlight.style.boxShadow = '';
      }, 2000);
    }
  }
});

// ---- Copyright year -----------------------------------------------
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = `© ${new Date().getFullYear()} · Vyrobeno s 🔥 pro ženy.`;
}
