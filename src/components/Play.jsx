import { useEffect, useRef, useState, useCallback } from 'react'
import './Play.css'
import {
  DEFAULT_WATCH_ITEMS,
  DEFAULT_MUSIC_PLAYLISTS,
  GALLERY_PHOTOS,
  BOOKS,
  createWatchItem,
  createTrack
} from '../data/playData.js'
import PlayAddModal from './PlayAddModal.jsx'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function Play({ open, onClose }) {
  const playRef = useRef(null)
  const [activeNav, setActiveNav] = useState('pw')
  const [addModalOpen, setAddModalOpen] = useState(false)

  // ── DATA STATE WITH LOCALSTORAGE PERSISTENCE ──────────────────────────────
  const [watchItems, setWatchItems] = useState(() => {
    try {
      const saved = localStorage.getItem('play_custom_watch')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...DEFAULT_WATCH_ITEMS]
        }
      }
    } catch {}
    return DEFAULT_WATCH_ITEMS
  })

  const [musicPlaylists, setMusicPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('play_custom_music')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_MUSIC_PLAYLISTS, ...parsed }
        }
      }
    } catch {}
    return DEFAULT_MUSIC_PLAYLISTS
  })

  const [galleryPhotos, setGalleryPhotos] = useState(GALLERY_PHOTOS)
  const [books, setBooks] = useState(BOOKS)

  // Live external data fetch (from Firebase Firestore or public/data/playData.json)
  useEffect(() => {
    let mounted = true
    const loadData = () => {
      import('../utils/firebasePlay.js').then(({ fetchExternalPlayData }) => {
        fetchExternalPlayData().then(ext => {
          if (!mounted || !ext) return
          if (ext.watchItems?.length) {
            console.log(`[Firebase] Live sync: loaded ${ext.watchItems.length} watch cards from Firestore`)
            setWatchItems(ext.watchItems)
          }
          if (ext.musicPlaylists && Object.keys(ext.musicPlaylists).length) {
            setMusicPlaylists(ext.musicPlaylists)
          }
          if (ext.galleryPhotos?.length) {
            setGalleryPhotos(ext.galleryPhotos)
          }
          if (ext.books?.length) {
            setBooks(ext.books)
          }
        })
      })
    }

    loadData()

    if (open) {
      window.addEventListener('focus', loadData)
      return () => {
        mounted = false
        window.removeEventListener('focus', loadData)
      }
    }
    return () => { mounted = false }
  }, [open])

  // Secret personal editing shortcut (Ctrl+Shift+E or ?admin) - completely invisible to normal visitors
  useEffect(() => {
    if (window.location.search.includes('admin')) {
      setAddModalOpen(true)
    }
    function onKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault()
        setAddModalOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Live date & time for reference styling
  const [nowDate, setNowDate] = useState({ dateStr: '', timeStr: '', timeAmPm: '' })
  useEffect(() => {
    function updateClock() {
      const d = new Date()
      setNowDate({
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-US', { hour12: false }),
        timeAmPm: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      })
    }
    updateClock()
    const id = setInterval(updateClock, 1000)
    return () => clearInterval(id)
  }, [])

  // ── 1. WATCH SECTION STATE & STACK LOGIC ─────────────────────────────────
  const [filter, setFilter] = useState('all')
  const [watchFocus, setWatchFocus] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)
  const deckRef = useRef(null)
  const cardsRef = useRef([])
  const metaRef = useRef(null)
  const pcurRef = useRef(0)
  const lastPcurRef = useRef(-1)

  // Filtered indices
  const visibleIndices = watchItems.map((_, i) => i).filter(i =>
    filter === 'all' || watchItems[i].k === filter
  )

  const drawDeck = useCallback(() => {
    const deck = deckRef.current
    if (!deck) return
    const cards = cardsRef.current
    const vis = visibleIndices
    const pcur = pcurRef.current
    const u = Math.min(1, window.innerWidth / 1200)
    const st = deck.parentElement
    const W = st.clientWidth
    const H = st.clientHeight
    const dl = deck.offsetLeft
    const dt = deck.offsetTop
    const c0 = cards[vis[0]]
    const cw0 = c0 ? c0.offsetWidth : 320
    const ch0 = c0 ? c0.offsetHeight : 200

    if (watchFocus) {
      // Focus Mode matching the reference image:
      // Center card: flat, prominent, unskewed
      // Upper Right: stack of upcoming cards in 3D isometric slant
      // Lower Left: stack of previous cards in 3D isometric slant
      const f = Math.min(1.85, Math.min(W * (W > 700 ? 0.54 : 0.88) / cw0, (H * 0.52) / ch0))
      const cy = W > 700 ? 0.42 : 0.36
      const fi = Math.max(0, Math.min(vis.length - 1, focusIndex))

      // Calculated dimensions for center card
      const W_card = cw0 * f
      const H_card = ch0 * f
      const leftPos = (W - W_card) / 2
      const topPos = H * cy + H_card / 2 + 18

      if (metaRef.current) {
        metaRef.current.style.left = `${leftPos}px`
        metaRef.current.style.top = `${topPos}px`
        metaRef.current.style.width = `min(${W_card}px, calc(100vw - 48px))`
      }

      vis.forEach((ci, i) => {
        const c = cards[ci]
        if (!c) return
        const d = i - fi

        if (d === 0) {
          // Center main focused card
          c.style.visibility = ''
          c.classList.remove('st')
          c.classList.add('focused-center')
          c.style.zIndex = '350'
          c.style.opacity = '1'
          c.style.transform = `translate(-50%,-50%) translate(${W / 2 - dl}px,${H * cy - dt}px) skewY(0deg) scale(${f})`
        } else if (d > 0) {
          // Top-Right Isometric Stack
          const k = d - 1
          if (k > 20) {
            c.style.visibility = 'hidden'
            return
          }
          c.style.visibility = ''
          c.classList.add('st')
          c.classList.remove('focused-center')

          const anchorX = W * (W > 700 ? 0.88 : 0.82)
          const anchorY = H * (W > 700 ? 0.16 : 0.12)
          const offX = k * (W > 700 ? 12 : 8)
          const offY = -k * (W > 700 ? 8 : 5)
          const scale = W > 700 ? 0.54 : 0.38

          c.style.zIndex = String(250 - k)
          c.style.opacity = String(k > 14 ? Math.max(0, (20 - k) / 6) : 1)
          c.style.transform = `translate(-50%,-50%) translate(${anchorX + offX - dl}px,${anchorY + offY - dt}px) skewY(21deg) scale(${scale})`
        } else {
          // Bottom-Left Isometric Stack
          const k = Math.abs(d) - 1
          if (k > 20) {
            c.style.visibility = 'hidden'
            return
          }
          c.style.visibility = ''
          c.classList.add('st')
          c.classList.remove('focused-center')

          const anchorX = W * (W > 700 ? 0.12 : 0.16)
          const anchorY = H * (W > 700 ? 0.82 : 0.86)
          const offX = -k * (W > 700 ? 12 : 8)
          const offY = k * (W > 700 ? 8 : 5)
          const scale = W > 700 ? 0.54 : 0.38

          c.style.zIndex = String(250 - k)
          c.style.opacity = String(k > 14 ? Math.max(0, (20 - k) / 6) : 1)
          c.style.transform = `translate(-50%,-50%) translate(${anchorX + offX - dl}px,${anchorY + offY - dt}px) skewY(21deg) scale(${scale})`
        }
      })
      return
    }

    // Default Isometric Ribbon Deck
    vis.forEach((ci, i) => {
      const c = cards[ci]
      if (!c) return
      const d = i - pcur
      const a = Math.abs(d)
      if (a > 13) {
        c.style.visibility = 'hidden'
        return
      }
      c.style.visibility = ''
      c.classList.remove('st')
      c.classList.remove('focused-center')
      const cl = Math.max(-1, Math.min(1, d))
      const x = d * 46 * u + cl * 150 * u
      const y = -d * 34 * u - cl * 80 * u
      const s = 0.8 + 0.2 * Math.max(0, 1 - a)
      c.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) skewY(21deg) scale(${s})`
      c.style.zIndex = String(100 - Math.round(a * 4))
      c.style.opacity = String(a > 10 ? Math.max(0, (13 - a) / 3) : 1)
    })
  }, [visibleIndices, watchFocus, focusIndex])

  // Handle card click
  const handleCardClick = (visIdx) => {
    if (watchFocus) {
      if (focusIndex === visIdx) {
        setWatchFocus(false)
        return
      }
      setFocusIndex(visIdx)
      return
    }
    setFocusIndex(visIdx)
    setWatchFocus(true)
  }

  // ── 2. GALLERY STRIP & LIGHTBOX STATE & LOGIC ────────────────────────────
  const stripRef = useRef(null)
  const trkRef = useRef(null)
  const setRef = useRef(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const lightboxOpenRef = useRef(false)
  useEffect(() => {
    lightboxOpenRef.current = lightboxOpen
  }, [lightboxOpen])

  // Gallery physics & momentum refs (persisted continuously without resetting)
  const gxRef = useRef(0)
  const gvRef = useRef(0)
  const setWRef = useRef(0)
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const lastPointerXRef = useRef(0)
  const activeNavRef = useRef('pw')

  // Dynamic state refs for RAF loop
  const drawDeckRef = useRef(drawDeck)
  drawDeckRef.current = drawDeck
  const watchFocusRef = useRef(watchFocus)
  watchFocusRef.current = watchFocus
  const visibleIndicesRef = useRef(visibleIndices)
  visibleIndicesRef.current = visibleIndices

  const openLightbox = (idx) => {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextLightbox = () => {
    setLightboxIndex(i => (i + 1) % galleryPhotos.length)
  }

  const prevLightbox = () => {
    setLightboxIndex(i => (i - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  // ── 3. MUSIC SECTION STATE & DUAL AUDIO (REAL MP3 + SYNTH) ───────────────
  const [curPlaylistKey, setCurPlaylistKey] = useState('Favourites')
  const [curTrackIndex, setCurTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const audioCtxRef = useRef(null)
  const timerRef = useRef(null)
  const stepRef = useRef(0)
  const realAudioRef = useRef(null)

  const currentPlaylist = musicPlaylists[curPlaylistKey] || musicPlaylists.Favourites || []
  const safeTrackIndex = Math.min(Math.max(0, curTrackIndex), Math.max(0, currentPlaylist.length - 1))
  const currentTrack = currentPlaylist[safeTrackIndex] || { t: 'No Track', a: 'Unknown', l: 180, src: '' }

  // Initialize real HTML5 audio
  useEffect(() => {
    if (!realAudioRef.current) {
      realAudioRef.current = new Audio()
    }
    const audio = realAudioRef.current

    const onTimeUpdate = () => {
      if (!audio.paused && audio.duration && !isNaN(audio.duration)) {
        setElapsed(audio.currentTime)
      }
    }

    const onEnded = () => {
      changeTrack(1)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentPlaylist.length])

  // Sync real audio playback
  useEffect(() => {
    const audio = realAudioRef.current
    if (!audio) return

    if (currentTrack?.src) {
      if (!audio.src.endsWith(currentTrack.src)) {
        audio.src = currentTrack.src
        audio.currentTime = 0
        setElapsed(0)
      }
      if (isPlaying) {
        audio.play().catch(() => {
          // Autoplay policy or invalid audio, fall back to synth
        })
      } else {
        audio.pause()
      }
    } else {
      audio.pause()
      audio.src = ''
    }
  }, [currentTrack, isPlaying])

  // Ambient synth chime fallback when no audio file is provided
  const pluckAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const scale = [0, 2, 3, 5, 7, 8, 10]
      const baseFreqs = [196, 220, 246.9, 261.6, 174.6]
      const pkIdx = Object.keys(musicPlaylists).indexOf(curPlaylistKey)
      const base = baseFreqs[(safeTrackIndex + Math.max(0, pkIdx)) % baseFreqs.length]
      const noteIdx = (stepRef.current * (safeTrackIndex % 3 + 2) + safeTrackIndex) % 7
      const freq = base * Math.pow(2, scale[noteIdx] / 12) * (stepRef.current % 4 === 0 ? 0.5 : 1)

      const t0 = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t0)
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.045, t0 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.85)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.9)
      stepRef.current += 1
    } catch {}
  }, [musicPlaylists, curPlaylistKey, safeTrackIndex])

  // Timer loop for playback (driving synthesized sound & fallback progression)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        const audio = realAudioRef.current
        const hasRealAudio = audio && audio.src && !audio.paused

        if (!hasRealAudio) {
          setElapsed(prev => {
            const next = prev + 0.25
            if (next >= currentTrack.l) {
              setCurTrackIndex(i => (i + 1) % currentPlaylist.length)
              stepRef.current = 0
              return 0
            }
            if (Math.round(next * 4) % 2 === 0) {
              pluckAudio()
            }
            return next
          })
        }
      }, 250)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, currentTrack.l, currentPlaylist.length, pluckAudio])

  const togglePlay = () => {
    if (!isPlaying && !audioCtxRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        audioCtxRef.current = new AudioContext()
      } catch {}
    }
    setIsPlaying(p => !p)
  }

  const changeTrack = (delta) => {
    setCurTrackIndex(i => (i + delta + currentPlaylist.length) % currentPlaylist.length)
    setElapsed(0)
    stepRef.current = 0
    if (realAudioRef.current) {
      realAudioRef.current.currentTime = 0
    }
  }

  const handleScrubberClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const target = frac * currentTrack.l
    setElapsed(target)
    if (realAudioRef.current && currentTrack?.src) {
      try {
        realAudioRef.current.currentTime = target
      } catch {}
    }
  }

  // ── 4. BOOKSHELF SECTION STATE ───────────────────────────────────────────
  const [selectedBookIndex, setSelectedBookIndex] = useState(3)

  // ── 5. ADD ITEM HANDLERS (PERSISTENT & LIVE) ─────────────────────────────
  const handleAddWatchItem = (itemData) => {
    const newItem = createWatchItem(itemData)
    setWatchItems(prev => {
      const updated = [newItem, ...prev]
      try {
        const customOnly = updated.filter(item => !DEFAULT_WATCH_ITEMS.some(d => d.t === item.t))
        localStorage.setItem('play_custom_watch', JSON.stringify(customOnly))
      } catch {}
      return updated
    })
    // Also sync directly to Firebase Firestore if connected
    import('../utils/firebasePlay.js').then(({ addFirestoreWatchItem }) => {
      addFirestoreWatchItem(itemData)
    })
    setFilter(itemData.category || 'all')
    setFocusIndex(0)
    setWatchFocus(true)
    if (playRef.current) {
      playRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleAddSong = ({ playlist, title, artist, duration, audio }) => {
    const newTrack = createTrack({ title, artist, duration, audio })
    setMusicPlaylists(prev => {
      const existing = prev[playlist] || []
      const updated = {
        ...prev,
        [playlist]: [newTrack, ...existing]
      }
      try {
        localStorage.setItem('play_custom_music', JSON.stringify(updated))
      } catch {}
      return updated
    })
    // Also sync directly to Firebase Firestore if connected
    import('../utils/firebasePlay.js').then(({ addFirestoreMusicTrack }) => {
      addFirestoreMusicTrack({ title, artist, duration, audio }, playlist)
    })
    setCurPlaylistKey(playlist)
    setCurTrackIndex(0)
    setElapsed(0)
    setIsPlaying(true)
    scrollToSection('pm')
  }

  // ── MAIN RAF SCROLL & DRAG SYSTEM ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const el = playRef.current
    if (!el) return

    let rafId
    let gt = 0

    const strip = stripRef.current
    const trk = trkRef.current
    const setEl = setRef.current

    // Setup ResizeObserver to accurately measure set width without layout thrashing
    let ro = null
    const updateSetWidth = () => {
      if (setEl) {
        const w = setEl.getBoundingClientRect().width
        if (w > 0) {
          setWRef.current = w
          if (gxRef.current === 0) {
            gxRef.current = -w
          }
        }
      }
    }

    if (setEl && window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        updateSetWidth()
      })
      ro.observe(setEl)
    }
    updateSetWidth()

    const onPointerDown = (e) => {
      if (e.button !== 0) return
      isDraggingRef.current = true
      hasDraggedRef.current = false
      lastPointerXRef.current = e.clientX
      strip?.setPointerCapture?.(e.pointerId)
      strip?.classList.add('drag')
    }

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - lastPointerXRef.current
      lastPointerXRef.current = e.clientX
      if (Math.abs(dx) > 1) {
        hasDraggedRef.current = true
      }
      gxRef.current += dx
      gvRef.current = dx * 40
    }

    const onPointerUp = (e) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      strip?.releasePointerCapture?.(e.pointerId)
      strip?.classList.remove('drag')
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 140)
    }

    const onWheel = (e) => {
      if (!strip) return
      const r = strip.getBoundingClientRect()
      if (r.bottom > 0 && r.top < window.innerHeight) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault()
          gvRef.current -= e.deltaX * 2.2
        } else if (e.shiftKey) {
          e.preventDefault()
          gvRef.current -= e.deltaY * 2.2
        }
      }
    }

    strip?.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    strip?.addEventListener('wheel', onWheel, { passive: false })

    const pw = document.getElementById('pw')

    function loop(now) {
      // 1. Deck scroll progress calculation
      if (pw) {
        const span = pw.offsetHeight - window.innerHeight
        const top = el.scrollTop - pw.offsetTop
        const maxIdx = Math.max(0, visibleIndicesRef.current.length - 1)
        const t = Math.min(1, Math.max(0, top / Math.max(1, span))) * maxIdx
        pcurRef.current += (t - pcurRef.current) * 0.12
        if (Math.abs(t - pcurRef.current) < 0.002) pcurRef.current = t
        if (pcurRef.current !== lastPcurRef.current || watchFocusRef.current) {
          lastPcurRef.current = pcurRef.current
          drawDeckRef.current()
        }
      }

      // 2. Section spy for subnav (only update state when changed to avoid re-renders)
      const sections = ['pw', 'pg', 'pm', 'pb']
      let currentSection = sections[0]
      sections.forEach(s => {
        const secEl = document.getElementById(s)
        if (secEl && secEl.offsetTop <= el.scrollTop + window.innerHeight * 0.4) {
          currentSection = s
        }
      })
      if (currentSection !== activeNavRef.current) {
        activeNavRef.current = currentSection
        setActiveNav(currentSection)
      }

      // 3. Gallery smooth infinite momentum scroll
      const dt = Math.min(0.05, (now - (gt || now)) / 1000)
      gt = now

      if (!lightboxOpenRef.current && trk && setWRef.current > 0) {
        const setW = setWRef.current

        if (!isDraggingRef.current) {
          const isHovered = strip?.matches(':hover')
          const autoDrift = isHovered ? -12 : -32
          gxRef.current += (autoDrift + gvRef.current) * dt
          gvRef.current *= Math.exp(-4.5 * dt)
          if (Math.abs(gvRef.current) < 0.1) gvRef.current = 0
        }

        // Seamless infinite wrap around [-2 * setW, -setW)
        while (gxRef.current <= -2 * setW) gxRef.current += setW
        while (gxRef.current > -setW) gxRef.current -= setW

        trk.style.transform = `translate3d(${gxRef.current}px,0,0)`
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      if (ro) ro.disconnect()
      strip?.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      strip?.removeEventListener('wheel', onWheel)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (!open) return
      if (e.key === 'Escape') {
        if (addModalOpen) {
          setAddModalOpen(false)
        } else if (lightboxOpen) {
          closeLightbox()
        } else if (watchFocus) {
          setWatchFocus(false)
        } else {
          onClose()
        }
      } else if (watchFocus && !addModalOpen) {
        if (e.key === 'ArrowRight') setFocusIndex(fi => Math.min(visibleIndices.length - 1, fi + 1))
        if (e.key === 'ArrowLeft') setFocusIndex(fi => Math.max(0, fi - 1))
      } else if (lightboxOpen && !addModalOpen) {
        if (e.key === 'ArrowRight') nextLightbox()
        if (e.key === 'ArrowLeft') prevLightbox()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lightboxOpen, watchFocus, addModalOpen, visibleIndices.length, onClose])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el && playRef.current) {
      playRef.current.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
    }
  }

  const activeWatchItem = watchItems[visibleIndices[watchFocus ? focusIndex : Math.round(pcurRef.current)]] || watchItems[0]
  const currentBook = books[selectedBookIndex]

  return (
    <div
      className={`more play${open ? ' open' : ''}`}
      id="play-panel"
      ref={playRef}
      role="dialog"
      aria-label="Play page"
      aria-hidden={!open}
    >
      {/* ── TOP NAV BAR ─────────────────────────────────────────────────── */}
      <div className="mtop">
        <span>AB</span>
        <nav className="pnav" aria-label="Play sections">
          <button className={activeNav === 'pw' ? 'on' : ''} onClick={() => scrollToSection('pw')}>Watch</button>
          <button className={activeNav === 'pg' ? 'on' : ''} onClick={() => scrollToSection('pg')}>Gallery</button>
          <button className={activeNav === 'pm' ? 'on' : ''} onClick={() => scrollToSection('pm')}>Music</button>
          <button className={activeNav === 'pb' ? 'on' : ''} onClick={() => scrollToSection('pb')}>Books</button>
        </nav>
        <button className="back" onClick={onClose}>← Back</button>
      </div>

      {/* ── SECTION 1: WATCH ────────────────────────────────────────────── */}
      <section id="pw" className="pw" style={{ '--n': visibleIndices.length }}>
        <div className={`stage${watchFocus ? ' foc' : ''}`}>
          {/* Default deck header info */}
          <div className="pinfo">
            <b>{activeWatchItem.t}</b>
            <span>{activeWatchItem.k} · {activeWatchItem.y} · {String((watchFocus ? focusIndex : Math.round(pcurRef.current)) + 1).padStart(2, '0')}/{visibleIndices.length}</span>
          </div>

          <div className="plab">watch</div>

          {/* Focus Mode Corner Overlays (matching reference image) */}
          {watchFocus && (
            <>
              <div className="wf-top-left">
                <span>{nowDate.dateStr}</span>
                <span>{nowDate.timeStr}</span>
              </div>
              <div className="wf-top-center">
                <span>every : second</span>
              </div>
              <div className="wf-bot-right">
                <button onClick={() => setFocusIndex(fi => Math.max(0, fi - 1))} aria-label="Previous card">←</button>
                <button onClick={() => setFocusIndex(fi => Math.min(visibleIndices.length - 1, fi + 1))} aria-label="Next card">→</button>
                <button onClick={() => setWatchFocus(false)} aria-label="Close focus">✕</button>
              </div>
            </>
          )}

          {/* Perspective 3D Deck */}
          <div className="deck anim" ref={deckRef}>
            {watchItems.map((item, i) => {
              const isVisible = visibleIndices.includes(i)
              return (
                <div
                  key={`${item.t}-${item.img || i}`}
                  ref={el => (cardsRef.current[i] = el)}
                  className="pc"
                  style={{
                    '--g': item.g,
                    backgroundImage: item.img ? `url("${item.img}"), ${item.g}` : item.g,
                    display: isVisible ? '' : 'none'
                  }}
                  onClick={() => {
                    const visIdx = visibleIndices.indexOf(i)
                    if (visIdx >= 0) handleCardClick(visIdx)
                  }}
                >
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <span>{item.t} · {item.y}</span>
                </div>
              )
            })}
          </div>

          {/* Focus Mode Metadata Box (Positioned Aligned Underneath Center Card) */}
          {watchFocus && (
            <div className="wf-meta" ref={metaRef}>
              <div className="wf-meta-time">
                <span>Today, {nowDate.timeAmPm}</span>
                <small>· {activeWatchItem.k} · {activeWatchItem.y}</small>
              </div>
              <h3 className="wf-meta-title">{activeWatchItem.t}</h3>
              <p className="wf-meta-sub">{activeWatchItem.c} · {activeWatchItem.r.toFixed(1)} / 10</p>
              <p className="wf-meta-note">"{activeWatchItem.note}"</p>
              <div className="wf-meta-actions">
                <button onClick={() => setFocusIndex(fi => Math.min(visibleIndices.length - 1, fi + 1))}>
                  <span>↘ read next</span>
                </button>
                <button onClick={() => setWatchFocus(false)}>
                  <span>✕ close view</span>
                </button>
              </div>
            </div>
          )}

          {/* Category Filter Chips with Dynamic Counts */}
          <ul className="filt">
            {['all', 'movies', 'series', 'anime'].map(cat => {
              const count = cat === 'all' ? watchItems.length : watchItems.filter(w => w.k === cat).length
              return (
                <li
                  key={cat}
                  className={filter === cat ? 'on' : ''}
                  onClick={() => {
                    setFilter(cat)
                    setWatchFocus(false)
                    pcurRef.current = 0
                    if (playRef.current) playRef.current.scrollTop = 0
                  }}
                >
                  {cat}
                  <sup>{count}</sup>
                </li>
              )
            })}
          </ul>

          <div className="phint">Scroll ↓ or click a card</div>
        </div>
      </section>

      {/* ── SECTION 2: GALLERY ──────────────────────────────────────────── */}
      <section id="pg" className="pg2">
        <div className="gtop">
          <p className="gsm">A selection of my photography: street, coast, light and the quiet moments in between.</p>
          <h2 className="ph2 g2">Through<br />my lens</h2>
        </div>

        <div className="strip" ref={stripRef}>
          <div className="trk" ref={trkRef}>
            {[0, 1, 2].map((setIndex) => (
              <div
                key={setIndex}
                className="trk-set"
                ref={setIndex === 0 ? setRef : undefined}
              >
                {galleryPhotos.map((p, i) => (
                  <button
                    key={`${p.t}-${i}`}
                    className="gi"
                    data-c={p.t}
                    style={{
                      '--ar': `${p.w}/${p.h}`,
                      backgroundImage: `url(${p.src})`
                    }}
                    onClick={() => {
                      if (!hasDraggedRef.current) {
                        openLightbox(i)
                      }
                    }}
                    aria-label={`Open photo ${p.t}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="gbot">
          <span className="gsm">Drag or scroll ↔</span>
          <h2 className="ph2 g2">One frame<br />at a time</h2>
        </div>
      </section>

      {/* Lightbox Modal */}
      <div
        className={`lb${lightboxOpen ? ' open' : ''}`}
        aria-hidden={!lightboxOpen}
        role="dialog"
        aria-label="Photo viewer"
        onClick={closeLightbox}
      >
        {lightboxOpen && galleryPhotos[lightboxIndex] && (
          <>
            <div
              className="lbimg"
              style={{
                left: '50%',
                top: '46%',
                transform: 'translate(-50%, -50%)',
                width: `min(86vw, ${(galleryPhotos[lightboxIndex].w / galleryPhotos[lightboxIndex].h) * 64}vh)`,
                height: `min(64vh, ${86 / (galleryPhotos[lightboxIndex].w / galleryPhotos[lightboxIndex].h)}vw)`,
                backgroundImage: `url(${galleryPhotos[lightboxIndex].src})`
              }}
              onClick={e => e.stopPropagation()}
            />
            <div className="lbc" onClick={e => e.stopPropagation()}>
              <span>{String(lightboxIndex + 1).padStart(2, '0')} / {String(galleryPhotos.length).padStart(2, '0')}</span>
              <b>{galleryPhotos[lightboxIndex].t}</b>
              <p>{galleryPhotos[lightboxIndex].cap}</p>
            </div>
            <div className="lbb" onClick={e => e.stopPropagation()}>
              <button onClick={prevLightbox} aria-label="Previous photo">←</button>
              <button onClick={nextLightbox} aria-label="Next photo">→</button>
              <button onClick={closeLightbox} aria-label="Close photo">✕</button>
            </div>
          </>
        )}
      </div>

      {/* ── SECTION 3: MUSIC ────────────────────────────────────────────── */}
      <section id="pm" className="pm">
        <h2 className="ph2">On<br />repeat</h2>
        <div className="mus">
          <div className="pl">
            <div className="tabs">
              {Object.keys(musicPlaylists).map(k => (
                <button
                  key={k}
                  className={k === curPlaylistKey ? 'on' : ''}
                  onClick={() => {
                    setCurPlaylistKey(k)
                    setCurTrackIndex(0)
                    setElapsed(0)
                  }}
                >
                  {k}
                </button>
              ))}
            </div>

            <ol>
              {(musicPlaylists[curPlaylistKey] || []).map((track, i) => (
                <li
                  key={i}
                  className={i === safeTrackIndex ? 'on' : ''}
                  onClick={() => {
                    setCurTrackIndex(i)
                    setElapsed(0)
                    if (!isPlaying) togglePlay()
                  }}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <b>{track.t}</b>
                  <em>{track.a}</em>
                  <small>{formatTime(track.l)}</small>
                </li>
              ))}
            </ol>
          </div>

          <div className="np">
            <div className="disc-wrap">
              <div className={`disc${isPlaying ? ' spin' : ''}`}>
                <i>AB</i>
              </div>
            </div>
            <div className="nt">{currentTrack.t}</div>
            <div className="na">{currentTrack.a}</div>

            <div className="bar" onClick={handleScrubberClick}>
              <i style={{ width: `${(elapsed / currentTrack.l) * 100}%` }} />
            </div>
            <div className="tm">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(currentTrack.l)}</span>
            </div>

            <div className="ctl">
              <button onClick={() => changeTrack(-1)} aria-label="Previous track">⏮</button>
              <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? '❚❚' : '▶'}
              </button>
              <button onClick={() => changeTrack(1)} aria-label="Next track">⏭</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: BOOKSHELF ────────────────────────────────────────── */}
      <section id="pb" className="pbk">
        <h2 className="ph2">The<br />shelf</h2>
        <div className="lib">
          <div className="fav">
            <i />
            <span>Favorite books</span>
            <i />
          </div>

          <div className="row4">
            {books.map((b, i) => {
              const isOpen = selectedBookIndex === i
              return (
                <button
                  key={`${b.t}-${i}`}
                  className={`bk4${isOpen ? ' on' : ''}`}
                  style={{ '--c': b.c, '--fg': b.f }}
                  onClick={() => setSelectedBookIndex(isOpen ? -1 : i)}
                  aria-label={b.t}
                >
                  <span className="bx">
                    <i className="g sp">
                      <em>{b.t}</em>
                    </i>
                    <i className="g cvr">
                      <b>{b.t}</b>
                      <small>{b.author}</small>
                    </i>
                    <i className="g bk2" />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="binfo">
            {currentBook ? (
              <>
                <b>{currentBook.t}</b>
                <span>{currentBook.author} · {currentBook.r.toFixed(1)}/10</span>
                <p>{currentBook.note}</p>
              </>
            ) : (
              <span>Click a book to pull it out of the shelf</span>
            )}
          </div>
        </div>
      </section>

      {/* ── ADD ITEM MODAL ──────────────────────────────────────────────── */}
      <PlayAddModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddWatchItem={handleAddWatchItem}
        onAddSong={handleAddSong}
      />
    </div>
  )
}
