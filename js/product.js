/* ============================================================
   FloorBot Pro — Product Loader (dinamico + cache)
   ============================================================ */

const CACHE_KEY = 'product_floorbot-pro';

function loadProduct() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try { applyProductData(JSON.parse(cached)); console.log('[Product] Cache:', JSON.parse(cached).nome); } catch(e){}
  }

  const url1 = CONFIG.SUPABASE_URL + '/rest/v1/prodotti?slug=eq.' + encodeURIComponent(CONFIG.PRODOTTO_SLUG) + '&attivo=eq.true&select=*';
  fetch(url1, {
    headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY }
  })
  .then(r => r.json())
  .then(data => {
    if (data && data.length > 0) { saveAndApply(data[0]); return; }
    console.warn('[Product] Vuoto con attivo=true. Provo senza filtro...');
    const url2 = CONFIG.SUPABASE_URL + '/rest/v1/prodotti?slug=eq.' + encodeURIComponent(CONFIG.PRODOTTO_SLUG) + '&select=*';
    return fetch(url2, { headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY } }).then(r => r.json());
  })
  .then(data => {
    if (!data) return;
    if (data.length > 0) { saveAndApply(data[0]); return; }
    console.warn('[Product] Anche senza filtro è vuoto. Debug...');
    return fetch(CONFIG.SUPABASE_URL + '/rest/v1/prodotti?select=slug,nome,attivo,prezzo', {
      headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY }
    }).then(r => r.json());
  })
  .then(all => {
    if (!all) return;
    console.log('[Product] === PRODOTTI NEL DB ===');
    all.forEach(p => console.log('  slug:', JSON.stringify(p.slug), '| attivo:', p.attivo, '| prezzo:', p.prezzo, '| nome:', p.nome));
    console.log('[Product] === FINE ===');
    if (!localStorage.getItem(CACHE_KEY)) initWithDefaults();
  })
  .catch(err => {
    console.error('[Product] Errore:', err);
    if (!localStorage.getItem(CACHE_KEY)) initWithDefaults();
  });
}

function saveAndApply(p) {
  applyProductData(p);
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    nome: p.nome, prezzo: parseFloat(p.prezzo),
    prezzo_listino: p.prezzo_listino ? parseFloat(p.prezzo_listino) : null,
    costo_spedizione: parseFloat(p.costo_spedizione || 4.90),
    spedizione_gratuita_sopra: parseFloat(p.spedizione_gratuita_sopra || 50),
    tempo_spedizione: p.tempo_spedizione || '24-48h',
    descrizione: p.descrizione, descrizione_lunga: p.descrizione_lunga,
    immagine_url: p.immagine_url, immagini_gallery: p.immagini_gallery,
    peso_kg: p.peso_kg, dimensioni: p.dimensioni,
    seo_title: p.seo_title, seo_description: p.seo_description
  }));
}

function applyProductData(p) {
  CONFIG.PRODOTTO_NOME   = p.nome || 'FloorBot Pro';
  CONFIG.PREZZO          = parseFloat(p.prezzo || 79.90);
  CONFIG.PREZZO_LISTINO  = p.prezzo_listino ? parseFloat(p.prezzo_listino) : null;
  CONFIG.COSTO_SPEDIZIONE           = parseFloat(p.costo_spedizione || 4.90);
  CONFIG.SOGLIA_SPEDIZIONE_GRATUITA = parseFloat(p.spedizione_gratuita_sopra || 50);
  CONFIG.TEMPO_SPEDIZIONE = p.tempo_spedizione || '24-48h';
  CONFIG.STRIPE_PRICE_ID  = p.stripe_price_id || 'price_placeholder';

  if (p.seo_title) document.title = p.seo_title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && p.seo_description) metaDesc.content = p.seo_description;

  const checkoutName = document.querySelector('.checkout-product h3');
  if (checkoutName && p.nome) checkoutName.textContent = p.nome;

  const heroImg = document.querySelector('.hero-img img');
  if (heroImg && p.immagine_url) heroImg.src = p.immagine_url;

  const checkoutImg = document.querySelector('.checkout-product img');
  if (checkoutImg && p.immagine_url) checkoutImg.src = p.immagine_url;

  const prezzoVal = parseFloat(p.prezzo || 79.90);
  const listinoVal = p.prezzo_listino ? parseFloat(p.prezzo_listino) : null;

  document.querySelectorAll('.price-current').forEach(el => { el.textContent = formatMoney(prezzoVal); });
  document.querySelectorAll('.price-old').forEach(el => { if (listinoVal) el.textContent = formatMoney(listinoVal); });
  document.querySelectorAll('.price-save').forEach(el => { if (listinoVal) el.textContent = 'Risparmi €' + (listinoVal - prezzoVal).toFixed(0); });

  if (p.immagini_gallery && Array.isArray(p.immagini_gallery)) {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    p.immagini_gallery.forEach((src, i) => { if (galleryItems[i]) galleryItems[i].src = src; });
  }

  const heroSub = document.querySelector('.hero-sub');
  if (heroSub && p.descrizione) heroSub.textContent = p.descrizione;

  if (p.descrizione_lunga) {
    const descContents = document.querySelectorAll('.desc-content');
    const paragraphs = p.descrizione_lunga.split(/\n\n|\r\n\r\n/).filter(s => s.trim());
    descContents.forEach((section, idx) => {
      const ps = section.querySelectorAll('p');
      if (paragraphs[idx] && ps.length > 0) ps[0].textContent = paragraphs[idx].trim();
    });
  }

  const descSections = document.querySelectorAll('.desc-content');
  descSections.forEach(section => {
    const ul = section.querySelector('ul'); if (!ul) return;
    if (p.peso_kg) {
      let li = Array.from(ul.children).find(li => li.textContent.toLowerCase().includes('peso'));
      const text = 'Peso: ' + p.peso_kg + ' kg';
      if (li) li.textContent = text; else { li = document.createElement('li'); li.textContent = text; ul.appendChild(li); }
    }
    if (p.dimensioni) {
      let li = Array.from(ul.children).find(li => li.textContent.toLowerCase().includes('dimension'));
      const text = 'Dimensioni: ' + p.dimensioni;
      if (li) li.textContent = text; else { li = document.createElement('li'); li.textContent = text; ul.appendChild(li); }
    }
  });

  const trustItems = document.querySelectorAll('.trust-item');
  trustItems.forEach(item => {
    if (item.textContent.toLowerCase().includes('spedizione') && p.tempo_spedizione) {
      item.innerHTML = '<div class="trust-icon">🚚</div> Spedizione ' + p.tempo_spedizione;
    }
  });

  if (typeof initCart === 'function') initCart();
}

function initWithDefaults() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) { try { applyProductData(JSON.parse(cached)); return; } catch(e){} }
  applyProductData({ nome: 'FloorBot Pro', prezzo: 79.90, prezzo_listino: 129.90, costo_spedizione: 4.90, spedizione_gratuita_sopra: 50, tempo_spedizione: '24-48h' });
}

document.addEventListener('DOMContentLoaded', loadProduct);