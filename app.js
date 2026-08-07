// ============================================
//  CineShelf – app.js
//  Cinephile Media Library
// ============================================

'use strict';

// ── State ──────────────────────────────────
let ALL = [];          // all entries from data.json
let FILTERED = [];     // current filtered+sorted result
let DISPLAYED = 0;     // how many cards are rendered
const PAGE_SIZE = 60;  // cards per batch
let LANG = 'de';       // 'de' | 'en'
let FAVORITES = {};    // { id: true }
let USER_RATINGS = {}; // { id: number }
let USER_NOTES = {};   // { id: string }

// ── i18n ───────────────────────────────────
const T = {
  de: {
    library: 'Bibliothek',
    toprated: 'Top Rated',
    favorites: 'Favoriten',
    stats: 'Statistiken',
    random: 'Zufällig',
    search: 'Titel, Regisseur, Schauspieler …',
    allTypes: 'Alle Typen',
    allGenres: 'Alle Genres',
    allYears: 'Alle Jahre',
    allCountries: 'Alle Länder',
    onlyFav: 'Nur Favoriten',
    film: 'Film',
    series: 'Serie',
    season: 'Staffel',
    game: 'Spiel',
    wwe: 'WWE',
    concert: 'Konzert',
    results: (n) => `${n.toLocaleString('de')} Einträge`,
    loadMore: 'Mehr laden',
    director: 'Regie',
    year: 'Jahr',
    country: 'Land',
    production: 'Produktion',
    genre: 'Genre',
    cast: 'Besetzung',
    rating: 'Bewertung',
    myRating: 'Meine Bewertung',
    notes: 'Notizen',
    notesPlaceholder: 'Deine Gedanken …',
    save: 'Speichern',
    imdb: 'IMDb',
    tmdb: 'TMDb',
    noFav: 'Noch keine Favoriten.',
    noFavSub: 'Klicke das Herz-Symbol auf einer Karte.',
    noResults: 'Keine Einträge gefunden.',
    sortAdded: 'Zuletzt hinzugefügt',
    sortTitleAZ: 'Titel A–Z',
    sortTitleZA: 'Titel Z–A',
    sortYearDesc: 'Jahr ↓',
    sortYearAsc: 'Jahr ↑',
    sortRating: 'Bewertung ↓',
    statTotal: 'Einträge gesamt',
    statFilms: 'Filme',
    statWWE: 'WWE-Events',
    statConcerts: 'Konzerte',
    statGenres: 'Top Genres',
    statDirectors: 'Top Regisseure',
    statCountries: 'Top Länder',
    statDecades: 'Nach Jahrzehnt',
    topratedSubtitle: 'Einträge mit Bewertung, sortiert nach Punktzahl',
    topratedSub2: 'Einträge mit Bewertung',
    favSubtitle: (n) => `${n} markierte Einträge`,
    clearRating: 'Löschen',
    ageRating: 'FSK',
  },
  en: {
    library: 'Library',
    toprated: 'Top Rated',
    favorites: 'Favorites',
    stats: 'Statistics',
    random: 'Random',
    search: 'Title, director, actor …',
    allTypes: 'All types',
    allGenres: 'All genres',
    allYears: 'All years',
    allCountries: 'All countries',
    onlyFav: 'Favorites only',
    film: 'Film',
    series: 'Series',
    season: 'Season',
    game: 'Game',
    wwe: 'WWE',
    concert: 'Concert',
    results: (n) => `${n.toLocaleString('en')} entries`,
    loadMore: 'Load more',
    director: 'Director',
    year: 'Year',
    country: 'Country',
    production: 'Production',
    genre: 'Genre',
    cast: 'Cast',
    rating: 'Rating',
    myRating: 'My Rating',
    notes: 'Notes',
    notesPlaceholder: 'Your thoughts …',
    save: 'Save',
    imdb: 'IMDb',
    tmdb: 'TMDb',
    noFav: 'No favorites yet.',
    noFavSub: 'Click the heart icon on any card.',
    noResults: 'No entries found.',
    sortAdded: 'Recently added',
    sortTitleAZ: 'Title A–Z',
    sortTitleZA: 'Title Z–A',
    sortYearDesc: 'Year ↓',
    sortYearAsc: 'Year ↑',
    sortRating: 'Rating ↓',
    statTotal: 'Total entries',
    statFilms: 'Films',
    statWWE: 'WWE events',
    statConcerts: 'Concerts',
    statGenres: 'Top Genres',
    statDirectors: 'Top Directors',
    statCountries: 'Top Countries',
    statDecades: 'By decade',
    topratedSubtitle: 'Entries with a rating, sorted by score',
    topratedSub2: 'rated entries',
    favSubtitle: (n) => `${n} marked entries`,
    clearRating: 'Clear',
    ageRating: 'Rating',
  }
};

