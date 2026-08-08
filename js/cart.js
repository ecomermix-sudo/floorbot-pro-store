/* ============================================================
   FloorBot Pro — Cart & Checkout
   Tabella: ordini (struttura condivisa — NON MODIFICARE)
   ============================================================ */

let qty = 1;

function initCart() {
  updateSummary();
}

function updateSummary() {
  const prezzo = CONFIG.PREZZO || 79.90;
  const spedizioneBase = CONFIG.COSTO_SPEDIZIONE || 4.90;
  const sogliaGratis = CONFIG.SOGLIA_SPEDIZIONE_GRATUITA || 50;

  const subtotale = prezzo * qty;
  const spedizione = subtotale >= sogliaGratis ? 0 : spedizioneBase;
  const totale = subtotale + spedizione;

  const elPrice = document.getElementById('summaryPrice');
  const elQty = document.getElementById('summaryQty');
  const elShip = document.getElementById('summaryShipping');
  const elTotal = document.getElementById('summaryTotal');
  const elShipRow = elShip ? elShip.parentElement : null;

  if (elPrice) elPrice.textContent = formatMoney(prezzo);
  if (elQty) elQty.textContent = qty;
  if (elShip) elShip.textContent = spedizione === 0 ? 'GRATIS' : formatMoney(spedizione);
  if (elTotal) elTotal.textContent = formatMoney(totale);
  if (elShipRow) elShipRow.classList.toggle('shipping-free', spedizione === 0);
}

function changeQty(delta) {
  const input = document.getElementById('qty');
  if (!input) return;
  let newVal = parseInt(input.value, 10) + delta;
  if (newVal < 1) newVal = 1;
  if (newVal > 10) newVal = 10;
  input.value = newVal;
  qty = newVal;
  updateSummary();
}

function showAlert(msg, type) {
  const box = document.getElementById('alertBox');
  const txt = document.getElementById('alertMsg');
  const savedBanner = document.getElementById('orderSavedBanner');
  if (!box || !txt) return;
  if (savedBanner) savedBanner.classList.remove('visible');
  txt.textContent = msg;
  box.className = 'alert ' + (type || 'error');
  box.style.display = 'flex';
}

function hideAlert() {
  const box = document.getElementById('alertBox');
  if (box) box.style.display = 'none';
}

function showSavedBanner(msg) {
  const box = document.getElementById('alertBox');
  const savedBanner = document.getElementById('orderSavedBanner');
  if (box) box.style.display = 'none';
  if (savedBanner) {
    const span = savedBanner.querySelector('span:last-child');
    if (span) span.textContent = msg || 'Ordine ricevuto e salvato! Ti contatteremo per completare il pagamento.';
    savedBanner.classList.add('visible');
  }
}

function setLoading(loading) {
  const btn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const txt = document.getElementById('btnText');
  if (!btn) return;
  btn.disabled = loading;
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
  if (txt) txt.textContent = loading ? 'Elaborazione...' : 'Procedi al Pagamento →';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCAP(cap) {
  return /^\d{5}$/.test(cap);
}

function validatePhone(phone) {
  return phone.length >= 8 && /[0-9]/.test(phone);
}

function getFormData() {
  return {
    nome: document.getElementById('nome')?.value.trim() || '',
    cognome: document.getElementById('cognome')?.value.trim() || '',
    email: document.getElementById('email')?.value.trim() || '',
    telefono: document.getElementById('telefono')?.value.trim() || '',
    indirizzo: document.getElementById('indirizzo')?.value.trim() || '',
    citta: document.getElementById('citta')?.value.trim() || '',
    cap: document.getElementById('cap')?.value.trim() || '',
    provincia: document.getElementById('provincia')?.value.trim() || '',
    note: document.getElementById('note')?.value.trim() || '',
  };
}

function validateForm(data) {
  if (!data.nome || !data.cognome || !data.email || !data.indirizzo || !data.citta || !data.cap || !data.provincia) {
    return 'Compila tutti i campi obbligatori.';
  }
  if (!validateEmail(data.email)) {
    return 'Inserisci un indirizzo email valido.';
  }
  if (!validateCAP(data.cap)) {
    return 'Il CAP deve essere composto da 5 cifre.';
  }
  if (data.telefono && !validatePhone(data.telefono)) {
    return 'Inserisci un numero di telefono valido.';
  }
  return null;
}

async function saveOrderDirectToSupabase(orderData) {
  try {
    const url = CONFIG.SUPABASE_URL + '/rest/v1/ordini';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[DB] Fallito:', res.status, text);
      return null;
    }
    const data = await res.json();
    console.log('[DB] Salvato, ID:', data[0]?.id);
    return data[0];
  } catch (err) {
    console.warn('[DB] Errore:', err.message);
    return null;
  }
}

async function submitOrder() {
  hideAlert();
  const savedBanner = document.getElementById('orderSavedBanner');
  if (savedBanner) savedBanner.classList.remove('visible');

  const data = getFormData();
  const error = validateForm(data);
  if (error) {
    showAlert(error);
    return;
  }

  setLoading(true);

  const prezzo = CONFIG.PREZZO || 79.90;
  const spedizioneBase = CONFIG.COSTO_SPEDIZIONE || 4.90;
  const sogliaGratis = CONFIG.SOGLIA_SPEDIZIONE_GRATUITA || 50;

  const subtotale = prezzo * qty;
  const spedizione = subtotale >= sogliaGratis ? 0 : spedizioneBase;
  const totale = subtotale + spedizione;
  const utmParams = new URLSearchParams(window.location.search);

  const orderPayload = {
    stato: 'pending',
    prodotto_slug: CONFIG.PRODOTTO_SLUG,
    prodotto_nome: CONFIG.PRODOTTO_NOME,
    nome: data.nome,
    cognome: data.cognome,
    email: data.email,
    telefono: data.telefono || null,
    indirizzo: data.indirizzo,
    citta: data.citta,
    cap: data.cap,
    provincia: data.provincia,
    nazione: 'IT',
    quantita: qty,
    prezzo_unitario: prezzo,
    costo_spedizione: spedizione,
    prezzo_totale: subtotale,
    totale_complessivo: totale,
    totale: totale,
    note_cliente: data.note || null,
    utm_source: utmParams.get('utm_source') || '',
    utm_medium: utmParams.get('utm_medium') || '',
    utm_campaign: utmParams.get('utm_campaign') || '',
    ip: '',
    user_agent: navigator.userAgent,
    referrer: document.referrer,
  };

  const saved = await saveOrderDirectToSupabase(orderPayload);

  if (!saved) {
    setLoading(false);
    showAlert('Errore salvataggio ordine.');
    return;
  }

  try {
    const res = await fetch(CONFIG.SUPABASE_URL + '/functions/v1/receive-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ ...orderPayload, order_id: saved.id, origin: window.location.origin }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      window.location.href = 'success.html?order_id=' + saved.id;
      return;
    }

    const body = await res.json();
    if (body.checkout_url) {
      window.location.href = body.checkout_url;
      return;
    }

    window.location.href = 'success.html?order_id=' + saved.id;

  } catch (err) {
    window.location.href = 'success.html?order_id=' + saved.id;
  }
}

function openCheckout() {
  const el = document.getElementById('checkout');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}