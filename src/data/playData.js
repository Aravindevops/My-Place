/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                 PLAY PAGE EXTERNAL DATA LOADER                  ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║  You can easily add/edit movies, series, anime, and songs:      ║
 * ║                                                                 ║
 * ║  METHOD 1 (Recommended): Edit `public/data/playData.json`       ║
 * ║  - Open `public/data/playData.json` or `src/data/playData.json` ║
 * ║  - Simply add or update movie & song objects in plain JSON.     ║
 * ║  - Put poster images in `public/posters/`                       ║
 * ║  - Put song audio files in `public/music/`                      ║
 * ║                                                                 ║
 * ║  METHOD 2 (Firebase Firestore Cloud DB):                        ║
 * ║  - Set `VITE_FIREBASE_PROJECT_ID` in `.env`                     ║
 * ║  - Edit directly from the Firebase console from any device!     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import rawJson from './playData.json'

// ── UTILITY HELPERS ──────────────────────────────────────────────────────────

export function parseDuration(val) {
  if (typeof val === 'number') return val
  if (typeof val === 'string' && val.includes(':')) {
    const [min, sec] = val.split(':').map(Number)
    return (min || 0) * 60 + (sec || 0)
  }
  return Number(val) || 180
}

export function resolvePoster(src) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:')) {
    return src
  }
  return `/posters/${src}`
}

export function resolveAudio(src) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:')) {
    return src
  }
  return `/music/${src}`
}

export function createWatchItem({
  title,
  category = 'movies',
  year = new Date().getFullYear(),
  rating = 9.0,
  creator = '',
  poster = '',
  gradient,
  note = ''
}) {
  const defaultGradients = {
    movies: 'linear-gradient(135deg, #101c38 0%, #2535d0 60%, #e07a5f 100%)',
    series: 'linear-gradient(135deg, #0f172a 0%, #0284c7 60%, #e2e8f0 100%)',
    anime: 'linear-gradient(135deg, #2e0854 0%, #a21caf 40%, #facc15 100%)'
  }

  return {
    k: (category || 'movies').toLowerCase(),
    t: title,
    y: Number(year) || 2026,
    r: Number(rating) || 9.0,
    c: creator,
    img: resolvePoster(poster),
    g: gradient || defaultGradients[(category || 'movies').toLowerCase()] || defaultGradients.movies,
    note
  }
}

export function createTrack({
  title,
  artist = 'Unknown Artist',
  duration = 200,
  audio = ''
}) {
  return {
    t: title,
    a: artist,
    l: parseDuration(duration),
    src: resolveAudio(audio)
  }
}

// ── DEFAULT WATCH ITEMS FROM JSON ────────────────────────────────────────────
export const DEFAULT_WATCH_ITEMS = (rawJson.watch || []).map(createWatchItem)

// ── DEFAULT MUSIC PLAYLISTS FROM JSON ────────────────────────────────────────
export const DEFAULT_MUSIC_PLAYLISTS = (() => {
  const playlists = {}
  for (const [key, list] of Object.entries(rawJson.music || {})) {
    playlists[key] = (list || []).map(createTrack)
  }
  return playlists
})()

// ── GALLERY PHOTOS ───────────────────────────────────────────────────────────
export const GALLERY_PHOTOS = [
  { w: 4, h: 5, t: 'Kerala', src: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80&auto=format&fit=max', cap: 'Misty backwaters at sunrise, Alappuzha, 2024' },
  { w: 1, h: 1, t: 'Street', src: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80&auto=format&fit=max', cap: 'Golden hour reflection on asphalt, Kochi, 2024' },
  { w: 3, h: 2, t: 'Coast', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=max', cap: 'Driftwood and salt foam at dusk, Varkala, 2025' },
  { w: 4, h: 5, t: 'Portrait', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80&auto=format&fit=max', cap: 'Shadow play and natural window light, 35mm, 2024' },
  { w: 3, h: 4, t: 'Hills', src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80&auto=format&fit=max', cap: 'Tea plantations engulfed in rolling fog, Munnar, 2024' },
  { w: 1, h: 1, t: 'Night', src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80&auto=format&fit=max', cap: 'Neon wet pavement and quiet alleyways, 2025' },
  { w: 3, h: 2, t: 'Rain', src: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1200&q=80&auto=format&fit=max', cap: 'Monsoon raindrops on emerald banana leaves, 2024' },
  { w: 4, h: 5, t: 'Market', src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80&auto=format&fit=max', cap: 'Spices, burlap sacks and morning bustle, Mattancherry, 2025' },
  { w: 1, h: 1, t: 'Light', src: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1200&q=80&auto=format&fit=max', cap: 'Direct beam through cathedral louvres, 2025' }
]

// ── BOOKS ────────────────────────────────────────────────────────────────────
export const BOOKS = [
  { t: 'Atomic Habits', author: 'James Clear', r: 9.4, c: '#d9593b', f: '#fff', note: 'A masterclass on compound improvements. The cue-craving-response-reward loop transformed how I approach daily software engineering.' },
  { t: 'Everyday Things', author: 'Don Norman', r: 9.6, c: '#161a33', f: '#fff', note: 'Affordances, signifiers, and feedback. Made me realize that if a user struggles with an interface, it is the design at fault, never the user.' },
  { t: 'Zero to One', author: 'Peter Thiel', r: 9.1, c: '#2535d0', f: '#fff', note: 'Vertical progress from 0 to 1 versus horizontal progress from 1 to n. Contrarian thinking that fundamentally reshaped how I think about creating technology.' },
  { t: 'Steal Like an Artist', author: 'Austin Kleon', r: 9.3, c: '#2e5b44', f: '#fff', note: 'Nothing is completely original. Collect good ideas, remix, transform, and build your own creative lineage.' },
  { t: 'Deep Work', author: 'Cal Newport', r: 9.5, c: '#6d3b84', f: '#fff', note: 'Rules for focused success in a distracted world. The superpower of eliminating noise and producing high cognitive output.' },
  { t: 'Thinking, Fast & Slow', author: 'Daniel Kahneman', r: 9.7, c: '#e9e6df', f: '#161a33', note: 'System 1 intuition versus System 2 deliberation. An eye-opening journey into heuristics, cognitive biases, and human judgment.' },
  { t: 'Refactoring UI', author: 'Adam Wathan & Steve Schoger', r: 9.8, c: '#2535d0', f: '#fff', note: 'The ultimate tactical guide to designing modern web applications from an engineer\'s perspective. Hierarchy, spacing, and micro-details.' },
  { t: 'Show Your Work!', author: 'Austin Kleon', r: 9.2, c: '#d9593b', f: '#fff', note: 'Generosity beats genius. Share your process, prototypes, and works-in-progress, not just the polished end product.' },
  { t: 'Klara and the Sun', author: 'Kazuo Ishiguro', r: 9.0, c: '#161a33', f: '#fff', note: 'A poignant and haunting examination of artificial intelligence, empathy, loneliness, and what it truly means to love.' },
  { t: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', r: 9.5, c: '#2e5b44', f: '#fff', note: 'Timeless craftsmanship: DRY, orthogonality, stone soup, and taking responsibility for your code.' },
  { t: 'Creative Selection', author: 'Ken Kocienda', r: 9.4, c: '#6d3b84', f: '#fff', note: 'Inside Apple’s design process during the golden age of Steve Jobs. Demos, taste, iteration, and decisive product taste.' },
  { t: 'Sapiens', author: 'Yuval Noah Harari', r: 9.6, c: '#e9e6df', f: '#161a33', note: 'A brief history of humankind through shared fictions, money, empire, and our unstoppable technological evolution.' }
]