function t(key, arg) {
  const d = T[LANG][key];
  if (typeof d === 'function') return d(arg);
  return d || key;
}

// ── Init ───────────────────────────────────
async function init() {
  loadLocalData();
  renderNavLabels();

  const grid = document.getElementById('grid');
  grid.innerHTML = '<div class="loading">Lade Bibliothek …</div>';

  try {
    const res = await fetch('data.json');
    ALL = await res.json();
  } catch (e) {
    grid.innerHTML = '<div class="loading">Fehler beim Laden von data.json</div>';
    return;
  }

  populateFilters();
  applyFilters();
  setupKeyboard();
}

// ── Local storage ──────────────────────────
function loadLocalData() {
  try {
    FAVORITES = JSON.parse(localStorage.getItem('cs_favs') || '{}');
    USER_RATINGS = JSON.parse(localStorage.getItem('cs_ratings') || '{}');
    USER_NOTES = JSON.parse(localStorage.getItem('cs_notes') || '{}');
    LANG = localStorage.getItem('cs_lang') || 'de';
    document.getElementById('langBtn').textContent = LANG === 'de' ? 'EN' : 'DE';
  } catch (e) {}
}
function saveLocalData() {
  try {
    localStorage.setItem('cs_favs', JSON.stringify(FAVORITES));
    localStorage.setItem('cs_ratings', JSON.stringify(USER_RATINGS));
    localStorage.setItem('cs_notes', JSON.stringify(USER_NOTES));
  } catch (e) {}
}

// ── Language toggle ────────────────────────
function toggleLang() {
  LANG = LANG === 'de' ? 'en' : 'de';
  localStorage.setItem('cs_lang', LANG);
  document.getElementById('langBtn').textContent = LANG === 'de' ? 'EN' : 'DE';
  renderNavLabels();
  applyFilters();
}
function renderNavLabels() {
  document.querySelector('[data-page="home"]').textContent = t('library');
  document.querySelector('[data-page="toprated"]').textContent = t('toprated');
  document.querySelector('[data-page="favorites"]').textContent = t('favorites');
  document.querySelector('[data-page="stats"]').textContent = t('stats');
  document.querySelector('.btn-random span').textContent = t('random');
  document.getElementById('searchInput').placeholder = t('search');
  document.querySelector('#filterType option[value=""]').textContent = t('allTypes');
  document.querySelector('#filterType option[value="film"]').textContent = t('film');
  document.querySelector('#filterType option[value="wwe"]').textContent = t('wwe');
  document.querySelector('#filterType option[value="concert"]').textContent = t('concert');
  document.querySelector('#filterGenre option[value=""]').textContent = t('allGenres');
  document.querySelector('#filterDecade option[value=""]').textContent = t('allYears');
  document.querySelector('#filterCountry option[value=""]').textContent = t('allCountries');
  document.querySelector('#filterFav').nextElementSibling.textContent = t('onlyFav');
  const sort = document.getElementById('sortBy');
  sort.options[0].text = t('sortAdded');
  sort.options[1].text = t('sortTitleAZ');
  sort.options[2].text = t('sortTitleZA');
  sort.options[3].text = t('sortYearDesc');
  sort.options[4].text = t('sortYearAsc');
  sort.options[5].text = t('sortRating');
  document.querySelector('.btn-loadmore') && (document.querySelector('.btn-loadmore').textContent = t('loadMore'));
}

