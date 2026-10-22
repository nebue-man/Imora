'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const ITEMS = [
  'Weddings', 'Portraits', 'Editorial', 'Commercials',
  'Product', 'Events', 'Film', 'Documentary',
]

export default function MarqueeSection() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const track = trackRef.current
      if (!track) return
      // Measure single set width, then animate x from 0 to -50% (two sets rendered)
      gsap.to(track, {
        x: '-50%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.marquee',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      })
    })
    return () => ctx.revert()
  }, [])

  const allItems = [...ITEMS, ...ITEMS] // doubled for continuous loop

  return (
    <section className="marquee">
      <div ref={trackRef} className="marquee-track">
        {allItems.map((item, i) => (
          <span key={i} className="marquee-item">
            {item} <span className="marquee-dot">&middot;</span>
          </span>
        ))}
      </div>
    </section>
  )
}
