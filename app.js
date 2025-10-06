/* ----------------------
   Ou, de Marni — Scripts
   - Cart & Wishlist (localStorage)
   - Tabs
   - Scent Finder Quiz
   - Simple Checkout (mock payment selection)
----------------------- */

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

/* Storage helper */
const store = {
  get(k, d){ try {return JSON.parse(localStorage.getItem(k)) ?? d} catch {return d} },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};

const CART_KEY = 'odm_cart';
const WISHLIST_KEY = 'odm_wishlist';

/* -------- Cart & Wishlist -------- */

function emitCartUpdated(){
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

function AddToCart(item){
  const cart = store.get(CART_KEY, []);
  const existing = cart.find(p => p.id === item.id);
  if(existing){
    existing.qty = (existing.qty || 1) + (item.qty || 1);
  } else {
    cart.push({...item, qty: item.qty || 1});
  }
  store.set(CART_KEY, cart);
  updateCartBadge();
  emitCartUpdated();
  alert('Added to cart ✔');
}

function changeQty(id, delta){
  const cart = store.get(CART_KEY, []);
  const p = cart.find(x => x.id === id);
  if(!p) return;
  p.qty = (p.qty || 1) + delta;
  if(p.qty <= 0){ // remove if zero
    const i = cart.findIndex(x => x.id === id);
    cart.splice(i,1);
  }
  store.set(CART_KEY, cart);
  updateCartBadge();
  emitCartUpdated();
}

function removeFromCart(id){
  const cart = store.get(CART_KEY, []).filter(i => i.id !== id);
  store.set(CART_KEY, cart);
  updateCartBadge();
  emitCartUpdated();
}

function addToWishlist(item){
  const wish = store.get(WISHLIST_KEY, []);
  if(!wish.find(p => p.id === item.id)) wish.push(item);
  store.set(WISHLIST_KEY, wish);
  alert('Saved to wishlist ♥');
}

function updateCartBadge(){
  const cart = store.get(CART_KEY, []);
  const count = cart.reduce((s,i)=>s+(i.qty||1),0);
  $$('.cart-count').forEach(el => el.textContent = count);
}

/* Button delegation (Add to cart / wishlist) */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-add]');
  if(!btn) return;

  const card = btn.closest('[data-product]');
  if(!card) return;

  const item = {
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
    img: $('img', card)?.getAttribute('src')
  };

  if(btn.dataset.add === 'cart') addToCart(item);
  if(btn.dataset.add === 'wishlist') addToWishlist(item);
});

/* -------- Tabs -------- */
function initTabs(){
  $$('.tabs').forEach(tabs => {
    tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if(!tab) return;
      const id = tab.dataset.target;
      $$('.tab', tabs).forEach(t=>t.classList.toggle('active', t===tab));
      const panes = tabs.nextElementSibling;
      if(!panes) return;
      $$(':scope > section', panes).forEach(p=>p.classList.toggle('active', p.id === id));
    });
    const first = $('.tab', tabs); if(first) first.click();
  });
}

/* -------- Scent Finder Quiz -------- */
function initQuiz(){
  const form = $('#quiz-form'); if(!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const mood = form.mood.value;
    const strength = form.strength.value;
    const season = form.season.value;
    const picks = [];

    if(mood==='calm' && season==='summer') picks.push('Salt Air');
    if(mood==='bold') picks.push('Night EDT');
    if(mood==='romantic' || season==='spring') picks.push('The Scent for HER');
    if(!picks.length) picks.push('Discovery Set');

    $('#quiz-result').innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3>Your picks</h3>
          <p class="lead">We recommend: <strong>${picks.join(', ')}</strong></p>
          <a class="button" href="shop.html#all">Shop recommendations</a>
        </div>
      </div>`;
  });
}

/* -------- Simple Checkout (Demo) -------- */
function initCheckout(){
  const form = $('#checkout-form'); if(!form) return;
  const list = $('#checkout-items');
  const totalEl = $('#checkout-total');

  function render(){
    const cart = store.get(CART_KEY, []);
    if(list){
      list.innerHTML = cart.map(i => `
        <li data-id="${i.id}">
          ${i.name} × ${i.qty}
          <span>R ${(i.price * i.qty).toFixed(2)}</span>
          <button class="icon-btn" data-cart="minus" title="Decrease">−</button>
          <button class="icon-btn" data-cart="plus" title="Increase">+</button>
          <button class="icon-btn" data-cart="remove" title="Remove">✕</button>
        </li>
      `).join('');
    }
    const total = cart.reduce((s,i)=> s + i.price * (i.qty||1), 0);
    if(totalEl) totalEl.textContent = `R ${total.toFixed(2)}`;
  }

  // initial render
  render();

  // re-render whenever cart changes
  window.addEventListener('cart:updated', render);

  // quantity/remove controls
  list?.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if(!li) return;
    const id = li.getAttribute('data-id');
    if(e.target.matches('[data-cart="minus"]')) changeQty(id, -1);
    if(e.target.matches('[data-cart="plus"]')) changeQty(id, +1);
    if(e.target.matches('[data-cart="remove"]')) removeFromCart(id);
  });

  // demo submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    alert('Order placed! (Demo) — Integrate PayPal/PayFlex/Credit Card in production.');
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
    emitCartUpdated(); // triggers render()
  });
}

/* -------- Boot -------- */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  updateCartBadge();
  initQuiz();
  initCheckout();
});

