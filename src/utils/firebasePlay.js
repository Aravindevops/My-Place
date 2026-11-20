/**
 * Firebase Firestore & External JSON Data Loader for Play Page
 * 
 * 1. Default (Zero setup):
 *    Directly reads from `public/data/playData.json` or bundled `src/data/playData.json`.
 *    You can edit `public/data/playData.json` or `src/data/playData.json` anytime in your code editor.
 * 
 * 2. Optional Cloud DB (Firebase Firestore):
 *    If you want to edit your movies and playlist live from your phone or browser
 *    without touching any code files, simply add your Firebase project ID to a `.env` file:
 *    
 *    VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
 *    
 *    The loader will automatically read from Firestore collections:
 *    - Collection `watch`: documents with fields { title, category, year, rating, creator, poster, note }
 *    - Collection `music`: documents with fields { title, artist, duration, audio, playlist }
 */

import rawJson from '../data/playData.json'
import { createWatchItem, createTrack } from '../data/playData.js'

// Direct Firebase Project ID with fallback
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'my-portfolio-467e3'

export async function fetchExternalPlayData() {
  const projectId = FIREBASE_PROJECT_ID

  // 1. Try Firebase Firestore REST API if configured
  if (projectId) {
    try {
      const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
      
      const [watchRes, musicRes, photosRes, booksRes] = await Promise.all([
        fetch(`${firestoreBase}/watch?pageSize=100`, { cache: 'no-store' }),
        fetch(`${firestoreBase}/music?pageSize=100`, { cache: 'no-store' }),
        fetch(`${firestoreBase}/photos?pageSize=100`, { cache: 'no-store' }).catch(() => null),
        fetch(`${firestoreBase}/books?pageSize=100`, { cache: 'no-store' }).catch(() => null)
      ])

      if (watchRes.ok && musicRes.ok) {
        const watchJson = await watchRes.json()
        const musicJson = await musicRes.json()

        const parseFields = (doc) => {
          const res = {}
          for (const key in doc.fields || {}) {
            const val = doc.fields[key]
            res[key] = val.stringValue ?? val.integerValue ?? val.doubleValue ?? val.booleanValue ?? ''
          }
          return res
        }

        const watchItems = (watchJson.documents || []).map(d => {
          const f = parseFields(d)
          return createWatchItem({
            title: f.title || f.t,
            category: f.category || f.k || 'movies',
            year: Number(f.year || f.y) || 2026,
            rating: Number(f.rating || f.r) || 9.0,
            creator: f.creator || f.c || '',
            poster: f.poster || f.img || '',
            note: f.note || ''
          })
        })

        // Sort items so order matches catalog and stays consistent
        const defaultTitles = (rawJson.watch || []).map(w => w.title)
        watchItems.sort((a, b) => {
          const ia = defaultTitles.indexOf(a.t)
          const ib = defaultTitles.indexOf(b.t)
          if (ia !== -1 && ib !== -1) return ia - ib
          if (ia !== -1) return -1
          if (ib !== -1) return 1
          return 0
        })

        const musicPlaylists = {}
        for (const doc of musicJson.documents || []) {
          const f = parseFields(doc)
          const pl = f.playlist || 'Favourites'
          if (!musicPlaylists[pl]) musicPlaylists[pl] = []
          musicPlaylists[pl].push(createTrack({
            title: f.title || f.t,
            artist: f.artist || f.a || 'Unknown',
            duration: f.duration || f.l || 210,
            audio: f.audio || f.src || ''
          }))
        }

        let galleryPhotos = null
        if (photosRes && photosRes.ok) {
          const photosJson = await photosRes.json()
          if (photosJson.documents?.length) {
            galleryPhotos = photosJson.documents.map(d => {
              const f = parseFields(d)
              return {
                w: Number(f.w) || 4,
                h: Number(f.h) || 5,
                t: f.title || f.t || 'Photo',
                src: f.src || '',
                cap: f.cap || '',
                order: f.order !== '' ? Number(f.order) : 999
              }
            }).sort((a, b) => a.order - b.order)
          }
        }

        let books = null
        if (booksRes && booksRes.ok) {
          const booksJson = await booksRes.json()
          if (booksJson.documents?.length) {
            books = booksJson.documents.map(d => {
              const f = parseFields(d)
              return {
                t: f.title || f.t || 'Book Title',
                author: f.author || 'Unknown',
                r: Number(f.rating || f.r) || 9.0,
                c: f.color || f.c || '#2535d0',
                f: f.textColor || f.f || '#ffffff',
                note: f.note || '',
                order: f.order !== '' ? Number(f.order) : 999
              }
            }).sort((a, b) => a.order - b.order)
          }
        }

        if (watchItems.length > 0) {
          return { watchItems, musicPlaylists, galleryPhotos, books }
        }
      }
    } catch (err) {
      console.warn('Firebase fetch fallback:', err)
    }
  }

  // 2. Fetch external public/data/playData.json (allows editing file without rebuild)
  try {
    const res = await fetch(`/data/playData.json?t=${Date.now()}`)
    if (res.ok) {
      const data = await res.json()
      if (data.watch && Array.isArray(data.watch)) {
        const watchItems = data.watch.map(createWatchItem)
        const musicPlaylists = {}
        for (const [key, list] of Object.entries(data.music || {})) {
          musicPlaylists[key] = (list || []).map(createTrack)
        }
        let galleryPhotos = null
        if (data.photos && Array.isArray(data.photos)) {
          galleryPhotos = data.photos.map(p => ({
            w: Number(p.w) || 4,
            h: Number(p.h) || 5,
            t: p.title || p.t || 'Photo',
            src: p.src || '',
            cap: p.cap || ''
          }))
        }
        let books = null
        if (data.books && Array.isArray(data.books)) {
          books = data.books.map(b => ({
            t: b.title || b.t || 'Book Title',
            author: b.author || 'Unknown',
            r: Number(b.rating || b.r) || 9.0,
            c: b.color || b.c || '#2535d0',
            f: b.textColor || b.f || '#ffffff',
            note: b.note || ''
          }))
        }
        return { watchItems, musicPlaylists, galleryPhotos, books }
      }
    }
  } catch {
    // Fall back to bundled data
  }

  // 3. Bundled fallback
  return null
}

