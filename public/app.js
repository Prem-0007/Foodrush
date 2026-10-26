(() => {
  const $ = (id) => document.getElementById(id);
  const inr = (paise) => '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };
  let token = store.get('fr_token'), user = JSON.parse(store.get('fr_user') || 'null');
  let menu = [], cart = {}, registering = false, attemptKey = null;

  const el = (tag, props, ...kids) => {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    kids.flat().forEach((k) => e.append(k instanceof Node ? k : document.createTextNode(String(k))));
    return e;
  };
  // Always textContent, never innerHTML, so server data can never inject markup (XSS).
  async function api(path, opts = {}) {
    const res = await fetch('/api' + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) signOut();
    if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { details: data.details });
    return data;
  }
  const say = (t, err) => { $('msg').textContent = t || ''; $('msg').className = err ? 'err' : ''; };
  const banner = (t, warn) => { $('banner').hidden = !t; $('banner').textContent = t || ''; $('banner').className = warn ? 'warn' : ''; };

  function signOut() { token = null; user = null; store.set('fr_token'); store.set('fr_user'); render(); }
  function renderWho() {
    const w = $('who'); w.replaceChildren();
    if (user) w.append(`Hi ${user.name} `, el('button', { type: 'button', onclick: signOut }, 'Sign out'));
  }

  function renderMenu() {
    const m = $('menu'); m.replaceChildren();
    if (!menu.length) return m.append('No items available.');
    let last = '';
    menu.forEach((i) => {
      if (i.restaurant !== last) { last = i.restaurant; m.append(el('h3', {}, last)); }
      const q = cart[i.sku] || 0;
      m.append(el('div', { className: 'item' },
        el('div', {}, el('b', {}, i.name), el('small', {}, i.description), el('small', {}, i.stock > 0 ? `${i.stock} left` : 'Sold out')),
        el('div', { className: 'r' }, inr(i.price),
          el('button', { type: 'button', ariaLabel: 'Remove one ' + i.name, disabled: !q, onclick: () => change(i.sku, -1) }, '−'), String(q),
          el('button', { type: 'button', ariaLabel: 'Add one ' + i.name, disabled: q >= Math.min(20, i.stock), onclick: () => change(i.sku, 1) }, '+'))));
    });
  }
  function change(sku, d) {
    cart[sku] = Math.max(0, (cart[sku] || 0) + d); if (!cart[sku]) delete cart[sku];
    attemptKey = null; // basket changed, so this is a new purchase and needs a new idempotency key
    renderMenu(); renderCart();
  }
  function renderCart() {
    const c = $('cart'); c.replaceChildren();
    let total = 0;
    Object.entries(cart).forEach(([sku, qty]) => {
      const i = menu.find((x) => x.sku === sku); if (!i) return;
      total += i.price * qty;
      c.append(el('div', { className: 'line' }, el('span', {}, `${qty} × ${i.name}`), el('span', {}, inr(i.price * qty))));
    });
    if (!total) c.append('Your basket is empty.');
    else c.append(el('div', { className: 'line' }, el('b', {}, 'Total'), el('b', {}, inr(total))), el('small', {}, 'Final price is calculated by the server.'));
    $('pay').disabled = !total;
  }

  async function pay() {
    if (!user) return say('Sign in first.', true);
    const address = $('address').value.trim();
    if (address.length < 5) return say('Enter a delivery address.', true);
    // One key per purchase attempt. A double tap or a retry sends the same key, so the server
    // returns the same order and Stripe session instead of creating a second charge.
    attemptKey = attemptKey || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
    $('pay').disabled = true; say('Creating your payment page…');
    try {
      const out = await api('/checkout', { method: 'POST', headers: { 'Idempotency-Key': attemptKey }, body: JSON.stringify({ items: Object.entries(cart).map(([sku, qty]) => ({ sku, qty })), address }) });
      if (out.url) { location.assign(out.url); return; }
      say('This order was already ' + out.status + '.');
    } catch (e) {
      say(e.message + (e.details ? ': ' + e.details.map((d) => d.path + ' ' + d.message).join(', ') : ''), true);
    }
    $('pay').disabled = false;
  }

  async function loadOrders() {
    $('ordersBox').hidden = !user; if (!user) return;
    try {
      const list = await api('/orders');
      const o = $('orders'); o.replaceChildren();
      if (!list.length) o.append('No orders yet.');
      list.forEach((x) => o.append(el('div', { className: 'o' }, el('div', { className: 'line' }, el('b', {}, '#' + x._id.slice(-6)), el('span', { className: 'tag' }, x.status.replaceAll('_', ' '))), el('small', {}, x.items.map((i) => `${i.qty}× ${i.name}`).join(', ') + ' · ' + inr(x.total)))));
    } catch {}
  }

  // After Stripe redirects back, the webhook may take a moment. Poll until the order is paid.
  async function handleReturn() {
    const p = new URLSearchParams(location.search);
    const paid = p.get('paid'), cancelled = p.get('cancelled');
    history.replaceState(null, '', location.pathname);
    if (cancelled) return banner('Payment cancelled. Nothing was charged and your basket is kept.', true);
    if (!paid || !token) return;
    banner('Confirming your payment…');
    for (let n = 0; n < 15; n++) {
      try {
        const o = await api('/orders/' + encodeURIComponent(paid));
        if (o.status !== 'pending_payment') { cart = {}; renderCart(); renderMenu(); loadOrders(); return banner('Payment received. Your order is ' + o.status.replaceAll('_', ' ') + '.'); }
      } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }
    banner('We have not received confirmation yet. Check "Your orders" in a minute; you will not be charged twice.', true);
  }

  $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = { email: $('email').value, password: $('password').value };
      if (registering) body.name = $('name').value;
      const out = await api(registering ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify(body) });
      token = out.token; user = out.user; store.set('fr_token', token); store.set('fr_user', JSON.stringify(user));
      $('password').value = ''; say(''); render(); loadOrders();
    } catch (err) { say(err.message, true); }
  });
  $('toggleAuth').addEventListener('click', () => {
    registering = !registering;
    $('authTitle').textContent = $('authBtn').textContent = registering ? 'Create account' : 'Sign in';
    $('toggleAuth').textContent = registering ? 'I already have an account' : 'Create an account';
    $('name').hidden = $('nameLabel').hidden = !registering; $('name').required = registering;
    $('password').autocomplete = registering ? 'new-password' : 'current-password';
  });
  $('pay').addEventListener('click', pay);

  function render() { renderWho(); $('authbox').hidden = !!user; renderMenu(); renderCart(); loadOrders(); }
  (async () => {
    render();
    try { menu = await api('/menu'); renderMenu(); } catch { $('menu').textContent = 'Could not load the menu. Refresh to try again.'; }
    handleReturn();
  })();
})();
