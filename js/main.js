/* Prévia Dra. Mariane Piassa — comportamento e motion. A página funciona integralmente sem este arquivo.
   Mecânicas: line-mask (títulos), image-zoom (retrato/espelho), iris (espelho), progresso de rolagem. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 900px)');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (p) { return p * p * (3 - 2 * p); };

  var top = doc.querySelector('.top');
  var btn = doc.querySelector('.menu-btn');
  var nav = doc.getElementById('nav');

  /* ---- Menu mobile: botão real, aria-expanded, Escape, clique fora e saída por Tab fecham ---- */
  function setMenu(open, returnFocus) {
    if (!btn || !nav) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    if (top) top.classList.toggle('menu-open', open);
    doc.body.classList.toggle('menu-open', open);
    if (!open && returnFocus) btn.focus();
  }
  if (btn && nav) {
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    doc.addEventListener('click', function (e) {
      if (btn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.top__in')) setMenu(false);
    });
    top.addEventListener('focusout', function (e) {
      if (btn.getAttribute('aria-expanded') === 'true' && e.relatedTarget && !top.contains(e.relatedTarget)) setMenu(false);
    });
    wide.addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* Navegação por teclado: o atalho fixo sai da frente do foco; volta ao tocar/clicar */
  doc.addEventListener('keydown', function (e) { if (e.key === 'Tab') doc.body.classList.add('kb'); });
  doc.addEventListener('pointerdown', function () { doc.body.classList.remove('kb'); });

  /* ---- Revelação única de títulos e blocos ao entrar na tela ---- */
  var targets = doc.querySelectorAll('.lm, .reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- Contagem única de "+13 anos" ao entrar na faixa de autoridade ---- */
  var counter = doc.querySelector('[data-count]');
  if (counter && !reduce && 'IntersectionObserver' in window) {
    var finalN = parseInt(counter.getAttribute('data-count'), 10);
    var cio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      cio.disconnect();
      var t0 = performance.now(), dur = 1100;
      (function tick(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        counter.textContent = String(Math.round(finalN * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.6 });
    cio.observe(counter);
  }

  /* ---- Elementos ligados à rolagem (um único rAF) ---- */
  var hero = doc.querySelector('.hero');
  var lens = doc.querySelector('.lens');
  var contact = doc.querySelector('.contact__main .btn');
  var heroCta = doc.querySelector('.hero__cta .btn');
  var dock = doc.querySelector('.dock');
  var path = doc.getElementById('path');
  var items = path ? path.querySelectorAll('li') : [];
  var bar = doc.querySelector('.progress');
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (top) top.classList.toggle('is-stuck', y > 8);
    /* atalho de WhatsApp (celular): aparece quando o CTA do hero saiu da tela e some no contato */
    if (dock && hero && contact) {
      var showDock = !wide.matches && (heroCta || hero).getBoundingClientRect().bottom < 0 && contact.getBoundingClientRect().top > vh * 0.94;
      dock.classList.toggle('on', showDock);
    }
    if (reduce) return;

    var max = doc.documentElement.scrollHeight - vh;
    if (bar && max > 0) bar.style.setProperty('--sp', clamp(y / max, 0, 1).toFixed(4));

    if (hero && y < vh * 1.2) {
      hero.style.setProperty('--ps', (1.03 + clamp(y / vh, 0, 1) * 0.06).toFixed(4));
    }
    if (lens) {
      var r = lens.getBoundingClientRect();
      var p = ease(clamp((vh * 0.92 - r.top) / (vh * 0.62), 0, 1));
      lens.style.setProperty('--rx', (26 + 84 * p).toFixed(1) + '%');
      lens.style.setProperty('--ry', (32 + 88 * p).toFixed(1) + '%');
      lens.style.setProperty('--ls', (1.2 - 0.2 * p).toFixed(4));
    }
    if (path && wide.matches) {
      var pr = path.getBoundingClientRect();
      var pp = clamp((vh * 0.72 - pr.top) / (pr.height || 1), 0.04, 1);
      path.style.setProperty('--p', pp.toFixed(3));
      items.forEach(function (li) {
        var lr = li.getBoundingClientRect();
        li.classList.toggle('on', lr.top < vh * 0.72);
      });
    } else if (path) {
      path.style.removeProperty('--p');
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  frame();

  /* ---- Trilho de procedimentos (celular): barra dourada mostra a parte já vista ---- */
  var rail = doc.getElementById('rail');
  var railUi = doc.querySelector('.rail__ui');
  /* desktop: grade sem rolagem — o trilho deixa de ser parada de Tab */
  var grid = window.matchMedia('(min-width: 1020px)');
  function railMode() {
    if (!rail) return;
    if (grid.matches) { rail.removeAttribute('tabindex'); rail.setAttribute('aria-label', 'Procedimentos'); }
    else { rail.setAttribute('tabindex', '0'); rail.setAttribute('aria-label', 'Procedimentos (deslize para ver os quatro)'); }
  }
  railMode();
  if (grid.addEventListener) grid.addEventListener('change', railMode);
  if (rail && railUi) {
    var railTick = false;
    var railP = function () {
      railTick = false;
      var max = rail.scrollWidth - rail.clientWidth;
      var vis = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1;
      var p = max > 0 ? clamp(rail.scrollLeft / max, 0, 1) : 1;
      railUi.style.setProperty('--rp', (vis + (1 - vis) * p).toFixed(3));
    };
    var railReq = function () { if (!railTick) { railTick = true; requestAnimationFrame(railP); } };
    rail.addEventListener('scroll', railReq, { passive: true });
    window.addEventListener('resize', railReq);
    railP();
  }

  /* ---- Retrato: deslocamento de ponteiro suave (apenas ponteiro fino, desktop; complementar) ---- */
  var img = doc.querySelector('.hero__img');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hero && img && fine && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty('--mx', cx.toFixed(2));
      hero.style.setProperty('--my', cy.toFixed(2));
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(loop); else raf = 0;
    }
    hero.addEventListener('pointermove', function (e) {
      if (!wide.matches) return;
      var b = hero.getBoundingClientRect();
      tx = -((e.clientX - b.left) / b.width - 0.5) * 16;
      ty = -((e.clientY - b.top) / b.height - 0.5) * 8;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } });
  }
})();
