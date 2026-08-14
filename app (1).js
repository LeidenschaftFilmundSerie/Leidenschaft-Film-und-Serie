'use strict';
let ALL=[],FILTERED=[],SHOWN=0;
const PG=60;
let LANG='de',FAV={},RAT={},NOTES={};
const GENRES=['Action','Drama','Abenteuer','Komödie','Thriller','Animation','Fantasy','Liebesfilm','Horror','Western','Weihnachtsfilm','DC','Mystery','Rennfilm','Science Fiction','MCU','Musik','Krimi','Dokumentarfilm','Historie','Familie'];
const I18N={
  de:{lib:'Bibliothek',fav:'Favoriten',stats:'Statistiken',rand:'Zufällig',allT:'Alle Typen',film:'Film',series:'Serie',concert:'Konzert',allG:'Alle Genres',allD:'Alle Jahrzehnte',onlyF:'Nur Favoriten',res:n=>`${n.toLocaleString('de')} Einträge`,more:'Mehr laden',dir:'Regie',yr:'Jahr',ctr:'Land',prod:'Produktion',cast:'Besetzung',myR:'Meine Bewertung',notes:'Notizen',notesPh:'Deine Gedanken …',save:'Speichern',clr:'Löschen',review:'Review',noFav:'Noch keine Favoriten.',noFavS:'Klicke das Herz-Symbol auf einer Karte.',favN:n=>`${n} markierte Einträge`,trN:n=>`${n} bewertete Einträge`,sAdd:'Zuletzt hinzugefügt',sTA:'Titel A–Z',sTZ:'Titel Z–A',sYD:'Jahr ↓',sYA:'Jahr ↑',sRD:'Bewertung ↓',sRA:'Bewertung ↑',stT:'Einträge gesamt',stFi:'Filme',stSe:'Serien',stCo:'Konzerte',stRa:'Bewertet',stFv:'Favoriten',stG:'Top Genres',stDi:'Top Regisseure',stDe:'Nach Jahrzehnt',stRD:'Bewertungsverteilung',lang:'🌐 Switch to English'},
  en:{lib:'Library',fav:'Favorites',stats:'Statistics',rand:'Random',allT:'All types',film:'Film',series:'Series',concert:'Concert',allG:'All genres',allD:'All decades',onlyF:'Favorites only',res:n=>`${n.toLocaleString('en')} entries`,more:'Load more',dir:'Director',yr:'Year',ctr:'Country',prod:'Production',cast:'Cast',myR:'My Rating',notes:'Notes',notesPh:'Your thoughts …',save:'Save',clr:'Clear',review:'Review',noFav:'No favorites yet.',noFavS:'Click the heart icon on any card.',favN:n=>`${n} marked entries`,trN:n=>`${n} rated entries`,sAdd:'Recently added',sTA:'Title A–Z',sTZ:'Title Z–A',sYD:'Year ↓',sYA:'Year ↑',sRD:'Rating ↓',sRA:'Rating ↑',stT:'Total entries',stFi:'Films',stSe:'Series',stCo:'Concerts',stRa:'Rated',stFv:'Favorites',stG:'Top Genres',stDi:'Top Directors',stDe:'By decade',stRD:'Rating distribution',lang:'🌐 Auf Deutsch'}
};
const t=(k,a)=>{const d=I18N[LANG][k];return typeof d==='function'?d(a):(d||k)};
const x=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const effR=m=>RAT[m.id]!==undefined?RAT[m.id]:(m.rating||0);

async function init(){
  load();updateUI();
  document.getElementById('grid').innerHTML='<div class="loading">Lade Bibliothek …</div>';
  try{const r=await fetch('data.json');ALL=await r.json();}
  catch(e){document.getElementById('grid').innerHTML='<div class="loading">Fehler: data.json nicht gefunden</div>';return;}
  buildFilters();applyFilters();keyboard();
}

