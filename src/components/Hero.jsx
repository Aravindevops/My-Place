import { useEffect, useRef, useState } from 'react'
import { dtInit } from '../utils/dtEffect.js'

export default function Hero({ go, onMenuOpen }) {
  const photoRef = useRef(null)
  const nameRef = useRef(null)
  const hintRef = useRef(null)
  const metaRef = useRef(null)
  const [mob, setMob] = useState(null)

  // Initialize and run decrypted text effect when hero animates in
  useEffect(() => {
    if (!metaRef.current) return
    const dtEls = metaRef.current.querySelectorAll('.dt')
    const instances = [...dtEls].map(dtInit).filter(Boolean)

    if (go) {
      instances.forEach((inst, i) => {
        setTimeout(() => {
          inst.run()
        }, 400 + i * 140)
      })
    }
  }, [go])

  // Build letter rows
  useEffect(() => {
    function build() {
      const m = innerWidth < 700
      if (m === mob) return
      setMob(m)
    }
    build()
    window.addEventListener('resize', build)
    return () => window.removeEventListener('resize', build)
  }, [mob])

  // Fit font size to container
  useEffect(() => {
    function fit() {
      document.querySelectorAll('.row').forEach(r => {
        r.style.fontSize = '100px'
        const w = [...r.children].reduce((s, c) => s + c.getBoundingClientRect().width, 0)
        r.style.fontSize =
          Math.min(100 * r.clientWidth * 0.965 / w, innerWidth < 700 ? innerHeight * 0.19 : 1e4) + 'px'
      })
    }
    document.fonts.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [mob])

  // Scroll parallax
  useEffect(() => {
    const photo = photoRef.current
    const isMob = innerWidth < 700
    function onScroll() {
      const y = scrollY, h = innerHeight, p = Math.min(y / h, 1)
      document.querySelectorAll('.row').forEach((r, i) =>
        r.style.transform = `translateX(${(i % 2 ? 1 : -1) * p * (isMob ? 14 : 18)}vw)`)
      if (photo) {
        photo.style.transform = document.body.classList.contains('go')
          ? `scale(${1 + p * 1.6}) rotate(${p * 40}deg)` : ''
        photo.style.animation = y > 2 ? 'none' : ''
      }
      const hint = document.querySelector('.hint')
      if (hint) hint.style.opacity = y > 40 ? '0' : ''
      document.body.classList.toggle('scrolled', y > 20)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [go])

  // Mouse parallax on photo
  useEffect(() => {
    const photo = photoRef.current
    function onMove(e) {
      if (scrollY < 5 && document.body.classList.contains('go') && photo) {
        const dx = e.clientX / innerWidth - 0.5
        const dy = e.clientY / innerHeight - 0.5
        photo.style.animation = 'none'
        photo.style.transform = `translate(${dx * 30}px, ${dy * 30}px) rotate(${dx * 8}deg)`
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [go])

  const letters = (word) => [...word].map((ch, i) => (
    <span key={i} style={{ '--i': i }}>{ch}</span>
  ))

  // Accumulate letter index across rows
  let k = 0
  const rows = ['ARAVIND', 'BABU'].map((word) => {
    const start = k
    k += word.length
    return (
      <div className="row" key={word}>
        {[...word].map((ch, i) => (
          <span key={i} style={{ '--i': start + i }}>{ch}</span>
        ))}
      </div>
    )
  })

  return (
    <header className="hero" id="hero">
      <nav>
        <span>AB</span>
        <button className="burger" id="open" aria-label="Open menu" onClick={onMenuOpen}>
          <i /><i />
        </button>
      </nav>

      <h1 className="name" ref={nameRef}>
        {rows}
        <div className="photo" ref={photoRef}>
          {/* Drop your photo at src/assets/profile.jpg */}
          <img src="/profile.jpg" alt="Portrait of Aravind Babu"
            onError={e => { e.target.style.background = 'linear-gradient(135deg,#4f63ff,#2535d0)'; e.target.style.display='block' }} />
        </div>
      </h1>

      <div className="meta" ref={metaRef}>
        <p>
          <span className="dt">Full stack developer</span><br />
          <span className="dt">Web design (UI/UX)</span><br />
          <span className="dt">Graphic designer</span>
        </p>
        <p>
          <span className="dt">Location : Kochi, Kerala, India</span><br />
          <span className="dt">Available for work:</span><br />
          <a href="mailto:aravindbabu.0001@gmail.com">
            <span className="dt">aravindbabu.0001@gmail.com</span>
          </a>
        </p>
      </div>

      <div className="hint">
        <span>Scroll to interact</span>
      </div>
    </header>
  )
}

