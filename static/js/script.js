// ---- clean script.js (safe, single file) ----
(function(){
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // ------ CONFIG / CURRENCY ------
  let CONFIG = null;
  const money = (v)=>{
    const sym = CONFIG?.currency_symbol || (CONFIG?.currency === "QAR" ? "QAR " : "QAR ");
    return sym + Number(v||0).toFixed(2);
  };

  async function loadConfig(){
    if (CONFIG) return CONFIG;
    try {
      const url = "store_config.json?v=" + Date.now();
      const res = await fetch(url, {cache:"no-store"});
      CONFIG = await res.json();
      window.__STORE_CONFIG__ = CONFIG;
    } catch(e){ console.error("config load failed", e); CONFIG = {}; }
    return CONFIG;
  }

  // ------ PRODUCTS DATA ------
  async function loadProducts(){
    try {
      const res = await fetch('./static/products.json?v=' + Date.now());
      const list = await res.json();
      window.__PRODUCTS__ = list;
      return list;
    } catch(e){
      // fallback demo items
      const list = [
        {id:"dress", title:"Flowy Dress", price:120, image:"images/dress_placeholder.png", category:"Women’s Fashion"},
        {id:"earrings", title:"Statement Earrings", price:35, image:"images/earrings_placeholder.png", category:"Women’s Accessories"},
        {id:"bracelet", title:"Delicate Bracelet", price:150, image:"images/earrings_placeholder.png", category:"Women’s Accessories"}
      ];
      window.__PRODUCTS__ = list;
      return list;
    }
  }

  // ------ STORAGE HELPERS ------
  const getCart = ()=>{ try{return JSON.parse(localStorage.getItem("cart")||"[]")}catch(e){return []} };
  const setCart = (c)=>localStorage.setItem("cart", JSON.stringify(c));
  const getOrders = ()=>{ try{return JSON.parse(localStorage.getItem("orders")||"[]")}catch(e){return []} };
  const setOrders = (o)=>localStorage.setItem("orders", JSON.stringify(o));

  // ------ HEADER / FOOTER ------
  function renderHeader(){
    const h = $("#header");
    if (!h) return;
    const count = getCart().reduce((s,i)=>s+Number(i.qty||1),0);
    h.innerHTML = `
      <div class="header container" style="padding:18px 0;">
        <a href="index.html" class="brand" style="display:flex;gap:12px;align-items:center;">
          <img src="images/logo.png" alt="logo" width="44" height="44"/>
          <div style="font-weight:800;letter-spacing:.2px;">${CONFIG?.store_name||"Sign & Sign Trading"}</div>
        </a>
        <nav style="display:flex;gap:10px">
          <a href="index.html">Home</a>
          <a href="products.html">Shop</a>
          <a href="orders.html" id="orders-link">My Orders</a>
          <a href="cart.html">Cart (${count})</a>
        </nav>
      </div>
    `;
  }
  function renderFooter(){
    const f = $("#footer");
    if (!f) return;
    f.innerHTML = `<div class="container" style="padding:24px 0;color:#64748b;">© ${new Date().getFullYear()} ${CONFIG?.store_name||""}</div>`;
  }

  // ------ HOME ------
  async function renderHome(){
    const hero = $("#hero");
    if (hero){
      hero.innerHTML = `
        <div class="container">
          <div class="card" style="padding:26px">
            <h1 style="margin:0 0 6px;font-size:40px;line-height:1.1;">Large-format Printing & Signage</h1>
            <div style="color:#475569;font-size:18px;">Precision • Speed • Quality</div>
          </div>
        </div>`;
    }
  }

  // ------ PRODUCTS GRID ------
  async function renderProducts(){
    const list = await loadProducts();
    const host = $("#products-grid");
    if (!host) return;
    host.classList.add("grid");
    host.innerHTML = list.map(p=>`
      <article class="card">
        <div class="thumb"><img src="${p.image||'images/dress_placeholder.png'}" alt=""></div>
        <div style="padding:12px 14px;">
          <div style="font-weight:700">${p.title}</div>
          <div style="margin:.25rem 0 .6rem;color:#0f172a;font-weight:700">${money(p.price)}</div>
          <button class="btn btn-sm" data-add="${p.id}">Add to Cart</button>
        </div>
      </article>
    `).join("");

    host.addEventListener("click",(e)=>{
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      const id = btn.getAttribute("data-add");
      const prod = (window.__PRODUCTS__||[]).find(x=>x.id===id);
      if (!prod) return;
      const cart = getCart();
      const ex = cart.find(i=>i.id===id);
      if (ex) ex.qty = Number(ex.qty||1)+1; else cart.push({id, qty:1});
      setCart(cart);
      renderHeader();
    });
  }

  // ------ CART ------
  async function renderCart(){
    const host = $("#cart-table-body");
    if (!host) return;
    await loadProducts();
    const cart = getCart();
    const products = window.__PRODUCTS__||[];
    const rows = cart.map(item=>{
      const p = products.find(x=>x.id===item.id)||{};
      const price = Number(p.price||0);
      const qty = Number(item.qty||1);
      return `
        <tr>
          <td>${p.title||item.id}</td>
          <td><input type="number" min="1" value="${qty}" data-qty="${item.id}" style="width:72px"></td>
          <td>${money(price)}</td>
          <td style="font-weight:700">${money(price*qty)}</td>
          <td><button class="btn btn-outline" data-remove="${item.id}">Remove</button></td>
        </tr>`;
    }).join("");
    host.innerHTML = rows || `<tr><td colspan="5" style="text-align:center;color:#64748b">Your cart is empty.</td></tr>`;
    updateCartTotal();

    const table = $("#cart-table");
    table.addEventListener("input",(e)=>{
      const el = e.target.closest("input[data-qty]");
      if (!el) return;
      const id = el.getAttribute("data-qty");
      const cart = getCart();
      const row = cart.find(i=>i.id===id);
      if (row){ row.qty = Math.max(1, Number(el.value||1)); setCart(cart); updateCartTotal(); }
    });
    table.addEventListener("click",(e)=>{
      const rm = e.target.closest("[data-remove]");
      if (!rm) return;
      const id = rm.getAttribute("data-remove");
      setCart(getCart().filter(i=>i.id!==id));
      renderCart(); renderHeader();
    });

    const cta = $("#to-checkout");
    if (cta) cta.onclick = ()=>location.href="checkout.html";
  }
  function updateCartTotal(){
    const products = window.__PRODUCTS__||[];
    const total = getCart().reduce((s,i)=>{
      const p = products.find(x=>x.id===i.id)||{};
      return s + Number(p.price||0)*Number(i.qty||1);
    },0);
    const el = $("#cart-total");
    if (el) el.textContent = money(total);
  }

  // ------ CHECKOUT ------
  async function renderCheckout(){
    await loadProducts(); // for totals
    const sum = $("#checkout-summary-body");
    if (sum){
      const products = window.__PRODUCTS__||[];
      const cart = getCart();
      sum.innerHTML = cart.map(i=>{
        const p = products.find(x=>x.id===i.id)||{};
        const price = Number(p.price||0);
        return `<tr><td>${p.title||i.id}</td><td>${i.qty||1}</td><td>${money(price)}</td><td style="font-weight:700">${money(price*(i.qty||1))}</td></tr>`;
      }).join("");
      const tEl = $("#checkout-total");
      const total = cart.reduce((s,i)=>{
        const p = products.find(x=>x.id===i.id)||{};
        return s + Number(p.price||0)*Number(i.qty||1);
      },0);
      if (tEl) tEl.textContent = money(total);
    }

    const place = $("#place-order");
    if (place){
      place.onclick = ()=>{
        const products = window.__PRODUCTS__||[];
        const cart = getCart();
        const items = cart.map(x=>{
          const p = products.find(pp=>pp.id===x.id)||{};
          return { id:x.id, title:p.title||x.id, price:Number(p.price||0), qty:Number(x.qty||1) };
        });
        const order = {
          id: ("ORD-"+Math.random().toString(36).substring(2,7).toUpperCase()),
          created_at: new Date().toISOString(),
          items,
          customer:{
            name: $("#name")?.value||"",
            email: $("#email")?.value||"",
            phone: $("#phone")?.value||""
          },
          total: items.reduce((s,i)=>s+i.price*i.qty,0),
          status: "Placed"
        };
        const all = getOrders();
        all.unshift(order);
        setOrders(all);
        setCart([]);
        location.href = "thankyou.html?id="+encodeURIComponent(order.id);
      };
    }
  }

  // ------ ORDERS (list/detail) already works in your orders.html ------
  // (we keep that page’s inline JS; nothing needed here)

  // ------ BOOT ------
  document.addEventListener("DOMContentLoaded", async ()=>{
    await loadConfig();
    renderHeader(); renderFooter();

    const page = document.body?.dataset?.page || document.documentElement?.dataset?.page || "";

    if (page==="home") { renderHome(); }
    if (page==="products") { renderProducts(); }
    if (page==="cart") { renderCart(); }
    if (page==="checkout") { renderCheckout(); }
  });
})();
// === Active nav & sticky header ===
(function(){
  function markActiveNav(){
    var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var links = document.querySelectorAll("header a[href$='.html']");
    links.forEach(function(a){
      try{
        var href = (a.getAttribute("href")||"").toLowerCase();
        if (href.endsWith(path)) a.classList.add("active");
      }catch(e){}
    });
  }
  function toggleScrolled(){
    if (window.scrollY > 8) document.body.classList.add("scrolled");
    else document.body.classList.remove("scrolled");
  }
  window.addEventListener("scroll", toggleScrolled, {passive:true});
  document.addEventListener("DOMContentLoaded", function(){ markActiveNav(); toggleScrolled(); });
})();
// === Supplier homepage renderer (banners + materials) ===
(function(){
  function byId(id){ return document.getElementById(id); }
  function el(html){ var d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstChild; }

  async function loadConfig(){
    try{
      const res = await fetch("store_config.json?nocache="+Date.now());
      return await res.json();
    }catch(e){ console.error("config load failed", e); return {}; }
  }

  function bannerToneClass(tone){
    return "tone-"+(tone||"blue");
  }

  function renderBanners(cfg){
    const host = byId("banners-track"); if(!host) return;
    const list = (cfg.banners||[]);
    if(!list.length){ host.innerHTML = '<div class="banner-card tone-blue"><div class="banner-copy"><h3>Welcome</h3><div class="sub">Add banners in store_config.json</div></div></div>'; return; }
    host.innerHTML = list.map(b => `
      <article class="banner-card ${bannerToneClass(b.tone)}">
        <div class="banner-copy">
          <h3>${b.title||""}</h3>
          <div class="sub">${b.subtitle||""}</div>
        </div>
        <div class="banner-cta">
          ${b.cta ? `<a class="btn" href="${b.href||'#'}">${b.cta}</a>` : ""}
        </div>
      </article>
    `).join("");
  }

  function renderMaterials(cfg){
    const host = byId("materials-grid"); if(!host) return;
    const list = (cfg.materials||[]);
    if(!list.length){ host.innerHTML = ""; return; }
    host.innerHTML = list.map(m => `
      <a class="material-card" href="${m.href||'#'}">
        <div class="material-label">${m.label||""}</div>
        <div class="material-blurb">${m.blurb||""}</div>
      </a>
    `).join("");
  }

  document.addEventListener("DOMContentLoaded", async function(){
    // Only on home
    const isHome = /index\.html$/i.test(location.pathname) || /(\/|\\)$/.test(location.pathname);
    if(!isHome) return;
    const cfg = await loadConfig();
    renderBanners(cfg);
    renderMaterials(cfg);
  });
})();
/* === Active nav highlight (no HTML changes required) === */
(function setActiveNav(){
  try{
    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav a[href]").forEach(a=>{
      const target = (a.getAttribute("href")||"").split("?")[0].toLowerCase();
      if (target && here === target) a.classList.add("active");
    });
  }catch(e){}
})();

