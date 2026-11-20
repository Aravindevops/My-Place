import { useEffect, useRef } from 'react'
import FlexCarousel from './FlexCarousel'

// ── UPDATE YOUR PROJECTS HERE ──────────────────────────────────────────────
export const PROJECTS = [
  {
    t: 'Project One',
    c: 'Web design',
    y: '2026',
    k: 'a',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80&auto=format&fit=max',
    alt: 'Project One - Web Design'
  },
  {
    t: 'Project Two',
    c: 'Full stack',
    y: '2026',
    k: 'b',
    src: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=80&auto=format&fit=max',
    alt: 'Project Two - Full Stack'
  },
  {
    t: 'Project Three',
    c: 'Graphic design',
    y: '2025',
    k: 'c',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=max',
    alt: 'Project Three - Graphic Design'
  },
  {
    t: 'Project Four',
    c: 'UI / UX',
    y: '2025',
    k: 'd',
    src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80&auto=format&fit=max',
    alt: 'Project Four - UI / UX'
  },
  {
    t: 'Project Five',
    c: 'Web design',
    y: '2025',
    k: 'e',
    src: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200&q=80&auto=format&fit=max',
    alt: 'Project Five - Web Design'
  },
  {
    t: 'Project Six',
    c: 'Brand identity',
    y: '2024',
    k: 'f',
    src: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80&auto=format&fit=max',
    alt: 'Project Six - Brand Identity'
  },
]

const CAROUSEL_ITEMS = PROJECTS.map(p => ({
  src: p.src,
  alt: p.alt || p.t,
  title: p.t,
  subtitle: `${p.c} · ${p.y}`
}))

export default function Work({ onAllWorkOpen }) {
  const wkhRef = useRef(null)
  const wmoreRef = useRef(null)

  useEffect(() => {
    const els = [wkhRef.current, wmoreRef.current].filter(Boolean)
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="wk" id="work">
      <h2 className="wkh" ref={wkhRef}><span>Work</span></h2>
      <div
        className="work-carousel-wrap"
        style={{
          width: '100%',
          height: 'clamp(500px, 62vh, 640px)',
          position: 'relative',
          margin: '0 auto 4vh'
        }}
      >
        <FlexCarousel
          items={CAROUSEL_ITEMS}
          preset="liquid"
          intro="rise"
          cardHeight={0.52}
          gap={16}
          squeeze={0.2}
          focusOnClick
          captions
          onSelect={(index, item) => {
            if (onAllWorkOpen) {
              onAllWorkOpen()
            }
          }}
        />
      </div>
      <div className="wmore rv" ref={wmoreRef} style={{ marginTop: '20px' }}>
        <a className="mbtn wbtn" href="#works" onClick={e => { e.preventDefault(); onAllWorkOpen() }}>
          <span>More work</span><i>→</i>
        </a>
      </div>
    </section>
  )
}