// ── Populate filter dropdowns ──────────────
function populateFilters() {
  // Genres
  const genreSet = new Set();
  ALL.forEach(m => (m.genres || []).forEach(g => {
    if (g.length < 40 && !['MCU','DC','WWE','World Wrestling Entertainment (WWE)'].includes(g))
      genreSet.add(g);
  }));
  const genreList = [...genreSet].sort();
  const genreEl = document.getElementById('filterGenre');
  genreList.forEach(g => {
    const o = document.createElement('option');
    o.value = g; o.textContent = g;
    genreEl.appendChild(o);
  });

  // Decades
  const decadeSet = new Set();
  ALL.forEach(m => {
    if (m.year && m.year > 1900) decadeSet.add(Math.floor(m.year / 10) * 10);
  });
  const decades = [...decadeSet].sort((a,b) => b - a);
  const decEl = document.getElementById('filterDecade');
  decades.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = `${d}er`;
    decEl.appendChild(o);
  });

  // Countries
  const countrySet = new Set();
  ALL.forEach(m => {
    if (m.country) countrySet.add(m.country);
  });
  const countries = [...countrySet].sort();
  const cEl = document.getElementById('filterCountry');
  countries.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    cEl.appendChild(o);
  });
}

// ── Filters & Sort ─────────────────────────
function applyFilters() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const type  = document.getElementById('filterType').value;
  const genre = document.getElementById('filterGenre').value;
  const decade = document.getElementById('filterDecade').value;
  const country = document.getElementById('filterCountry').value;
  const favOnly = document.getElementById('filterFav').checked;
  const sort  = document.getElementById('sortBy').value;

  // Show/hide clear button
  document.getElementById('searchClear').style.display = query ? 'block' : 'none';

  FILTERED = ALL.filter(m => {
    if (type && m.type !== type) return false;
    if (genre && !(m.genres || []).includes(genre)) return false;
    if (decade && m.year && Math.floor(m.year / 10) * 10 !== parseInt(decade)) return false;
    if (country && m.country !== country) return false;
    if (favOnly && !FAVORITES[m.id]) return false;
    if (query) {
      const haystack = [m.title, m.director, m.country,
        (m.actors || []).map(a => a.name).join(' '),
        (m.genres || []).join(' ')].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // Sort
  FILTERED.sort((a, b) => {
    switch (sort) {
      case 'title-asc':  return (a.title || '').localeCompare(b.title || '', 'de');
      case 'title-desc': return (b.title || '').localeCompare(a.title || '', 'de');
      case 'year-desc':  return (b.year || 0) - (a.year || 0);
      case 'year-asc':   return (a.year || 0) - (b.year || 0);
      case 'rating-desc':{
        const rA = USER_RATINGS[a.id] !== undefined ? USER_RATINGS[a.id] : (a.rating || 0);
        const rB = USER_RATINGS[b.id] !== undefined ? USER_RATINGS[b.id] : (b.rating || 0);
        return rB - rA || b.added - a.added;
      }
      default: return b.added - a.added; // added-desc (reverse original order = most recent)
    }
  });

  document.getElementById('resultsCount').textContent = t('results', FILTERED.length);
  DISPLAYED = 0;
  document.getElementById('grid').innerHTML = '';
  loadMoreItems();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  applyFilters();
}

// ── Render grid ────────────────────────────
function loadMoreItems() {
  const frag = document.createDocumentFragment();
  const end = Math.min(DISPLAYED + PAGE_SIZE, FILTERED.length);
  for (let i = DISPLAYED; i < end; i++) {
    frag.appendChild(createCard(FILTERED[i]));
  }
  document.getElementById('grid').appendChild(frag);
  DISPLAYED = end;

  const btn = document.getElementById('loadMore');
  if (DISPLAYED < FILTERED.length) {
    btn.style.display = 'block';
  } else {
    btn.style.display = 'none';
  }
}

function createCard(m) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = m.id;

  const isFav = !!FAVORITES[m.id];
  const rating = USER_RATINGS[m.id] !== undefined ? USER_RATINGS[m.id] : m.rating;
  const typeLabel = t(m.type) || m.type;

  el.innerHTML = `
    <div class="card-poster">
      ${m.poster_url
        ? `<img src="${m.poster_url}" alt="${escHtml(m.title)}" loading="lazy" onerror="this.parentNode.innerHTML=fallbackPoster('${escHtml(m.title)}')">`
        : `<div class="card-poster-fallback"><div class="fallback-icon">🎬</div><div class="fallback-title">${escHtml(m.title)}</div></div>`
      }
      <span class="card-type-badge badge-${m.type}">${typeLabel}</span>
      <button class="card-fav ${isFav ? 'is-fav' : ''}" onclick="toggleFav(event,${m.id})" title="${isFav ? 'Entfernen' : 'Favorit'}">
        ${isFav ? '♥' : '♡'}
      </button>
    </div>
    <div class="card-info">
      <div class="card-title" title="${escHtml(m.title)}">${escHtml(m.title)}</div>
      <div class="card-meta">
        <span class="card-year">${m.year || '–'}</span>
        ${rating ? `<span class="card-rating">${rating}</span>` : ''}
      </div>
    </div>
  `;

  el.addEventListener('click', (e) => {
    if (e.target.closest('.card-fav')) return;
    openDetail(m.id);
  });

  return el;
}

function fallbackPoster(title) {
  return `<div class="card-poster-fallback"><div class="fallback-icon">🎬</div><div class="fallback-title">${escHtml(title)}</div></div>`;
}

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Favorite toggle ────────────────────────
function toggleFav(e, id) {
  e.stopPropagation();
  if (FAVORITES[id]) {
    delete FAVORITES[id];
  } else {
    FAVORITES[id] = true;
  }
  saveLocalData();

  // Update card button
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (card) {
    const btn = card.querySelector('.card-fav');
    const isFav = !!FAVORITES[id];
    btn.classList.toggle('is-fav', isFav);
    btn.textContent = isFav ? '♥' : '♡';
  }

  // Update modal fav if open
  const modalFav = document.getElementById('modal-fav-btn');
  if (modalFav && parseInt(modalFav.dataset.id) === id) {
    const isFav = !!FAVORITES[id];
    modalFav.classList.toggle('is-fav', isFav);
    modalFav.textContent = isFav ? '♥' : '♡';
  }

  showToast(FAVORITES[id] ? '♥ Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');
}

// ── Detail modal ───────────────────────────
function openDetail(id) {
  const m = ALL.find(x => x.id === id);
  if (!m) return;

  const isFav = !!FAVORITES[id];
  const myRating = USER_RATINGS[id] !== undefined ? USER_RATINGS[id] : (m.rating || 0);
  const myNote = USER_NOTES[id] || '';
  const typeLabel = t(m.type) || m.type;

  // Rating pips (1,2,…10 in 0.5 steps = 1.0,1.5,2.0…10.0)
  const ratingPips = [];
  for (let v = 1; v <= 10; v++) {
    const label = v;
    ratingPips.push(`<button class="rating-pip ${myRating === v ? 'active' : ''}" onclick="setRating(${id},${v})" data-val="${v}">${v}</button>`);
  }

  // Half values row
  const halfPips = [];
  for (let v = 0.5; v <= 9.5; v++) {
    const label = v.toFixed(1).replace('.0','');
    halfPips.push(`<button class="rating-pip ${myRating === v ? 'active' : ''}" onclick="setRating(${id},${v})" data-val="${v}" style="font-size:8px">${v}</button>`);
  }

  const actors = (m.actors || []).slice(0, 6);
  const genres = (m.genres || []).filter(g => g.length < 30);

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-layout">
      <div class="modal-poster">
        ${m.poster_url
          ? `<img src="${m.poster_url}" alt="${escHtml(m.title)}">`
          : `<div class="modal-poster-fallback">🎬</div>`}
      </div>
      <div class="modal-content">
        <div class="modal-type-tag">${typeLabel}</div>
        <h2 class="modal-title">${escHtml(m.title)}</h2>

        <div class="modal-meta-row">
          ${m.year ? `<div class="modal-meta-item"><span class="modal-meta-label">${t('year')}</span><span class="modal-meta-value">${m.year}</span></div>` : ''}
          ${m.director ? `<div class="modal-meta-item"><span class="modal-meta-label">${t('director')}</span><span class="modal-meta-value">${escHtml(m.director)}</span></div>` : ''}
          ${m.country ? `<div class="modal-meta-item"><span class="modal-meta-label">${t('country')}</span><span class="modal-meta-value">${escHtml(m.country)}</span></div>` : ''}
          ${m.age_rating ? `<div class="modal-meta-item"><span class="modal-meta-label">${t('ageRating')}</span><span class="modal-meta-value">${escHtml(m.age_rating)}</span></div>` : ''}
          ${m.production ? `<div class="modal-meta-item"><span class="modal-meta-label">${t('production')}</span><span class="modal-meta-value">${escHtml(m.production.split('\n')[0])}</span></div>` : ''}
          <div class="modal-meta-item">
            <button class="card-fav ${isFav ? 'is-fav' : ''}" id="modal-fav-btn" data-id="${id}" onclick="toggleFav(event,${id})" style="position:static;width:auto;height:auto;background:none;border-radius:0;font-size:18px;padding:0;">${isFav ? '♥' : '♡'}</button>
          </div>
        </div>

        ${genres.length ? `<div class="modal-genres">${genres.map(g => `<span class="genre-chip">${escHtml(g)}</span>`).join('')}</div>` : ''}
        ${m.description ? `<p class="modal-description">${escHtml(m.description)}</p>` : ''}

        ${actors.length ? `
          <div class="modal-section-label">${t('cast')}</div>
          <div class="modal-cast">
            ${actors.map(a => `<div class="cast-item"><span class="cast-name">${escHtml(a.name)}</span>${a.role ? `<span class="cast-role">– ${escHtml(a.role)}</span>` : ''}</div>`).join('')}
          </div>` : ''}

        <div class="modal-rating-section">
          <div class="modal-section-label">${t('myRating')}</div>
          <div class="rating-controls">
            <div class="rating-stars" id="rating-row">
              ${ratingPips.join('')}
            </div>
            ${myRating ? `<button class="rating-clear" onclick="clearRating(${id})">${t('clearRating')}</button>` : ''}
          </div>
          ${myRating ? `<div style="margin-top:8px;font-family:var(--font-display);font-size:24px;color:var(--accent)">${myRating} <span style="font-size:12px;color:var(--text-muted);font-family:var(--font-body)">/ 10</span></div>` : ''}
        </div>

        <div class="modal-rating-section" style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
          <div class="modal-section-label">${t('notes')}</div>
          <textarea class="notes-textarea" id="note-input-${id}" placeholder="${t('notesPlaceholder')}">${escHtml(myNote)}</textarea>
          <button class="notes-save-btn" onclick="saveNote(${id})">${t('save')}</button>
        </div>

        <div class="modal-links">
          ${m.imdb_id ? `<a href="https://www.imdb.com/title/${m.imdb_id}" target="_blank" class="modal-link">↗ ${t('imdb')}</a>` : ''}
          ${m.tmdb_id ? `<a href="https://www.themoviedb.org/movie/${m.tmdb_id}" target="_blank" class="modal-link">↗ ${t('tmdb')}</a>` : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) closeModalBtn();
}
function closeModalBtn() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Rating ─────────────────────────────────
function setRating(id, val) {
  USER_RATINGS[id] = val;
  saveLocalData();
  openDetail(id); // re-render modal
  // Update card
  const card = document.querySelector(`.card[data-id="${id}"] .card-rating`);
  // Find card and update
  refreshCard(id);
  showToast(`Bewertet: ${val}/10`);
}
function clearRating(id) {
  delete USER_RATINGS[id];
  saveLocalData();
  openDetail(id);
  refreshCard(id);
  showToast('Bewertung entfernt');
}
function saveNote(id) {
  const val = document.getElementById(`note-input-${id}`).value.trim();
  if (val) USER_NOTES[id] = val;
  else delete USER_NOTES[id];
  saveLocalData();
  showToast(t('save') + ' ✓');
}

function refreshCard(id) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;
  const m = ALL.find(x => x.id === id);
  const rating = USER_RATINGS[id] !== undefined ? USER_RATINGS[id] : (m && m.rating);
  const ratingEl = card.querySelector('.card-rating');
  const metaEl = card.querySelector('.card-meta');
  if (rating) {
    if (ratingEl) ratingEl.textContent = rating;
    else if (metaEl) metaEl.insertAdjacentHTML('beforeend', `<span class="card-rating">${rating}</span>`);
  } else if (ratingEl) {
    ratingEl.remove();
  }
}

