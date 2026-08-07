# CineShelf – Meine Medienbibliothek

Persönliche Medienbibliothek mit Dark-Theme-Design, optimiert für GitHub Pages / Cloudflare Pages.

## Deployment

### GitHub Pages
1. Repository auf GitHub erstellen
2. Alle Dateien hochladen
3. Settings → Pages → Branch: main / root → Save
4. Live unter: `https://USERNAME.github.io/REPO/`

### Cloudflare Pages
1. Cloudflare Dashboard → Pages → Create project
2. "Upload assets" → Alle Dateien zippen und hochladen
3. Fertig – kostenlos & mit globalem CDN

## Struktur
```
index.html   – Haupt-HTML
style.css    – Design-System
app.js       – Anwendungslogik
data.json    – Filmdatenbank (automatisch generiert)
```

## Features
- 🎬 Poster-Grid mit Lazy Loading
- 🔍 Suche nach Titel, Regisseur, Schauspieler
- 🏷️ Filter: Genre, Jahrzehnt, Land, Typ, Favoriten
- ★ Eigene Bewertungen (1–10, gespeichert lokal)
- ♥ Favoritenliste
- 📊 Statistiken
- 🎲 Zufallsfilm
- 🌐 Deutsch/Englisch