/**
 * Save new watch item directly to Firestore
 */
export async function addFirestoreWatchItem(item) {
  const projectId = FIREBASE_PROJECT_ID
  if (!projectId) return false
  try {
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const body = {
      fields: {
        title: { stringValue: String(item.title || '') },
        category: { stringValue: String(item.category || 'movies') },
        year: { integerValue: String(item.year || 2026) },
        rating: { doubleValue: Number(item.rating || 9.0) },
        creator: { stringValue: String(item.creator || '') },
        poster: { stringValue: String(item.poster || '') },
        note: { stringValue: String(item.note || '') }
      }
    }
    const res = await fetch(`${firestoreBase}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.ok
  } catch (err) {
    console.error('Failed to save to Firestore:', err)
    return false
  }
}

function parseDuration(val) {
  if (typeof val === 'number') return Math.round(val)
  if (typeof val === 'string') {
    if (val.includes(':')) {
      const parts = val.split(':')
      const m = parseInt(parts[0], 10) || 0
      const s = parseInt(parts[1], 10) || 0
      return m * 60 + s
    }
    const num = parseInt(val, 10)
    if (!isNaN(num)) return num
  }
  return 210
}

/**
 * Save new music track directly to Firestore
 */
export async function addFirestoreMusicTrack(track, playlist = 'Favourites') {
  const projectId = FIREBASE_PROJECT_ID
  if (!projectId) return false
  try {
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const durSec = parseDuration(track.duration)
    const body = {
      fields: {
        title: { stringValue: String(track.title || '') },
        artist: { stringValue: String(track.artist || 'Unknown') },
        duration: { integerValue: String(durSec) },
        audio: { stringValue: String(track.audio || '') },
        playlist: { stringValue: String(playlist || 'Favourites') }
      }
    }
    const res = await fetch(`${firestoreBase}/music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.ok
  } catch (err) {
    console.error('Failed to save to Firestore:', err)
    return false
  }
}

/**
 * Save new gallery photo directly to Firestore
 */
export async function addFirestorePhoto(photo) {
  const projectId = FIREBASE_PROJECT_ID
  if (!projectId) return false
  try {
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const body = {
      fields: {
        title: { stringValue: String(photo.title || photo.t || '') },
        src: { stringValue: String(photo.src || '') },
        cap: { stringValue: String(photo.cap || '') },
        w: { integerValue: String(photo.w || 4) },
        h: { integerValue: String(photo.h || 5) }
      }
    }
    const res = await fetch(`${firestoreBase}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.ok
  } catch (err) {
    console.error('Failed to save photo to Firestore:', err)
    return false
  }
}

/**
 * Save new library book directly to Firestore
 */
export async function addFirestoreBook(book) {
  const projectId = FIREBASE_PROJECT_ID
  if (!projectId) return false
  try {
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const body = {
      fields: {
        title: { stringValue: String(book.title || book.t || '') },
        author: { stringValue: String(book.author || 'Unknown') },
        rating: { doubleValue: Number(book.rating || book.r || 9.0) },
        color: { stringValue: String(book.color || book.c || '#2535d0') },
        textColor: { stringValue: String(book.textColor || book.f || '#ffffff') },
        note: { stringValue: String(book.note || '') }
      }
    }
    const res = await fetch(`${firestoreBase}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.ok
  } catch (err) {
    console.error('Failed to save book to Firestore:', err)
    return false
  }
}



