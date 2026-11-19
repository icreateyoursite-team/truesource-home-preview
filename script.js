(() => {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('smooth');
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* header turns solid on scroll */
  const onScroll = () => nav.classList.toggle('solid', scrollY > 60);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  /* mobile drawer */
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('.nav__menu a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false);
    document.querySelectorAll('.has-mega.open').forEach(li => close(li));
  }));

  /* mega menu: click/tap toggles (.open only), hover handled in CSS for real pointers */
  const close = li => { li.classList.remove('open'); li.querySelector('.nav__toggle').setAttribute('aria-expanded', false); };
  document.querySelectorAll('.has-mega').forEach(li => {
    const btn = li.querySelector('.nav__toggle');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = !li.classList.contains('open');
      li.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', e => { document.querySelectorAll('.has-mega.open').forEach(li => { if (!li.contains(e.target)) close(li); }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.has-mega.open').forEach(close); });
  /* a resize across the breakpoint never leaves a menu open */
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if ((lastW > 1100) !== (innerWidth > 1100)) {
      document.querySelectorAll('.has-mega.open').forEach(close);
      nav.classList.remove('menu-open');
    }
    lastW = innerWidth;
  });

  /* reveal on scroll, staggered within each group */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i * 0.1, 0.5) + 's');
    io.observe(el);
  });

  /* stat count-up */
  const counters = document.querySelectorAll('[data-count]');
  if (!reduce) counters.forEach(el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    el.textContent = (0).toFixed(dec);
    setTimeout(() => {
      const t0 = performance.now(), dur = 1600;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 700);
  });

  /* gentle parallax on wide screens only */
  const layers = [...document.querySelectorAll('[data-parallax]')];
  const wide = matchMedia('(min-width: 1025px)');
  let ticking = false;
  const para = () => {
    ticking = false;
    layers.forEach(l => {
      if (!wide.matches || reduce) { l.style.transform = ''; return; }
      const r = l.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      l.style.transform = `translate3d(0, ${(-c * 6).toFixed(2)}%, 0)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
  para();

  /* hero: crossfade through the photos (no slider controls), paused for reduced motion */
  const slides = [...document.querySelectorAll('[data-fade] img')];
  if (slides.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      slides[i].classList.remove('is-on');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-on');
    }, 6000);
  }

  /* consultation pop-up: every "Book a Consultation" opens it instead of scrolling */
  const modal = document.getElementById('consult');
  let lastFocus = null;
  const POP_KEY = 'ts_consult_popup_seen';
  const markSeen = () => { try { sessionStorage.setItem(POP_KEY, '1'); } catch (e) {} };
  const openModal = (auto) => {
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.classList.add('modal-open');
    nav.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false);
    markSeen();
    /* a timed pop-up focuses the close button, so phones don't jump to the keyboard */
    setTimeout(() => (auto === true ? modal.querySelector('.modal__x') : modal.querySelector('input[name=name]')).focus(), 60);
  };
  /* timed pop-up: once per visit, a few seconds after the homepage opens, never over an open menu or form */
  setTimeout(() => {
    let seen = false; try { seen = !!sessionStorage.getItem(POP_KEY); } catch (e) {}
    const busy = !modal.hidden || nav.classList.contains('menu-open') || document.querySelector('.has-mega.open') || (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName));
    if (!seen && !busy) openModal(true);
  }, 6000);
  const closeModal = () => {
    modal.hidden = true; document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  };
  document.querySelectorAll('[data-modal="consult"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openModal(); }));
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const f = [...modal.querySelectorAll('button, input, textarea, a[href]')].filter(el => !el.closest('.hp') && el.type !== 'hidden');
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* enquiry forms (pop-up and bottom of page): honeypot + time trap + server-side rate limit (enquiry.php) */
  const t0 = performance.now();
  document.querySelectorAll('.js-enquiry').forEach(form => {
    const msg = form.querySelector('.form__msg');
    const btn = form.querySelector('button[type=submit]');
    const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'ok' : 'bad'); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let bad = false;
      ['name', 'phone', 'email'].forEach(n => {
        const f = form.elements[n], wrap = f.closest('.f');
        const invalid = !f.value.trim() || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        wrap.classList.toggle('err', invalid); if (invalid) bad = true;
      });
      if (bad) { say('Please add your name, phone and a valid email.', false); return; }
      form.elements.ts.value = Math.round(performance.now() - t0);
      const data = Object.fromEntries(new FormData(form));
      data.interest = [...form.querySelectorAll('[name=interest]:checked')].map(i => i.value).join(', ');
      btn.disabled = true; btn.querySelector('span').textContent = 'Sending...';
      try {
        if (!/(^|\.)truesourcehome\.com$/.test(location.hostname)) { await new Promise(r => setTimeout(r, 700)); throw { demo: true }; }
        const res = await fetch('enquiry.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) throw new Error(out.error || 'Something went wrong. Please call or text 770-956-8899.');
        form.reset();
        say('Thank you! We have your request and will be in touch soon. For anything urgent, call or text 770-956-8899.', true);
      } catch (err) {
        if (err && err.demo) { say('Preview only: on the live site this request goes straight to the TrueSource team.', true); }
        else say(err.message || 'Something went wrong. Please call or text 770-956-8899.', false);
      } finally {
        btn.disabled = false; btn.querySelector('span').textContent = 'Send My Request';
      }
    });
  });

  /* AI remodel tool: its "Schedule a Consult" button opens the same pop-up, with the visitor's picks in the message */
  window.RV_CONFIG = Object.assign(window.RV_CONFIG || {}, {
    onCta: picks => {
      const m = document.getElementById('m-message');
      if (m && picks && !m.value) m.value = picks;
      openModal();
    }
  });
})();
