# Audit: GTM / GA4 / Google Tag — sheskates.cz

> Datum auditu: 2026-06-09
> Auditor: AI senior GTM/GA4 developer

---

## 1. Nalezené Google tagy v kódu projektu

| Pattern | Nalezeno v kódu? | Soubor(y) | Závěr |
|---------|-----------------|-----------|-------|
| `gtag(` | **NE** | — | ✅ Žádné přímé gtag.js volání |
| `googletagmanager.com/gtag/js` | **NE** | — | ✅ Žádný inline GA4 / gtag.js script |
| `google-analytics.com` | **NE** | — | ✅ Žádný legacy analytics.js |
| `G-KDMZ8KZC3F` | **ANO** | `gtm-test.spec.js:36` | ✅ Pouze v testu jako negativní kontrola (`not.toContain`) |
| `AW-18191922314` | **ANO** | `gtm-test.spec.js:38` | ✅ Pouze v testu jako negativní kontrola (`not.toContain`) |
| `GT-M34XNHRD` | **NE** | — | ❌ Tento ID **není v kódu projektu** — pochází z GTM UI |
| `GoogleAnalytics` / `GoogleTagManager` | **NE** *(kromě testů)* | — | ✅ Žádné nativní SDK volání |

**KONKLUZE:** Veškeré Google tagy (AW-18191922314, GT-M34XNHRD) které vidíš v Tag Assistant, pocházejí **výhradně z GTM kontejneru GTM-KVV3BZGP** — nejsou vložené přímo do HTML/JS. V kódu projektu je pouze GTM snippet.

---

## 2. Nalezené GTM kontejnery

| Soubor | Řádek | Hodnota |
|--------|-------|---------|
| `index.html` | 9 | `GTM-KVV3BZGP` |
| `index.html` | 105 | `GTM-KVV3BZGP` (noscript iframe) |
| `longboard-kemp-pro-zeny.html` | 9 | `GTM-KVV3BZGP` |
| `longboard-kemp-pro-zeny.html` | 105 | `GTM-KVV3BZGP` (noscript iframe) |
| `checkout.html` | 9 | `GTM-KVV3BZGP` |
| `checkout.html` | 436 | `GTM-KVV3BZGP` (noscript iframe) |
| `thank-you.html` | 9 | `GTM-KVV3BZGP` |
| `thank-you.html` | 267 | `GTM-KVV3BZGP` (noscript iframe) |
| `premium_interactive_guide.html` | 9 | `GTM-KVV3BZGP` |
| `premium_interactive_guide.html` | 87 | `GTM-KVV3BZGP` (noscript iframe) |

✅ **Jediný kontejner:** `GTM-KVV3BZGP` — konzistentní na všech stránkách.

---

## 3. Všechny `dataLayer.push()` v projektu

| # | Soubor | Řádek | Event | Poznámka |
|---|--------|-------|-------|----------|
| 1 | `checkout.html` | 13 | `begin_checkout` | ⚠️ **Statický** — odpálí se při načtení stránky |
| 2 | `js/checkout.js` | 163 | `begin_checkout` | ✅ Dynamický — při odeslání formuláře |
| 3 | `thank-you.html` | 76 | `purchase` | ✅ Dynamický — z localStorage |
| 4 | `thank-you.html` | 103 | `purchase` | ⚠️ Fallback — když localStorage chybí |
| 5 | `js/longboard.js` | 76 | `cta_click` | GTM event na klik CTA |
| 6 | `js/longboard.js` | 151 | `exit_popup_submit` | GTM event na odběr newsletteru |
| 7 | `js/cookie-consent.js` | 7 | `consent` update | Grant všech storage |
| 8 | `js/cookie-consent.js` | 14 | `consent` update | Deny všech storage |

---

## 4. Nalezené CSP hlavičky / konfigurace

