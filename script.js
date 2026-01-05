/* --- Navigation & Accessibility --- */
function syncMenuAria(checked) {
  const nav = document.querySelector('nav');
  const btn = document.querySelector('.hamburger');
  if (!nav || !btn) return;
  btn.setAttribute('aria-expanded', String(checked));
  nav.setAttribute('aria-hidden', String(!checked));
}

document.getElementById('menu-toggle')?.addEventListener('change', (e) => {
  syncMenuAria(e.target.checked);
});

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function smoothScroll(e) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  e.preventDefault();
  const target = document.querySelector(href);
  if (!target) return;
  const checkbox = document.getElementById('menu-toggle');
  if (checkbox) {
    checkbox.checked = false;
    syncMenuAria(false);
  }
  target.scrollIntoView(prefersReduced ? {} : { behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', smoothScroll);
});

syncMenuAria(document.getElementById('menu-toggle')?.checked ?? false);

/* --- Projects Filter --- */
function filterProjects(category = 'all') {
  document.querySelectorAll('.projects-grid .project-card').forEach(card => {
    const cat = (card.dataset.category || '').toLowerCase();
    const show = category === 'all' || cat === category.toLowerCase();
    card.hidden = !show;
    card.setAttribute('aria-hidden', String(!show));
  });
}

function buildFilterUI() {
  const container = document.querySelector('.projects-filter');
  if (!container) return;
  const cats = new Set(['all']);
  document.querySelectorAll('.projects-grid .project-card').forEach(card => {
    const c = (card.dataset.category || '').trim().toLowerCase();
    if (c) cats.add(c);
  });
  container.innerHTML = '';
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.dataset.filter = c;
    btn.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    container.appendChild(btn);
  });
  container.addEventListener('click', (e) => {
    const target = e.target.closest('[data-filter]');
    if (!target) return;
    filterProjects(target.dataset.filter);
    container.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('is-active', b === target));
  });
}
buildFilterUI();
filterProjects('all');

/* --- Lightbox --- */
let lightboxEl;
function ensureLightbox() {
  if (lightboxEl) return lightboxEl;
  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.innerHTML = `
    <div class="lightbox__backdrop" tabindex="-1"></div>
    <figure class="lightbox__content" role="dialog" aria-modal="true" aria-label="Image preview">
      <img alt="">
      <figcaption class="lightbox__caption"></figcaption>
      <button type="button" class="lightbox__close" aria-label="Close">×</button>
    </figure>`;
  document.body.appendChild(lightboxEl);
  lightboxEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('lightbox__backdrop') || e.target.classList.contains('lightbox__close')) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  return lightboxEl;
}

function openLightbox(src, alt = '', caption = '') {
  const lb = ensureLightbox();
  const img = lb.querySelector('img');
  const cap = lb.querySelector('.lightbox__caption');
  img.src = src; img.alt = alt;
  cap.textContent = caption || alt;
  lb.classList.add('is-open');
  lb.querySelector('.lightbox__close').focus();
}

function closeLightbox() {
  if (lightboxEl) lightboxEl.classList.remove('is-open');
}

document.querySelectorAll('.projects-grid figure img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    const caption = img.closest('figure')?.querySelector('figcaption')?.textContent || '';
    openLightbox(img.src, img.alt, caption);
  });
});

/* --- Contact Form Validation & Popup --- */
function setupContactValidation() {
  const form = document.querySelector('.contact-form');
  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    message: document.getElementById('message'),
  };
  const errors = {
    name: document.getElementById('name-error'),
    email: document.getElementById('email-error'),
    message: document.getElementById('message-error'),
  };

  if (!form || !fields.name) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  function setError(fieldEl, errorEl, message) {
    if (!fieldEl || !errorEl) return;
    errorEl.textContent = message || '';
    fieldEl.classList.toggle('is-invalid', Boolean(message));
    fieldEl.setAttribute('aria-invalid', String(Boolean(message)));
  }

  function validateName() {
    const v = fields.name.value.trim();
    if (!v) { setError(fields.name, errors.name, 'Please enter your full name.'); return false; }
    setError(fields.name, errors.name, ''); return true;
  }

  function validateEmail() {
    const v = fields.email.value.trim();
    if (!v) { setError(fields.email, errors.email, 'Email is required.'); return false; }
    if (!emailPattern.test(v)) { setError(fields.email, errors.email, 'Please enter a valid email address.'); return false; }
    setError(fields.email, errors.email, ''); return true;
  }

  function validateMessage() {
    const v = fields.message.value.trim();
    if (!v) { setError(fields.message, errors.message, 'Please enter a message.'); return false; }
    if (v.length < 10) { setError(fields.message, errors.message, 'Message should be at least 10 characters.'); return false; }
    setError(fields.message, errors.message, ''); return true;
  }

  function validateAll() {
    const a = validateName();
    const b = validateEmail();
    const c = validateMessage();
    return a && b && c;
  }

  fields.name.addEventListener('input', validateName);
  fields.email.addEventListener('input', validateEmail);
  fields.message.addEventListener('input', validateMessage);

  form.addEventListener('submit', function(e) {
    e.preventDefault(); // STOP THE CRASH
    
    if (validateAll()) {
      const popup = document.getElementById('success-popup');
      if (popup) {
        popup.hidden = false;
        setTimeout(() => popup.classList.add('is-visible'), 10);
        form.reset();
        setTimeout(() => {
          popup.classList.remove('is-visible');
          setTimeout(() => { popup.hidden = true; }, 400);
        }, 4000);
      }
    }
  });
}

// CALL THE FUNCTION SO IT ACTUALLY RUNS
setupContactValidation();
