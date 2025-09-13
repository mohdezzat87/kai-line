/////////////////////////////
// Simple cart + UI logic //
/////////////////////////////

let storeConfig = { name: "Kai Line", color: "#d4a373", categories: ["Women's Fashion","Women's Accessories"] };
let productsData = [];

// ----- cart helpers -----
function loadCart(){ try{return JSON.parse(localStorage.getItem('cart')||'[]')}catch(e){return []} }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); updateHeaderCount(); }
function cartCount(){ return loadCart().reduce((s,i)=>s+i.qty,0); }
function findProduct(id){ return productsData.find(p=>p.id===id); }
function inCart(id){ return loadCart().some(i=>i.id===id); }
function addOrRemove(id){
  let cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if(idx>=0){ cart.splice(idx,1); } else { cart.push({id, qty:1}); }
  saveCart(cart); return !(idx>=0);
}
function setQty(id, qty){
  let cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if(idx<0) return;
  if(qty<=0){ cart.splice(idx,1); } else { cart[idx].qty = qty; }
  saveCart(cart);
}
function updateHeaderCount(){
  const el = document.querySelector('#nav-cart-count');
  if(el) el.textContent = `Cart (${cartCount()})`;
}

// -------- DATA LOADING (prefer JSON files over embedded globals) --------
async function ensureData(){
  try{
    // Prefer external JSON (so changes in store_config.json take effect)
    const rc = await fetch('store_config.json');
    if(rc.ok) storeConfig = await rc.json();
    else if(window.__STORE_CONFIG__) storeConfig = window.__STORE_CONFIG__;
    else if(window.STORE_CONFIG)     storeConfig = window.STORE_CONFIG;
  }catch(e){
    if(window.__STORE_CONFIG__) storeConfig = window.__STORE_CONFIG__;
    else if(window.STORE_CONFIG)     storeConfig = window.STORE_CONFIG;
  }
  document.documentElement.style.setProperty('--primary-color', storeConfig.color || '#5BA7D1');

  try{
    const rp = await fetch('products.json');
    if(rp.ok) productsData = await rp.json();
    else if(window.__PRODUCTS__)     productsData = window.__PRODUCTS__;
    else if(window.PRODUCTS_DATA)    productsData = window.PRODUCTS_DATA;
  }catch(e){
    if(window.__PRODUCTS__)     productsData = window.__PRODUCTS__;
    else if(window.PRODUCTS_DATA)    productsData = window.PRODUCTS_DATA;
  }
}

// -------- RENDERERS --------
function renderHeader(){
  const header = document.getElementById('header');
  if(!header) return;
  const brandName = storeConfig.store_name || storeConfig.name || 'Store';
  header.innerHTML = `
    <div class="container">
      <div class="nav">
        <a href="index.html" class="brand" style="display:flex;align-items:center;gap:.5rem;">
          <img src="images/logo.png" alt="logo" class="logo" style="height:160px;display:block" onerror="this.style.display='none'">
          <span>${brandName}</span>
        </a>
        <nav>
          <a href="index.html">Home</a>
          <a href="products.html">Shop</a>
          <a id="nav-cart-count" href="cart.html">Cart (${cartCount()})</a>
        </nav>
      </div>
    </div>`;
}

function renderHome(){
  const main=document.getElementById('main'); if(!main) return;
  const cats = storeConfig.categories?.map(c=>c.name||c) || ["Women's Fashion","Women's Accessories"];
  const c0 = cats[0], c1 = cats[1];
  const img0 = (storeConfig.categories?.[0]?.image)||'fashion_category.png';
  const img1 = (storeConfig.categories?.[1]?.image)||'accessories_category.png';
  const hero = storeConfig.hero_image || 'hero.png';
  main.innerHTML = `
    <div class="hero" style="background-image:url('images/${hero}')">
      <h1>Large-format Printing & Signage<br>Precision • Speed • Quality</h1>
    </div>
    <h2 style="margin-top:2rem;">Categories</h2>
    <div class="categories">
      <a class="category-card" href="products.html?category=${encodeURIComponent(c0)}">
        <img src="images/${img0}"><div class="label">${c0}</div>
      </a>
      <a class="category-card" href="products.html?category=${encodeURIComponent(c1)}">
        <img src="images/${img1}"><div class="label">${c1}</div>
      </a>
    </div>`;
}

