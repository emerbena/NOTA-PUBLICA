const image = (id, width = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const stories = [
  { id: 'movilidad', category: 'Actualidad', title: 'Moverse diferente también es cambiar la ciudad', description: 'Dos ruedas, más espacio público y nuevas formas de habitar las calles que compartimos.', image: 'photo-1571068316344-75bc76f77890', alt: 'Una persona recorre en bicicleta un camino rodeado de vegetación', minutes: 5, body: ['La ciudad se descubre de otra manera cuando cambia la velocidad. A pie o en bicicleta, aparecen detalles que suelen perderse detrás de una ventana: una tienda de barrio, la sombra de un árbol, una conversación en la esquina.', 'Pensar la movilidad implica preguntarse quién puede usar las calles y en qué condiciones. Las aceras continuas, los cruces accesibles y los recorridos conectados son parte de esa conversación.', 'Esta historia ilustrativa invita a mirar el trayecto cotidiano con atención: ¿qué haría que tu próximo recorrido fuera más cómodo, seguro y agradable?'] },
  { id: 'libros', category: 'Cultura', title: 'Las librerías que hacen barrio, una historia a la vez', description: 'Mucho más que estantes: pequeños lugares donde los libros se convierten en conversación.', image: 'photo-1507842217343-583bb7270b66', alt: 'Pasillos y estanterías de una biblioteca bañada de luz cálida', minutes: 4, body: ['Una librería puede ser una puerta hacia un mundo distinto y, al mismo tiempo, una forma de conocer mejor el lugar en el que vivimos. En sus estantes conviven historias lejanas con preguntas cercanas.', 'Cuando la lectura se comparte, el libro deja de ser un objeto solitario. Un club de lectura, una presentación o una recomendación abren espacios para encontrarse con otras voces.', 'Este relato de demostración propone imaginar una librería como punto de encuentro: un espacio donde quedarse un rato, escuchar y salir con una pregunta nueva.'] },
  { id: 'bosques', category: 'Planeta', title: 'Escuchar al bosque: otra forma de pensar el futuro', description: 'Una invitación a mirar la naturaleza con más atención y a repensar nuestro lugar en ella.', image: 'photo-1448375240586-882707db888b', alt: 'Rayos de sol atraviesan un bosque verde', minutes: 7, body: ['Detenerse en un bosque es un ejercicio de atención. La luz cambia, los sonidos se superponen y cada recorrido ofrece detalles distintos. Mirar con cuidado puede ser el comienzo de una relación diferente con el entorno.', 'La conversación sobre el futuro también necesita preguntas sobre los espacios que habitamos y los paisajes que deseamos conservar. ¿Qué valoramos de ellos? ¿Qué estamos dispuestos a cuidar?', 'Esta pieza ilustrativa no presenta una investigación científica. Es una invitación editorial a dar espacio a la naturaleza en nuestras conversaciones cotidianas.'] },
  { id: 'ia', category: 'Tecnología', title: 'La inteligencia artificial ya está aquí. ¿Y las preguntas difíciles?', description: 'Una conversación sobre creatividad, responsabilidad y las decisiones detrás de la tecnología.', image: 'photo-1677442136019-21780ecad995', alt: 'Representación digital de una inteligencia artificial', minutes: 5, body: ['Cada nueva herramienta trae posibilidades y preguntas. En el caso de la inteligencia artificial, la conversación también pasa por quién decide cómo se utiliza y qué lugar ocupa el criterio humano.', 'Antes de adoptar una herramienta, podemos preguntarnos qué problema queremos resolver, qué información compartimos y cómo revisaremos el resultado. La curiosidad y el pensamiento crítico pueden ir de la mano.', 'Este artículo de muestra propone un punto de partida para conversar. No describe un producto concreto ni sustituye una evaluación técnica.'] },
  { id: 'ciudad', category: 'Actualidad', title: 'La ciudad que queremos también se construye a pie', description: 'Recuperar las calles, encontrarnos en los parques y volver a poner a las personas en el centro.', image: 'photo-1477959858617-67f85cf4f1df', alt: 'Panorámica urbana entre edificios y espacios verdes', minutes: 6, body: ['Una ciudad no es solo sus edificios. También son las distancias que recorremos, los lugares donde descansamos y las personas con quienes compartimos el espacio. Caminar permite descubrir esa dimensión cotidiana.', 'Un banco a la sombra, una acera amplia o una plaza abierta pueden cambiar la experiencia de un recorrido. Pensar una ciudad a escala humana empieza por prestar atención a estas pequeñas decisiones.', 'La pregunta no tiene una única respuesta: ¿cómo queremos encontrarnos en el espacio público? Esta historia ilustrativa abre una conversación sobre las calles que imaginamos y el papel que podemos tener en ellas.'] },
  { id: 'economia', category: 'Economía', title: 'El valor de comprar cerca de casa', description: 'Una mirada a los comercios de barrio y a las relaciones que construimos en lo cotidiano.', image: 'photo-1488459716781-31db52582fe9', alt: 'Frutas y alimentos frescos de un mercado', minutes: 4, body: ['El comercio de proximidad forma parte del paisaje cotidiano: la panadería de la esquina, la tienda y el mercado. Cada compra puede ser también un encuentro con las personas que sostienen esos espacios.', 'Hablar de economía local invita a observar cómo elegimos, qué valoramos y qué opciones tenemos cerca. Las decisiones cambian según las necesidades, el tiempo disponible y el presupuesto de cada hogar.', 'Esta pieza de demostración explora esas preguntas sin ofrecer asesoramiento financiero ni afirmar resultados económicos específicos.'] },
  { id: 'politica', category: 'Política', title: 'La conversación pública empieza por escuchar', description: 'Participar, preguntar y encontrar puntos en común en medio de nuestras diferencias.', image: 'photo-1529156069898-49953e39b3ac', alt: 'Grupo de personas compartiendo un encuentro al aire libre', minutes: 5, body: ['Compartir un espacio no significa compartir todas las ideas. La conversación pública necesita maneras de expresar desacuerdos y escuchar las experiencias de otras personas.', 'Preguntar antes de suponer, revisar las fuentes y distinguir entre hechos y opiniones son hábitos que ayudan a participar con más cuidado.', 'Este texto editorial ilustrativo no se refiere a un gobierno, una elección ni un acontecimiento concreto. Propone una reflexión sobre cómo conversamos.'] },
  { id: 'opinion', category: 'Opinión', title: 'Estar informados es aprender a hacernos mejores preguntas', description: 'Una pausa entre titulares para recuperar el contexto y la curiosidad.', minutes: 3, body: ['La información puede llegar más rápido de lo que podemos procesarla. Leer un titular es apenas un comienzo: detrás aparecen preguntas sobre el origen, las circunstancias y las voces que faltan.', 'Darnos tiempo para entender es una forma de cuidar nuestra atención. No exige saberlo todo, sino reconocer qué sabemos, qué nos falta y dónde podríamos encontrar una explicación mejor.', 'Nota Pública es, en esta demostración, una propuesta de esa lectura: clara, curiosa y dispuesta a mirar más allá de la primera impresión.'] }
];
const bookmarkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>';
let saved = new Set();
try { const items = JSON.parse(localStorage.getItem('np-saved') || '[]'); if (Array.isArray(items)) saved = new Set(items.filter(id => stories.some(s => s.id === id))); } catch {}
let category = 'Todas';
let query = '';
let showAll = false;
let toastTimer;
const grid = document.querySelector('#stories-grid');
const dialog = document.querySelector('#article-dialog');
const searchInput = document.querySelector('#search');
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const date = new Date();
document.querySelector('#today').textContent = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }).format(date);
document.querySelector('#today').dateTime = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
document.querySelector('#year').textContent = new Intl.DateTimeFormat('es-CO', { year:'numeric',timeZone:'America/Bogota' }).format(date);