function load(){
  try{FAV=JSON.parse(localStorage.getItem('cs_f')||'{}');RAT=JSON.parse(localStorage.getItem('cs_r')||'{}');NOTES=JSON.parse(localStorage.getItem('cs_n')||'{}');LANG=localStorage.getItem('cs_l')||'de';}catch(e){}
}
function save(){
  try{localStorage.setItem('cs_f',JSON.stringify(FAV));localStorage.setItem('cs_r',JSON.stringify(RAT));localStorage.setItem('cs_n',JSON.stringify(NOTES));}catch(e){}
}

function exportData(){
  const b=new Blob([JSON.stringify({favorites:FAV,ratings:RAT,notes:NOTES,exported:new Date().toISOString()},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cineshelf-daten.json';a.click();
  toast('✓ Daten exportiert');
}
function importData(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.favorites)FAV={...FAV,...d.favorites};if(d.ratings)RAT={...RAT,...d.ratings};if(d.notes)NOTES={...NOTES,...d.notes};save();applyFilters();toast('✓ Daten importiert');}catch(){toast('Fehler beim Importieren');}};
  r.readAsText(f);e.target.value='';
}

function toggleLang(){LANG=LANG==='de'?'en':'de';localStorage.setItem('cs_l',LANG);updateUI();applyFilters();}
function updateUI(){
  document.getElementById('langBtn').textContent=t('lang');
  document.querySelectorAll('[data-page]').forEach(el=>{const p=el.dataset.page;el.textContent=p==='home'?t('lib'):p==='toprated'?'Top Rated':p==='favorites'?t('fav'):t('stats');});
  const hide=document.querySelector('.hide-mobile');if(hide)hide.textContent=t('rand');
  const si=document.getElementById('searchInput');if(si)si.placeholder=LANG==='de'?'Titel, Regisseur, Schauspieler …':'Title, director, actor …';
  const ft=document.getElementById('fType');if(ft){ft.options[0].text=t('allT');ft.options[1].text=t('film');ft.options[2].text=t('series');ft.options[3].text=t('concert');}
  const fg=document.getElementById('fGenre');if(fg&&fg.options[0])fg.options[0].text=t('allG');
  const fd=document.getElementById('fDecade');if(fd&&fd.options[0])fd.options[0].text=t('allD');
  const cl=document.querySelector('.chk-label span');if(cl)cl.textContent=t('onlyF');
  const so=document.getElementById('sortBy');
  if(so){['sAdd','sTA','sTZ','sYD','sYA','sRD','sRA'].forEach((k,i)=>{if(so.options[i])so.options[i].text=t(k);});}
}

function buildFilters(){
  const gp=new Set(ALL.flatMap(m=>m.genres||[]));
  const gEl=document.getElementById('fGenre');
  GENRES.filter(g=>gp.has(g)).forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;gEl.appendChild(o);});
  const dec=[...new Set(ALL.filter(m=>m.year>1900).map(m=>Math.floor(m.year/10)*10))].sort((a,b)=>b-a);
  const dEl=document.getElementById('fDecade');
  dec.forEach(d=>{const o=document.createElement('option');o.value=d;o.textContent=`${d}er`;dEl.appendChild(o);});
}

function applyFilters(){
  const q=document.getElementById('searchInput').value.toLowerCase().trim();
  const tp=document.getElementById('fType').value;
  const gn=document.getElementById('fGenre').value;
  const dc=document.getElementById('fDecade').value;
  const fv=document.getElementById('fFav').checked;
  const so=document.getElementById('sortBy').value;
  document.getElementById('searchClear').style.display=q?'block':'none';
  FILTERED=ALL.filter(m=>{
    if(tp&&m.type!==tp)return false;
    if(gn&&!(m.genres||[]).includes(gn))return false;
    if(dc&&m.year&&Math.floor(m.year/10)*10!==+dc)return false;
    if(fv&&!FAV[m.id])return false;
    if(q){const h=[m.title,m.director,...(m.actors||[]).map(a=>a.name),...(m.genres||[])].join(' ').toLowerCase();if(!h.includes(q))return false;}
    return true;
  });
  FILTERED.sort((a,b)=>{
    switch(so){
      case'title-asc':return(a.title||'').localeCompare(b.title||'','de');
      case'title-desc':return(b.title||'').localeCompare(a.title||'','de');
      case'year-desc':return(b.year||0)-(a.year||0);
      case'year-asc':return(a.year||0)-(b.year||0);
      case'rating-desc':return effR(b)-effR(a)||b.added-a.added;
      case'rating-asc':return effR(a)-effR(b)||a.added-b.added;
      default:return b.added-a.added;
    }
  });
  document.getElementById('count').textContent=t('res',FILTERED.length);
  SHOWN=0;document.getElementById('grid').innerHTML='';loadMore();
}
function clearSearch(){document.getElementById('searchInput').value='';applyFilters();}

