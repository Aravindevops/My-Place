/**
 * Firebase Firestore Seeding Script
 * 
 * Uploads all movies, series, anime, and songs from `public/data/playData.json`
 * into your Google Firebase Firestore database in seconds.
 * 
 * Usage:
 *   node scripts/seedFirebase.js <YOUR_FIREBASE_PROJECT_ID>
 * 
 * Or if you set VITE_FIREBASE_PROJECT_ID in .env:
 *   node scripts/seedFirebase.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Resolve Project ID
let projectId = process.argv[2]

if (!projectId) {
  // Try reading from .env
  const envPath = path.resolve(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const match = envContent.match(/VITE_FIREBASE_PROJECT_ID\s*=\s*(.+)/)
    if (match && match[1]) {
      projectId = match[1].trim().replace(/^['"]|['"]$/g, '')
    }
  }
}

if (!projectId || projectId === 'your-firebase-project-id') {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Please provide your Firebase Project ID.')
  console.log('\nUsage:')
  console.log('  node scripts/seedFirebase.js <your-firebase-project-id>')
  console.log('\nOr set VITE_FIREBASE_PROJECT_ID=<your-project-id> inside your .env file.')
  process.exit(1)
}

// 2. Read playData.json
const dataPath = path.resolve(__dirname, '../public/data/playData.json')
if (!fs.existsSync(dataPath)) {
  console.error('\x1b[31m%s\x1b[0m', `Error: Data file not found at ${dataPath}`)
  process.exit(1)
}

const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
const watchList = rawData.watch || []
const musicDict = rawData.music || {}

const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

async function uploadWatchItem(item) {
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to upload watch item "${item.title}": ${res.status} ${errText}`)
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

async function uploadTrack(track, playlist) {
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to upload track "${track.title}": ${res.status} ${errText}`)
  }
}

async function run() {
  console.log('\x1b[36m%s\x1b[0m', `Starting Firebase Firestore seed for project: [${projectId}]`)
  console.log(`Connecting to: ${baseUrl}\n`)

  // Upload Watch Items
  console.log(`Uploading ${watchList.length} watch cards...`)
  let watchCount = 0
  for (const item of watchList) {
    try {
      await uploadWatchItem(item)
      watchCount++
      process.stdout.write(`  ✓ [Watch] "${item.title}" (${item.category})\n`)
    } catch (err) {
      console.error(`  ✗ Error uploading "${item.title}":`, err.message)
    }
  }

  // Upload Music Tracks
  let trackCount = 0
  for (const [playlist, tracks] of Object.entries(musicDict)) {
    console.log(`\nUploading playlist "${playlist}" (${tracks.length} tracks)...`)
    for (const track of tracks) {
      try {
        await uploadTrack(track, playlist)
        trackCount++
        process.stdout.write(`  ✓ [Music] "${track.title}" - ${track.artist}\n`)
      } catch (err) {
        console.error(`  ✗ Error uploading "${track.title}":`, err.message)
      }
    }
  }

  console.log('\n\x1b[32m%s\x1b[0m', '==============================================')
  console.log('\x1b[32m%s\x1b[0m', `✓ Successfully uploaded ${watchCount} watch cards and ${trackCount} tracks!`)
  console.log('\x1b[32m%s\x1b[0m', 'Your portfolio is now connected and powered by Firebase Firestore.')
  console.log('\x1b[32m%s\x1b[0m', '==============================================\n')
}

run().catch(err => {
  console.error('\n\x1b[31m%s\x1b[0m', 'Seeding failed:')
  console.error(err)
  console.log('\nTip: Make sure Firestore Rules allow read and write (e.g. Test Mode):')
  console.log(`  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }`)
})

