'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface CharData {
  x: number
  y: number
  r: number
  s: number
}

const SERVICES: { cls: string; title: string; desc: string }[] = [
  { cls: 'c1', title: 'Wedding',     desc: 'Full-day coverage from getting-ready to reception, delivered as one considered, editorial story.' },
  { cls: 'c2', title: 'Portrait',    desc: 'Individual, couple and family portraits shot on location or in studio, with a natural, unposed feel.' },
  { cls: 'c3', title: 'Product',     desc: 'Clean, considered product sets built on controlled light and honest colour.' },
  { cls: 'c4', title: 'Event',       desc: 'Live coverage of launches, functions and corporate days — unobtrusive, and delivered fast.' },
  { cls: 'c5', title: 'Commercial',  desc: 'Campaign and brand imagery made to work across print, social and everything in between.' },
  { cls: 'c6', title: 'Videography', desc: 'Films and motion work — wedding films, brand pieces and social cuts, shot and graded in house.' },
]

const ST_LINES = ['Wedding', 'Portrait', 'Product', 'Event', 'Commercial', 'Videography']

export default function StoneSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const sect = sectionRef.current
    const sticky = stickyRef.current
    const canvas = canvasRef.current
    const typeEl = typeRef.current
    if (!sect || !sticky || !typeEl) return

    // Split st-line text into individual character spans
    const chars: Array<HTMLElement & { __d: CharData }> = []
    typeEl.querySelectorAll<HTMLElement>('.st-line').forEach((line) => {
      const txt = line.textContent ?? ''
      line.innerHTML = txt.split('').map((c) => `<b>${c}</b>`).join('')
      line.querySelectorAll<HTMLElement>('b').forEach((b) => {
        const el = b as HTMLElement & { __d: CharData }
        el.__d = {
          x: (Math.random() - 0.5) * 900,
          y: (Math.random() - 0.5) * 700,
          r: (Math.random() - 0.5) * 150,
          s: 0.6 + Math.random() * 1.2,
        }
        chars.push(el)
      })
    })

    const st = { p: 0 }

    // THREE.JS setup
    let renderer: THREE.WebGLRenderer | null = null
    let rock: THREE.Object3D | null = null
    let slab: THREE.Group | null = null

    function supportsWebGL() {
      try {
        const c = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
      } catch { return false }
    }

    function setRockOpacity(obj: THREE.Object3D, v: number) {
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.transparent = true
          mat.opacity = v
        }
      })
    }

    let t2 = 0
    let renderFn: (() => void) | null = null
    let resizeStone: (() => void) | null = null

    if (canvas && supportsWebGL()) {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        const scene = new THREE.Scene()
        const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
        cam.position.set(0, 0, 7)

        scene.add(new THREE.AmbientLight(0xffffff, 0.5))
        const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(-4, 6, 5); scene.add(key)
        const fill = new THREE.DirectionalLight(0x8fa6c4, 0.8); fill.position.set(5, -3, 2); scene.add(fill)

        function noise(x: number, y: number, z: number) {
          return Math.sin(x * 2.1 + y * 1.3) * Math.cos(y * 1.9 - z * 2.2) * 0.5
               + Math.sin(x * 4.7 - z * 3.1) * 0.28
               + Math.cos(y * 7.3 + x * 5.1) * 0.13
        }
        function roughen(geo: THREE.BufferGeometry, amount: number) {
          const pos = geo.attributes.position as THREE.BufferAttribute
          const v = new THREE.Vector3()
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)
            const n = noise(v.x, v.y, v.z)
            const len = v.length() || 1
            v.addScaledVector(v.clone().divideScalar(len), n * amount)
            pos.setXYZ(i, v.x, v.y, v.z)
          }
          pos.needsUpdate = true
          geo.computeVertexNormals()
          return geo
        }

        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9c968a, roughness: 0.98, metalness: 0.02, transparent: true })
        const rockMesh = new THREE.Mesh(roughen(new THREE.IcosahedronGeometry(1.25, 5), 0.20), stoneMat)
        scene.add(rockMesh)
        rock = rockMesh

        // Load camera_lens.glb
        const gltfLoader = new GLTFLoader()
        gltfLoader.register(() => ({ name: 'KHR_materials_pbrSpecularGlossiness' }))
        const draco = new DRACOLoader()
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
        gltfLoader.setDRACOLoader(draco)
        gltfLoader.load('/camera_lens.glb', (gltf) => {
          const m = gltf.scene
          const b = new THREE.Box3().setFromObject(m)
          const sz = b.getSize(new THREE.Vector3())
          const ct = b.getCenter(new THREE.Vector3())
          const kk = 2.6 / (Math.max(sz.x, sz.y, sz.z) || 1)
          m.scale.setScalar(kk)
          m.position.set(-ct.x * kk, -ct.y * kk, -ct.z * kk)
          m.traverse((o) => {
            const mesh = o as THREE.Mesh
            if (mesh.isMesh && mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial
              mat.transparent = true
              mat.envMapIntensity = 1.2
              mat.needsUpdate = true
            }
          })
          const holder = new THREE.Group()
          holder.add(m)
          scene.add(holder)
          if (rock) scene.remove(rock)
          rock = holder
        }, undefined, (err) => {
          console.warn('[imora] could not load camera_lens.glb — keeping rock', err)
        })

        // Aperture slab
        slab = new THREE.Group()
        const apMetal = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.34, metalness: 0.92, transparent: true, opacity: 0 })
        const apBlade = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.42, metalness: 0.78, transparent: true, opacity: 0, side: THREE.DoubleSide })
        const apGlass = new THREE.MeshStandardMaterial({ color: 0x08111c, roughness: 0.05, metalness: 1.0, transparent: true, opacity: 0 })

        const apRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.13, 18, 64), apMetal); slab.add(apRing)
        const apRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.055, 14, 56), apMetal); apRing2.position.z = 0.07; slab.add(apRing2)
        const apGlassMesh = new THREE.Mesh(new THREE.CircleGeometry(1.02, 64), apGlass); apGlassMesh.position.z = -0.14; slab.add(apGlassMesh)

        const blades: THREE.Mesh[] = []
        for (let bi = 0; bi < 8; bi++) {
          const shape = new THREE.Shape()
          shape.moveTo(0, 0); shape.lineTo(1.16, 0.30); shape.lineTo(1.16, -0.62); shape.lineTo(0.10, -0.34); shape.lineTo(0, 0)
          const blade = new THREE.Mesh(new THREE.ShapeGeometry(shape), apBlade)
          blade.rotation.z = (bi / 8) * Math.PI * 2
          blade.position.z = 0.02 + bi * 0.002
          blade.userData.base = blade.rotation.z
          slab.add(blade); blades.push(blade)
        }
        slab.userData.blades = blades
        slab.userData.mats = [apMetal, apBlade, apGlass]
        scene.add(slab)

        resizeStone = () => {
          const w = sticky.clientWidth, h = sticky.clientHeight
          renderer!.setSize(w, h, false)
          cam.aspect = w / h
          cam.updateProjectionMatrix()
        }
        resizeStone()
        window.addEventListener('resize', resizeStone)

        renderFn = () => {
          if (!rock) return
          const p = st.p
          t2 += 0.016

          const drop = Math.min(p / 0.16, 1)
          const ease = 1 - Math.pow(1 - drop, 3)
          const y = 7 - ease * 7
          const scale = 0.28 + ease * 0.72

          const turn = Math.min(Math.max((p - 0.34) / 0.26, 0), 1)
          const turnE = turn * turn * (3 - 2 * turn)

          rock.position.y = y
          rock.scale.setScalar(scale * (1 + p * 0.35))
          rock.rotation.x = 0.25 + p * 0.45 - turnE * 0.62
          rock.rotation.y += 0.0032 * (1 - turnE)
          rock.rotation.y *= (1 - turnE * 0.06)
          setRockOpacity(rock, 1)
          rock.visible = true

          if (slab) {
            const apOpen = Math.min(Math.max((p - 0.46) / 0.22, 0), 1)
            slab.position.y = y * 0.35
            slab.position.z = -0.9
            slab.scale.setScalar(0.72 + turnE * 0.5 + p * 0.22)
            slab.rotation.z = turnE * 0.22
            slab.visible = turnE > 0.01
            const fade = turnE * 0.9
            ;(slab.userData.mats as THREE.MeshStandardMaterial[]).forEach((mt) => { mt.opacity = fade })
            ;(slab.userData.blades as THREE.Mesh[]).forEach((bl, i) => {
              bl.rotation.z = bl.userData.base + apOpen * 0.42 + Math.sin(t2 + i) * 0.012
            })
          }

          renderer!.render(scene, cam)
        }
        gsap.ticker.add(renderFn)
      } catch { /* no WebGL */ }
    }

    // ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: sect,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) {
        const p = self.progress
        st.p = p

        // Background
        const dark = Math.min(p / 0.2, 1)
        const c = Math.round(215 - dark * 205)
        sticky.style.background = `rgb(${c},${c},${c + 2})`
        const ink = dark > 0.5 ? 'rgba(240,237,232,0.92)' : '#1b1b1b'
        sticky.querySelectorAll<HTMLElement>('.stone-label,.stone-foot,.stone-link').forEach((el) => { el.style.color = ink })

        // Character scatter
        const scatter = Math.min(Math.max((p - 0.20) / 0.20, 0), 1)
        const quiet = Math.min(Math.max((p - 0.44) / 0.16, 0), 1)
        chars.forEach((b) => {
          const d = b.__d
          b.style.transform = `translate(${d.x * scatter}px,${d.y * scatter}px) rotate(${d.r * scatter}deg) scale(${1 + (d.s - 1) * scatter})`
          b.style.opacity = String((1 - scatter * 0.86) * (1 - quiet * 0.75))
          b.style.color = dark > 0.5 ? '#e8e5df' : '#1b1b1b'
        })

        // Cards slide in
        const cardsIn = Math.min(Math.max((p - 0.50) / 0.28, 0), 1)
        const out = Math.min(Math.max((p - 0.94) / 0.06, 0), 1)
        const cardCfg: [string, number][] = [['.c1', -1], ['.c4', 1], ['.c2', -1], ['.c5', 1], ['.c3', -1], ['.c6', 1]]
        cardCfg.forEach(([cls, dir], i) => {
          const el = sticky.querySelector<HTMLElement>(cls)
          if (!el) return
          const t = Math.min(Math.max((cardsIn * 1.45) - i * 0.075, 0), 1)
          const e = 1 - Math.pow(1 - t, 3)
          el.style.opacity = String(e * (1 - out))
          el.style.transform = `translateX(${dir * (1 - e) * 42}vw)`
        })
      },
    })

    return () => {
      trigger.kill()
      if (renderFn) gsap.ticker.remove(renderFn)
      if (resizeStone) window.removeEventListener('resize', resizeStone)
      if (renderer) renderer.dispose()
    }
  }, [])

  return (
    <section className="stone" id="services" ref={sectionRef}>
      <div className="stone-sticky" ref={stickyRef}>
        <canvas className="stone-canvas" ref={canvasRef} />
        {SERVICES.map((s) => (
          <div className={`svc-card ${s.cls}`} key={s.cls}>
            <h4>{s.title}</h4>
            <p>{s.desc}</p>
          </div>
        ))}
        <div className="stone-ui">
          <div className="stone-label">Our Services</div>
          <div className="stone-type" ref={typeRef}>
            {ST_LINES.map((line) => (
              <div className="st-line" key={line}>{line}</div>
            ))}
          </div>
          <div className="stone-foot">&#10022; Different disciplines. One standard of craft.</div>
          <Link href="#contact" className="stone-link">View services <span>&rarr;</span></Link>
        </div>
      </div>
    </section>
  )
}
