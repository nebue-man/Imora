import Image from 'next/image'

export default function KeyFactsSection() {
  return (
    <section className="kf">
      <div className="kf-head">
        <h2>Key facts</h2>
        <p>A snapshot of our<br />experience and impact.</p>
      </div>
      <div className="kf-grid">
        <div className="kf-card dark" style={{ position: 'relative' }}>
          <div className="kf-media">
            <Image
              src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=700&q=80"
              alt="Awards"
              fill
              style={{ objectFit: 'cover' }}
            />
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
          <div className="kf-label" style={{ maxWidth: '80%', margin: '0 auto', textTransform: 'none', letterSpacing: 0, fontSize: '14px', lineHeight: '1.45' }}>90% of our clients book us again within the year.</div>
        </div>
        <div className="kf-card dark" style={{ position: 'relative' }}>
          <div className="kf-media">
            <Image
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80"
              alt="Team"
              fill
              style={{ objectFit: 'cover' }}
            />
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