function loadMore(){
  const frag=document.createDocumentFragment();
  const end=Math.min(SHOWN+PG,FILTERED.length);
  for(let i=SHOWN;i<end;i++)frag.appendChild(mkCard(FILTERED[i]));
  document.getElementById('grid').appendChild(frag);SHOWN=end;
  document.getElementById('loadMoreWrap').style.display=SHOWN<FILTERED.length?'block':'none';
}

function mkCard(m){
  const el=document.createElement('div');el.className='card';el.dataset.id=m.id;
  const fav=!!FAV[m.id],r=effR(m)||0,icon=m.type==='series'?'📺':'🎬';
  el.innerHTML=`<div class="card-img">${m.poster_url?`<img src="${x(m.poster_url)}" alt="${x(m.title)}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=card-fb><div class=card-fb-icon>${icon}</div><div class=card-fb-title>${x(m.title)}</div></div>'">`:`<div class="card-fb"><div class="card-fb-icon">${icon}</div><div class="card-fb-title">${x(m.title)}</div></div>`}<span class="badge b-${m.type}">${t(m.type)}</span><button class="card-fav ${fav?'on':''}" onclick="toggleFav(event,${m.id})">${fav?'♥':'♡'}</button></div><div class="card-info"><div class="card-title" title="${x(m.title)}">${x(m.title)}</div><div class="card-meta"><span class="card-year">${m.year||'–'}</span>${r?`<span class="card-rating">${r}</span>`:''}</div></div>`;
  el.addEventListener('click',e=>{if(!e.target.closest('.card-fav'))openDetail(m.id);});
  return el;
}

function toggleFav(e,id){
  e.stopPropagation();FAV[id]?delete FAV[id]:(FAV[id]=true);save();
  const c=document.querySelector(`.card[data-id="${id}"] .card-fav`);
  if(c){c.classList.toggle('on',!!FAV[id]);c.textContent=FAV[id]?'♥':'♡';}
  const mb=document.getElementById(`mfav-${id}`);
  if(mb){mb.classList.toggle('on',!!FAV[id]);mb.textContent=FAV[id]?'♥':'♡';}
  toast(FAV[id]?'♥ Favorit hinzugefügt':'Aus Favoriten entfernt');
}