| Pattern | Nalezeno? | Soubor | Závěr |
|---------|-----------|--------|-------|
| `Content-Security-Policy` | **NE** | — | ❌ Žádný `<meta http-equiv="Content-Security-Policy">` |
| `next.config` | **NE** | — | Není Next.js projekt |
| `vercel.json` | **NE** | — | Není ve zdrojácích |
| `middleware` | **NE** | — | Není Next.js |
| `netlify.toml` | **NE** | — | Není ve zdrojácích |
| `nginx` | **NE** | — | Není ve zdrojácích |
| `apache` | **NE** | — | Není ve zdrojácích |

**KONKLUZE:** CSP není definována v kódu projektu. Pokud existuje, je nastavená na úrovni serveru (hosting, CDN, proxy) a audit kódu ji nemůže odhalit.

---

## 5. Načítá se více Google tagů současně?

| Zdroj | Stav |
|-------|------|
| Přímé skripty v HTML | ❌ Ne — pouze `gtm.js?id=GTM-KVV3BZGP` |
| Přes GTM konfiguraci | ⚠️ **Ano** — Tag Assistant hlásí AW-18191922314 + GT-M34XNHRD |

**Vysvětlení:** GT-M34XNHRD není v kódu. Je to buď:
- Druhý GTM kontejner připojený v GTM-KVV3BZGP přes **Google Tag** (gtag config)
- Nastavený v GTM UI jako Configuration Tag pro GA4
- Vložený přes nějaký jiný tag v GTM (např. Google Ads Conversion Tracking)

---

## 6. Je někde Google Tag mimo GTM?

**NE.** V kódu projektu je pouze standardní GTM snippet:
```javascript
(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-KVV3BZGP');
```

Žádný `gtag.js`, žádný `google-analytics.com`, žádný `googletagmanager.com/gtag/js`.

---

## 7. Skripty odesílající e-commerce eventy

### `purchase`
```
thank-you.html:76   — dynamický (z localStorage)
thank-you.html:103  — fallback (pevné hodnoty)
```

### `begin_checkout`
```
checkout.html:13    — statický (při načtení stránky)
js/checkout.js:163  — dynamický (při submitu formuláře)
```

### `add_to_cart`
```
❌ NENALEZENO — byl odstraněn v předchozím refaktoringu
```

### `page_view`
```
❌ NENALEZENO v kódu — řídí se výhradně přes GTM / GA4 konfiguraci
```

---

## 8. Konflikty a kritické problémy

### 🔴 K1: Duplicitní `begin_checkout` na checkout stránce

**checkout.html:13** posílá `begin_checkout` okamžitě při načtení stránky — i když uživatel nic nevyplní. **js/checkout.js:163** posílá `begin_checkout` znovu při odeslání formuláře.

**Dopad:** GA4 zapíše 2× begin_checkout za jeden skutečný checkout. První je navíc s natvrdo `item_id: 'longboard_solo'`, i když uživatel přišel pro duo.

### 🔴 K2: Statický `begin_checkout` má špatný item_id

Na řádku 18 `checkout.html` je `item_id: 'longboard_solo'` a cena 4900 natvrdo. Pokud uživatel přijde přes `checkout.html?variant=duo`, dataLayer stejně pošle solo.

### 🟡 K3: Fallback `purchase` na thank-you posílá falešná data

Když localStorage chybí (jiné zařízení, vyčištěno), thank-you pošle purchase s:
- `item_name: 'Longboard kemp — 1 osoba'`
- `item_id: 'longboard_solo'`
- `value: 4900`

I když uživatel mohl koupit duo za 7350 Kč.

### 🟡 K4: `dataLayer` inicializace je po GTM snippetu

V `thank-you.html`, `checkout.html` a `checkout.js` se volá:
```javascript
window.dataLayer = window.dataLayer || [];
```
**až po** GTM snippetu. To může způsobit race condition, když GTM mezitím začne zpracovávat eventy.

### 🟡 K5: `cookie-consent.js` neinicializuje dataLayer před GTM

Pokud je souhlas uložen v localStorage, `cookie-consent.js` okamžitě volá:
```javascript
window.dataLayer.push(['consent', 'update', {...}]);
```
ale `dataLayer` není inicializován před GTM snippetem. Může se stát, že consent event dorazí dřív než GTM a je ztracen.

