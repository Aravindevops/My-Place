import { useEffect, useRef } from 'react'

// ── UPDATE YOUR SOCIAL LINKS HERE ──────────────────────────────────────────
const SOCIAL_LINKS = [
  { label: "Let's Connect", href: null },
  { label: 'LinkedIn',  href: 'https://linkedin.com/in/' },
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'X',         href: 'https://x.com/' },
  { label: 'Threads',   href: 'https://threads.net/' },
  { label: 'aravindbabu.0001@gmail.com', href: 'mailto:aravindbabu.0001@gmail.com' },
]

const NAV_ITEMS = [
  { label: 'Home',    href: '#hero' },
  { label: 'About',   href: '#about' },
  { label: 'Work',    href: '#work' },
  { label: 'Play',    href: '#work' },
  { label: 'Contact', href: '#contact' },
]

export default function Menu({ open, onClose, onPlayOpen }) {
  const itemsRef = useRef(null)

  // Fit menu item font sizes
  useEffect(() => {
    function fitMenu() {
      const it = itemsRef.current
      if (!it) return
      const ch = [...it.children]
      const m = innerWidth <= 800
      ch.forEach(c => c.style.fontSize = '')
      it.style.fontSize = '100px'
      const ws = ch.map(c => c.getBoundingClientRect().width)
      if (m) {
        it.style.fontSize = ''
        const maxW = innerWidth - 40
        ch.forEach((c, i) => c.style.fontSize = Math.min(100 * maxW / ws[i], innerHeight * 0.12) + 'px')
      } else {
        it.style.fontSize = Math.min(innerHeight * 0.165, 100 * innerWidth * 0.5 / Math.max(...ws)) + 'px'
      }
    }
    document.fonts.ready.then(fitMenu)
    window.addEventListener('resize', fitMenu)
    fitMenu()
    return () => window.removeEventListener('resize', fitMenu)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleNavClick(item) {
    onClose()
    if (item.label === 'Play') {
      setTimeout(() => onPlayOpen?.(), 450)
      return
    }
    const href = item.href
    if (href === '#hero') {
      setTimeout(() => document.documentElement.scrollIntoView({ behavior: 'smooth' }), 500)
    } else {
      setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 500)
    }
  }

  return (
    <div
      className={`menu${open ? ' open' : ''}`}
      id="menu"
      aria-hidden={!open}
    >
      <nav>
        <span>AB</span>
        <button className="burger" id="close" aria-label="Close menu" onClick={onClose}>
          <i /><i />
        </button>
      </nav>

      <div className="mbody">
        <div className="side">
          <div className="links">
            {SOCIAL_LINKS.map((s, i) =>
              s.href
                ? <a key={i} href={s.href} style={{ '--d': i }} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{s.label}</a>
                : <a key={i} style={{ '--d': i }}>{s.label}</a>
            )}
          </div>
          <div className="foot">
            <a href="https://linkedin.com/in/" aria-label="LinkedIn" style={{ '--d': 6 }} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24">
                <circle cx="4" cy="3.5" r="2.4" />
                <rect x="1.8" y="8" width="4.4" height="14" />
                <path d="M10 8h4.2v2c.8-1.4 2.2-2.3 4.2-2.3 3.4 0 4.6 2 4.6 5.6V22h-4.2v-7.2c0-1.6-.6-2.5-2-2.5s-2.4 1-2.4 2.7V22H10z" />
              </svg>
            </a>
            <a href="https://instagram.com/" aria-label="Instagram" style={{ '--d': 7 }} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24">
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2.2A2.8 2.8 0 004.2 7v10A2.8 2.8 0 007 19.8h10a2.8 2.8 0 002.8-2.8V7A2.8 2.8 0 0017 4.2zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM17.3 5.6a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </a>
            <small style={{ '--d': 8 }}>© 2026 Aravind Babu</small>
          </div>
        </div>

        <div className="items" id="items" ref={itemsRef}>
          {NAV_ITEMS.map((item, i) => (
            <a
              key={i}
              className="mi"
              href={item.href}
              style={{ '--i': i }}
              onClick={e => { e.preventDefault(); handleNavClick(item) }}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

