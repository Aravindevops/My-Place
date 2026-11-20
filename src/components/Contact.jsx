import { useEffect, useRef } from 'react'
import { dtInit } from '../utils/dtEffect.js'

const CH = ' =+xX0S8#@'
const CELL = 18
const CWID = CELL * 0.6
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function hh(a, b) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}
function vn(x, y) {
  const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j
  const u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g)
  return hh(i,j)*(1-u)*(1-v) + hh(i+1,j)*u*(1-v) + hh(i,j+1)*(1-u)*v + hh(i+1,j+1)*u*v
}

export default function Contact({ onPlayOpen }) {
  const ctRef = useRef(null)
  const acvRef = useRef(null)
  const cpRef = useRef(null)
  const mailRef = useRef(null)

  // ASCII canvas animation
  useEffect(() => {
    const ct = ctRef.current
    const acv = acvRef.current
    if (!acv || !ct) return
    const actx = acv.getContext('2d')
    let cw = 1, chh = 1, aC = 1, aR = 1, tT = 0, tI = 0
    let introT = calm ? 1 : 0
    let trail = [], clicks = [], aVis = false, aLast = 0, aRaf = 0

    function aSize() {
      const d = Math.min(devicePixelRatio || 1, 2)
      const r = ct.getBoundingClientRect()
      cw = r.width; chh = r.height
      acv.width = cw * d; acv.height = chh * d
      aC = Math.ceil(cw / CWID); aR = Math.ceil(chh / CELL)
      actx.setTransform(d, 0, 0, d, 0, 0)
      actx.font = `300 ${CELL * 0.78}px 'Geist Mono',ui-monospace,Menlo,Consolas,monospace`
      actx.textAlign = 'center'; actx.textBaseline = 'middle'
      actx.fillStyle = '#6a7bff'
    }

    function aDraw(dt) {
      tT += dt * 0.5; tI += dt
      if (introT < 1) introT = Math.min(1, introT + dt / 2.4)
      trail.forEach(p => p.age += dt); trail = trail.filter(p => p.age < 0.7)
      clicks.forEach(c => c.age += dt); clicks = clicks.filter(c => c.age < 1.2)
      actx.clearRect(0, 0, cw, chh)
      const rad = chh * 0.1, fr = Math.floor(tI * 20), tick = Math.floor(tI * 9)
      for (let j = 0; j < aR; j++) {
        const ny = j / aR
        for (let i = 0; i < aC; i++) {
          const nx = (i / aC - 0.5) * 2, edge = 0.66 + 0.18 * nx * nx - ny
          if (edge <= 0) continue
          const v = (0.25 + 0.75 * Math.min(1, edge / 0.5)) * (0.45 + 0.55 * vn(i * 0.07 + tT * 0.6, j * 0.09 - tT * 0.3))
          if (v < 0.1) continue
          const px = (i + 0.5) * CWID, py = (j + 0.5) * CELL
          let s = 0
          for (const p of trail) { const d2 = (px-p.x)**2+(py-p.y)**2, k=1-p.age/0.7; s=Math.max(s,k*k*Math.exp(-d2/(rad*rad))) }
          for (const c of clicks) { const d=Math.hypot(px-c.x,py-c.y),env=Math.min(1,c.age/0.08)*(1-c.age/1.2)**2; s=Math.max(s,Math.exp(-(((d-c.age*.75*chh)/(0.06*chh))**2))*env) }
          const rev = Math.min(1, Math.max(0, (introT * 1.45 - ny) / 0.45))
          const dec = Math.max(s, 1 - rev)
          if (hh(i*1.3,j*1.7) > 0.8*(0.45+0.55*(0.3+v*1.1)) && dec < 0.02) continue
          const tone = Math.min(1, Math.max(0, Math.pow(v, 0.75) + (hh(i*2.3,j+tick*17)-0.5)*0.08)) * 0.75
          let idx = Math.round(tone * (CH.length - 1))
          if (dec > 0.02 && hh(i*3.7+fr*5.3,j) < dec*1.25) idx = 1 + Math.floor(hh(i+fr*1.37,j*2.1)*(CH.length-1))
          if (idx < 1) continue
          actx.globalAlpha = (0.18 + 0.5 * tone) * (0.4 + 0.6 * Math.max(rev, s))
          actx.fillText(CH[idx], px, py)
        }
      }
      actx.globalAlpha = 1
    }

    function asciiLoop(now) {
      aRaf = 0
      if (!aVis) return
      if (now - aLast >= 45) { const dt = Math.min((now - aLast) / 1000, 0.1); aLast = now; aDraw(dt) }
      aRaf = requestAnimationFrame(asciiLoop)
    }

    const ro = new ResizeObserver(() => { aSize(); if (calm) aDraw(0) })
    ro.observe(ct)

    if (!calm) {
      const io = new IntersectionObserver(([e]) => {
        aVis = e.isIntersecting
        if (aVis && !aRaf) { aLast = 0; aRaf = requestAnimationFrame(asciiLoop) }
      })
      io.observe(ct)
    }

    // Trail on pointer move
    function onMove(e) {
      if (calm) return
      const r = ct.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) return
      const p = trail[0]
      if (p && Math.hypot(x - p.x, y - p.y) < 8) return
      trail.unshift({ x, y, age: 0 })
      if (trail.length > 24) trail.pop()
    }
    function onDown(e) {
      if (calm) return
      const r = ct.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) return
      clicks.unshift({ x, y, age: 0 })
      if (clicks.length > 4) clicks.pop()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      if (aRaf) cancelAnimationFrame(aRaf)
    }
  }, [])

  // Contact section reveal & decrypted text
  useEffect(() => {
    const ct = ctRef.current
    if (!ct) return
    const dxEls = ct.querySelectorAll('.dx')
    const cd = [...dxEls].map(dtInit).filter(Boolean)

    const io = new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return
      o.disconnect()
      ct.classList.add('in')
      cd.forEach((d, i) => setTimeout(d.run, 600 + i * 200))
    }, { threshold: 0.25 })
    io.observe(ct)
    return () => io.disconnect()
  }, [])

  // Dark nav when contact is in view
  useEffect(() => {
    const ct = ctRef.current
    if (!ct) return
    const io = new IntersectionObserver(([e]) =>
      document.body.classList.toggle('on-dark', e.isIntersecting),
      { rootMargin: '0px 0px -92% 0px' })
    io.observe(ct)
    return () => io.disconnect()
  }, [])

  // Light cursor in contact
  useEffect(() => {
    const ct = ctRef.current
    if (!ct) return
    const on = () => document.body.classList.add('cur-light')
    const off = () => document.body.classList.remove('cur-light')
    ct.addEventListener('pointerenter', on)
    ct.addEventListener('pointerleave', off)
    return () => { ct.removeEventListener('pointerenter', on); ct.removeEventListener('pointerleave', off) }
  }, [])

  // Copy email
  function copyEmail() {
    const btn = cpRef.current
    const email = 'aravindbabu.0001@gmail.com'
    navigator.clipboard.writeText(email).then(() => {
      btn.textContent = 'Copied!'
      setTimeout(() => btn.textContent = 'Copy email', 1800)
    }).catch(() => {
      btn.textContent = 'Press Ctrl+C'
      setTimeout(() => btn.textContent = 'Copy email', 1800)
    })
  }

  function scrollTo(id) {
    if (id === '#hero') document.documentElement.scrollIntoView({ behavior: 'smooth' })
    else document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="ct" id="contact" ref={ctRef}>
      <canvas id="ascii" aria-hidden="true" ref={acvRef} />

      <div className="ct-nav">
        <div className="ri" style={{ '--d': 1 }}>
          <h3>Navigation</h3>
          <a href="#hero" onClick={e => { e.preventDefault(); scrollTo('#hero') }}>Home</a>
          <a href="#about" onClick={e => { e.preventDefault(); scrollTo('#about') }}>About</a>
          <a href="#work" onClick={e => { e.preventDefault(); scrollTo('#work') }}>Work</a>
          <a href="#play" onClick={e => { e.preventDefault(); onPlayOpen ? onPlayOpen() : scrollTo('#work') }}>Play</a>
          <a href="#contact" onClick={e => { e.preventDefault(); scrollTo('#contact') }}>Contact</a>
        </div>
        <div className="ri" style={{ '--d': 2 }}>
          <h3>Socials</h3>
          {/* ── UPDATE YOUR SOCIAL LINKS HERE ── */}
          <a href="https://instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://linkedin.com/in/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://threads.net/" target="_blank" rel="noreferrer">Threads</a>
          <a href="https://x.com/" target="_blank" rel="noreferrer">X</a>
        </div>
      </div>

      <div className="ct-main">
        <p className="ct-q ri" style={{ '--d': 3 }}>
          Like what you see?<br />Let's connect.
        </p>
        <a className="mail ri" style={{ '--d': 4 }} href="mailto:aravindbabu.0001@gmail.com">
          <span className="dx">aravindbabu.0001@gmail.com</span>
        </a>
        <button className="cp ri" id="cp" ref={cpRef} style={{ '--d': 5 }} onClick={copyEmail}>
          Copy email
        </button>
      </div>

      <div className="ct-big" aria-hidden="true">AB</div>
    </section>
  )
}

