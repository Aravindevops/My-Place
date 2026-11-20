import { useEffect } from 'react'
import { PROJECTS } from './Work.jsx'

function AllCard({ p, i }) {
  return (
    <article className="wcard">
      <div className={`art k-${p.k}`}>
        <b>0{i + 1}</b>
      </div>
      <div className="wm">
        <span>{p.t}</span>
        <small>{p.c} · {p.y}</small>
      </div>
    </article>
  )
}

export default function AllWork({ open, onClose }) {
  useEffect(() => {
    const el = document.getElementById('all-work-panel')
    if (!el) return
    if (open) {
      el.scrollTop = 0
      setTimeout(() => {
        const rvs = el.querySelectorAll('.rv')
        const io = new IntersectionObserver(es =>
          es.forEach(e => e.isIntersecting && e.target.classList.add('in')),
          { root: el, threshold: 0.12 })
        rvs.forEach(r => { r.classList.remove('in'); io.observe(r) })
        document.getElementById('wback')?.focus({ preventScroll: true })
      }, 450)
    } else {
      setTimeout(() => {
        el.querySelectorAll('.rv').forEach(r => r.classList.remove('in'))
      }, 900)
    }
  }, [open])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={`more${open ? ' open' : ''}`}
      id="all-work-panel"
      aria-hidden={!open}
      role="dialog"
      aria-label="All work"
    >
      <div className="mtop">
        <span>AB</span>
        <button className="back" id="wback" onClick={onClose}>← Back</button>
      </div>
      <div className="mwrap">
        <h2 className="mh rv">All<br />work</h2>
        <div className="hg rv" style={{ marginTop: '9vh' }}>
          {PROJECTS.map((p, i) => <AllCard key={i} p={p} i={i} />)}
        </div>
      </div>
    </div>
  )
}

