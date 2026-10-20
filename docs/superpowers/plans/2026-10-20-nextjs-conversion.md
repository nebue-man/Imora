# Imora Next.js Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 3-page Imora static site (plain HTML/CSS/JS) into a Next.js App Router project with TypeScript, preserving the pixel-faithful dark luxury design, GSAP scroll animations, Three.js 3D models, and Lenis smooth scroll — running on a Node.js server (no static export).

**Architecture:** App Router with 3 routes (`/`, `/photography`, `/studio`). All animation libraries are client-only — Three.js components use `dynamic(() => import(...), { ssr: false })`, GSAP runs inside `useEffect` with cleanup via `gsap.context().revert()`. The original `styles.css` is copied wholesale into `globals.css` to guarantee pixel-fidelity (no Tailwind conversion of existing rules). Lenis is provided app-wide via a provider wired into the GSAP ticker.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, GSAP 3 + ScrollTrigger, Three.js (npm `three`), lenis

**Source files to reference throughout:**
- HTML markup → `/Users/dilshan/Documents/Imora/photography.html` and `studio.html`
- All animations → `/Users/dilshan/Documents/Imora/main.js`
- All styles → `/Users/dilshan/Documents/Imora/styles.css`

---

## File Structure

```
imora-next/
  src/
    app/
      layout.tsx                   root layout: fonts, providers
      page.tsx                     entry chooser (/)
      photography/
        page.tsx
      studio/
        page.tsx
      globals.css                  full copy of styles.css + Next.js base reset
    components/
      providers/
        LenisProvider.tsx
      ui/
        Preloader.tsx
        CustomCursor.tsx
        WaFloat.tsx
        NoiseOverlay.tsx
      shared/
        Header.tsx
        Footer.tsx
      photography/
        HeroBg.tsx                 Three.js bg canvas — dynamic import only
        HeroSection.tsx
        StatementSection.tsx
        ValuesSection.tsx
        MarqueeSection.tsx
        AboutSection.tsx
        ServicesGridSection.tsx
        KeyFactsSection.tsx
        HorizontalWorkSection.tsx
        StoneServicesSection.tsx   Three.js lens + GSAP scatter — dynamic import only
        InclusionsSection.tsx
        TestimonialsSection.tsx
        FramesInMotionSection.tsx
        VideoSection.tsx
        CtaSection.tsx
      studio/
        StudioHeroSection.tsx
        RoomViewerSection.tsx      Three.js 360 room — dynamic import only
        CameraSetupSection.tsx
        SpecsSection.tsx
        EquipmentSection.tsx
    lib/
      constants.ts
    types/
      index.ts
  public/
    canon_eos_5d_mark_iv.glb
    camera_lens.glb
    (all .jpg / .webp / .svg assets)
  next.config.ts
```

---

## Core Patterns

Refer to these before writing any component; every task below assumes them.

### Pattern A — GSAP-only component

```tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function SomeSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      // port animation from main.js here
    }, ref)
    return () => ctx.revert()
  }, [])

  return <section ref={ref}>…</section>
}
```

### Pattern B — Three.js component

Three.js components must NEVER be imported directly. Always use dynamic import in the parent:

```tsx
// In parent (page or section):
import dynamic from 'next/dynamic'
const HeroBg = dynamic(() => import('@/components/photography/HeroBg'), { ssr: false })
```

Inside the component itself:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import gsap from 'gsap'

export default function HeroBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer | null = null
    // ... full Three.js setup ...
    return () => {
      renderer?.dispose()
      // remove RAF, event listeners
    }
  }, [])

  return <canvas ref={canvasRef} className="bg-canvas" />
}
```

### Pattern C — Animatable object as ref (GSAP target)

When main.js animates a plain object like `var bg = { blast:0, intro:1, progress:0 }`, use a ref so it persists across renders without triggering re-renders:

```tsx
const bgRef = useRef({ blast: 0, intro: 1, progress: 0 })
// pass bgRef.current to gsap.to(bgRef.current, {...})
```

### Pattern D — Mouse pointer for 3D parallax

```tsx
const pointerRef = useRef({ x: 0, y: 0 })
useEffect(() => {
  const onMove = (e: MouseEvent) => {
    pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
    pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('mousemove', onMove)
  return () => window.removeEventListener('mousemove', onMove)
}, [])
```

### Pattern E — Preloader → hero intro coordination

The photography page preloader fires `startMonogramIntro()` on the `bg` object after the wipe completes. In React, the page holds a callback:

```tsx
// photography/page.tsx
const [preloaderDone, setPreloaderDone] = useState(false)
// ...
<Preloader onComplete={() => setPreloaderDone(true)} />
<HeroBg preloaderDone={preloaderDone} />
```

`HeroBg` watches the prop: `useEffect(() => { if (preloaderDone) gsap.to(bgRef.current, { intro:0, duration:1.9, ease:'power3.out' }) }, [preloaderDone])`

---

## Task 1: Bootstrap Next.js project

**Files:**
- Create: `imora-next/` (new project at the same level as the existing flat files)
- Modify: `imora-next/next.config.ts`

- [ ] **Step 1: Scaffold the project**

Run from `/Users/dilshan/Documents/Imora`:

```bash
npx create-next-app@latest imora-next \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --use-npm \
  --no-eslint \
  --import-alias "@/*"
```

When prompted, accept all defaults.

- [ ] **Step 2: Install animation and 3D dependencies**

```bash
cd imora-next
npm install gsap three lenis
npm install --save-dev @types/three
```

- [ ] **Step 3: Configure next.config.ts**

Replace the generated `next.config.ts` with:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000 with the default Next.js page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js project with GSAP, Three.js, Lenis"
```

---

## Task 2: Copy assets to public/

**Files:**
- Modify: `imora-next/public/` (add all static assets)

- [ ] **Step 1: Copy all media assets**

Run from `/Users/dilshan/Documents/Imora`:

```bash
cp canon_eos_5d_mark_iv.glb camera_lens.glb \
   loftloom.jpg loftloom_m.jpg myworker.jpg myworker_m.jpg \
   pulse-studio.jpg pulse-studio_m.jpg \
   doug.webp jean.webp malte.webp stephen.webp zoltan.webp \
   adesignaward.svg awwwards.svg blast-icon.svg ccda.svg csswinner.svg \
   footer-sound.svg gsap.svg logo.svg thefwa.svg \
   partner1.svg partner2.svg partner3.svg partner4.svg partner5.svg \
   imora-next/public/
```

- [ ] **Step 2: Verify**

```bash
ls imora-next/public/*.glb
```

Expected: both `.glb` files listed.

- [ ] **Step 3: Commit**

```bash
cd imora-next
git add public/
git commit -m "chore: copy static assets to public/"
```

---

## Task 3: Global CSS

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with the full original stylesheet**

Open `src/app/globals.css` and replace everything with the full contents of `/Users/dilshan/Documents/Imora/styles.css` (all 740 lines), then prepend these two Tailwind directives before the existing rules:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ========== Imora stylesheet (verbatim from styles.css) ========== */
/* paste entire styles.css content below */
```

Do not modify any rules — this guarantees pixel-fidelity.

- [ ] **Step 2: Verify build still compiles**

```bash
npm run build
```

Expected: build succeeds (Tailwind + original CSS coexist fine since original CSS uses specific class names that don't conflict).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: port original stylesheet into globals.css"
```

---

## Task 4: Constants and root layout

**Files:**
- Create: `src/lib/constants.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create constants.ts**

```ts
// src/lib/constants.ts
export const WA_NUMBER = '910000000000'
export const WA_TEXT = 'Hi Imora, I would like to enquire about a shoot.'
export const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`
```

- [ ] **Step 2: Write root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { LenisProvider } from '@/components/providers/LenisProvider'
import NoiseOverlay from '@/components/ui/NoiseOverlay'
import CustomCursor from '@/components/ui/CustomCursor'
import WaFloat from '@/components/ui/WaFloat'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Imora | Photography, Film & Studio Services',
  description:
    'Imora — an independent studio in India. Photography and film for weddings, portraits, product, events and brands, plus a treated podcast studio for hire.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <LenisProvider>
          <NoiseOverlay />
          <CustomCursor />
          <WaFloat />
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Add font CSS variables to globals.css**

At the very top of `globals.css` (after the Tailwind directives, before the `:root` block), add:

```css
:root {
  --font-playfair: 'Playfair Display', serif;
  --font-inter: 'Inter', sans-serif;
}
```

Then in the existing body rule, change `font-family:'Inter',sans-serif;` to `font-family: var(--font-inter), sans-serif;` and in the h1/h2/h3/h4 rule change `font-family:'Playfair Display',serif;` to `font-family: var(--font-playfair), serif;`.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: root layout with font providers and global wrappers"
```

---

## Task 5: LenisProvider

**Files:**
- Create: `src/components/providers/LenisProvider.tsx`

- [ ] **Step 1: Write LenisProvider**

This is a direct port of main.js lines 353–368 into a React provider.

```tsx
// src/components/providers/LenisProvider.tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    const rafFn = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    // Anchor scroll: <a href="#section"> scrolls smoothly
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    const handleAnchor = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement
      const href = a.getAttribute('href') ?? ''
      const target = href.length > 1 ? document.querySelector(href) : null
      if (target) {
        e.preventDefault()
        lenis.scrollTo(target as HTMLElement, { offset: -20, duration: 1.4 })
      }
    }
    anchors.forEach((a) => a.addEventListener('click', handleAnchor))

    return () => {
      gsap.ticker.remove(rafFn)
      anchors.forEach((a) => a.removeEventListener('click', handleAnchor))
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/providers/
git commit -m "feat: Lenis smooth scroll provider wired into GSAP ticker"
```

---

## Task 6: Global UI components

**Files:**
- Create: `src/components/ui/NoiseOverlay.tsx`
- Create: `src/components/ui/CustomCursor.tsx`
- Create: `src/components/ui/WaFloat.tsx`
- Create: `src/components/ui/Preloader.tsx`

- [ ] **Step 1: NoiseOverlay** (static, no JS)

```tsx
// src/components/ui/NoiseOverlay.tsx
export default function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />
}
```

- [ ] **Step 2: CustomCursor** (port main.js lines 371–397)

```tsx
// src/components/ui/CustomCursor.tsx
'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

