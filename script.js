// ── Nav height (offset for smooth scroll, kept in sync with --nav-h) ──
const getNavOffset = () => {
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
  return navH + 10; // 10px breathing room below the fixed header
};

// ── Smooth scroll (avoid scrollIntoView) ──
document.querySelectorAll('a[href^="#"], button[data-target]').forEach(el => {
  el.addEventListener('click', e => {
    const href = el.getAttribute('href');
    if (href && !href.startsWith('#')) return; // let cross-page links navigate normally
    e.preventDefault();
    const id = href?.slice(1) || el.getAttribute('data-target');
    const target = document.getElementById(id);
    if (target) {
      const offset = target.getBoundingClientRect().top + window.pageYOffset - getNavOffset();
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
    closeMobileNav();
  });
});

// ── Mobile nav (hamburger) ──
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('main-nav');
function closeMobileNav() {
  if (!navToggle || !mainNav) return;
  mainNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
}
if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      closeMobileNav();
      navToggle.focus();
    }
  });
}

// ── Active nav on scroll ──
const navLinks = document.querySelectorAll('.nav-link[data-target]');
const sections = Array.from(document.querySelectorAll('section[id]:not([hidden])'));

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

// ── スケジュール「仕事の裏側」アコーディオン — recruit.html のみ要素が存在 ──
// トリガーは <button type="button">。href="#..." や data-target を使うと
// 上のスムーススクロールに拾われてしまうため、この形を崩さないこと。
document.querySelectorAll('.schedule-behind-toggle').forEach(btn => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;
  const icon = btn.querySelector('.schedule-behind-icon');
  const label = btn.querySelector('.schedule-behind-label');
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    if (icon) icon.textContent = isOpen ? '+' : '−';
    if (label) label.textContent = isOpen ? '裏側を見る' : '閉じる';
  });
});

// ── タブ切替（修練医の声 / 指導医の声）— recruit.html のみ要素が存在 ──
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  const select = tab => {
    tabs.forEach(t => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (!panel) return;
      panel.hidden = !selected;
      // 非表示のパネル内では IntersectionObserver が発火しないため、
      // 表示に切り替えた時点で .reveal を確定させる（translateY で残るのを防ぐ）
      if (selected) panel.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    });
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const i = tabs.indexOf(tab);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      select(next);
      next.focus();
    });
  });
});

// ── カードグリッドの折りたたみ — recruit.html のみ要素が存在 ──
// data-collapse-after="件数" を持つグリッドを、その件数までに絞って表示する。
// 対になるトグルは、そのグリッドの id を aria-controls で指す .feed-more ボタン。
// 表示件数を変えるときは HTML の data-collapse-after を書き換えるだけでよい。
document.querySelectorAll('[data-collapse-after]').forEach(grid => {
  const toggle = document.querySelector('.feed-more[aria-controls="' + grid.id + '"]');
  const limit = parseInt(grid.dataset.collapseAfter, 10);
  if (!toggle || !Number.isFinite(limit)) return;
  const extras = Array.from(grid.children).slice(limit);
  if (!extras.length) return; // 件数が上限以下ならトグルは出さない
  const closedLabel = toggle.dataset.moreLabel + '（残り' + extras.length + '件）';
  extras.forEach(item => { item.hidden = true; });
  toggle.textContent = closedLabel;
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    extras.forEach(item => {
      item.hidden = isOpen;
      // 非表示のままだと .reveal が translateY で残るため、開いた時点で確定させる
      if (!isOpen) item.classList.add('visible');
    });
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.textContent = isOpen ? closedLabel : '折りたたむ';
  });
});

// ── 紹介リンク機能の唯一の制御点 ──
// 病院側の正式な公開許可が下りるまで false のまま。再有効化時はこの1箇所を true に変更する。
// README.md「⚠️ 実名・住所の暫定公開について」参照。
const REFERRAL_ENABLED = false;

// .ref-widget（紹介リンク発行ウィジェット）の表示をフラグから動的制御 — recruit.html のみ要素が存在
document.querySelectorAll('.ref-widget').forEach(el => {
  el.hidden = !REFERRAL_ENABLED;
});

// ── Referral banner (?ref=...) — recruit.html のみ要素が存在 ──
if (REFERRAL_ENABLED) (function() {
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
if (REFERRAL_ENABLED) {
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
}