// ── Pages ──────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelector(`[data-page="${name}"]`).classList.add('active');
  window.scrollTo(0, 0);

  if (name === 'toprated') renderTopRated();
  if (name === 'favorites') renderFavorites();
  if (name === 'stats') renderStats();
}

// ── Top Rated ─────────────────────────────
function renderTopRated() {
  const rated = ALL
    .filter(m => USER_RATINGS[m.id] !== undefined ? USER_RATINGS[m.id] : m.rating)
    .sort((a,b) => {
      const rA = USER_RATINGS[a.id] !== undefined ? USER_RATINGS[a.id] : (a.rating || 0);
      const rB = USER_RATINGS[b.id] !== undefined ? USER_RATINGS[b.id] : (b.rating || 0);
      return rB - rA;
    });

  document.getElementById('topratedSubtitle').textContent = `${rated.length} ${t('topratedSub2')}`;
  const grid = document.getElementById('toprated-grid');
  grid.innerHTML = '';

  if (!rated.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">★</div><p>Noch keine Einträge bewertet.</p><p class="empty-sub">Öffne eine Karte und vergib eine Bewertung.</p></div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  rated.forEach(m => frag.appendChild(createCard(m)));
  grid.appendChild(frag);
}

// ── Favorites ─────────────────────────────
function renderFavorites() {
  const favs = ALL.filter(m => FAVORITES[m.id]);
  document.getElementById('favoritesSubtitle').textContent = t('favSubtitle', favs.length);
  const grid = document.getElementById('favorites-grid');
  const empty = document.getElementById('favorites-empty');
  grid.innerHTML = '';

  if (!favs.length) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    empty.innerHTML = `<div class="empty-icon">♡</div><p>${t('noFav')}</p><p class="empty-sub">${t('noFavSub')}</p>`;
    return;
  }
  grid.style.display = '';
  empty.style.display = 'none';
  const frag = document.createDocumentFragment();
  favs.forEach(m => frag.appendChild(createCard(m)));
  grid.appendChild(frag);
}