function render() {
  const matches = stories.filter(s => s.id !== 'opinion' && (category === 'Todas' || s.category === category) && normalize(`${s.title} ${s.description} ${s.category}`).includes(normalize(query)));
  const visible = showAll || category !== 'Todas' || query ? matches : matches.slice(0, 3);
  grid.innerHTML = visible.map(s => `<article class="story-card"><button class="story-image-button" data-story="${s.id}" aria-label="Leer: ${s.title}"><img src="${image(s.image)}" alt="${s.alt}" loading="lazy"></button><div class="card-topline"><span class="eyebrow">${s.category.toUpperCase()}</span><button class="bookmark" data-save="${s.id}" aria-pressed="${saved.has(s.id)}" aria-label="${saved.has(s.id) ? 'Quitar de guardados' : 'Guardar artículo'}">${bookmarkIcon}</button></div><h3><button data-story="${s.id}">${s.title}</button></h3><p>${s.description}</p><div class="card-meta"><strong>Redacción Nota Pública</strong><span>${s.minutes} min de lectura</span></div></article>`).join('');
  document.querySelector('#empty-results').hidden = matches.length > 0;
  const status = document.querySelector('#filter-status');
  status.hidden = category === 'Todas' && !query;
  status.textContent = `${matches.length} ${matches.length === 1 ? 'historia' : 'historias'}${category !== 'Todas' ? ' en ' + category : ''}${query ? ' para «' + query + '»' : ''}`;
  document.querySelectorAll('[data-category]').forEach(b => {const active = b.dataset.category === category; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active);});
  document.querySelector('#view-all').innerHTML = showAll && category === 'Todas' && !query ? 'Ver selección <span>↗</span>' : 'Ver todas las noticias <span>↗</span>';
}
function notify(text) { const toast = document.querySelector('#toast'); toast.textContent = text; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.hidden = true, 3200); }
function openDialog(html) { document.querySelector('#dialog-content').innerHTML = html; dialog.showModal(); }
function openStory(id) {
  const s = stories.find(story => story.id === id);
  if (!s) return;
  openDialog(`<span class="eyebrow">${s.category.toUpperCase()}</span><h2 id="dialog-title" class="dialog-title">${s.title}</h2><span class="read-time">Redacción Nota Pública · ${s.minutes} min de lectura</span>${s.image ? `<img class="dialog-image" src="${image(s.image, 1100)}" alt="${s.alt}">` : ''}<div class="dialog-body">${s.body.map(p => `<p>${p}</p>`).join('')}</div><p class="dialog-demo">Contenido de demostración creado para esta portada. No es una noticia verificada ni una cobertura de actualidad.</p>`);
}
function reset() { category = 'Todas'; query = ''; searchInput.value = ''; showAll = true; render(); }
document.addEventListener('click', event => {
  const storyButton = event.target.closest('[data-story]');
  if (storyButton) openStory(storyButton.dataset.story);
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    let stored = true;
    try {localStorage.setItem('np-saved', JSON.stringify([...saved]));} catch { stored = false; }
    document.querySelectorAll(`[data-save="${id}"]`).forEach(b => {b.setAttribute('aria-pressed', saved.has(id)); b.setAttribute('aria-label', saved.has(id) ? 'Quitar de guardados' : 'Guardar artículo');});
    notify(saved.has(id) ? (stored ? 'Artículo guardado en este navegador.' : 'Artículo guardado durante esta visita.') : 'Artículo eliminado de tus guardados.');
  }
  const categoryButton = event.target.closest('[data-category]');
  if (categoryButton) { category = categoryButton.dataset.category; query = ''; searchInput.value = ''; showAll = false; render(); if (category !== 'Todas') document.querySelector('#historias').scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' }); }
  const trend = event.target.closest('[data-search]');
  if (trend) { category = 'Todas'; query = trend.dataset.search; searchInput.value = query; showAll = true; openSearch(); render(); document.querySelector('#historias').scrollIntoView({ behavior: 'smooth' }); }
  const info = event.target.closest('[data-info]');
  if (info) openInfo(info.dataset.info);
});
function openSearch() { document.querySelector('#search-panel').hidden = false; document.querySelector('.search-toggle').setAttribute('aria-expanded','true'); }
document.querySelector('.search-toggle').addEventListener('click', () => { const panel = document.querySelector('#search-panel'); const opening = panel.hidden; panel.hidden = !opening; document.querySelector('.search-toggle').setAttribute('aria-expanded', opening); if (opening) searchInput.focus(); });
searchInput.addEventListener('input', () => { query = searchInput.value.trim(); showAll = true; render(); });
searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); document.querySelector('#historias').scrollIntoView({ behavior:'smooth' }); } if(event.key === 'Escape'){document.querySelector('#search-panel').hidden = true;document.querySelector('.search-toggle').setAttribute('aria-expanded','false');document.querySelector('.search-toggle').focus();} });
document.querySelector('#clear-search').addEventListener('click', () => { query = ''; searchInput.value = ''; render(); searchInput.focus(); });
document.querySelector('#view-all').addEventListener('click', () => { if (category !== 'Todas' || query) reset(); else {showAll = !showAll; render();} });
document.querySelector('#reset-filters').addEventListener('click', reset);
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close(); });
const infoPages = {
  about: {title: 'Una mirada con contexto', body: 'Nota Pública es un prototipo de un medio de noticias en español. Su propuesta visual combina una portada editorial clara con espacio para la actualidad, la cultura, la tecnología y el planeta. Todos los artículos de esta versión son ilustrativos.'},
  principles: {title: 'Los principios de esta propuesta', body: 'Claridad para explicar. Curiosidad para preguntar. Contexto para comprender. Esta propuesta editorial invita a distinguir los hechos de las opiniones y a dar espacio a distintas perspectivas. Los textos del prototipo no representan una redacción en funcionamiento.'},
  privacy: {title: 'Privacidad en esta demostración', body: 'El formulario del boletín no envía ni guarda tu correo electrónico. La función de guardar artículos utiliza el almacenamiento local de tu navegador y solo conserva identificadores de artículos. No usamos analítica ni cookies de seguimiento propias. Las fotografías se cargan desde Unsplash y las tipografías desde Google Fonts; al cargarlas, tu navegador se conecta con esos servicios.'}
};
function openInfo(key) { const info = infoPages[key]; if(info) openDialog(`<span class="eyebrow">NOTA PÚBLICA</span><h2 id="dialog-title" class="dialog-title">${info.title}</h2><p class="dialog-body">${info.body}</p>`); }
document.querySelector('#privacy-link').addEventListener('click', () => openInfo('privacy'));
document.querySelector('#newsletter-form').addEventListener('submit', event => { event.preventDefault(); const feedback = document.querySelector('#newsletter-feedback'); feedback.textContent = '¡Gracias por tu interés! Esta es una demostración: no se ha creado una suscripción ni se ha enviado tu correo.'; feedback.hidden = false; event.target.reset(); });
document.querySelectorAll('[data-save]').forEach(b => { b.innerHTML = bookmarkIcon; b.setAttribute('aria-pressed', saved.has(b.dataset.save)); });
render();
