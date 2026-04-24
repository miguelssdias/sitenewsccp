/**
 * noticia.js — Interações específicas da página de artigo
 * Sport Club Corinthians Paulista
 *
 * Depende de script.js (já carregado antes).
 * Módulos:
 *  1. Barra de progresso de leitura
 *  2. Parallax no hero da notícia
 *  3. Botões de compartilhamento + copiar link
 *  4. Toast de feedback
 *  5. Lazy load das imagens do artigo com fade
 */

(() => {
  'use strict';

  /* ---- utilitários locais ---- */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const throttle = (fn, limit = 16) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= limit) { last = now; fn(...args); }
    };
  };

  /* ============================================================
     1. BARRA DE PROGRESSO DE LEITURA
     ============================================================ */
  const initReadingProgress = () => {
    // Injetar elemento
    const bar = document.createElement('div');
    bar.className = 'art-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Progresso de leitura');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    document.body.appendChild(bar);

    const article = $('.art-body') || $('.art-main');
    if (!article) return;

    const update = throttle(() => {
      const rect    = article.getBoundingClientRect();
      const total   = article.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const pct     = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;

      bar.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', Math.round(pct));
    }, 16);

    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  /* ============================================================
     2. PARALLAX NO HERO DA NOTÍCIA
     ============================================================ */
  const initHeroParallax = () => {
    const heroBg = $('.art-hero-bg');
    if (!heroBg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = $('.art-hero');
    const heroH = hero?.offsetHeight ?? window.innerHeight;

    const onScroll = throttle(() => {
      const y = window.scrollY;
      if (y > heroH) return;
      heroBg.style.transform = `scale(1.04) translateY(${y * 0.28}px)`;
    }, 16);

    window.addEventListener('scroll', onScroll, { passive: true });
  };

  /* ============================================================
     3. TOAST
     ============================================================ */
  let toastTimer = null;

  const showToast = (msg = 'Link copiado!') => {
    const toast = $('#art-toast');
    if (!toast) return;

    const span = toast.querySelector('span');
    if (span) span.textContent = msg;

    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  };

  /* ============================================================
     4. BOTÕES DE COMPARTILHAMENTO
     ============================================================ */
  const initShare = () => {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const urls = {
      twitter:   `https://twitter.com/intent/tweet?url=${url}&text=${title}&via=corinthians`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      instagram: 'https://www.instagram.com/corinthians/', // Instagram não suporta share direto
    };

    $$('[data-share]').forEach(btn => {
      const net = btn.dataset.share;
      btn.addEventListener('click', () => {
        if (urls[net]) {
          window.open(urls[net], '_blank', 'noopener,noreferrer,width=600,height=480');
        }
      });
    });

    // Copiar link
    const copyBtn = $('#btn-copy-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast('Link copiado!');
        } catch {
          // Fallback para browsers antigos
          const ta = document.createElement('textarea');
          ta.value = window.location.href;
          ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast('Link copiado!');
        }
      });
    }

    // Web Share API nativa (mobile)
    if (navigator.share) {
      const shareBtns = $$('.art-share-btn');
      if (shareBtns.length) {
        // Adicionar botão extra de share nativo
        const nativeBtn = document.createElement('button');
        nativeBtn.className = 'art-share-btn';
        nativeBtn.setAttribute('aria-label', 'Compartilhar');
        nativeBtn.innerHTML = '<i class="fas fa-share-nodes" aria-hidden="true"></i>';
        nativeBtn.addEventListener('click', async () => {
          try {
            await navigator.share({ title: document.title, url: window.location.href });
          } catch {}
        });
        shareBtns[shareBtns.length - 1].parentElement.prepend(nativeBtn);
      }
    }
  };

  /* ============================================================
     5. IMAGENS DO ARTIGO — fade-in ao carregar
     ============================================================ */
  const initArticleImages = () => {
    // Já tratado pelo script.js global, mas reforçar para figuras
    $$('.art-figure-img, .art-related-img, .art-more-card-img-wrap img').forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('img-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('img-loaded'));
      }
    });
  };

  /* ============================================================
     6. SCROLL REVEAL nas seções internas (caixas, quotes, figuras)
     ============================================================ */
  const initArticleReveal = () => {
    if (!window.IntersectionObserver) return;

    const targets = [
      '.art-quote',
      '.art-figure',
      '.art-destaque-box',
      '.art-tags',
      '.art-related-item',
      '.art-more-card',
    ];

    const style = document.createElement('style');
    style.textContent = `
      .art-reveal {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1),
                    transform 0.5s cubic-bezier(0.4,0,0.2,1);
      }
      .art-reveal.art-revealed {
        opacity: 1;
        transform: none;
      }
    `;
    document.head.appendChild(style);

    targets.forEach(sel => {
      $$(sel).forEach((el, i) => {
        el.classList.add('art-reveal');
        el.style.transitionDelay = `${i * 50}ms`;
      });
    });

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('art-revealed');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.07, rootMargin: '0px 0px -32px 0px' }
    );

    $$('.art-reveal').forEach(el => obs.observe(el));
  };

  /* ============================================================
     INIT
     ============================================================ */
  const init = () => {
    initReadingProgress();
    initHeroParallax();
    initShare();
    initArticleImages();
    initArticleReveal();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
