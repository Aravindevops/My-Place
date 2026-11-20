/**
 * Private Firebase Admin Seeding Script (Zero External Dependencies)
 * 
 * Uses built-in Node.js crypto to securely sign a JWT with your serviceAccountKey.json
 * and obtain a Google Cloud OAuth2 Access Token.
 * 
 * Uploads all items directly into Firestore with full Owner/Admin credentials,
 * completely bypassing security rules so `allow write: if false;` can stay permanently active!
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform'
  }

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedClaims = base64url(JSON.stringify(claims))
  const signatureInput = `${encodedHeader}.${encodedClaims}`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signatureInput)
  const signature = signer.sign(serviceAccount.private_key)
  const encodedSignature = base64url(signature)

  const jwt = `${signatureInput}.${encodedSignature}`

  const tokenRes = await fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Failed to obtain Google access token: ${tokenRes.status} ${errText}`)
  }

  const tokenData = await tokenRes.json()
  return tokenData.access_token
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

async function run() {
  const rootDir = path.resolve(__dirname, '..')
  const files = fs.readdirSync(rootDir)
  const keyFile = files.find(f => f === 'serviceAccountKey.json' || (f.includes('firebase-adminsdk') && f.endsWith('.json')))

  if (!keyFile) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: No service account key found in project root.')
    process.exit(1)
  }

  const keyPath = path.resolve(rootDir, keyFile)
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))
  const projectId = serviceAccount.project_id || 'my-portfolio-467e3'

  console.log('\x1b[36m%s\x1b[0m', `Authenticating with Google Cloud for project [${projectId}]...`)
  const accessToken = await getAccessToken(serviceAccount)
  console.log('\x1b[32m%s\x1b[0m', '✓ Authenticated successfully with Google Cloud Admin credentials.')

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }

  // Read data
  const dataPath = path.resolve(__dirname, '../public/data/playData.json')
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const watchList = rawData.watch || []
  const musicDict = rawData.music || {}
  const photoList = rawData.photos || []
  const bookList = rawData.books || []

  console.log(`\nUploading ${watchList.length} watch cards (Admin mode)...`)
  let watchCount = 0
  for (const item of watchList) {
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

    const res = await fetch(`${baseUrl}/watch`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`  ✗ Error uploading "${item.title}":`, err)
    } else {
      watchCount++
      console.log(`  ✓ [Watch] "${item.title}" (${item.category})`)
    }
  }

  // Upload Music Tracks
  let trackCount = 0
  for (const [playlist, tracks] of Object.entries(musicDict)) {
    console.log(`\nUploading playlist "${playlist}" (${tracks.length} tracks)...`)
    for (const track of tracks) {
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

      const res = await fetch(`${baseUrl}/music`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`  ✗ Error uploading "${track.title}":`, err)
      } else {
        trackCount++
        console.log(`  ✓ [Music] "${track.title}" - ${track.artist}`)
      }
    }
  }

  // Upload Photos (Gallery)
  console.log(`\nUploading ${photoList.length} gallery photos (Admin mode)...`)
  let photoCount = 0
  for (let idx = 0; idx < photoList.length; idx++) {
    const photo = photoList[idx]
    const body = {
      fields: {
        title: { stringValue: String(photo.title || photo.t || '') },
        src: { stringValue: String(photo.src || '') },
        cap: { stringValue: String(photo.cap || '') },
        w: { integerValue: String(photo.w || 3) },
        h: { integerValue: String(photo.h || 2) },
        order: { integerValue: String(idx) }
      }
    }

    const res = await fetch(`${baseUrl}/photos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`  ✗ Error uploading photo "${photo.title}":`, err)
    } else {
      photoCount++
      console.log(`  ✓ [Photo] "${photo.title}"`)
    }
  }

  // Upload Books (Shelf)
  console.log(`\nUploading ${bookList.length} library books (Admin mode)...`)
  let bookCount = 0
  for (let idx = 0; idx < bookList.length; idx++) {
    const book = bookList[idx]
    const body = {
      fields: {
        title: { stringValue: String(book.title || book.t || '') },
        author: { stringValue: String(book.author || 'Unknown') },
        rating: { doubleValue: Number(book.rating || book.r || 9.0) },
        color: { stringValue: String(book.color || book.c || '#2535d0') },
        textColor: { stringValue: String(book.textColor || book.f || '#ffffff') },
        note: { stringValue: String(book.note || '') },
        order: { integerValue: String(idx) }
      }
    }

    const res = await fetch(`${baseUrl}/books`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`  ✗ Error uploading book "${book.title}":`, err)
    } else {
      bookCount++
      console.log(`  ✓ [Book] "${book.title}" by ${book.author}`)
    }
  }

  console.log('\n\x1b[32m%s\x1b[0m', '=======================================================')
  console.log('\x1b[32m%s\x1b[0m', `✓ Upload complete: ${watchCount} watch items, ${trackCount} tracks, ${photoCount} photos, ${bookCount} books!`)
  console.log('\x1b[32m%s\x1b[0m', 'Your Google Firebase Firestore database is fully seeded and live.')
  console.log('\x1b[32m%s\x1b[0m', '=======================================================\n')
}

run().catch(err => {
  console.error('\x1b[31m%s\x1b[0m', 'Admin seed failed:')
  console.error(err)
})