// ── Statistics ─────────────────────────────
function renderStats() {
  const total = ALL.length;
  const films = ALL.filter(m => m.type === 'film').length;
  const wwe = ALL.filter(m => m.type === 'wwe').length;
  const concerts = ALL.filter(m => m.type === 'concert').length;
  const rated = ALL.filter(m => USER_RATINGS[m.id] !== undefined ? USER_RATINGS[m.id] : m.rating).length;
  const favCount = Object.keys(FAVORITES).length;

  // Genre distribution
  const genreCounts = {};
  ALL.forEach(m => (m.genres || []).forEach(g => {
    if (g.length < 30 && !['MCU','DC','WWE'].includes(g))
      genreCounts[g] = (genreCounts[g] || 0) + 1;
  }));
  const topGenres = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);

  // Director distribution
  const dirCounts = {};
  ALL.forEach(m => {
    if (m.director) dirCounts[m.director] = (dirCounts[m.director] || 0) + 1;
  });
  const topDirs = Object.entries(dirCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Country distribution
  const countryCounts = {};
  ALL.forEach(m => {
    if (m.country) countryCounts[m.country] = (countryCounts[m.country] || 0) + 1;
  });
  const topCountries = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Decade distribution
  const decadeCounts = {};
  ALL.forEach(m => {
    if (m.year && m.year > 1900) {
      const d = Math.floor(m.year/10)*10;
      decadeCounts[d] = (decadeCounts[d]||0)+1;
    }
  });
  const decades = Object.entries(decadeCounts).sort((a,b)=>a[0]-b[0]);

  // Rating distribution
  const ratingDist = {};
  Object.values(USER_RATINGS).forEach(r => {
    ratingDist[r] = (ratingDist[r]||0)+1;
  });

  const html = `
    ${statBigCard(total, t('statTotal'), '⬡')}
    ${statBigCard(films, t('statFilms'), '🎬')}
    ${statBigCard(wwe, t('statWWE'), '🏆')}
    ${statBigCard(concerts, t('statConcerts'), '🎵')}
    ${statBigCard(favCount, t('favorites'), '♥')}
    ${statBigCard(rated, 'Bewertet', '★')}
    ${statListCard(t('statGenres'), topGenres)}
    ${statListCard(t('statDirectors'), topDirs)}
    ${statListCard(t('statCountries'), topCountries)}
    ${statListCard(t('statDecades'), decades.map(([d,c]) => [`${d}er`, c]))}
    ${rated > 0 ? statListCard('Bewertungsverteilung', Object.entries(ratingDist).sort((a,b)=>b[0]-a[0]).map(([r,c]) => [`${r}/10`, c])) : ''}
  `;

  document.getElementById('stats-content').innerHTML = html;
}

