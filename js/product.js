/* ============================================================
   FloorBot Pro — Product Loader
   Carica dati prodotto dinamicamente dalla tabella 'prodotti'.
   ============================================================ */

async function loadProduct() {
  console.log('[FloorBot] Caricamento prodotto... slug:', CONFIG.PRODOTTO_SLUG);

  try {
    const url = CONFIG.SUPABASE_URL + '/rest/v1/prodotti?slug=eq.' + encodeURIComponent(CONFIG.PRODOTTO_SLUG) + '&attivo=eq.true&select=*';
    console.log('[FloorBot] Fetch:', url);

    const res = await fetch(url, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
      }
    });

    console.log('[FloorBot] Status:', res.status);

    if (!res.ok) {
      console.warn('[FloorBot] Fetch fallito:', res.status, await res.text());
      initWithDefaults();
      return;
    }

    const data = await res.json();
    console.log('[FloorBot] Dati ricevuti:', data);

    if (!data || data.length === 0) {
      console.warn('[FloorBot] Nessun prodotto trovato per slug:', CONFIG.PRODOTTO_SLUG);
      initWithDefaults();
      return;
    }

    const p = data[0];
    console.log('[FloorBot] Prodotto trovato:', p.nome, 'Prezzo:', p.prezzo);

    /* --- Popola CONFIG --- */
    CONFIG.PRODOTTO_NOME   = p.nome;
    CONFIG.PREZZO          = parseFloat(p.prezzo);
    CONFIG.PREZZO_LISTINO  = p.prezzo_listino ? parseFloat(p.prezzo_listino) : null;
    CONFIG.COSTO_SPEDIZIONE           = parseFloat(p.costo_spedizione || 4.90);
    CONFIG.SOGLIA_SPEDIZIONE_GRATUITA = parseFloat(p.spedizione_gratuita_sopra || 50);
    CONFIG.TEMPO_SPEDIZIONE = p.tempo_spedizione || '24-48h';
    CONFIG.STRIPE_PRICE_ID  = p.stripe_price_id || 'price_placeholder';

    /* --- Aggiorna DOM --- */
    updateProductDOM(p);
    console.log('[FloorBot] DOM aggiornato con prezzo:', CONFIG.PREZZO);

    /* --- Inizializza carrello --- */
    if (typeof initCart === 'function') {
      initCart();
      console.log('[FloorBot] Carrello inizializzato');
    } else {
      console.warn('[FloorBot] initCart non trovata — cart.js caricato?');
    }

  } catch (err) {
    console.error('[FloorBot] Errore caricamento:', err);
    initWithDefaults();
  }
}

function initWithDefaults() {
  console.log('[FloorBot] Fallback a valori di default');
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

  /* Prezzi — hero e checkout */
  const prezzoVal = parseFloat(p.prezzo);
  const listinoVal = p.prezzo_listino ? parseFloat(p.prezzo_listino) : null;

  document.querySelectorAll('.price-current').forEach(el => {
    el.textContent = formatMoney(prezzoVal);
  });

  document.querySelectorAll('.price-old').forEach(el => {
    if (listinoVal) el.textContent = formatMoney(listinoVal);
  });

  document.querySelectorAll('.price-save').forEach(el => {
    if (listinoVal) {
      const saving = listinoVal - prezzoVal;
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