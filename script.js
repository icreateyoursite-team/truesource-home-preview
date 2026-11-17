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

  /* enquiry form: honeypot + time trap + server-side rate limit (enquiry.php) */
  const form = document.getElementById('enquiry');
  const msg = form.querySelector('.form__msg');
  const btn = form.querySelector('button[type=submit]');
  const t0 = performance.now();
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
})();
