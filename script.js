// ── Smooth scroll (avoid scrollIntoView) ──
document.querySelectorAll('a[href^="#"], button[data-target]').forEach(el => {
  el.addEventListener('click', e => {
    const href = el.getAttribute('href');
    if (href && !href.startsWith('#')) return; // let cross-page links navigate normally
    e.preventDefault();
    const id = href?.slice(1) || el.getAttribute('data-target');
    const target = document.getElementById(id);
    if (target) {
      const offset = target.getBoundingClientRect().top + window.pageYOffset - 78;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  });
});

// ── Active nav on scroll ──
const navLinks = document.querySelectorAll('.nav-link[data-target]');
const sections = Array.from(document.querySelectorAll('section[id]'));

const updateNav = () => {
  const scrollY = window.pageYOffset + 120;
  let current = '';
  sections.forEach(sec => {
    if (sec.offsetTop <= scrollY) current = sec.id;
  });
  navLinks.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === current);
  });
};
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ── Scroll reveal ──
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

// ── Referral banner (?ref=...) — recruit.html のみ要素が存在 ──
(function() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (!ref) return;
  const banner = document.getElementById('refBanner');
  const text = document.getElementById('refBannerText');
  if (banner && text) {
    text.textContent = ref + ' さんからのご紹介でこのページをご覧いただき、ありがとうございます。';
    banner.classList.add('show');
  }
})();

// ── Referral link generator — recruit.html のみ要素が存在 ──
const refGenBtn = document.getElementById('refGenBtn');
if (refGenBtn) {
  refGenBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('refNameInput');
    const output = document.getElementById('refOutput');
    const outputUrl = document.getElementById('refOutputUrl');
    const name = (nameInput.value || '').trim();
    if (!name) { nameInput.focus(); return; }
    const slug = encodeURIComponent(name);
    const url = window.location.origin + window.location.pathname + '?ref=' + slug;
    outputUrl.textContent = url;
    output.classList.add('show');
  });
}
const refCopyBtn = document.getElementById('refCopyBtn');
if (refCopyBtn) {
  refCopyBtn.addEventListener('click', async () => {
    const outputUrl = document.getElementById('refOutputUrl');
    if (!outputUrl || !outputUrl.textContent) return;
    try {
      await navigator.clipboard.writeText(outputUrl.textContent);
      refCopyBtn.textContent = 'コピーしました';
      setTimeout(() => { refCopyBtn.textContent = 'コピー'; }, 1600);
    } catch (e) {}
  });
}