function openDetail(id){
  const m=ALL.find(v=>v.id===id);if(!m)return;
  const fav=!!FAV[id],r=effR(m),note=NOTES[id]||'';
  const actors=(m.actors||[]).slice(0,6);
  const pips=[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10].map(v=>`<button class="pip${r===v?' on':''}" onclick="setR(${id},${v})">${v}</button>`).join('');
  const icon=m.type==='series'?'📺':'🎬';
  document.getElementById('modal-body').innerHTML=`<div class="modal-layout"><div class="modal-poster">${m.poster_url?`<img src="${x(m.poster_url)}" alt="${x(m.title)}">`:`<div class="modal-fb-poster">${icon}</div>`}</div><div class="modal-body"><div class="modal-type">${t(m.type)}</div><h2 class="modal-title">${x(m.title)}</h2><div class="meta-row">${m.year?`<div class="meta-item"><span class="meta-lbl">${t('yr')}</span><span class="meta-val">${m.year}</span></div>`:''} ${m.director?`<div class="meta-item"><span class="meta-lbl">${t('dir')}</span><span class="meta-val">${x(m.director)}</span></div>`:''} ${m.country?`<div class="meta-item"><span class="meta-lbl">${t('ctr')}</span><span class="meta-val">${x(m.country)}</span></div>`:''} ${m.age_rating?`<div class="meta-item"><span class="meta-lbl">FSK</span><span class="meta-val">${x(m.age_rating)}</span></div>`:''} ${m.production?`<div class="meta-item"><span class="meta-lbl">${t('prod')}</span><span class="meta-val">${x(m.production.split('\n')[0])}</span></div>`:''}<div class="meta-item" style="margin-left:auto"><button class="fav-btn ${fav?'on':''}" id="mfav-${id}" onclick="toggleFav(event,${id})">${fav?'♥':'♡'}</button></div></div>${(m.genres||[]).length?`<div class="chips">${(m.genres||[]).map(g=>`<span class="chip">${x(g)}</span>`).join('')}</div>`:''} ${m.description?`<p class="modal-desc">${x(m.description)}</p>`:''} ${m.note?`<div class="modal-note"><div class="sec-lbl">${t('review')}</div>${x(m.note)}</div>`:''} ${note?`<div class="modal-note"><div class="sec-lbl">${t('notes')}</div>${x(note)}</div>`:''} ${actors.length?`<div class="sec-lbl">${t('cast')}</div><div class="cast-list">${actors.map(a=>`<div class="cast-item"><span class="cast-name">${x(a.name)}</span>${a.role?`<span class="cast-role">– ${x(a.role)}</span>`:''}</div>`).join('')}</div>`:''}<div class="rating-sec"><div class="sec-lbl">${t('myR')}</div><div class="rating-pips">${pips}</div>${r?`<div class="rating-val">${r} <span>/ 10</span></div><button class="clear-btn" onclick="clrR(${id})">${t('clr')}</button>`:''}</div><div class="notes-sec"><div class="sec-lbl">${t('notes')}</div><textarea class="notes-ta" id="nt-${id}" placeholder="${t('notesPh')}">${x(note)}</textarea><button class="notes-save" onclick="saveNote(${id})">${t('save')}</button></div><div class="links">${m.imdb_id?`<a href="https://www.imdb.com/title/${m.imdb_id}" target="_blank" class="ext-link">↗ IMDb</a>`:''} ${m.tmdb_id?`<a href="https://www.themoviedb.org/movie/${m.tmdb_id}" target="_blank" class="ext-link">↗ TMDb</a>`:''}</div></div></div>`;
  document.getElementById('modal').classList.add('open');document.body.style.overflow='hidden';
}
function closeModal(e){if(e.target===document.getElementById('modal'))closeModalBtn();}
function closeModalBtn(){document.getElementById('modal').classList.remove('open');document.body.style.overflow='';}

function setR(id,v){RAT[id]=v;save();openDetail(id);refreshCard(id);toast(`★ ${v}/10`);}
function clrR(id){delete RAT[id];save();openDetail(id);refreshCard(id);toast('Bewertung entfernt');}
function saveNote(id){const v=document.getElementById(`nt-${id}`).value.trim();v?(NOTES[id]=v):delete NOTES[id];save();toast('✓ '+t('save'));}
function refreshCard(id){
  const c=document.querySelector(`.card[data-id="${id}"]`);if(!c)return;
  const m=ALL.find(v=>v.id===id);const r=effR(m)||0;
  const meta=c.querySelector('.card-meta'),re=c.querySelector('.card-rating');
  if(r){if(re)re.textContent=r;else meta.insertAdjacentHTML('beforeend',`<span class="card-rating">${r}</span>`);}
  else if(re)re.remove();
}

function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(l=>l.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelector(`[data-page="${name}"]`).classList.add('active');
  window.scrollTo(0,0);closeMenu();
  if(name==='toprated')renderTR();
  if(name==='favorites')renderFav();
  if(name==='stats')renderStats();
}