function renderProducts(){
  const main=document.getElementById('main'); if(!main) return;
  const selected = new URL(location.href).searchParams.get('category');
  let list = [...productsData];
  if(selected){ list = list.filter(p=>p.category===selected); }

  const cats = (storeConfig.categories||[]).map(c=>c.name||c);
  const catLinks = cats.map(c => `<a href="products.html?category=${encodeURIComponent(c)}">${c}</a>`).join(' ');

  main.innerHTML = `
    <div style="margin-bottom:1rem;"><strong>Filter by category:</strong>
      <a href="products.html"${selected? '':' style="font-weight:bold;"'}>All</a>
      ${catLinks}
    </div>
    <div class="products" id="products-grid"></div>`;

  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  if(list.length===0){ grid.innerHTML = '<p>No products found.</p>'; return; }

  list.forEach(p=>{
    const isIn = inCart(p.id);
    const card = document.createElement('div');
    card.className='product-card';
    card.innerHTML = `
      <img src="images/${p.image}" alt="${p.title}">
      <div class="info">
        <a class="title" href="product.html?id=${encodeURIComponent(p.id)}">${p.title}</a>
        <div class="price">QAR ${Number(p.price).toFixed(2)}</div>
      </div>
      <button class="btn" data-id="${p.id}">${isIn? 'Remove':'Add to Cart'}</button>
    `;
    card.querySelector('button').addEventListener('click', (e)=>{
      const nowIn = addOrRemove(p.id);
      e.currentTarget.textContent = nowIn? 'Remove':'Add to Cart';
    });
    grid.appendChild(card);
  });
}

function renderProductDetail(){
  const main=document.getElementById('main'); if(!main) return;
  const id = new URL(location.href).searchParams.get('id');
  const p = findProduct(id); if(!p){ main.textContent='Product not found'; return; }
  const isIn = inCart(p.id);
  main.innerHTML = `
    <div class="product-detail">
      <div><img src="images/${p.image}" alt="${p.title}"></div>
      <div class="details">
        <h2>${p.title}</h2>
        <p>${p.description}</p>
        <p class="price" style="font-size:1.5rem; color:var(--primary-color);">QAR ${Number(p.price).toFixed(2)}</p>
        <button id="toggle-cart" class="btn">${isIn? 'Remove from Cart':'Add to Cart'}</button>
      </div>
    </div>`;
  document.getElementById('toggle-cart').addEventListener('click', (e)=>{
    const nowIn = addOrRemove(p.id);
    e.currentTarget.textContent = nowIn? 'Remove from Cart':'Add to Cart';
  });
}

function renderCart(){
  const main=document.getElementById('main'); if(!main) return;
  const cart = loadCart();
  if(cart.length===0){ main.innerHTML='<h1>Your Cart</h1><p>Your cart is empty.</p>'; return; }

  let total = 0;
  const rows = cart.map(item=>{
    const p = findProduct(item.id); if(!p) return '';
    const sub = Number(p.price) * item.qty; total += sub;
    return `
      <tr data-id="${p.id}">
        <td>${p.title}</td>
        <td>
          <button class="qtybtn" data-d="-1">-</button>
          <input class="qty" type="number" min="1" value="${item.qty}" style="width:60px; text-align:center;">
          <button class="qtybtn" data-d="1">+</button>
        </td>
        <td>QAR ${Number(p.price).toFixed(2)}</td>
        <td class="subtotal">QAR ${sub.toFixed(2)}</td>
        <td><button class="btn btn-remove">Remove</button></td>
      </tr>`;
  }).join('');

  main.innerHTML = `
    <h1>Your Cart</h1>
    <table class="cart-table">
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:right; font-weight:bold; margin-top:1rem;">Total: QAR <span id="cart-total">${total.toFixed(2)}</span></div>
    <a class="btn" href="checkout.html" style="margin-top:1rem; display:inline-block;">Proceed to Checkout</a>
  `;

  const tbody = main.querySelector('tbody');
  tbody.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const id = tr.getAttribute('data-id');
    if(e.target.classList.contains('btn-remove')){ setQty(id, 0); renderCart(); return; }
    if(e.target.classList.contains('qtybtn')){
      const delta = Number(e.target.getAttribute('data-d'));
      const input = tr.querySelector('.qty');
      const newQty = Math.max(0, Number(input.value) + delta);
      input.value = newQty || 1; setQty(id, newQty); renderCart();
    }
  });
  tbody.addEventListener('change', (e)=>{
    if(!e.target.classList.contains('qty')) return;
    const tr = e.target.closest('tr'); const id = tr.getAttribute('data-id');
    const q = Math.max(0, Number(e.target.value)||0); setQty(id, q); renderCart();
  });
}

// -------- BOOT --------
async function boot(){
  await ensureData();
  renderHeader();
  updateHeaderCount();
  const page = document.body.dataset.page;
  if(page==='home') renderHome();
  if(page==='products') renderProducts();
  if(page==='product') renderProductDetail();
  if(page==='cart') renderCart();
}
document.addEventListener('DOMContentLoaded', boot);






