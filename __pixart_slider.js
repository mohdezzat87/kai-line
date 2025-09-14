/* [pixart-slider] build slider from store_config.json */
(function(){
  if (document.getElementById('hero') && !window.__PIXART_SLIDER__) {
    window.__PIXART_SLIDER__ = true;
    var host = document.getElementById('hero');
    fetch('store_config.json?ts=' + Date.now()).then(r=>r.json()).then(cfg=>{
      var banners = (cfg && cfg.banners)||[];
      if(!banners.length) return;
      var wrap = document.createElement('div');
      wrap.className = 'slider container';
      var slides = document.createElement('div');
      slides.className = 'slides';
      banners.forEach(function(b){
        var s = document.createElement('div');
        s.className = 'slide';
        s.innerHTML = `
          <div>
            <h3>${b.title||''}</h3>
            <p>${b.subtitle||''}</p>
            <div class="cta">
              <a class="btn btn-primary" href="${b.ctaHref||'products.html'}">${b.ctaText||'Shop now'}</a>
            </div>
          </div>
          <div><img alt="" src="${b.image||''}"></div>
        `;
        slides.appendChild(s);
      });
      var dots = document.createElement('div'); dots.className='dots';
      banners.forEach(function(_,i){
        var d = document.createElement('button');
        d.setAttribute('aria-label','Go to slide '+(i+1));
        d.addEventListener('click',()=>go(i,true));
        dots.appendChild(d);
      });
      wrap.appendChild(slides); wrap.appendChild(dots); host.innerHTML=''; host.appendChild(wrap);
      var i=0, reduce = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, timer=null;
      function setActive(idx){
        Array.from(slides.children).forEach((el,n)=>el.style.transform = 'translateX(' + ((n-idx)*100) + '%)');
        Array.from(dots.children).forEach((el,n)=>el.classList.toggle('is-active', n===idx));
      }
      function go(n, stop){ i=(n+banners.length)%banners.length; setActive(i); if(stop) auto(false); }
      function auto(start=true){ if(timer){clearInterval(timer); timer=null} if(start && !reduce){ timer=setInterval(()=>go(i+1,false),6000) } }
      setActive(0); auto(true);
      wrap.addEventListener('mouseenter', ()=>auto(false)); wrap.addEventListener('mouseleave', ()=>auto(true));
      window.addEventListener('keydown', e=>{ if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return; if(e.key==='ArrowRight') go(i+1,true); if(e.key==='ArrowLeft') go(i-1,true);});
    }).catch(console.error);
  }
})();