export default function CustomCursor() {
  useEffect(() => {
    const dot = document.querySelector<HTMLElement>('.cursor-dot')
    const outline = document.querySelector<HTMLElement>('.cursor-outline')
    if (!dot || !outline) return

    gsap.set([dot, outline], { xPercent: -50, yPercent: -50 })
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
    const outX = gsap.quickTo(outline, 'x', { duration: 0.45, ease: 'power3' })
    const outY = gsap.quickTo(outline, 'y', { duration: 0.45, ease: 'power3' })

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX); dotY(e.clientY)
      outX(e.clientX); outY(e.clientY)
    }
    window.addEventListener('mousemove', onMove)

    // Magnetic button effect (main.js lines 389–397)
    const setupMagnetic = () => {
      document.querySelectorAll<HTMLElement>('.btn').forEach((btn) => {
        const onBtnMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect()
          gsap.to(btn, {
            x: (e.clientX - r.left - r.width / 2) * 0.35,
            y: (e.clientY - r.top - r.height / 2) * 0.35,
            duration: 0.3, ease: 'power2.out',
          })
        }
        const onBtnLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' })
        btn.addEventListener('mousemove', onBtnMove)
        btn.addEventListener('mouseleave', onBtnLeave)
      })
    }
    setupMagnetic()

    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div className="cursor-dot" />
      <div className="cursor-outline"><span className="cursor-label">View</span></div>
    </>
  )
}
```

- [ ] **Step 3: WaFloat** (port main.js lines 18–35)

```tsx
// src/components/ui/WaFloat.tsx
import { WA_HREF } from '@/lib/constants'