### 🟡 K6: `js/longboard.js` spoléhá na globální `dataLayer`
```javascript
dataLayer.push({ event: 'cta_click', ... });
```
Bez `window.dataLayer = window.dataLayer || [];` v tomto souboru. Pokud se skript načte před GTM, dojde k `ReferenceError`.

### 🟡 K7: Tag Assistant hlásí "Tato značka Google měla být načtena ještě před odesláním jakýchkoli událostí"

Tohle je GTM konfigurační problém, nikoliv kód. Znamená to, že **Google Tag** (GA4 config) v GTM UI je nastaven s timingem později než by měl. Řeší se v GTM UI nastavením **Tag Sequence** nebo **Consent Initialization** triggeru.

### 🟡 K8: "Odložené požadavky na server" v Tag Assistant

GTM se načítá asynchronně (`j.async=true`). Pokud dataLayer eventy dorazí před načtením GTM knihovny, jsou odloženy nebo ztraceny. Doporučení: inicializovat `dataLayer` jako pole **před** GTM snippetem.

---

## 9. Doporučené opravy (diff patch)

### Oprava 1: Odstranit statický `begin_checkout` z checkout.html
```diff
- <script>
- window.dataLayer = window.dataLayer || [];
- window.dataLayer.push({
-   event: 'begin_checkout',
-   value: 4900,
-   currency: 'CZK',
-   items: [{...}],
-   ecommerce: {...}
- });
- </script>
```
**Důvod:** Duplicitní měření. Správný begin_checkout se posílá až v `js/checkout.js` při skutečném submitu.

### Oprava 2: Inicializovat `dataLayer` před GTM snippetem na všech stránkách
```html
<!-- PŘED GTM snippetem -->
<script>
  window.dataLayer = window.dataLayer || [];
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(..., 'GTM-KVV3BZGP');</script>
```
**Soubory:** `index.html`, `longboard-kemp-pro-zeny.html`, `checkout.html`, `thank-you.html`, `premium_interactive_guide.html`

### Oprava 3: Přidat `dataLayer` inicializaci do `js/longboard.js`
```diff
  if (window.dataLayer) {
    dataLayer.push({...})
  }
```
**Důvod:** Ochrana před `ReferenceError`.

### Oprava 4: Přesunout consent inicializaci do `<head>` před GTM
```html
<script>
  window.dataLayer = window.dataLayer || [];
  // consent default zde (pokud chceš mít denied před GTM load)
</script>
```
**Poznámka:** `cookie-consent.js` se načítá `defer`. Consent update po kliku uživatele je OK, ale default consent by měl být v hlavičce.

### Oprava 5: GTM UI — nastavit Google Tag na Consent Initialization
V GTM konzoli:
- Otevřít tag "Google Tag" (GA4 config)
- Trigger: změnit na **Consent Initialization - All Pages**
- Tím se načte před jakýmikoliv jinými eventy

### Oprava 6: GTM UI — zkontrolovat GT-M34XNHRD
V Tag Assistant klikni na "Untitled Tag" s ID GT-M34XNHRD a zjisti:
- Je to druhý GTM kontejner?
- Je to Google Tag s jiným Measurement ID?
- Pokud je zbytečný, odstraň ho z GTM.

---

## 10. Shrnutí pro majitele GTM kontejneru

| Problém | Místo | Řešení |
|---------|-------|--------|
| AW-18191922314 + GT-M34XNHRD v Tag Assistant | GTM UI | Tyto tagy nejsou v kódu. Konfigurují se v GTM konzoli. Zkontroluj tagy a triggery. |
| "Značka měla být načtena před událostmi" | GTM UI | Nastav Google Tag trigger na **Consent Initialization**. |
| Duplicitní begin_checkout | `checkout.html:13` + `js/checkout.js:163` | Odstraň statický push z checkout.html. |
| dataLayer race condition | Všechny HTML | Přesuň `window.dataLayer = []` před GTM snippet. |
| Fallback purchase je falešný | `thank-you.html:103` | Uvaž o odstranění fallbacku nebo alespoň odlišení labelu. |
| CSP blokace | Server/Hosting | Zkontroluj HTTP hlavičky na serveru (nginx/apache/Cloudflare). |