/* === Home enhancements driven by store_config.json === */
(async function enhanceHome(){
  const isHome = /(?:^|\/)index\.html(?:$|\?)/i.test(location.pathname + location.search);
  if(!isHome) return;
  let cfg={};
  try{ cfg = await (await fetch('store_config.json?nocache='+Date.now())).json(); }catch(e){ console.warn('config load failed', e); }

  // HERO
  const hero = document.getElementById('hero');
  if(hero && Array.isArray(cfg.banners) && cfg.banners.length){
    let idx = 0;
    function render(){
      const b = cfg.banners[idx] || {};
      hero.innerHTML = `
        <div class="hero-slide">
          <div class="copy">
            <h1>${b.title||''}</h1>
            <p>${b.subtitle||''}</p>
            <div><a class="hero-cta" href="${b.cta_url||'#'}">${b.cta_text||'Shop'}</a></div>
          </div>
          <img src="images/${b.image||''}" alt="">
          <div class="hero-dots">${(cfg.banners||[]).map((_,i)=>`<span class="${i===idx?'active':''}"></span>`).join('')}</div>
        </div>`;
      hero.querySelectorAll('.hero-dots span').forEach((d,i)=>d.addEventListener('click',()=>{idx=i; render();}));
    }
    render();
    setInterval(()=>{ idx=(idx+1)%(cfg.banners.length||1); render(); },7000);
  }

  // MATERIALS
  const mat = document.getElementById('materials');
  if(mat && Array.isArray(cfg.materials)){
    mat.innerHTML = cfg.materials.map(m=>`
      <a class="material-card" href="products.html?category=${encodeURIComponent(m.slug||m.name||'')}">
        <img src="images/${m.icon||'icons/box.svg'}" alt="">
        <div><div class="name">${m.name||''}</div><div style="color:#64748b;font-size:.9rem">Browse</div></div>
      </a>
    `).join('');
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  try {
    var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('nav a[href]').forEach(function(a){
      var href = (a.getAttribute('href') || '').toLowerCase();
      var target = href.split('/').pop() || href;
      if (target === current || (current === 'index.html' && (href === '/' || /index\.html$/i.test(href)))) {
        a.classList.add('is-active');
      }
    });
  } catch (e) { console.error('active nav error', e); }
});
