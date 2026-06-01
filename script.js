const header = document.querySelector('[data-header]');
const burger = document.querySelector('[data-burger]');
const nav = document.querySelector('[data-nav]');
const toTopButton = document.querySelector('[data-to-top]');
const form = document.querySelector('#contact-form');
const statusMessage = document.querySelector('[data-form-status]');
const leadEndpoint = '/.netlify/functions/send-telegram';

const setHeaderState = () => {
  const isScrolled = window.scrollY > 12;
  header?.classList.toggle('is-scrolled', isScrolled);
  toTopButton?.classList.toggle('is-visible', window.scrollY > 520);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

const closeMenu = () => {
  nav?.classList.remove('is-open');
  burger?.classList.remove('is-active');
  burger?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
};

burger?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('is-open');
  burger.classList.toggle('is-active', Boolean(isOpen));
  burger.setAttribute('aria-expanded', String(Boolean(isOpen)));
  document.body.classList.toggle('nav-open', Boolean(isOpen));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

toTopButton?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const validateField = (field) => {
  const parent = field.closest('label');
  const isCheckbox = field.type === 'checkbox';
  const isValid = isCheckbox ? field.checked : field.checkValidity();

  parent?.classList.toggle('has-error', !isValid);
  return isValid;
};

form?.querySelectorAll('input, textarea').forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.closest('label')?.classList.contains('has-error')) {
      validateField(field);
    }
  });
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fields = Array.from(form.querySelectorAll('input, textarea'));
  const validationResults = fields.map(validateField);
  const isFormValid = validationResults.every(Boolean);

  statusMessage.className = 'form-status';

  if (!isFormValid) {
    statusMessage.textContent = 'Проверьте обязательные поля и попробуйте ещё раз.';
    statusMessage.classList.add('is-error');
    return;
  }

  const formData = new FormData(form);
  const lead = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    message: formData.get('message'),
    pageUrl: window.location.href,
    createdAt: new Date().toISOString(),
  };

  const submitButton = form.querySelector('button[type="submit"]');
  const defaultButtonText = submitButton?.textContent;

  localStorage.setItem('rim-last-lead', JSON.stringify(lead));
  submitButton?.setAttribute('disabled', 'true');
  if (submitButton) {
    submitButton.textContent = 'Отправляем...';
  }

  try {
    const response = await fetch(leadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Не удалось отправить заявку.');
    }

    statusMessage.textContent = 'Спасибо! Заявка отправлена в Telegram. Мы свяжемся с вами в ближайшее время.';
    statusMessage.classList.add('is-success');
    form.reset();
  } catch (error) {
    statusMessage.textContent = `${error.message} Вы можете позвонить нам по телефону +7 902 286-13-09.`;
    statusMessage.classList.add('is-error');
  } finally {
    submitButton?.removeAttribute('disabled');
    if (submitButton && defaultButtonText) {
      submitButton.textContent = defaultButtonText;
    }
  }
});