function statBigCard(num, label, icon) {
  return `<div class="stat-card">
    <div class="stat-card-title">${label}</div>
    <div class="stat-big-number">${num.toLocaleString('de')}</div>
    <div class="stat-big-label">${icon}</div>
  </div>`;
}
function statListCard(title, items) {
  if (!items.length) return '';
  const max = items[0][1];
  return `<div class="stat-card">
    <div class="stat-card-title">${title}</div>
    <div class="stat-list">
      ${items.map(([label,count]) => `
        <div class="stat-list-item">
          <span class="stat-list-label" title="${escHtml(label)}">${escHtml(label)}</span>
          <div class="stat-list-bar-wrap"><div class="stat-list-bar" style="width:${Math.round(count/max*100)}%"></div></div>
          <span class="stat-list-count">${count}</span>
        </div>`).join('')}
    </div>
  </div>`;
}

// ── Random ─────────────────────────────────
function openRandom() {
  const pool = FILTERED.length > 0 ? FILTERED : ALL;
  const m = pool[Math.floor(Math.random() * pool.length)];
  if (m) openDetail(m.id);
}

// ── Keyboard shortcuts ──────────────────────
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModalBtn();
    if (e.key === '/' && !['INPUT','TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });
}

// ── Toast ──────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Bootstrap ──────────────────────────────
document.addEventListener('DOMContentLoaded', init);
