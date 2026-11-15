import { stories } from './modules/data/stories.js';
import { infoPages } from './modules/data/info-pages.js';
import { image, normalize } from './modules/shared/utils.js';
import { INITIAL_STORY_COUNT } from './modules/shared/config.js';
import { readSavedStories, writeSavedStories } from './modules/services/saved-stories.js';

const bookmarkIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>';
const saved = readSavedStories(stories);
let category = 'Todas';
let query = '';
let showAll = false;
let toastTimer;
const grid = document.querySelector('#stories-grid');
const dialog = document.querySelector('#article-dialog');
const searchInput = document.querySelector('#search');
const date = new Date();
document.querySelector('#today').textContent = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Bogota',
}).format(date);
document.querySelector('#today').dateTime = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);
document.querySelector('#year').textContent = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  timeZone: 'America/Bogota',
}).format(date);

function render() {
  const matches = stories.filter(
    (s) =>
      s.id !== 'opinion' &&
      (category === 'Todas' || s.category === category) &&
      normalize(`${s.title} ${s.description} ${s.category}`).includes(normalize(query)),
  );
  const visible =
    showAll || category !== 'Todas' || query ? matches : matches.slice(0, INITIAL_STORY_COUNT);
  grid.innerHTML = visible
    .map(
      (s) =>
        `<article class="story-card"><button class="story-image-button" data-story="${s.id}" aria-label="Leer: ${s.title}"><img src="${image(s.image)}" alt="${s.alt}" loading="lazy"></button><div class="card-topline"><span class="eyebrow">${s.category.toUpperCase()}</span><button class="bookmark" data-save="${s.id}" aria-pressed="${saved.has(s.id)}" aria-label="${saved.has(s.id) ? 'Quitar de guardados' : 'Guardar artículo'}">${bookmarkIcon}</button></div><h3><button data-story="${s.id}">${s.title}</button></h3><p>${s.description}</p><div class="card-meta"><strong>Redacción Nota Pública</strong><span>${s.minutes} min de lectura</span></div></article>`,
    )
    .join('');
  document.querySelector('#empty-results').hidden = matches.length > 0;
  const status = document.querySelector('#filter-status');
  status.hidden = category === 'Todas' && !query;
  status.textContent = `${matches.length} ${matches.length === 1 ? 'historia' : 'historias'}${category !== 'Todas' ? ' en ' + category : ''}${query ? ' para «' + query + '»' : ''}`;
  document.querySelectorAll('[data-category]').forEach((b) => {
    const active = b.dataset.category === category;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active);
  });
  document.querySelector('#view-all').innerHTML =
    showAll && category === 'Todas' && !query
      ? 'Ver selección <span>↗</span>'
      : 'Ver todas las noticias <span>↗</span>';
}
function notify(text) {
  const toast = document.querySelector('#toast');
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 3200);
}
function openDialog(html) {
  document.querySelector('#dialog-content').innerHTML = html;
  dialog.showModal();
}
function openStory(id) {
  const s = stories.find((story) => story.id === id);
  if (!s) return;
  openDialog(
    `<span class="eyebrow">${s.category.toUpperCase()}</span><h2 id="dialog-title" class="dialog-title">${s.title}</h2><span class="read-time">Redacción Nota Pública · ${s.minutes} min de lectura</span>${s.image ? `<img class="dialog-image" src="${image(s.image, 1100)}" alt="${s.alt}">` : ''}<div class="dialog-body">${s.body.map((p) => `<p>${p}</p>`).join('')}</div><p class="dialog-demo">Contenido de demostración creado para esta portada. No es una noticia verificada ni una cobertura de actualidad.</p>`,
  );
}
function reset() {
  category = 'Todas';
  query = '';
  searchInput.value = '';
  showAll = true;
  render();
}
document.addEventListener('click', (event) => {
  const storyButton = event.target.closest('[data-story]');
  if (storyButton) openStory(storyButton.dataset.story);
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    const stored = writeSavedStories(saved);
    document.querySelectorAll(`[data-save="${id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', saved.has(id));
      b.setAttribute('aria-label', saved.has(id) ? 'Quitar de guardados' : 'Guardar artículo');
    });
    notify(
      saved.has(id)
        ? stored
          ? 'Artículo guardado en este navegador.'
          : 'Artículo guardado durante esta visita.'
        : 'Artículo eliminado de tus guardados.',
    );
  }
  const categoryButton = event.target.closest('[data-category]');
  if (categoryButton) {
    category = categoryButton.dataset.category;
    query = '';
    searchInput.value = '';
    showAll = false;
    render();
    if (category !== 'Todas')
      document.querySelector('#historias').scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const trend = event.target.closest('[data-search]');
  if (trend) {
    category = 'Todas';
    query = trend.dataset.search;
    searchInput.value = query;
    showAll = true;
    openSearch();
    render();
    document.querySelector('#historias').scrollIntoView({ behavior: 'smooth' });
  }
  const info = event.target.closest('[data-info]');
  if (info) openInfo(info.dataset.info);
});
function openSearch() {
  document.querySelector('#search-panel').hidden = false;
  document.querySelector('.search-toggle').setAttribute('aria-expanded', 'true');
}
document.querySelector('.search-toggle').addEventListener('click', () => {
  const panel = document.querySelector('#search-panel');
  const opening = panel.hidden;
  panel.hidden = !opening;
  document.querySelector('.search-toggle').setAttribute('aria-expanded', opening);
  if (opening) searchInput.focus();
});
searchInput.addEventListener('input', () => {
  query = searchInput.value.trim();
  showAll = true;
  render();
});
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.querySelector('#historias').scrollIntoView({ behavior: 'smooth' });
  }
  if (event.key === 'Escape') {
    document.querySelector('#search-panel').hidden = true;
    document.querySelector('.search-toggle').setAttribute('aria-expanded', 'false');
    document.querySelector('.search-toggle').focus();
  }
});
document.querySelector('#clear-search').addEventListener('click', () => {
  query = '';
  searchInput.value = '';
  render();
  searchInput.focus();
});
document.querySelector('#view-all').addEventListener('click', () => {
  if (category !== 'Todas' || query) reset();
  else {
    showAll = !showAll;
    render();
  }
});
document.querySelector('#reset-filters').addEventListener('click', reset);
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const r = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom)
  )
    dialog.close();
});
function openInfo(key) {
  const info = infoPages[key];
  if (info)
    openDialog(
      `<span class="eyebrow">NOTA PÚBLICA</span><h2 id="dialog-title" class="dialog-title">${info.title}</h2><p class="dialog-body">${info.body}</p>`,
    );
}
document.querySelector('#privacy-link').addEventListener('click', () => openInfo('privacy'));
document.querySelector('#newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const feedback = document.querySelector('#newsletter-feedback');
  feedback.textContent =
    '¡Gracias por tu interés! Esta es una demostración: no se ha creado una suscripción ni se ha enviado tu correo.';
  feedback.hidden = false;
  event.target.reset();
});
document.querySelectorAll('[data-save]').forEach((b) => {
  b.innerHTML = bookmarkIcon;
  b.setAttribute('aria-pressed', saved.has(b.dataset.save));
});
render();
