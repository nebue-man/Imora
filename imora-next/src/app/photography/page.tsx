'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Preloader from '@/components/ui/Preloader'
import Header from '@/components/shared/Header'
import HeroSection from '@/components/photography/HeroSection'
import StatementSection from '@/components/photography/StatementSection'
import ValuesSection from '@/components/photography/ValuesSection'
import MarqueeSection from '@/components/photography/MarqueeSection'

const HeroBg = dynamic(
  () => import('@/components/photography/HeroBg'),
  { ssr: false }
)

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
        <StatementSection />
        <ValuesSection />
        <MarqueeSection />
      </div>

      <div className="page-solid">
        {/* sections added in tasks 11-15 */}
      </div>
    </>
  )
}
