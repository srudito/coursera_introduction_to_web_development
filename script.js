
function syncMenuAria(checked) {
  const nav = document.querySelector('nav');
  const btn = document.querySelector('.hamburger');
  if (!nav || !btn) return;
  btn.setAttribute('aria-expanded', String(checked));
  nav.setAttribute('aria-hidden', String(!checked));
}

// Keep ARIA in sync with the checkbox (label click handles the toggle)
document.getElementById('menu-toggle')?.addEventListener('change', (e) => {
  syncMenuAria(e.target.checked);
});

// Smooth scrolling + close menu after navigation (respects reduced motion)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function smoothScroll(e) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  e.preventDefault();

  const target = document.querySelector(href);
  if (!target) return;

  // Close menu
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

// Initialize ARIA on load
syncMenuAria(document.getElementById('menu-toggle')?.checked ?? false);





// --- Projects Filter (robust) ---
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

  container.innerHTML = ''; // clear
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.dataset.filter = c;
    btn.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    container.appendChild(btn);
  });

  // Delegation handles future buttons too
  container.addEventListener('click', (e) => {
    const target = e.target.closest('[data-filter]');
    if (!target) return;
    const selected = target.dataset.filter;
    filterProjects(selected);

    // update selected state
    container.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('is-active', b === target));
  });
}

// Initialize on load
buildFilterUI();
filterProjects('all');



/*
// --- Projects Filter ---
function filterProjects(category = 'all') {
  document.querySelectorAll('.projects-grid .project-card').forEach(card => {
    const cat = card.dataset.category || 'all';
    const show = category === 'all' || cat === category;
    card.hidden = !show;
    card.setAttribute('aria-hidden', String(!show));
  });
}
// Optional: hook filter buttons like <button data-filter="dashboard">Dashboard</button>
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => filterProjects(btn.dataset.filter));
});
// Initialize
filterProjects('all');
*/


// --- Lightbox ---
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

  // Close on backdrop click / button / Esc
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
// Bind to project images
document.querySelectorAll('.projects-grid figure img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    const caption = img.closest('figure')?.querySelector('figcaption')?.textContent || '';
    openLightbox(img.src, img.alt, caption);
  });
});


// --- Contact Form Validation ---
(function setupContactValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');
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

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i; // simple, practical email check

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

  // Real-time feedback
  fields.name.addEventListener('input', validateName);
  fields.email.addEventListener('input', validateEmail);
  fields.message.addEventListener('input', validateMessage);

  // On submit
  form.addEventListener('submit', (e) => {
    if (!validateAll()) {
      e.preventDefault();
      status.classList.remove('visually-hidden');
      status.textContent = 'Please fix the errors in the form before submitting.';
      return;
    }
    e.preventDefault(); // simulate success (remove to allow real submission)
    status.classList.remove('visually-hidden');
    status.textContent = 'Thanks! Your message has been submitted.';
    form.reset();
    // Clear visuals after reset
    Object.values(errors).forEach(el => el.textContent = '');
    Object.values(fields).forEach(el => { el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); });
  });
})();
