/**
 * Sport Club Corinthians Paulista
 * script.js — Interações nível sênior
 *
 * Módulos:
 *  1. Header scroll / sticky behavior
 *  2. Menu mobile com trap de foco e acessibilidade
 *  3. Botão voltar ao topo
 *  4. Scroll suave
 *  5. Marcação de link ativo
 *  6. Filtro de elenco com animação FLIP
 *  7. Scroll reveal (IntersectionObserver)
 *  8. Lazy loading de imagens com fade-in
 *  9. Parallax leve no hero
 * 10. Utilitários: debounce, throttle
 */

(() => {
  'use strict';

  /* ============================================================
     UTILITÁRIOS
     ============================================================ */

  const debounce = (fn, delay = 200) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const throttle = (fn, limit = 100) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= limit) {
        last = now;
        fn(...args);
      }
    };
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ============================================================
     1. HEADER — scroll behavior
     ============================================================ */
  const initHeader = () => {
    const header = $('.site-header');
    if (!header) return;

    const onScroll = throttle(() => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    }, 80);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
  };

  /* ============================================================
     2. MENU MOBILE — acessível, com trap de foco e gestos
     ============================================================ */
  const initMobileMenu = () => {
    const toggle   = $('.menu-toggle');
    const navbar   = $('.navbar');
    const overlay  = $('#overlay') || $('.overlay');
    if (!toggle || !navbar) return;

    let isOpen = false;

    // Elementos focáveis dentro do menu
    const getFocusable = () =>
      $$('a, button, [tabindex]:not([tabindex="-1"])', navbar)
        .filter(el => !el.hasAttribute('disabled'));

    const openMenu = () => {
      isOpen = true;
      navbar.classList.add('active');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fechar menu');
      if (overlay) { overlay.classList.add('active'); overlay.removeAttribute('aria-hidden'); }
      document.body.style.overflow = 'hidden';

      // Foco no primeiro item
      requestAnimationFrame(() => {
        const first = getFocusable()[0];
        if (first) first.focus();
      });
    };

    const closeMenu = () => {
      isOpen = false;
      navbar.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      if (overlay) { overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
      toggle.focus();
    };

    const toggleMenu = () => (isOpen ? closeMenu() : openMenu());

    toggle.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // Fechar com Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Trap de foco dentro do menu
    navbar.addEventListener('keydown', e => {
      if (!isOpen || e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Fechar ao clicar em link
    $$('.nav-links a', navbar).forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Fechar ao redimensionar para desktop
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 768 && isOpen) closeMenu();
    }, 150));
  };

  /* ============================================================
     3. BOTÃO VOLTAR AO TOPO
     ============================================================ */
  const initBackToTop = () => {
    const btn = $('.back-to-top');
    if (!btn) return;

    const THRESHOLD = 400;
    let visible = false;

    const onScroll = throttle(() => {
      const shouldShow = window.scrollY > THRESHOLD;
      if (shouldShow !== visible) {
        visible = shouldShow;
        btn.style.display = visible ? 'flex' : 'none';
        // Pequena animação
        if (visible) {
          btn.style.opacity = '0';
          btn.style.transform = 'translateY(8px)';
          requestAnimationFrame(() => {
            btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0)';
          });
        }
      }
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  /* ============================================================
     4. SCROLL SUAVE para âncoras internas
     ============================================================ */
  const initSmoothScroll = () => {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#top') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const target = $(href);
        if (!target) return;
        e.preventDefault();
        const headerH = ($('.site-header')?.offsetHeight ?? 0);
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
        // Mover foco para acessibilidade
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  };

  /* ============================================================
     5. LINK ATIVO na navegação
     ============================================================ */
  const initActiveLinks = () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    $$('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === page || (page === '' && href === 'index.html');
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
    });
  };

  /* ============================================================
     6. FILTRO DE ELENCO com animação FLIP
     ============================================================ */
  const initElencoFiltro = () => {
    const grid    = $('#players-grid');
    const botoes  = $$('.filtro-btn');
    if (!grid || !botoes.length) return;

    const cards = $$('.player-card', grid);

    const DURATION = 320;
    const EASE     = 'cubic-bezier(0.4, 0, 0.2, 1)';

    const aplicarFiltro = (filtro) => {
      // 1. Capturar posições antes
      const rects = new Map();
      cards.forEach(c => rects.set(c, c.getBoundingClientRect()));

      // 2. Aplicar visibilidade
      cards.forEach(card => {
        const pos = card.dataset.posicao;
        const mostrar = filtro === 'todos' || pos === filtro;
        card.dataset.hidden = mostrar ? 'false' : 'true';
        card.style.display = mostrar ? '' : 'none';
      });

      // 3. FLIP — animar cards visíveis
      cards.forEach(card => {
        if (card.dataset.hidden === 'true') return;
        const oldRect = rects.get(card);
        const newRect = card.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top  - newRect.top;

        if (dx === 0 && dy === 0) {
          // Apenas fade-in se estava oculto antes
          card.animate(
            [{ opacity: 0, transform: 'scale(0.92)' },
             { opacity: 1, transform: 'scale(1)' }],
            { duration: DURATION, easing: EASE, fill: 'both' }
          );
          return;
        }

        card.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` },
           { transform: 'translate(0, 0)' }],
          { duration: DURATION, easing: EASE }
        );
      });
    };

    botoes.forEach(btn => {
      btn.addEventListener('click', () => {
        botoes.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        aplicarFiltro(btn.dataset.filtro);
      });
      // Acessibilidade: role button com aria-pressed
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    });
  };

  /* ============================================================
     7. SCROLL REVEAL com IntersectionObserver
     ============================================================ */
  const initScrollReveal = () => {
    if (!window.IntersectionObserver) return;

    // Injetar estilos de reveal via JS para não poluir o CSS principal
    const style = document.createElement('style');
    style.textContent = `
      .reveal {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.55s cubic-bezier(0.4,0,0.2,1),
                    transform 0.55s cubic-bezier(0.4,0,0.2,1);
      }
      .reveal.revealed {
        opacity: 1;
        transform: none;
      }
      .reveal-scale {
        opacity: 0;
        transform: scale(0.94);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .reveal-scale.revealed {
        opacity: 1;
        transform: scale(1);
      }
    `;
    document.head.appendChild(style);

    // Marcar elementos para revelar
    const seletores = [
      '.news-card',
      '.player-card',
      '.destaque-card',
      '.card',
      '.section-header',
      '.page-title',
      '.contato-inner',
    ];

    seletores.forEach(sel => {
      $$(sel).forEach((el, i) => {
        el.classList.add('reveal');
        // Stagger delay baseado no índice dentro do pai
        const siblings = $$('.reveal', el.parentElement);
        const localIdx = siblings.indexOf(el);
        el.style.transitionDelay = `${Math.min(localIdx * 60, 360)}ms`;
      });
    });

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    $$('.reveal').forEach(el => observer.observe(el));
  };

  /* ============================================================
     8. LAZY LOADING DE IMAGENS com fade-in
     ============================================================ */
  const initImageLoading = () => {
    const style = document.createElement('style');
    style.textContent = `
      img[loading="lazy"] { opacity: 0; transition: opacity 0.4s ease; }
      img[loading="lazy"].img-loaded { opacity: 1; }
    `;
    document.head.appendChild(style);

    $$('img[loading="lazy"]').forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('img-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('img-loaded'));
        img.addEventListener('error', () => {
          // Placeholder elegante em caso de erro
          img.style.opacity = '1';
          img.style.background = '#1a1a1a';
          img.alt = img.alt || 'Imagem indisponível';
        });
      }
    });
  };

  /* ============================================================
     9. PARALLAX leve no hero
     ============================================================ */
  const initParallax = () => {
    const heroBg = $('.hero-bg');
    if (!heroBg) return;

    // Respeitar preferência de movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onScroll = throttle(() => {
      const scrolled = window.scrollY;
      const heroH = heroBg.parentElement?.offsetHeight ?? window.innerHeight;
      if (scrolled > heroH) return; // Parar fora do viewport
      const offset = scrolled * 0.3;
      heroBg.style.transform = `scale(1.08) translateY(${offset}px)`;
    }, 16);

    window.addEventListener('scroll', onScroll, { passive: true });
  };

  /* ============================================================
     10. HIGHLIGHT de seção no scroll (home)
     ============================================================ */
  const initSectionHighlight = () => {
    const sections = $$('section[id]');
    const navLinks = $$('.nav-links a[href*="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach(link => {
            const matches = link.getAttribute('href')?.includes(id);
            link.classList.toggle('active', matches);
          });
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    sections.forEach(s => observer.observe(s));
  };

  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */
  const init = () => {
    initHeader();
    initMobileMenu();
    initBackToTop();
    initSmoothScroll();
    initActiveLinks();
    initElencoFiltro();
    initScrollReveal();
    initImageLoading();
    initParallax();
    initSectionHighlight();
  };

  // Garantir que o DOM esteja pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
