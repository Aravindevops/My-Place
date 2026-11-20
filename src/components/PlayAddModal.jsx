import { useState } from 'react'

export default function PlayAddModal({ open, onClose, onAddWatchItem, onAddSong }) {
  const [tab, setTab] = useState('watch') // 'watch' | 'music'

  // Watch Form State
  const [wTitle, setWTitle] = useState('')
  const [wCat, setWCat] = useState('movies')
  const [wYear, setWYear] = useState(new Date().getFullYear())
  const [wRating, setWRating] = useState('9.4')
  const [wCreator, setWCreator] = useState('')
  const [wPoster, setWPoster] = useState('')
  const [wNote, setWNote] = useState('')

  // Song Form State
  const [sTitle, setSTitle] = useState('')
  const [sArtist, setSArtist] = useState('')
  const [sPlaylist, setSPlaylist] = useState('Favourites')
  const [sCustomPlaylist, setSCustomPlaylist] = useState('')
  const [sDuration, setSDuration] = useState('3:45')
  const [sAudio, setSAudio] = useState('')

  const [copied, setCopied] = useState(false)

  if (!open) return null

  // Generate code snippet for watch
  const getWatchCode = () => {
    return `  createWatchItem({
    title: '${wTitle || 'Your Title'}',
    category: '${wCat}',
    year: ${wYear || 2026},
    rating: ${wRating || 9.0},
    creator: '${wCreator || 'Creator Name'}',
    poster: '${wPoster || 'poster.jpg'}',
    note: '${(wNote || 'Your personal review note...').replace(/'/g, "\\'")}'
  }),`
  }

  // Generate code snippet for music
  const activePlaylist = sPlaylist === 'NEW' ? (sCustomPlaylist.trim() || 'Custom') : sPlaylist
  const getSongCode = () => {
    return `    createTrack({
      title: '${sTitle || 'Track Name'}',
      artist: '${sArtist || 'Artist Name'}',
      duration: '${sDuration || '3:30'}',
      audio: '${sAudio || ''}'
    }),`
  }

  const handleCopyCode = () => {
    const code = tab === 'watch' ? getWatchCode() : getSongCode()
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleAddWatchSubmit = (e) => {
    e.preventDefault()
    if (!wTitle.trim()) return
    onAddWatchItem({
      title: wTitle.trim(),
      category: wCat,
      year: Number(wYear) || 2026,
      rating: Number(wRating) || 9.0,
      creator: wCreator.trim(),
      poster: wPoster.trim(),
      note: wNote.trim() || 'Added to collection.'
    })
    setWTitle('')
    setWCreator('')
    setWPoster('')
    setWNote('')
    onClose()
  }

  const handleAddSongSubmit = (e) => {
    e.preventDefault()
    if (!sTitle.trim()) return
    onAddSong({
      playlist: activePlaylist,
      title: sTitle.trim(),
      artist: sArtist.trim() || 'Unknown Artist',
      duration: sDuration.trim() || '3:30',
      audio: sAudio.trim()
    })
    setSTitle('')
    setSArtist('')
    setSAudio('')
    onClose()
  }

  return (
    <div className="pam-overlay" onClick={onClose} role="dialog" aria-label="Add to Play collection">
      <div className="pam-card" onClick={e => e.stopPropagation()}>
        <div className="pam-header">
          <div className="pam-tabs">
            <button
              type="button"
              className={tab === 'watch' ? 'active' : ''}
              onClick={() => setTab('watch')}
            >
              + Movie / Poster
            </button>
            <button
              type="button"
              className={tab === 'music' ? 'active' : ''}
              onClick={() => setTab('music')}
            >
              + Song / Playlist
            </button>
          </div>
          <button className="pam-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {tab === 'watch' ? (
          <form onSubmit={handleAddWatchSubmit} className="pam-form">
            <p className="pam-tip">
              Tip: Drop your poster file into <code>public/posters/</code> (e.g. <code>oppenheimer.jpg</code>) or paste any online image URL!
            </p>

            <div className="pam-row">
              <div className="pam-group flex-2">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Interstellar"
                  value={wTitle}
                  onChange={e => setWTitle(e.target.value)}
                  required
                />
              </div>
              <div className="pam-group flex-1">
                <label>Category</label>
                <select value={wCat} onChange={e => setWCat(e.target.value)}>
                  <option value="movies">Movie</option>
                  <option value="series">Series</option>
                  <option value="anime">Anime</option>
                </select>
              </div>
            </div>

            <div className="pam-row">
              <div className="pam-group flex-1">
                <label>Year</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={wYear}
                  onChange={e => setWYear(e.target.value)}
                />
              </div>
              <div className="pam-group flex-1">
                <label>Rating (/10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  placeholder="9.5"
                  value={wRating}
                  onChange={e => setWRating(e.target.value)}
                />
              </div>
              <div className="pam-group flex-2">
                <label>Director / Studio</label>
                <input
                  type="text"
                  placeholder="e.g. Christopher Nolan"
                  value={wCreator}
                  onChange={e => setWCreator(e.target.value)}
                />
              </div>
            </div>

            <div className="pam-group">
              <label>Poster Image (Filename or Web URL)</label>
              <input
                type="text"
                placeholder="e.g. my-poster.jpg or https://images.unsplash.com/..."
                value={wPoster}
                onChange={e => setWPoster(e.target.value)}
              />
            </div>

            <div className="pam-group">
              <label>Review / Thoughtful Note</label>
              <textarea
                rows="3"
                placeholder="What made you remember this piece? Quote or review..."
                value={wNote}
                onChange={e => setWNote(e.target.value)}
              />
            </div>

            <div className="pam-actions">
              <button type="submit" className="pam-btn-primary">
                ✓ Add to View
              </button>
              <button type="button" className="pam-btn-secondary" onClick={handleCopyCode}>
                {copied ? '✓ Copied Code!' : '📋 Copy Code Snippet'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddSongSubmit} className="pam-form">
            <p className="pam-tip">
              Tip: Drop your MP3 file into <code>public/music/</code> (e.g. <code>song.mp3</code>) or paste any audio link. If left blank, it uses the ambient synth!
            </p>

            <div className="pam-row">
              <div className="pam-group flex-2">
                <label>Track Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Midnight City"
                  value={sTitle}
                  onChange={e => setSTitle(e.target.value)}
                  required
                />
              </div>
              <div className="pam-group flex-2">
                <label>Artist Name</label>
                <input
                  type="text"
                  placeholder="e.g. M83"
                  value={sArtist}
                  onChange={e => setSArtist(e.target.value)}
                />
              </div>
            </div>

            <div className="pam-row">
              <div className="pam-group flex-1">
                <label>Playlist</label>
                <select value={sPlaylist} onChange={e => setSPlaylist(e.target.value)}>
                  <option value="Favourites">Favourites</option>
                  <option value="Focus">Focus</option>
                  <option value="Late night">Late night</option>
                  <option value="NEW">+ Create New Playlist</option>
                </select>
              </div>
              {sPlaylist === 'NEW' && (
                <div className="pam-group flex-1">
                  <label>New Playlist Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Roadtrip"
                    value={sCustomPlaylist}
                    onChange={e => setSCustomPlaylist(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="pam-group flex-1">
                <label>Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 3:45 or 225"
                  value={sDuration}
                  onChange={e => setSDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="pam-group">
              <label>Audio File (Optional: filename in public/music/ or URL)</label>
              <input
                type="text"
                placeholder="e.g. track.mp3 or https://..."
                value={sAudio}
                onChange={e => setSAudio(e.target.value)}
              />
            </div>

            <div className="pam-actions">
              <button type="submit" className="pam-btn-primary">
                ✓ Add to Playlist
              </button>
              <button type="button" className="pam-btn-secondary" onClick={handleCopyCode}>
                {copied ? '✓ Copied Code!' : '📋 Copy Code Snippet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

