/* ============================================================
   FloorBot Pro — Product Loader
   Carica dati prodotto dinamicamente dalla tabella 'prodotti'.
   ============================================================ */

async function loadProduct() {
  try {
    const url = CONFIG.SUPABASE_URL + '/rest/v1/prodotti?slug=eq.' + CONFIG.PRODOTTO_SLUG + '&attivo=eq.true&select=*';
    const res = await fetch(url, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
      }
    });
    if (!res.ok) {
      console.warn('[Product] Fetch failed:', res.status);
      initWithDefaults();
      return;
    }
    const data = await res.json();
    if (!data || data.length === 0) {
      console.warn('[Product] Nessun prodotto trovato per slug:', CONFIG.PRODOTTO_SLUG);
      initWithDefaults();
      return;
    }

    const p = data[0];

    /* --- Popola CONFIG con i dati dal DB --- */
    CONFIG.PRODOTTO_NOME   = p.nome;
    CONFIG.PREZZO          = parseFloat(p.prezzo);
    CONFIG.PREZZO_LISTINO  = p.prezzo_listino ? parseFloat(p.prezzo_listino) : null;
    CONFIG.COSTO_SPEDIZIONE           = parseFloat(p.costo_spedizione || 4.90);
    CONFIG.SOGLIA_SPEDIZIONE_GRATUITA = parseFloat(p.spedizione_gratuita_sopra || 50);
    CONFIG.TEMPO_SPEDIZIONE = p.tempo_spedizione || '24-48h';
    CONFIG.STRIPE_PRICE_ID  = p.stripe_price_id || 'price_placeholder';

    /* --- Aggiorna il DOM --- */
    updateProductDOM(p);

    /* --- Inizializza carrello --- */
    if (typeof initCart === 'function') initCart();

  } catch (err) {
    console.warn('[Product] Errore:', err);
    initWithDefaults();
  }
}

function initWithDefaults() {
  CONFIG.PRODOTTO_NOME   = 'FloorBot Pro';
  CONFIG.PREZZO          = 79.90;
  CONFIG.PREZZO_LISTINO  = 129.90;
  CONFIG.COSTO_SPEDIZIONE           = 4.90;
  CONFIG.SOGLIA_SPEDIZIONE_GRATUITA = 50;
  CONFIG.TEMPO_SPEDIZIONE = '24-48h';
  if (typeof initCart === 'function') initCart();
}

function updateProductDOM(p) {
  /* SEO */
  if (p.seo_title) document.title = p.seo_title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && p.seo_description) metaDesc.content = p.seo_description;

  /* Nome prodotto checkout */
  const checkoutName = document.querySelector('.checkout-product h3');
  if (checkoutName && p.nome) checkoutName.textContent = p.nome;

  /* Immagini */
  const heroImg = document.querySelector('.hero-img img');
  if (heroImg && p.immagine_url) heroImg.src = p.immagine_url;

  const checkoutImg = document.querySelector('.checkout-product img');
  if (checkoutImg && p.immagine_url) checkoutImg.src = p.immagine_url;

  /* Prezzi */
  document.querySelectorAll('.price-current').forEach(el => {
    if (p.prezzo) el.textContent = formatMoney(parseFloat(p.prezzo));
  });
  document.querySelectorAll('.price-old').forEach(el => {
    if (p.prezzo_listino) el.textContent = formatMoney(parseFloat(p.prezzo_listino));
  });
  document.querySelectorAll('.price-save').forEach(el => {
    if (p.prezzo && p.prezzo_listino) {
      const saving = parseFloat(p.prezzo_listino) - parseFloat(p.prezzo);
      el.textContent = 'Risparmi €' + saving.toFixed(0);
    }
  });

  /* Gallery */
  if (p.immagini_gallery && Array.isArray(p.immagini_gallery)) {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    p.immagini_gallery.forEach((src, i) => {
      if (galleryItems[i]) galleryItems[i].src = src;
    });
  }
}

document.addEventListener('DOMContentLoaded', loadProduct);