'use client'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import Preloader from '@/components/ui/Preloader'

export default function HomePage() {
  const pickRef = useRef<HTMLDivElement>(null)

  const handlePreloaderDone = () => {
    const panels = pickRef.current?.querySelectorAll<HTMLElement>('.pick-panel')
    if (panels?.length) {
      gsap.to(Array.from(panels), { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' })
    }
  }

  return (
    <>
      <Preloader onComplete={handlePreloaderDone} />

      <div className="pick" ref={pickRef}>
        <div className="pick-mark">Imora</div>

        <Link
          className="pick-panel"
          href="/photography"
          style={{ opacity: 0, transform: 'translateY(40px)' }}
        >
          <div className="pick-media">
            <Image
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80"
              alt="Photography and film"
              fill
              sizes="50vw"
              priority
            />
          </div>
          <div className="pick-in">
            <span className="pick-num">01 — We shoot</span>
            <h2>Photography<br />&amp; Videography</h2>
            <p>
              Weddings, portraits, product, events, commercial work and film.
              Made for clarity, patience and feeling.
            </p>
            <span className="pick-go">Enter <span>→</span></span>
          </div>
        </Link>

        <Link
          className="pick-panel"
          href="/studio"
          style={{ opacity: 0, transform: 'translateY(40px)' }}
        >
          <div className="pick-media">
            <Image
              src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1400&q=80"
              alt="Studio services"
              fill
              sizes="50vw"
            />
          </div>
          <div className="pick-in">
            <span className="pick-num">02 — We host</span>
            <h2>Studio<br />Services</h2>
            <p>
              A fully treated room for podcasts and long-form conversation —
              multi-camera, broadcast audio, same-week delivery.
            </p>
            <span className="pick-go">Enter <span>→</span></span>
          </div>
        </Link>

        <div className="pick-foot">Choose a side — or say hello on WhatsApp</div>
      </div>
    </>
  )
}