function renderTR(){
  const rated=ALL.filter(m=>effR(m)>0).sort((a,b)=>effR(b)-effR(a));
  document.getElementById('trSub').textContent=t('trN',rated.length);
  const g=document.getElementById('tr-grid');g.innerHTML='';
  if(!rated.length){g.innerHTML='<div class="empty"><div class="empty-icon">★</div><p>Noch keine Einträge bewertet.</p></div>';return;}
  const f=document.createDocumentFragment();rated.forEach(m=>f.appendChild(mkCard(m)));g.appendChild(f);
}
function renderFav(){
  const favs=ALL.filter(m=>FAV[m.id]);
  document.getElementById('favSub').textContent=t('favN',favs.length);
  const g=document.getElementById('fav-grid'),e=document.getElementById('fav-empty');
  if(!favs.length){g.style.display='none';e.style.display='block';e.innerHTML=`<div class="empty-icon">♡</div><p>${t('noFav')}</p><p class="empty-sub">${t('noFavS')}</p>`;return;}
  g.style.display='';e.style.display='none';g.innerHTML='';
  const f=document.createDocumentFragment();favs.forEach(m=>f.appendChild(mkCard(m)));g.appendChild(f);
}
function renderStats(){
  const fi=ALL.filter(m=>m.type==='film').length,se=ALL.filter(m=>m.type==='series').length,co=ALL.filter(m=>m.type==='concert').length;
  const ra=ALL.filter(m=>effR(m)>0).length,fv=Object.keys(FAV).length;
  const gc={},dc={},dec={},rd={};
  ALL.forEach(m=>{
    (m.genres||[]).forEach(g=>{gc[g]=(gc[g]||0)+1;});
    if(m.director)dc[m.director]=(dc[m.director]||0)+1;
    if(m.year>1900){const d=Math.floor(m.year/10)*10;dec[d]=(dec[d]||0)+1;}
    const r=effR(m);if(r>0)rd[r]=(rd[r]||0)+1;
  });
  const topG=Object.entries(gc).filter(([g])=>GENRES.includes(g)).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topD=Object.entries(dc).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topDec=Object.entries(dec).sort((a,b)=>+a[0]-+b[0]);
  const topR=Object.entries(rd).sort((a,b)=>+b[0]-+a[0]);
  document.getElementById('stats').innerHTML=big(ALL.length,t('stT'),'⬡')+big(fi,t('stFi'),'🎬')+big(se,t('stSe'),'📺')+big(co,t('stCo'),'🎵')+big(ra,t('stRa'),'★')+big(fv,t('stFv'),'♥')+lst(t('stG'),topG)+lst(t('stDi'),topD)+lst(t('stDe'),topDec.map(([d,c])=>[`${d}er`,c]))+(topR.length?lst(t('stRD'),topR.map(([r,c])=>[`${r}/10`,c])):'');
}
function big(n,l,i){return `<div class="stat-card"><div class="stat-title">${l}</div><div class="stat-big">${n.toLocaleString('de')}</div><div class="stat-sub">${i}</div></div>`;}
function lst(title,items){
  if(!items.length)return'';const mx=items[0][1];
  return`<div class="stat-card"><div class="stat-title">${title}</div><div class="stat-list">${items.map(([l,c])=>`<div class="stat-row"><span class="stat-lbl" title="${x(l)}">${x(l)}</span><div class="stat-bar-wrap"><div class="stat-bar" style="width:${Math.round(c/mx*100)}%"></div></div><span class="stat-cnt">${c}</span></div>`).join('')}</div></div>`;
}

function openRandom(){const pool=FILTERED.length?FILTERED:ALL;openDetail(pool[Math.floor(Math.random()*pool.length)].id);}
function toggleMenu(){document.getElementById('dropdown').classList.toggle('open');}
function closeMenu(){document.getElementById('dropdown').classList.remove('open');}
document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap'))closeMenu();});
function keyboard(){document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModalBtn();if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();document.getElementById('searchInput').focus();}});}
let tt;
function toast(msg){const e=document.getElementById('toast');e.textContent=msg;e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),2200);}
document.addEventListener('DOMContentLoaded',init);