export default function WaFloat() {
  return (
    <a
      className="wa-float wa-link"
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.010-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.04 21.5h-.01a9.4 9.4 0 01-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 01-1.44-5.01c0-5.19 4.23-9.41 9.42-9.41 2.51 0 4.88.98 6.65 2.76a9.35 9.35 0 012.75 6.66c0 5.19-4.22 9.41-9.41 9.41m8.01-17.42A11.28 11.28 0 0012.04.75C5.81.75.75 5.81.75 12.03c0 1.99.52 3.93 1.51 5.64L.66 23.25l5.72-1.5a11.26 11.26 0 005.65 1.44h.01c6.22 0 11.28-5.06 11.29-11.28 0-3.02-1.17-5.85-3.3-7.98"/>
      </svg>
    </a>
  )
}
```

- [ ] **Step 4: Preloader** (port main.js lines 440–465)

The `onComplete` prop lets the parent page trigger the hero intro after the wipe.

```tsx
// src/components/ui/Preloader.tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface PreloaderProps {
  onComplete?: () => void
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const fill = fillRef.current
    const count = countRef.current
    if (!root || !fill || !count) return

    const counter = { val: 0 }
    gsap.to(counter, {
      val: 100,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(counter.val)
        count.textContent = String(v)
        fill.style.width = `${v}%`
      },
      onComplete() {
        gsap.to(root, {
          yPercent: -100,
          duration: 0.9,
          ease: 'power4.inOut',
          delay: 0.15,
          onComplete() {
            root.style.display = 'none'
            onComplete?.()
          },
        })
      },
    })
  }, [onComplete])

  return (
    <div ref={rootRef} className="preloader">
      <span className="preloader-logo">Imora</span>
      <div className="preloader-bar">
        <div ref={fillRef} className="preloader-fill" />
      </div>
      <span ref={countRef} className="preloader-count">0</span>
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: global UI components — cursor, noise, WhatsApp float, preloader"
```

---

## Task 7: Shared Header and Footer

**Files:**
- Create: `src/components/shared/Header.tsx`
- Create: `src/components/shared/Footer.tsx`

- [ ] **Step 1: Header** (port from photography.html lines 31–45 and studio.html lines 23–36)

The nav links differ per page, so accept them as props.

```tsx
// src/components/shared/Header.tsx
import Link from 'next/link'

interface NavItem { label: string; href: string }

interface HeaderProps {
  navItems: NavItem[]
  ctaLabel: string
  ctaHref: string
}

export default function Header({ navItems, ctaLabel, ctaHref }: HeaderProps) {
  return (
    <header>
      <Link className="logo" href="/">Imora</Link>
      <div className="nav-right">
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href={ctaHref} className="nav-pill">{ctaLabel}</Link>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Footer** (port from photography.html lines 495–521 and studio.html lines 213–238)

Accept `tagline` and `colTwo` (Work vs Studio) as props since they differ between pages.

```tsx
// src/components/shared/Footer.tsx
import Link from 'next/link'

interface FooterProps {
  tagline: string
  colTwoTitle: string
  colTwoLinks: { label: string; href: string }[]
  copyright: string
  subtitle: string
}

export default function Footer({ tagline, colTwoTitle, colTwoLinks, copyright, subtitle }: FooterProps) {
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-logo">Imora</div>
            <p>{tagline}</p>
          </div>
          <div className="footer-col">
            <h4>{colTwoTitle}</h4>
            <ul>
              {colTwoLinks.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Elsewhere</h4>
            <ul>
              <li><Link href="/studio">Studio Hire</Link></li>
              <li><Link href="/">Home</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@imora.studio">hello@imora.studio</a></li>
              <li><a href="tel:+910000000000">+91 00000 00000</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{copyright}</span>
          <span>{subtitle}</span>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/
git commit -m "feat: shared Header and Footer components"
```

---

## Task 8: Entry chooser page (/)

**Files:**
- Modify: `src/app/page.tsx`

This is the simplest page. It has the preloader, two pick panels, and a GSAP intro animation (main.js line 437: `gsap.to('.pick-panel', { opacity:1, y:0, ... })`).

- [ ] **Step 1: Write the entry chooser page**

```tsx
// src/app/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Preloader from '@/components/ui/Preloader'

export default function HomePage() {
  const [showContent, setShowContent] = useState(false)

  return (
    <>
      <Preloader
        onComplete={() => {
          setShowContent(true)
          // pick-panel intro — GSAP is safe to call after mount
          import('gsap').then(({ default: gsap }) => {
            gsap.to('.pick-panel', { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' })
          })
        }}
      />

      <div className="pick">
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
            />
          </div>
          <div className="pick-in">
            <span className="pick-num">01 — We shoot</span>
            <h2>Photography<br />&amp; Videography</h2>
            <p>Weddings, portraits, product, events, commercial work and film.
               Made for clarity, patience and feeling.</p>
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
            <p>A fully treated room for podcasts and long-form conversation —
               multi-camera, broadcast audio, same-week delivery.</p>
            <span className="pick-go">Enter <span>→</span></span>
          </div>
        </Link>

        <div className="pick-foot">Choose a side — or say hello on WhatsApp</div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Add pick page CSS to globals.css**

Search `styles.css` for `.pick` rules (there are ~20 lines covering `.pick`, `.pick-mark`, `.pick-panel`, `.pick-media`, `.pick-in`, `.pick-num`, `.pick-go`, `.pick-foot`). They should already be in globals.css from Task 3 — verify they exist and are not missing.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Expected: preloader runs, two panels fade in.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: entry chooser page with animated pick panels"
```

---

## Task 9: Photography page skeleton + HeroBg (Three.js)

**Files:**
- Create: `src/app/photography/page.tsx`
- Create: `src/components/photography/HeroBg.tsx`
- Create: `src/components/photography/HeroSection.tsx`

`HeroBg` is the most complex component — it ports the entire `initBackground3D()` function (main.js lines 500–902) plus the blast/hold interaction. Read that section carefully before implementing.

- [ ] **Step 1: Write HeroBg.tsx**

This component wraps the full Three.js setup from main.js. Key points:
- `bgRef = useRef({ blast:0, intro:1, progress:0 })` (Pattern C)
- `pointerRef = useRef({ x:0, y:0 })` (Pattern D)
- `preloaderDone` prop triggers `startMonogramIntro()` (Pattern E)
- All Three.js imports from npm (`three/addons/...` not CDN globals)
- Model URL is `/canon_eos_5d_mark_iv.glb` (public/ folder)
- DRACOLoader decoder path: `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`
- ScrollTrigger on `#zone3d` sets `bgRef.current.progress`
- Hold-to-blast: `pointerdown` anywhere (not on `a`/`button`) within first viewport height

```tsx
// src/components/photography/HeroBg.tsx
'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface HeroBgProps {
  preloaderDone: boolean
}

export default function HeroBg({ preloaderDone }: HeroBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgRef = useRef({ blast: 0, intro: 1, progress: 0 })
  const pointerRef = useRef({ x: 0, y: 0 })

  // Trigger intro animation after preloader completes (Pattern E)
  useEffect(() => {
    if (preloaderDone) {
      gsap.to(bgRef.current, { intro: 0, duration: 1.9, ease: 'power3.out' })
    }
  }, [preloaderDone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    gsap.registerPlugin(ScrollTrigger)

    // --- Port the entire initBackground3D() from main.js lines 500–902 here ---
    // Replace all `THREE.GLTFLoader` → GLTFLoader, `THREE.DRACOLoader` → DRACOLoader
    // Replace `bg.blast/intro/progress` → bgRef.current.blast/intro/progress
    // Replace `pointer.x/y` → pointerRef.current.x/y
    // Model URL: '/canon_eos_5d_mark_iv.glb'
    // The render loop is added via gsap.ticker.add() — capture the fn ref for cleanup

    let renderer: THREE.WebGLRenderer
    let rafFn: (time?: number) => void
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: '#zone3d',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) { bgRef.current.progress = self.progress },
    })

    const onMouseMove = (e: MouseEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const blastOn = () => gsap.to(bgRef.current, { blast: 1, duration: 0.8, ease: 'power2.out' })
    const blastOff = () => gsap.to(bgRef.current, { blast: 0, duration: 1.5, ease: 'elastic.out(1,0.55)' })
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button')) return
      if (window.scrollY < window.innerHeight * 1.2) blastOn()
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', blastOff)
    window.addEventListener('pointercancel', blastOff)

    // Full Three.js scene init from main.js lines 505–901 goes here.
    // Copy the code block verbatim, replacing:
    //   new THREE.GLTFLoader()  →  new GLTFLoader()
    //   new THREE.DRACOLoader() →  new DRACOLoader()
    //   bg.xxx                  →  bgRef.current.xxx
    //   pointer.x/y             →  pointerRef.current.x/y
    //   canvas variable         →  canvasRef.current (already set above)

    return () => {
      scrollTriggerInstance.kill()
      if (rafFn) gsap.ticker.remove(rafFn)
      renderer?.dispose()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', blastOff)
      window.removeEventListener('pointercancel', blastOff)
    }
  }, [])

  return <canvas ref={canvasRef} className="bg-canvas" />
}
```

- [ ] **Step 2: Write HeroSection.tsx** (port photography.html lines 49–71)

```tsx
// src/components/photography/HeroSection.tsx
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <h1 className="hero-title">Moments, held a little longer.</h1>
          <Link href="#contact" className="hero-cta">
            Start a Project <span className="arrow">→</span>
          </Link>
        </div>
        <div className="hero-foot">
          <div className="hero-hint">
            Hold to <b>✦</b> blast<br />
            Move to <b>⚡</b> bend the lines
          </div>
          <div className="hero-meta">
            <div className="hero-badge">
              <div>Est. 2016</div>
              <div>9+ years<br />behind the lens</div>
            </div>
            <p>Weddings, portraits, product, events, commercials and film — shot for clarity, patience and feeling.</p>
          </div>
        </div>
      </div>
      <div className="hero-scroll">↓</div>
    </section>
  )
}
```

- [ ] **Step 3: Write photography/page.tsx skeleton**

Start with just the top zone and hero. Remaining sections added in subsequent tasks.

```tsx
// src/app/photography/page.tsx
'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Preloader from '@/components/ui/Preloader'
import Header from '@/components/shared/Header'
import HeroSection from '@/components/photography/HeroSection'

const HeroBg = dynamic(() => import('@/components/photography/HeroBg'), { ssr: false })

const navItems = [
  { label: 'Work', href: '#work' },
  { label: 'Studio', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Video', href: '#video' },
  { label: 'Studio Hire', href: '/studio' },
]

export default function PhotographyPage() {
  const [preloaderDone, setPreloaderDone] = useState(false)

  return (
    <>
      <Preloader onComplete={() => setPreloaderDone(true)} />
      <Header navItems={navItems} ctaLabel="Let's Talk" ctaHref="#contact" />

      <div className="stage" id="zone3d">
        <HeroBg preloaderDone={preloaderDone} />
        <HeroSection />
        {/* remaining sections added in later tasks */}
      </div>

      <div className="page-solid">
        {/* page solid sections added in later tasks */}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000/photography`. Expected: preloader runs, hero fades in, 3D camera renders and rotates. Console should show `[imora] camera model loaded`.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: photography page hero with Three.js background camera"
```

---

## Task 10: Photography scroll sections — Statement, Values, Marquee

**Files:**
- Create: `src/components/photography/StatementSection.tsx`
- Create: `src/components/photography/ValuesSection.tsx`
- Create: `src/components/photography/MarqueeSection.tsx`

These are GSAP-only (Pattern A). All three live inside `#zone3d` in the HTML.

- [ ] **Step 1: StatementSection** (port photography.html lines 73–76, main.js lines 468–478)

```tsx
// src/components/photography/StatementSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function StatementSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const el = ref.current?.querySelector('[data-words]')
      if (!el) return
      el.innerHTML = (el.textContent ?? '').split(' ').map(
        (w) => `<span class="w">${w}</span>`
      ).join(' ')
      gsap.to(el.querySelectorAll('.w'), {
        color: '#f4ede3',
        ease: 'none',
        stagger: 0.4,
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          end: 'bottom 55%',
          scrub: 0.6,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="statement" ref={ref}>
      <span className="statement-label">About</span>
      <p className="statement-text" data-words>
        Imora is an independent photography studio making images that hold their
        weight — through patience, light, and restraint.
      </p>
    </section>
  )
}
```

- [ ] **Step 2: ValuesSection** (port photography.html lines 78–89, no specific animation beyond section-head reveal which runs on all `.section-head` elements)

```tsx
// src/components/photography/ValuesSection.tsx
import Link from 'next/link'

export default function ValuesSection() {
  return (
    <section className="values">
      <div className="values-rule"><div /></div>
      <div className="values-grid">
        <div>
          <h4>We shoot for permanence.<br />Light first, patience always,<br />edited to last.</h4>
        </div>
        <div className="values-right">
          <p>Our aim is to make photographs that still mean something in twenty years — honest, unhurried, and made for the people in them.</p>
          <Link href="#about" className="values-link">More about us <span>→</span></Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: MarqueeSection** (port photography.html lines 91–99)

```tsx
// src/components/photography/MarqueeSection.tsx
export default function MarqueeSection() {
  return (
    <section className="big-marquee">
      <div className="bm-top">Focused vision.<br />Measured execution.</div>
      <div className="bm-track">
        <span>Observe <i>+</i> Compose <i>+</i> Remember <i>+</i></span>
        <span>Observe <i>+</i> Compose <i>+</i> Remember <i>+</i></span>
      </div>
      <div className="bm-foot"><b>✦</b> From fleeting to permanent.</div>
    </section>
  )
}
```

- [ ] **Step 4: Add to photography/page.tsx inside #zone3d**

```tsx
// After <HeroSection /> inside the zone3d div:
import StatementSection from '@/components/photography/StatementSection'
import ValuesSection from '@/components/photography/ValuesSection'
import MarqueeSection from '@/components/photography/MarqueeSection'
// ...
<HeroSection />
<StatementSection />
<ValuesSection />
<MarqueeSection />
```

- [ ] **Step 5: Verify scroll animation works**

```bash
npm run dev
```

Scroll down on `/photography`. Expected: statement words light up one by one as they enter the viewport.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: photography — statement, values, marquee sections"
```

---

## Task 11: Photography — About and Services Grid sections

**Files:**
- Create: `src/components/photography/AboutSection.tsx`
- Create: `src/components/photography/ServicesGridSection.tsx`

These live in `.page-solid` (not the 3D zone). Both use GSAP Pattern A.

- [ ] **Step 1: AboutSection** (port photography.html lines 111–128, main.js lines 934–958)

```tsx
// src/components/photography/AboutSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function AboutSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.set('.about-img', { clipPath: 'inset(0% 0% 100% 0%)' })
      gsap.set('.about-text', { opacity: 0, y: 40 })
      ScrollTrigger.create({
        trigger: '.about-grid',
        start: 'top 78%',
        onEnter() {
          gsap.to('.about-img', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.out' })
          gsap.to('.about-text', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.15 })
        },
      })
      // Counting stats (main.js lines 947–958)
      ref.current?.querySelectorAll<HTMLElement>('.about-stats h3').forEach((el) => {
        const target = parseInt(el.textContent ?? '0', 10)
        const suffix = (el.textContent ?? '').replace(/[0-9]/g, '')
        const obj = { val: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter() {
            gsap.to(obj, {
              val: target,
              duration: 1.6,
              ease: 'power2.out',
              onUpdate() { el.textContent = `${Math.round(obj.val)}${suffix}` },
            })
          },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section id="about" className="section-pad" ref={ref}>
      <div className="container about-grid">
        <div className="about-img">
          <Image
            src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=900&q=80"
            alt="Photographer at work"
            width={900}
            height={600}
          />
        </div>
        <div className="about-text">
          <span className="eyebrow">The Studio</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', marginBottom: 24 }}>
            We photograph the moments people go back to.
          </h2>
          <p>Imora is an independent studio working across weddings, portraits, product, events, commercial work and film. Every project starts the same way — by listening, then looking for the frame that says the most with the least.</p>
          <p>No two shoots look alike, but every one carries the same restraint: natural light where we can get it, honest composition, and a final edit that feels like memory rather than performance.</p>
          <div className="about-stats">
            <div><h3>9+</h3><span>Years Shooting</span></div>
            <div><h3>420+</h3><span>Projects Delivered</span></div>
            <div><h3>30+</h3><span>Cities Covered</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: ServicesGridSection** (port photography.html lines 130–166, main.js lines 1321–1327)

```tsx
// src/components/photography/ServicesGridSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const genres = [
  { num: '01', label: 'Wedding', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80' },
  { num: '02', label: 'Portrait', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=80' },
  { num: '03', label: 'Product', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80' },
  { num: '04', label: 'Event', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=700&q=80' },
  { num: '05', label: 'Commercial', img: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?auto=format&fit=crop&w=700&q=80' },
  { num: '06', label: 'Videography', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80' },
]

export default function ServicesGridSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.genre-card').forEach((card, i) => {
        gsap.set(card, { clipPath: 'inset(0% 0% 100% 0%)' })
        ScrollTrigger.create({
          trigger: card,
          start: 'top 88%',
          onEnter() {
            gsap.to(card, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power4.out', delay: (i % 4) * 0.08 })
          },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section id="work" className="section-pad" style={{ background: 'var(--bg-alt)' }} ref={ref}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">What We Shoot</span>
            <h2>Six services, one eye for the honest frame.</h2>
          </div>
          <p>From full wedding days and intimate portrait sessions to product sets, live events, commercial campaigns and motion.</p>
        </div>
        <div className="genre-grid">
          {genres.map((g) => (
            <div key={g.num} className="genre-card">
              <Image src={g.img} alt={`${g.label} photography`} width={700} height={500} />
              <div className="genre-overlay">
                <span>{g.num}</span>
                <h3>{g.label}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add both to photography/page.tsx inside .page-solid**

```tsx
import AboutSection from '@/components/photography/AboutSection'
import ServicesGridSection from '@/components/photography/ServicesGridSection'
// ...
<div className="page-solid">
  <AboutSection />
  <ServicesGridSection />
  {/* more sections coming */}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: photography — about + services grid sections"
```

---

## Task 12: Photography — Key Facts + Horizontal Work Scroll

**Files:**
- Create: `src/components/photography/KeyFactsSection.tsx`
- Create: `src/components/photography/HorizontalWorkSection.tsx`

- [ ] **Step 1: KeyFactsSection** (port photography.html lines 169–203, main.js lines 961–993)

The whole `.kf-grid` tilts up as a 3D plane using GSAP fromTo with `rotateX`/`rotateZ`. Port directly from main.js lines 962–993.

```tsx
// src/components/photography/KeyFactsSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function KeyFactsSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      // Plane tilt — port of main.js lines 966–983
      gsap.fromTo('.kf-grid',
        { rotateX: 24, rotateZ: 3.5, y: 90, scale: 0.9 },
        {
          rotateX: 0, rotateZ: 0, y: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: '.kf', start: 'top 62%', end: 'top -5%', scrub: 0.6 },
        }
      )
      gsap.utils.toArray<HTMLElement>('.kf-card').forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0.15, y: 40 },
          {
            opacity: 1, y: 0, ease: 'none',
            scrollTrigger: { trigger: '.kf', start: `top ${60 - i * 4}%`, end: 'top 8%', scrub: 0.6 },
          }
        )
      })
      gsap.from('.kf-head > *', {
        opacity: 0, y: 34, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.kf', start: 'top 78%' },
      })
      gsap.from('.kf-logos b', {
        opacity: 0, y: 18, duration: 0.7, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: '.kf-partners', start: 'top 88%' },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="kf" ref={ref}>
      <div className="kf-head">
        <h2>Key facts</h2>
        <p>A snapshot of our<br />experience and impact.</p>
      </div>
      <div className="kf-grid">
        <div className="kf-card dark">
          <div className="kf-media">
            <Image src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=700&q=80" alt="Awards" width={700} height={500} />
          </div>
          <div className="kf-label">Featured &amp; Awards</div>
          <div className="kf-bottom">
            <p>Featured on top photography platforms worldwide.</p>
            <div className="kf-num">50<sup>+</sup></div>
          </div>
        </div>
        <div className="kf-card light">
          <div className="kf-label">Shoots Completed</div>
          <div className="kf-circle">1.5K<sup style={{ fontSize: '.45em', verticalAlign: 'super' }}>+</sup></div>
          <div className="kf-label" style={{ maxWidth: '80%', margin: '0 auto', textTransform: 'none', letterSpacing: 0, fontSize: 14, lineHeight: 1.45 }}>
            90% of our clients book us again within the year.
          </div>
        </div>
        <div className="kf-card dark">
          <div className="kf-media">
            <Image src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80" alt="Team" width={700} height={500} />
          </div>
          <div className="kf-label">Our Team</div>
          <div className="kf-bottom">
            <p>Different eyes.<br />One standard.</p>
            <div className="kf-num">20<sup>+</sup></div>
          </div>
        </div>
      </div>
      <div className="kf-partners">
        <span>Trusted By</span>
        <div className="kf-logos">
          <b>Lumen</b><b>Vestra</b><b>Northbound</b><b>Atelier&nbsp;9</b><b>Solace</b>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: HorizontalWorkSection** (port photography.html lines 205–245, main.js lines 995–1030)

The horizontal scroll uses a GSAP pin + scrub. Note the `window.innerWidth <= 900` guard — on mobile, skip the pin.

```tsx
// src/components/photography/HorizontalWorkSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const projects = [
  { title: 'The Mehta Wedding', desc: 'Two days in Udaipur, shot as one continuous story.', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Studio Nine', desc: 'A product campaign built on hard light and clean edges.', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Northbound', desc: 'Six weeks on the road, shot for a travel publication.', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Quiet Portraits', desc: 'An ongoing series on people photographed without a brief.', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80' },
]

export default function HorizontalWorkSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (window.innerWidth <= 900) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const inner = ref.current?.querySelector<HTMLElement>('.hwork-inner')
      if (!inner) return
      const getDistance = () => {
        let w = 0
        Array.from(inner.children).forEach((c) => { w += (c as HTMLElement).getBoundingClientRect().width })
        return Math.max(0, w - window.innerWidth)
      }
      gsap.to(inner, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current!,
          start: 'top top',
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      gsap.from('.hwork-lead > *', {
        opacity: 0, y: 40, duration: 0.9, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 55%' },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="hwork" ref={ref}>
      <div className="hwork-inner">
        <div className="hwork-lead">
          <h2>Selected work<br />&amp; explorations</h2>
          <Link href="#">View all projects <span>→</span></Link>
        </div>
        {projects.map((p) => (
          <div key={p.title} className="hwork-item">
            <figure>
              <Image src={p.img} alt={p.title} width={1200} height={800} />
            </figure>
            <h3>{p.title}</h3>
            <div className="hwork-meta">
              <p>{p.desc}</p>
              <Link href="#">Explore project <span>→</span></Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add both to photography/page.tsx .page-solid**

```tsx
import KeyFactsSection from '@/components/photography/KeyFactsSection'
import HorizontalWorkSection from '@/components/photography/HorizontalWorkSection'
// after ServicesGridSection:
<KeyFactsSection />
<HorizontalWorkSection />
```

- [ ] **Step 4: Verify horizontal scroll**

On desktop, scroll through the work section. Expected: section pins and projects travel sideways before unpinning.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: photography — key facts tilt + horizontal work scroll"
```

---

## Task 13: Photography — Stone Services section (Three.js + GSAP scatter)

**Files:**
- Create: `src/components/photography/StoneServicesSection.tsx`

This is the most complex section. It combines Three.js (the lens model / aperture) with a GSAP scroll timeline that scatters type characters and flies service cards in from the corners. Port from main.js lines 1038–1319 and photography.html lines 247–291.

- [ ] **Step 1: Write StoneServicesSection.tsx**

The Three.js canvas (`stone-canvas`) is part of this component but not a separate file since it's tightly coupled to the GSAP scroll timeline. Use Pattern B for the Three.js renderer but keep it inside the same component:

```tsx
// src/components/photography/StoneServicesSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'

const services = [
  { cls: 'c1', title: 'Wedding', num: '01', desc: 'Full-day coverage from getting-ready to reception, delivered as one considered, editorial story.' },
  { cls: 'c2', title: 'Portrait', num: '02', desc: 'Individual, couple and family portraits shot on location or in studio, with a natural, unposed feel.' },
  { cls: 'c3', title: 'Product', num: '03', desc: 'Clean, considered product sets built on controlled light and honest colour.' },
  { cls: 'c4', title: 'Event', num: '04', desc: 'Live coverage of launches, functions and corporate days — unobtrusive, and delivered fast.' },
  { cls: 'c5', title: 'Commercial', num: '05', desc: 'Campaign and brand imagery made to work across print, social and everything in between.' },
  { cls: 'c6', title: 'Videography', num: '06', desc: 'Films and motion work — wedding films, brand pieces and social cuts, shot and graded in house.' },
]

export default function StoneServicesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stRef = useRef({ p: 0 })

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // --- THREE.JS SCENE (port main.js lines 1063–1275) ---
    // Port the entire try{} block verbatim, replacing:
    //   canvas       → canvasRef.current
    //   sticky       → stickyRef.current
    //   st.p         → stRef.current.p
    //   THREE.GLTFLoader → GLTFLoader
    //   THREE.DRACOLoader → DRACOLoader
    //   Model URL: '/camera_lens.glb'

    // --- CHAR SCATTER (port main.js lines 1044–1058) ---
    const chars: Array<{ el: HTMLElement; d: { x: number; y: number; r: number; s: number } }> = []
    sectionRef.current?.querySelectorAll<HTMLElement>('.st-line').forEach((line) => {
      const txt = line.textContent ?? ''
      line.innerHTML = txt.split('').map((c) => `<b>${c}</b>`).join('')
      line.querySelectorAll<HTMLElement>('b').forEach((b) => {
        const d = {
          x: (Math.random() - 0.5) * 900,
          y: (Math.random() - 0.5) * 700,
          r: (Math.random() - 0.5) * 150,
          s: 0.6 + Math.random() * 1.2,
        }
        chars.push({ el: b, d })
      })
    })

    // --- SCROLL TIMELINE (port main.js lines 1278–1318) ---
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) {
        const p = self.progress
        stRef.current.p = p
        const sticky = stickyRef.current
        if (!sticky) return

        // background light → dark
        const dark = Math.min(p / 0.2, 1)
        const c = Math.round(215 - dark * 205)
        sticky.style.background = `rgb(${c},${c},${c + 2})`
        const ink = dark > 0.5 ? 'rgba(240,237,232,0.92)' : '#1b1b1b'
        sticky.querySelectorAll<HTMLElement>('.stone-label,.stone-foot,.stone-link').forEach((el) => { el.style.color = ink })

        // character scatter
        const scatter = Math.min(Math.max((p - 0.20) / 0.20, 0), 1)
        const quiet = Math.min(Math.max((p - 0.44) / 0.16, 0), 1)
        chars.forEach(({ el, d }) => {
          el.style.transform = `translate(${d.x * scatter}px,${d.y * scatter}px) rotate(${d.r * scatter}deg) scale(${1 + (d.s - 1) * scatter})`
          el.style.opacity = String((1 - scatter * 0.86) * (1 - quiet * 0.75))
          el.style.color = dark > 0.5 ? '#e8e5df' : '#1b1b1b'
        })

        // card fly-in
        const cardsIn = Math.min(Math.max((p - 0.50) / 0.28, 0), 1)
        const out = Math.min(Math.max((p - 0.94) / 0.06, 0), 1)
        const cardCfg: [string, number][] = [['.c1', -1], ['.c4', 1], ['.c2', -1], ['.c5', 1], ['.c3', -1], ['.c6', 1]]
        cardCfg.forEach(([sel, dir], i) => {
          const el = sticky.querySelector<HTMLElement>(sel)
          if (!el) return
          const t = Math.min(Math.max(cardsIn * 1.45 - i * 0.075, 0), 1)
          const e = 1 - Math.pow(1 - t, 3)
          el.style.opacity = String(e * (1 - out))
          el.style.transform = `translateX(${dir * (1 - e) * 42}vw)`
        })
      },
    })

    return () => { st.kill() }
  }, [])

  return (
    <section className="stone" id="services" ref={sectionRef}>
      <div className="stone-sticky" ref={stickyRef}>
        <canvas className="stone-canvas" ref={canvasRef} />

        {services.map((s) => (
          <div key={s.cls} className={`svc-card ${s.cls}`}>
            <h4>{s.title} <i>{s.num}</i></h4>
            <p>{s.desc}</p>
          </div>
        ))}

        <div className="stone-ui">
          <div className="stone-label">Our Services</div>
          <div className="stone-type">
            {['Wedding', 'Portrait', 'Product', 'Event', 'Commercial', 'Videography'].map((w) => (
              <div key={w} className="st-line">{w}</div>
            ))}
          </div>
          <div className="stone-foot">✦ Different disciplines. One standard of craft.</div>
          <Link href="#contact" className="stone-link">View services <span>→</span></Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wrap with dynamic import in page.tsx**

```tsx
// At top of photography/page.tsx:
const StoneServicesSection = dynamic(
  () => import('@/components/photography/StoneServicesSection'),
  { ssr: false }
)
// In .page-solid after HorizontalWorkSection:
<StoneServicesSection />
```

- [ ] **Step 3: Verify**

Scroll through the services section. Expected: background fades from near-white to dark, type characters scatter, lens model drops in and grows, six service cards fly in from alternating sides.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: photography — stone services section with Three.js lens and GSAP scatter"
```

---

## Task 14: Photography — Inclusions, Testimonials, Frames in Motion

**Files:**
- Create: `src/components/photography/InclusionsSection.tsx`
- Create: `src/components/photography/TestimonialsSection.tsx`
- Create: `src/components/photography/FramesInMotionSection.tsx`

- [ ] **Step 1: InclusionsSection** (port photography.html lines 293–335, main.js lines 1329–1335)

```tsx
// src/components/photography/InclusionsSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rows = [
  { num: '01', title: 'Wedding', desc: 'Full-day coverage from getting-ready to reception, delivered as one continuous story.' },
  { num: '02', title: 'Portrait', desc: 'Individual, couple and family portraits on location or in studio, with a natural, unposed feel.' },
  { num: '03', title: 'Product', desc: 'Clean, considered product sets built on controlled light and honest colour.' },
  { num: '04', title: 'Event', desc: 'Launches, functions and corporate days covered unobtrusively and turned around fast.' },
  { num: '05', title: 'Commercial', desc: 'Campaign and brand imagery made to work across print, social and everything between.' },
  { num: '06', title: 'Videography', desc: 'Wedding films, brand pieces and social cuts — shot, edited and graded in house.' },
]

export default function InclusionsSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.service-row').forEach((row) => {
        gsap.set(row, { opacity: 0, x: -40 })
        ScrollTrigger.create({
          trigger: row,
          start: 'top 90%',
          onEnter() { gsap.to(row, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }) },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section-pad" style={{ background: 'var(--bg-alt)' }} ref={ref}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">What&apos;s Included</span>
            <h2>Book Imora for your next shoot.</h2>
          </div>
          <p>Every package is shaped around the story you&apos;re trying to tell — not the other way around.</p>
        </div>
        <div className="services-list">
          {rows.map((r) => (
            <div key={r.num} className="service-row">
              <span className="service-num">{r.num}</span>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
              <div className="service-arrow">↗</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: TestimonialsSection** (port photography.html lines 337–376, main.js lines 1337–1343)

```tsx
// src/components/photography/TestimonialsSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const testimonials = [
  { quote: '"Imora photographed our wedding and somehow disappeared into the day — the photos feel like we\'re back there. Every frame is exactly how it felt."', name: 'Ananya Mehta', role: 'Wedding Client', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80' },
  { quote: '"Our product shoot needed to feel premium without trying too hard. Imora nailed the brief in one session — clean, considered, on brand."', name: 'Rohan Kapoor', role: 'Founder, Studio Nine', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
  { quote: '"I\'ve done a lot of portrait sessions and always felt stiff on camera. This was the first time I actually looked like myself in the photos."', name: 'Priya Shah', role: 'Portrait Client', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' },
  { quote: '"Professional, unobtrusive, and fast to deliver. Our campaign shots have outperformed everything else we shot this year."', name: 'Devika Rao', role: 'Marketing Lead', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80' },
]

export default function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.testi-card').forEach((card, i) => {
        gsap.set(card, { opacity: 0, y: 40 })
        ScrollTrigger.create({
          trigger: card, start: 'top 92%',
          onEnter() { gsap.to(card, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.06 }) },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section-pad" ref={ref}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Kind Words</span>
            <h2>What clients say after the shoot.</h2>
          </div>
        </div>
        <div className="testi-track">
          {testimonials.map((t) => (
            <div key={t.name} className="testi-card">
              <p>{t.quote}</p>
              <div className="testi-person">
                <div className="testi-avatar">
                  <Image src={t.img} alt={t.name} width={100} height={100} />
                </div>
                <div><strong>{t.name}</strong><span>{t.role}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: FramesInMotionSection** (port photography.html lines 378–422, main.js lines 1349–1389)

```tsx
// src/components/photography/FramesInMotionSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const wheelImgs = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
]

const gridImgs = wheelImgs.slice(0, 6).map((u) => u.replace('w=600', 'w=800'))

export default function FramesInMotionSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const sect = sectionRef.current
      const wheel = wheelRef.current
      if (!sect || !wheel) return

      const cards = Array.from(wheel.querySelectorAll<HTMLElement>('.wcard'))
      const R = window.innerWidth < 900 ? 700 : 980
      const STEP = window.innerWidth < 900 ? 13 : 9.4
      const SPAN = (cards.length - 1) * STEP

      cards.forEach((card, i) => {
        const a = -SPAN / 2 + i * STEP
        card.style.transform = `rotate(${a}deg) translateY(${-R}px) rotate(${-a * 0.82}deg)`
      })

      const FROM = SPAN / 2 + 26
      const TO = -SPAN / 2 - 26
      const t1 = sect.querySelector<HTMLElement>('.motion-t1')
      const t2 = sect.querySelector<HTMLElement>('.motion-t2')

      ScrollTrigger.create({
        trigger: sect, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate(self) {
          const p = self.progress
          wheel.style.transform = `rotate(${FROM + (TO - FROM) * p}deg)`
          if (t1) t1.style.transform = `translateX(${-p * 16}vw)`
          if (t2) t2.style.transform = `translateX(${p * 16}vw)`
        },
      })

      gsap.from('.mgrid figure', {
        opacity: 0, y: 60, duration: 0.9, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '.mgrid', start: 'top 78%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <>
      <section className="motion" ref={sectionRef}>
        <div className="motion-sticky">
          <svg className="motion-guides" viewBox="0 0 1600 900" preserveAspectRatio="none">
            <path d="M 240 760 Q 700 300 1500 470" />
            <path d="M 300 880 Q 820 420 1560 560" />
            <path d="M 700 120 Q 1050 60 1400 210" />
          </svg>
          <h2 className="motion-t motion-t1">Frames in</h2>
          <h2 className="motion-t motion-t2">Motion</h2>
          <p className="motion-mid">Exploring light through<br />daily practice.</p>
          <p className="motion-note">Tests, outtakes and frame studies shared openly as part of how we work.</p>
          <Link href="#" className="motion-link">View the journal <span>→</span></Link>
          <div className="wheel" ref={wheelRef}>
            {wheelImgs.map((src, i) => (
              <div key={i} className="wcard">
                <Image src={src} alt="Frame study" width={600} height={400} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mgrid">
        <div className="mgrid-in">
          {gridImgs.map((src, i) => (
            <figure key={i}>
              <Image src={src} alt="Frame study" width={800} height={600} />
            </figure>
          ))}
        </div>
        <div className="mgrid-foot">
          <p>Tests, outtakes and frame studies shared openly as part of how we work.</p>
          <Link href="#">View the journal <span>→</span></Link>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 4: Add all three to photography/page.tsx .page-solid**

```tsx
import InclusionsSection from '@/components/photography/InclusionsSection'
import TestimonialsSection from '@/components/photography/TestimonialsSection'
import FramesInMotionSection from '@/components/photography/FramesInMotionSection'
// After StoneServicesSection:
<InclusionsSection />
<TestimonialsSection />
<FramesInMotionSection />
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: photography — inclusions, testimonials, frames in motion"
```

---

## Task 15: Photography — Videography, CTA, and Footer

**Files:**
- Create: `src/components/photography/VideoSection.tsx`
- Create: `src/components/photography/CtaSection.tsx`

- [ ] **Step 1: VideoSection** (port photography.html lines 424–484, showreel logic from main.js lines 47–89)

```tsx
// src/components/photography/VideoSection.tsx
'use client'
import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const VIDEO_SRC = '' // Set to YouTube embed URL, Vimeo URL, or local file path

const cards = [
  { num: '01', title: 'Wedding films', desc: 'The day as it actually unfolded — vows, speeches and the quiet gaps between them, cut to breathe rather than to a trailer template.', items: ['Highlight film', 'Full ceremony & speeches', 'Social cutdowns'] },
  { num: '02', title: 'Brand films', desc: 'Founder stories, product pieces and campaign films made to sit on a homepage and still hold up two years later.', items: ['Concept & treatment', 'Direction & shoot', 'Edit, grade & sound'] },
  { num: '03', title: 'Social reels', desc: 'Vertical cuts built for the feed — shot properly rather than salvaged from footage framed for something else.', items: ['9:16 native capture', 'Captions & sound design', 'Batch delivery'] },
]

export default function VideoSection() {
  const stageRef = useRef<HTMLDivElement>(null)

  const play = () => {
    const stage = stageRef.current
    if (!stage) return
    const src = VIDEO_SRC.trim()
    if (!src) {
      const cap = stage.querySelector('.reel-caption')
      if (cap) cap.textContent = 'No showreel added yet — see README section 4'
      return
    }
    const isFile = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)
    if (isFile) {
      const vid = document.createElement('video')
      vid.src = src; vid.controls = true; vid.autoplay = true; vid.playsInline = true
      stage.innerHTML = ''; stage.appendChild(vid)
    } else {
      const iframe = document.createElement('iframe')
      iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1'
      iframe.allow = 'autoplay; fullscreen; picture-in-picture'
      iframe.setAttribute('allowfullscreen', '')
      iframe.title = 'Imora showreel'
      stage.innerHTML = ''; stage.appendChild(iframe)
    }
    stage.style.cursor = 'default'
  }

  return (
    <section className="reel" id="video">
      <div className="container">
        <div className="reel-head">
          <div>
            <span className="eyebrow">Videography</span>
            <h2>Some moments need to move.</h2>
          </div>
          <p>The same eye, running at 24 frames a second. Shot, edited and graded in house, so the film and the photographs feel like one body of work.</p>
        </div>
        <div
          ref={stageRef}
          className="reel-stage"
          id="showreel"
          onClick={play}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play() } }}
          role="button"
          tabIndex={0}
        >
          <div className="reel-poster">
            <Image src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80" alt="Showreel" width={1600} height={900} />
          </div>
          <div className="reel-veil" />
          <div className="reel-play" aria-label="Play showreel" />
          <div className="reel-caption">Showreel — coming soon</div>
        </div>
        <p className="reel-note">Placeholder. Drop your reel in and this plays inline — see README section 4.</p>
        <div className="reel-grid">
          {cards.map((c) => (
            <div key={c.num} className="reel-card">
              <div className="num">{c.num}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <ul>{c.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: CtaSection** (port photography.html lines 487–493)

```tsx
// src/components/photography/CtaSection.tsx
import Link from 'next/link'
import { WA_HREF } from '@/lib/constants'

interface CtaSectionProps {
  eyebrow: string
  heading: string
  ctaLabel: string
}

export default function CtaSection({ eyebrow, heading, ctaLabel }: CtaSectionProps) {
  return (
    <section id="contact" className="cta">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h2 dangerouslySetInnerHTML={{ __html: heading }} />
        <a href={WA_HREF} className="btn wa-link" target="_blank" rel="noopener noreferrer">
          {ctaLabel}
        </a>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Complete photography/page.tsx**

Add remaining imports and sections, plus the footer. The page should now be complete:

```tsx
import VideoSection from '@/components/photography/VideoSection'
import CtaSection from '@/components/photography/CtaSection'
import Footer from '@/components/shared/Footer'
// After FramesInMotionSection:
<VideoSection />
<CtaSection eyebrow="Let's Talk" heading="Ready to make<br/>your next memory?" ctaLabel="Book on WhatsApp ↗" />
<Footer
  tagline="Photography and film for weddings, portraits, product, events and brands — based in India, shooting worldwide."
  colTwoTitle="Work"
  colTwoLinks={[
    { label: 'What We Shoot', href: '#work' },
    { label: 'Services', href: '#services' },
    { label: 'Videography', href: '#video' },
  ]}
  copyright="© 2026 Imora Photography Studio. All rights reserved."
  subtitle="Photography & Videography"
/>
```

- [ ] **Step 4: Verify full photography page**

```bash
npm run dev
```

Scroll from top to bottom of `/photography`. Expected: all sections render, scroll animations trigger, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: photography page complete — all sections integrated"
```

---

## Task 16: Studio page — Hero + 360° Room Viewer

**Files:**
- Create: `src/app/studio/page.tsx`
- Create: `src/components/studio/StudioHeroSection.tsx`
- Create: `src/components/studio/RoomViewerSection.tsx`

`RoomViewerSection` ports the entire room-builder IIFE from main.js lines 98–339. It's Three.js only (no GLB — the room is fully procedural) so it can use Pattern B.

- [ ] **Step 1: StudioHeroSection** (port studio.html lines 40–57)

```tsx
// src/components/studio/StudioHeroSection.tsx
import Image from 'next/image'
import { WA_HREF } from '@/lib/constants'

export default function StudioHeroSection() {
  return (
    <section className="pod" id="podcast" style={{ paddingTop: 210 }}>
      <div className="pod-bg">
        <Image
          src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1600&q=80"
          alt="Podcast studio"
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="pod-in">
        <div className="pod-tag"><i /> Opening Soon</div>
        <h2>The Imora podcast studio.</h2>
        <p>We&apos;re building a fully treated room for recording and filming long-form conversation — multi-camera, broadcast audio, and lighting that makes people look like themselves. Register your interest and we&apos;ll hold you a slot for opening week.</p>
        <div className="pod-list">
          <div><b>Multi-camera</b><span>4K video capture</span></div>
          <div><b>Broadcast audio</b><span>Treated, low-noise room</span></div>
          <div><b>Up to 4 guests</b><span>Round-table setup</span></div>
          <div><b>Same-week edit</b><span>Video &amp; audio delivered</span></div>
        </div>
        <a href={WA_HREF} className="btn wa-link" target="_blank" rel="noopener noreferrer">Register interest ↗</a>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: RoomViewerSection** (port main.js lines 98–339 and studio.html lines 59–87)

```tsx
// src/components/studio/RoomViewerSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function RoomViewerSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    const hint = hintRef.current
    if (!canvas || !stage) return

    // WebGL check (port main.js lines 104–114)
    const webglOK = () => {
      try {
        const c = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
      } catch { return false }
    }
    if (!webglOK()) { document.body.classList.add('no-3d'); return }

    // --- Port the ENTIRE room-builder from main.js lines 116–338 verbatim ---
    // Replace global `THREE.xxx` with imported THREE.xxx (already imported above)
    // Replace `stage` and `canvas` references with stageRef.current and canvasRef.current
    // Replace `hint` with hintRef.current
    // The look-around controls (pointerdown/move/up, wheel) are self-contained

    // Cleanup RAF
    let rafId: number
    // (capture the requestAnimationFrame call id inside the ported loop and cancel it here)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', () => {}) // (use a named fn in the port)
    }
  }, [])

  return (
    <section className="room" id="room">
      <div className="container">
        <div className="room-head">
          <div>
            <span className="eyebrow">360° View</span>
            <h2>Stand in the middle and look around.</h2>
          </div>
          <p>Drag to turn, scroll to zoom. This is a scale model of the room we&apos;re building — desk, treatment, cameras and lighting in their real positions.</p>
        </div>
        <div className="room-stage" id="stage" ref={stageRef}>
          <canvas id="room-canvas" ref={canvasRef} />
          <div className="room-fallback">
            Your browser can&apos;t render the 3D room.<br />
            The equipment list below covers everything in it.
          </div>
          <div className="room-hint" ref={hintRef}>Drag to look around</div>
        </div>
        <div className="room-legend">
          {['Host seat', 'Guest side', 'Camera wall', 'Full room'].map((label, i) => (
            <button key={label} data-view={i}>{label}</button>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write studio/page.tsx skeleton**

```tsx
// src/app/studio/page.tsx
import dynamic from 'next/dynamic'
import Header from '@/components/shared/Header'
import StudioHeroSection from '@/components/studio/StudioHeroSection'

const RoomViewerSection = dynamic(
  () => import('@/components/studio/RoomViewerSection'),
  { ssr: false }
)

const navItems = [
  { label: 'The Room', href: '#room' },
  { label: 'Setup', href: '#setup' },
  { label: 'Equipment', href: '#kit' },
  { label: 'Photo & Video', href: '/photography' },
]

export default function StudioPage() {
  return (
    <div className="page-solid">
      <Header navItems={navItems} ctaLabel="Book the room" ctaHref="#contact" />
      <StudioHeroSection />
      <RoomViewerSection />
      {/* remaining sections added in Task 17 */}
    </div>
  )
}
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Navigate to `http://localhost:3000/studio`. Expected: studio hero renders, 360° room renders with procedural geometry, drag to look around works.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: studio page — hero and 360 room viewer"
```

---

## Task 17: Studio page — Setup, Specs, Equipment, CTA, Footer

**Files:**
- Create: `src/components/studio/CameraSetupSection.tsx`
- Create: `src/components/studio/SpecsSection.tsx`
- Create: `src/components/studio/EquipmentSection.tsx`

All are static — no GSAP or Three.js.

- [ ] **Step 1: CameraSetupSection** (port studio.html lines 89–121)

```tsx
// src/components/studio/CameraSetupSection.tsx
const cams = [
  { num: 'Cam 01', title: 'Wide master', desc: 'Locked-off two-shot covering the whole table. The safety angle — always rolling, always usable, and the frame the edit falls back to.' },
  { num: 'Cam 02', title: 'Host close-up', desc: 'Tighter portrait framing on the host chair, shallow depth of field, set slightly off-axis so eyelines stay natural rather than straight down the barrel.' },
  { num: 'Cam 03', title: 'Guest close-up', desc: 'Mirrored framing on the guest side. Matched lens and colour profile, so cuts between hosts and guests never jump.' },
]

export default function CameraSetupSection() {
  return (
    <section className="setup" id="setup">
      <div className="container">
        <div className="room-head">
          <div>
            <span className="eyebrow">Camera Setup</span>
            <h2>Three angles, cut live or in post.</h2>
          </div>
          <p>Every session records all three feeds separately, so the edit is never locked to one decision made on the day.</p>
        </div>
        <div className="setup-grid">
          {cams.map((c) => (
            <div key={c.num} className="cam-card">
              <div className="num">{c.num}</div>
              <div className="lens" />
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: SpecsSection** (port studio.html lines 123–133)

```tsx
// src/components/studio/SpecsSection.tsx
const specs = [
  { val: '3', label: 'Camera angles' },
  { val: '4K', label: 'Recording resolution' },
  { val: '4', label: 'Guests seated' },
  { val: '7 days', label: 'Edit turnaround' },
]

export default function SpecsSection() {
  return (
    <section className="pspecs">
      <div className="container">
        <div className="pspecs-in">
          {specs.map((s) => (
            <div key={s.label}>
              <h4>{s.val}</h4>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: EquipmentSection** (port studio.html lines 135–202)

```tsx
// src/components/studio/EquipmentSection.tsx
const equipment = [
  { cat: 'Cameras', item: 'Canon EOS 5D Mark IV', desc: 'Full-frame bodies on the wide master and both close-ups, matched for colour.', qty: '×3' },
  { cat: 'Lenses', item: '24–70mm f/2.8 & 85mm f/1.8', desc: 'Zoom on the master for framing flexibility, primes on the close-ups for separation.', qty: '×3' },
  { cat: 'Audio', item: 'Broadcast dynamic microphones on boom arms', desc: 'One per seat, each recorded to its own track so voices can be balanced separately.', qty: '×4' },
  { cat: 'Audio', item: 'Multi-channel audio interface', desc: 'Isolated inputs with backup recording, so a single failure never costs the session.', qty: '×1' },
  { cat: 'Lighting', item: 'Bi-colour LED key and fill panels', desc: 'Softboxed key per seat plus a hair light, dialled to suit skin tone rather than a preset.', qty: '×5' },
  { cat: 'Lighting', item: 'RGB accent tubes', desc: 'Background colour on the treated wall — subtle by default, tunable to brand.', qty: '×4' },
  { cat: 'Treatment', item: 'Broadband acoustic panels and bass traps', desc: 'Wall and corner treatment to kill flutter echo, so the room sounds controlled, not dead.', qty: 'Full wall' },
  { cat: 'Monitoring', item: 'Closed-back headphones and a confidence monitor', desc: 'Everyone hears the mix as it\'s recorded; the host can see framing at all times.', qty: '×4' },
  { cat: 'Delivery', item: 'Edited video and audio masters', desc: 'Cut episode, audio-only master, and vertical clips for social — delivered within the week.', qty: 'Per session' },
]

export default function EquipmentSection() {
  return (
    <section className="kit" id="kit">
      <div className="container">
        <div className="room-head">
          <div>
            <span className="eyebrow">Equipment</span>
            <h2>What&apos;s in the room.</h2>
          </div>
          <p>Everything is included in the hire — you bring the conversation.</p>
        </div>
        <div className="kit-group">
          {equipment.map((e, i) => (
            <div key={i} className="kit-row">
              <div className="cat">{e.cat}</div>
              <div className="item">{e.item}<span>{e.desc}</span></div>
              <div className="qty">{e.qty}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Complete studio/page.tsx**

```tsx
import CameraSetupSection from '@/components/studio/CameraSetupSection'
import SpecsSection from '@/components/studio/SpecsSection'
import EquipmentSection from '@/components/studio/EquipmentSection'
import CtaSection from '@/components/photography/CtaSection'
import Footer from '@/components/shared/Footer'

// After RoomViewerSection:
<CameraSetupSection />
<SpecsSection />
<EquipmentSection />
<CtaSection eyebrow="Opening Soon" heading="Hold a slot for<br/>opening week." ctaLabel="Register interest ↗" />
<Footer
  tagline="Studio services — a treated room for podcasts, interviews and long-form conversation. Based in India."
  colTwoTitle="Studio"
  colTwoLinks={[
    { label: 'The Room', href: '#room' },
    { label: 'Camera Setup', href: '#setup' },
    { label: 'Equipment', href: '#kit' },
  ]}
  copyright="© 2026 Imora. All rights reserved."
  subtitle="Studio services"
/>
```

- [ ] **Step 5: Verify full studio page**

```bash
npm run dev
```

Scroll through `/studio`. Expected: all sections render correctly.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: studio page complete — all sections integrated"
```

---

## Task 18: Integration and smoke test

**Files:**
- Modify: `src/app/globals.css` (if any CSS is missing)

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 2: Check all three pages at mobile (375px) and desktop**

```bash
npm run dev
```

Open each URL in a browser and verify at 375px and 1280px widths:
- `http://localhost:3000` — entry chooser: two panels, preloader, WhatsApp float
- `http://localhost:3000/photography` — preloader, hero with 3D camera, all scroll sections
- `http://localhost:3000/studio` — studio hero, 360° room, equipment list

- [ ] **Step 3: Verify 3D models load**

Open browser console on `/photography`. Expected line: `[imora] camera model loaded — swapping out the placeholder.`

Open browser console on `/studio`. Expected: no `could not load` errors.

- [ ] **Step 4: Verify Lenis + GSAP scroll on photography page**

On `/photography` at desktop:
- Statement words light up as you scroll ✓
- Key facts grid tilts up into view ✓
- Selected work section pins and scrolls horizontally ✓
- Stone services: background turns dark, lens drops, cards fly in ✓
- Frames in Motion: arc sweeps left ✓

- [ ] **Step 5: Verify WhatsApp links**

The console should show: `[imora] WhatsApp links point at a placeholder number.` (expected until WA_NUMBER is set).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Next.js port of Imora — all pages and animations"
```

---

## Post-conversion notes

**What still needs the client to set before going live:**
- `WA_NUMBER` in `src/lib/constants.ts` — replace `'910000000000'` with the real number
- `VIDEO_SRC` in `VideoSection.tsx` — wire up the showreel
- All images currently point to Unsplash placeholders — replace with real photos in `public/`

**Vercel deployment:**
```bash
npx vercel --prod
```
The project uses no `output: 'export'` so deploys as a Node.js serverless app on Vercel with zero config.
