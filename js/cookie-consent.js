(function () {
  var STORAGE_KEY = 'sheskates_consent';

  function applyConsent(choice) {
    if (typeof window.gtag !== 'function') return;
    if (choice === 'granted') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        analytics_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    } else {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
  }

  function saveAndApply(choice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
    applyConsent(choice);
    var banner = document.getElementById('ss-cookie-banner');
    if (banner) banner.remove();
  }

  function injectStyles() {
    var css = [
      '#ss-cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;',
      'background:#1a1a1a;color:#f5f5f5;padding:1rem 1.5rem;',
      'display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;',
      'font-family:inherit;font-size:.875rem;line-height:1.5;',
      'box-shadow:0 -2px 12px rgba(0,0,0,.3);}',
      '#ss-cookie-banner p{margin:0;flex:1 1 240px;}',
      '#ss-cookie-banner a{color:#c9f;text-decoration:underline;}',
      '.ss-cookie-btn{padding:.5rem 1.25rem;border:none;border-radius:6px;',
      'cursor:pointer;font-size:.875rem;font-weight:600;white-space:nowrap;}',
      '#ss-accept{background:#7c3aed;color:#fff;}',
      '#ss-accept:hover{background:#6d28d9;}',
      '#ss-reject{background:transparent;color:#aaa;border:1px solid #555;}',
      '#ss-reject:hover{color:#fff;border-color:#999;}'
    ].join('');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showBanner() {
    injectStyles();
    var banner = document.createElement('div');
    banner.id = 'ss-cookie-banner';
    banner.innerHTML = [
      '<p>Používáme cookies pro analytiku a reklamu. Pomáhají nám zlepšovat web',
      ' a zobrazovat relevantní nabídky.</p>',
      '<button id="ss-reject" class="ss-cookie-btn">Odmítnout</button>',
      '<button id="ss-accept" class="ss-cookie-btn">Přijmout vše</button>'
    ].join('');
    document.body.appendChild(banner);
    document.getElementById('ss-accept').addEventListener('click', function () {
      saveAndApply('granted');
    });
    document.getElementById('ss-reject').addEventListener('click', function () {
      saveAndApply('denied');
    });
  }

  var saved;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (saved) {
    applyConsent(saved);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
