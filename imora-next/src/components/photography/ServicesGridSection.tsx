import Image from 'next/image'

const genres = [
  { num: '01', title: 'Wedding',    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80', alt: 'Wedding photography' },
  { num: '02', title: 'Portrait',   src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=80', alt: 'Portrait photography' },
  { num: '03', title: 'Product',    src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80', alt: 'Product photography' },
  { num: '04', title: 'Event',      src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=700&q=80', alt: 'Event photography' },
  { num: '05', title: 'Commercial', src: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?auto=format&fit=crop&w=700&q=80', alt: 'Commercial photography' },
  { num: '06', title: 'Videography',src: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80', alt: 'Videography' },
]

export default function ServicesGridSection() {
  return (
    <section id="work" className="section-pad" style={{ background: 'var(--bg-alt)' }}>
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
            <div className="genre-card" key={g.num}>
              <Image
                src={g.src}
                alt={g.alt}
                width={700}
                height={933}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="genre-overlay">
                <span>{g.num}</span>
                <h3>{g.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
