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