/* === PATCH: view modes + checkout (safe) === */
(function(){
  function getViewMode(){ try{return localStorage.getItem("viewMode")||"grid";}catch(e){return "grid";} }
  function setViewMode(m){ try{localStorage.setItem("viewMode",m);}catch(e){}; if (typeof renderProducts==="function"){ renderProducts(); } }
  window.setViewMode = setViewMode; window.getViewMode = getViewMode;

  if (typeof renderProducts === "function") {
    const _orig = renderProducts;
    window.renderProducts = function(){
      _orig();
      var main = document.getElementById("main"); if(!main) return;
      var grid = main.querySelector(".products"); if(!grid) return;

      var bar = document.createElement("div");
      bar.className = "view-toolbar";
      bar.innerHTML = '<span style="opacity:.75;margin-right:.25rem">View:</span>'
        + '<button class="btn-small" data-view="grid">Grid</button>'
        + '<button class="btn-small" data-view="thumbs">Thumbnails</button>';
      main.insertBefore(bar, grid);

      var mode = getViewMode();
      if (mode === "thumbs") {
        grid.classList.remove("products--grid");
        grid.classList.add("products--thumbs");
        grid.querySelectorAll(".product-card").forEach(function(c){ c.classList.add("thumb"); });
      } else {
        grid.classList.remove("products--thumbs");
        grid.classList.add("products--grid");
        grid.querySelectorAll(".product-card").forEach(function(c){ c.classList.remove("thumb"); });
      }
      bar.querySelectorAll("button").forEach(function(b){
        if (b.getAttribute("data-view")===mode) b.classList.add("active");
        b.addEventListener("click", function(){ setViewMode(b.getAttribute("data-view")); });
      });
    };
  }

  function renderCheckout(){
    var main=document.getElementById("main"); if(!main) return;
    if (typeof loadCart!=="function" || typeof findProduct!=="function"){
      main.innerHTML = "<h1>Checkout</h1><p>Cart not available.</p>"; return;
    }
    var cart = loadCart();
    if(cart.length===0){ main.innerHTML="<h1>Checkout</h1><p>Your cart is empty.</p>"; return; }

    var total = 0, rows="";
    cart.forEach(function(item){
      var p = findProduct(item.id); if(!p) return;
      var sub = p.price * item.qty; total += sub;
      rows += "<tr><td>"+p.title+"</td><td style='text-align:center'>"+item.qty+"</td><td style='text-align:right'>$"+p.price.toFixed(2)+"</td><td style='text-align:right'>$"+sub.toFixed(2)+"</td></tr>";
    });

    main.innerHTML =
      "<h1>Checkout</h1>"
      + "<div style='display:grid;gap:1rem;grid-template-columns:1fr 1fr;'>"
      +   "<form id='checkout-form' style='background:#fff;border:1px solid #eee;border-radius:10px;padding:1rem;'>"
      +     "<h3 style='margin-top:0'>Billing & Shipping</h3>"
      +     "<label>Name<input required style='width:100%'></label><br/>"
      +     "<label>Email<input type='email' required style='width:100%'></label><br/>"
      +     "<label>Phone<input required style='width:100%'></label><br/>"
      +     "<label>Address<textarea required style='width:100%;height:90px'></textarea></label><br/>"
      +     "<label>City<input required style='width:100%'></label><br/>"
      +     "<label>Country<input required style='width:100%'></label><br/>"
      +     "<h3>Payment</h3>"
      +     "<p style='opacity:.8'>Tap Payments integration will go here (demo only).</p>"
      +     "<button type='submit' class='btn'>Place Order (Demo)</button>"
      +   "</form>"
      +   "<div style='background:#fff;border:1px solid #eee;border-radius:10px;padding:1rem;'>"
      +     "<h3 style='margin-top:0'>Order Summary</h3>"
      +     "<table style='width:100%;border-collapse:collapse'>"
      +       "<thead><tr><th align='left'>Item</th><th>Qty</th><th align='right'>Price</th><th align='right'>Subtotal</th></tr></thead>"
      +       "<tbody>"+rows+"</tbody>"
      +     "</table>"
      +     "<div style='text-align:right;font-weight:700;margin-top:1rem'>Total: $"+total.toFixed(2)+"</div>"
      +   "</div>"
      + "</div>";

    document.getElementById("checkout-form").addEventListener("submit", function(e){
      e.preventDefault();
      alert("Demo: order placed.");
      try{ localStorage.removeItem("cart"); }catch(_){}
      if (typeof updateHeaderCount==="function") updateHeaderCount();
      location.href="index.html";
    });
  }
  window.renderCheckout = renderCheckout;

  document.addEventListener("DOMContentLoaded", function(){
    var page = (document.body && document.body.dataset && document.body.dataset.page) || "";
    if (page==="checkout") renderCheckout();
  });
})();
