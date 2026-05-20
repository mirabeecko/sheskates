#!/usr/bin/env node
/**
 * Setup Stripe produktů a Payment Links pro SheSkates
 * Používá AI Gateway: https://ai.majlajf.cz/stripe/...
 *
 * Spuštění:
 *   node scripts/setup-stripe.js
 */

const GATEWAY_BASE = "https://ai.majlajf.cz/stripe";
const BEARER_TOKEN = process.env.GATEWAY_TOKEN || "350b0dd217e878bc129542b1dfc6c40fe7c07b5691137483c2bc27a1bbf81edf";
const THANKYOU_URL = process.env.THANKYOU_URL || "https://sheskates.cz/thankyou.html";

const headers = {
  "Authorization": `Bearer ${BEARER_TOKEN}`,
  "Content-Type": "application/x-www-form-urlencoded",
};

async function stripePost(endpoint, body) {
  const url = `${GATEWAY_BASE}/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Stripe API error [${endpoint}]: ${data.error.message}`);
  }
  return data;
}

async function main() {
  console.log("🛹  SheSkates Stripe Setup\n");

  // 1 osoba – 6 290 Kč
  console.log("Creating product: 1 osoba …");
  const productSolo = await stripePost("products", {
    name: "1 osoba",
    description: "Víkendový surfskate kemp pro ženy – 2 dny / 1 noc, kompletní vybavení, 12h coachingu. Jedna účastnice.",
  });
  console.log("  Product ID:", productSolo.id);

  const priceSolo = await stripePost("prices", {
    product: productSolo.id,
    currency: "czk",
    unit_amount: "629000", // 6 290 Kč v haléřích
  });
  console.log("  Price ID:  ", priceSolo.id);

  // Já a kámoška – 9 435 Kč
  console.log("\nCreating product: Já a kámoška …");
  const productDuo = await stripePost("products", {
    name: "Já a kámoška",
    description: "Víkendový surfskate kemp pro ženy – 2 dny / 1 noc, kompletní vybavení, 12h coachingu. Akce pro dvě osoby.",
  });
  console.log("  Product ID:", productDuo.id);

  const priceDuo = await stripePost("prices", {
    product: productDuo.id,
    currency: "czk",
    unit_amount: "943500", // 9 435 Kč v haléřích
  });
  console.log("  Price ID:  ", priceDuo.id);

  // Payment Links
  console.log("\nCreating Payment Links …");
  const linkSolo = await stripePost("payment_links", {
    "line_items[0][price]": priceSolo.id,
    "line_items[0][quantity]": "1",
    "after_completion[type]": "redirect",
    "after_completion[redirect][url]": THANKYOU_URL,
  });
  console.log("  1 osoba:     ", linkSolo.url);

  const linkDuo = await stripePost("payment_links", {
    "line_items[0][price]": priceDuo.id,
    "line_items[0][quantity]": "1",
    "after_completion[type]": "redirect",
    "after_completion[redirect][url]": THANKYOU_URL,
  });
  console.log("  Já a kámoška:", linkDuo.url);

  // Výstup pro .env
  console.log("\n✅  Hotovo! Přidej do .env nebo index.html:\n");
  console.log(`STRIPE_PAYMENT_LINK_SOLO=${linkSolo.url}`);
  console.log(`STRIPE_PAYMENT_LINK_DUO=${linkDuo.url}`);
  console.log(`STRIPE_PRICE_SOLO_ID=${priceSolo.id}`);
  console.log(`STRIPE_PRICE_DUO_ID=${priceDuo.id}`);
}

main().catch(err => {
  console.error("\n❌ Chyba:", err.message);
  process.exit(1);
});
