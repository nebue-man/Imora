/* ==========================================================================
   Imora Photography Studio — behaviour
   Requires (loaded before this file):
     three.js r128, GLTFLoader, DRACOLoader, GSAP + ScrollTrigger, Lenis
   ========================================================================== */

/* ============================================================
   WHATSAPP — set the number once, here.
   Full international format, digits only: country code + number,
   with no "+", spaces or dashes. India example: 919824182099
   ============================================================ */
var WA_NUMBER = '910000000000';   /* <-- REPLACE with Imora's real WhatsApp number */
var WA_TEXT   = 'Hi Imora, I would like to enquire about a shoot.';

/* Deliberately outside the animation block below: that block bails out
   early for visitors who prefer reduced motion, and the booking links
   must work regardless. */
(function(){
  var links = document.querySelectorAll('.wa-link');
  if(!links.length) return;

  var digits = String(WA_NUMBER).replace(/\D/g, '');
  var href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(WA_TEXT);

  Array.prototype.forEach.call(links, function(a){
    a.setAttribute('href', href);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  if(digits === '910000000000' || digits.length < 10){
    console.warn('[imora] WhatsApp links point at a placeholder number. ' +
                 'Set WA_NUMBER at the top of main.js.');
  }
})();

/* ============================================================
   SHOWREEL — click the poster to play.

   To wire up a real film, set data-video on #showreel in index.html:
     • YouTube   data-video="https://www.youtube.com/embed/VIDEO_ID"
     • Vimeo     data-video="https://player.vimeo.com/video/VIDEO_ID"
     • local file data-video="showreel.mp4"
   Anything ending .mp4/.webm/.mov plays through a native <video>;
   everything else is treated as an embed URL.
   ============================================================ */
(function(){
  var stage = document.getElementById('showreel');
  if(!stage) return;

  function play(){
    var src = (stage.getAttribute('data-video') || '').trim();

    if(!src){
      /* nothing wired up yet — say so rather than doing nothing */
      var cap = stage.querySelector('.reel-caption');
      if(cap) cap.textContent = 'No showreel added yet — see README section 4';
      console.info('[imora] showreel: set data-video on #showreel to enable playback.');
      return;
    }

    var isFile = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
    var player;

    if(isFile){
      player = document.createElement('video');
      player.src = src;
      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
    } else {
      player = document.createElement('iframe');
      /* autoplay once the visitor has clicked, which browsers allow */
      player.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
      player.allow = 'autoplay; fullscreen; picture-in-picture';
      player.setAttribute('allowfullscreen', '');
      player.setAttribute('title', 'Imora showreel');
    }

    stage.innerHTML = '';
    stage.appendChild(player);
    stage.style.cursor = 'default';
  }

  stage.addEventListener('click', play);
  stage.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); play(); }
  });
})();

/* ============================================================
   PODCAST ROOM — a scale model you look around from the inside.
   The camera sits at head height in the centre and only rotates,
   which is what makes it read as a 360 view, not a diorama.
   Kept outside the animation block below so it still works for
   visitors who prefer reduced motion.
   ============================================================ */
(function(){
  var canvas = document.getElementById('room-canvas');
  var stage = document.getElementById('stage');
  var hint = document.getElementById('hint');
  if(!canvas || !stage) return;

  function webglOK(){
    try{
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    }catch(e){ return false; }
  }
  if(typeof THREE === 'undefined' || !webglOK()){
    document.body.classList.add('no-3d');
    return;
  }

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08080a);
  scene.fog = new THREE.Fog(0x08080a, 9, 22);

  var camera = new THREE.PerspectiveCamera(68, 1, 0.1, 100);
  camera.position.set(0, 1.55, 0);
  camera.rotation.order = 'YXZ';

  var W = 8, D = 9, H = 3.2;   /* room in metres */

  function noiseTex(base, spec, size){
    var c = document.createElement('canvas');
    c.width = c.height = size || 256;
    var x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
    for(var i = 0; i < 14000; i++){
      x.fillStyle = 'rgba(' + spec + ',' + (0.03 + Math.random() * 0.16) + ')';
      x.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  var matFloor = new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.94 });
  var matCeil  = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 1 });
  var matWall  = new THREE.MeshStandardMaterial({ map: noiseTex('#1a1a1f', '90,88,84'), roughness: 0.95 });
  var matPanel = new THREE.MeshStandardMaterial({ color: 0x24242a, roughness: 1 });
  var matDark  = new THREE.MeshStandardMaterial({ color: 0x0e0e11, roughness: 0.7, metalness: 0.25 });
  var matMetal = new THREE.MeshStandardMaterial({ color: 0x8d9198, roughness: 0.35, metalness: 0.9 });
  var matWood  = new THREE.MeshStandardMaterial({ color: 0x4a3527, roughness: 0.68 });
  var matGold  = new THREE.MeshStandardMaterial({ color: 0xc9a76a, roughness: 0.4, metalness: 0.7 });

  function box(w, h, d, mat, x, y, z){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); scene.add(m); return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, seg){
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
    m.position.set(x, y, z); scene.add(m); return m;
  }

  /* shell */
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), matFloor);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), matCeil);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; scene.add(ceil);
  [[0, -D/2, 0], [0, D/2, Math.PI], [-W/2, 0, Math.PI/2], [W/2, 0, -Math.PI/2]]
    .forEach(function(w, i){
      var wall = new THREE.Mesh(new THREE.PlaneGeometry(i < 2 ? W : D, H), matWall);
      wall.position.set(i < 2 ? 0 : w[0], H/2, i < 2 ? w[1] : 0);
      wall.rotation.y = w[2];
      scene.add(wall);
    });

  /* acoustic treatment */
  for(var px = -3; px <= 3; px += 1.0){
    for(var py = 0; py < 3; py++){
      var p = box(0.86, 0.72, 0.09, matPanel, px, 0.85 + py * 0.8, -D/2 + 0.06);
      p.rotation.z = (px + py) % 2 ? 0 : Math.PI / 2;
    }
  }
  [[-W/2 + 0.35, -D/2 + 0.35], [W/2 - 0.35, -D/2 + 0.35]].forEach(function(c){
    cyl(0.28, 0.28, H, matPanel, c[0], H/2, c[1], 12);
  });

  /* table */
  box(2.6, 0.09, 1.25, matWood, 0, 0.74, -0.2);
  [[-1.15, -0.9], [1.15, -0.9], [-1.15, 0.1], [1.15, 0.1]].forEach(function(l){
    cyl(0.05, 0.05, 0.74, matDark, l[0], 0.37, l[1], 10);
  });

  /* seats */
  var seats = [[-0.85, 0.75], [0.85, 0.75], [-0.85, -1.2], [0.85, -1.2]];
  seats.forEach(function(s){
    box(0.52, 0.08, 0.5, matDark, s[0], 0.45, s[1]);
    box(0.52, 0.62, 0.08, matDark, s[0], 0.78, s[1] + (s[1] > 0 ? 0.22 : -0.22));
    cyl(0.05, 0.05, 0.45, matMetal, s[0], 0.22, s[1], 10);
    cyl(0.26, 0.26, 0.03, matMetal, s[0], 0.02, s[1], 14);
  });

  /* mics on boom arms */
  seats.forEach(function(s){
    var dir = s[1] > 0 ? -1 : 1;
    var arm = box(0.045, 0.045, 0.85, matDark, s[0], 1.16, s[1] + dir * 0.42);
    arm.rotation.x = dir * 0.32;
    var mic = cyl(0.05, 0.062, 0.2, matDark, s[0], 1.02, s[1] + dir * 0.74, 14);
    mic.rotation.x = dir * 0.85;
    cyl(0.058, 0.058, 0.02, matGold, s[0], 0.94, s[1] + dir * 0.8, 14);
  });

  /* three camera rigs */
  [{ x: 0, z: 2.9, ry: Math.PI },
   { x: -2.2, z: 1.9, ry: Math.PI - 0.62 },
   { x: 2.2, z: 1.9, ry: Math.PI + 0.62 }].forEach(function(c){
    cyl(0.035, 0.035, 1.35, matMetal, c.x, 0.68, c.z, 10);
    [0, 2.1, 4.2].forEach(function(a){
      var leg = cyl(0.02, 0.02, 0.8, matMetal, c.x + Math.sin(a) * 0.22, 0.33, c.z + Math.cos(a) * 0.22, 8);
      leg.rotation.z = Math.sin(a) * 0.3;
      leg.rotation.x = Math.cos(a) * 0.3;
    });
    var body = box(0.3, 0.21, 0.19, matDark, c.x, 1.45, c.z);
    body.rotation.y = c.ry;
    var lensGrp = new THREE.Group();
    var lens = cyl(0.075, 0.085, 0.26, matDark, 0, 0, -0.2, 20);
    lens.rotation.x = Math.PI / 2;
    var ring = cyl(0.088, 0.088, 0.03, matMetal, 0, 0, -0.33, 20);
    ring.rotation.x = Math.PI / 2;
    lensGrp.add(lens); lensGrp.add(ring);
    lensGrp.position.set(c.x, 1.45, c.z);
    lensGrp.rotation.y = c.ry;
    scene.add(lensGrp);
    var tally = cyl(0.014, 0.014, 0.012, new THREE.MeshStandardMaterial({
      color: 0xe8703a, emissive: 0xe8703a, emissiveIntensity: 2.4
    }), c.x, 1.57, c.z, 10);
    tally.rotation.x = Math.PI / 2;
  });

  /* lighting rig */
  function softbox(x, z, tint, power){
    var panel = box(0.86, 0.86, 0.07, new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: tint, emissiveIntensity: 1.5
    }), x, 2.42, z);
    panel.lookAt(0, 1.2, -0.2);
    var l = new THREE.PointLight(tint, power, 12, 2);
    l.position.set(x, 2.35, z); scene.add(l);
    cyl(0.02, 0.02, 0.75, matMetal, x, 2.82, z, 8);
  }
  softbox(-1.9, 1.7, 0xfff2e0, 12);
  softbox(1.9, 1.7, 0xfff2e0, 12);
  softbox(0, -2.6, 0xffe9d0, 8);

  [-2.6, -1.3, 1.3, 2.6].forEach(function(x, i){
    var col = i % 2 ? 0xc9a76a : 0xe8703a;
    box(0.06, 1.7, 0.06, new THREE.MeshStandardMaterial({
      color: col, emissive: col, emissiveIntensity: 2.2
    }), x, 1.5, -D/2 + 0.16);
    var pl = new THREE.PointLight(col, 3.2, 6, 2);
    pl.position.set(x, 1.5, -D/2 + 0.5); scene.add(pl);
  });

  var mon = box(1.0, 0.58, 0.05, new THREE.MeshStandardMaterial({
    color: 0x0a0a0c, emissive: 0x24303c, emissiveIntensity: 0.85
  }), 0, 1.75, D/2 - 0.12);
  mon.rotation.y = Math.PI;

  scene.add(new THREE.AmbientLight(0xffffff, 0.34));
  scene.add(new THREE.HemisphereLight(0xbfd0e8, 0x201a14, 0.5));

  /* look-around controls */
  var yaw = Math.PI, pitch = -0.04, tYaw = Math.PI, tPitch = -0.04;
  var fov = 68, tFov = 68;
  var dragging = false, lx = 0, ly = 0, touched = false;

  function hideHint(){
    if(touched) return;
    touched = true;
    if(hint) hint.classList.add('hide');
  }

  stage.addEventListener('pointerdown', function(e){
    dragging = true; lx = e.clientX; ly = e.clientY;
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
    hideHint();
  });
  stage.addEventListener('pointermove', function(e){
    if(!dragging) return;
    tYaw   -= (e.clientX - lx) * 0.0042;
    tPitch -= (e.clientY - ly) * 0.0034;
    tPitch = Math.max(-0.62, Math.min(0.55, tPitch));
    lx = e.clientX; ly = e.clientY;
  });
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){
    stage.addEventListener(ev, function(){
      dragging = false; stage.classList.remove('dragging');
    });
  });
  stage.addEventListener('wheel', function(e){
    e.preventDefault();
    tFov = Math.max(38, Math.min(88, tFov + e.deltaY * 0.045));
  }, { passive: false });

  var views = [
    { yaw: Math.PI * 0.72, pitch: -0.05, fov: 62 },
    { yaw: Math.PI * 1.28, pitch: -0.05, fov: 62 },
    { yaw: 0,              pitch: 0.02,  fov: 66 },
    { yaw: Math.PI,        pitch: -0.06, fov: 84 }
  ];
  document.querySelectorAll('.room-legend button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = views[+b.dataset.view] || views[3];
      tYaw = v.yaw; tPitch = v.pitch; tFov = v.fov;
      hideHint();
    });
  });

  function resizeRoom(){
    var w = stage.clientWidth, h = stage.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resizeRoom();
  window.addEventListener('resize', resizeRoom);

  var idle = 0;
  (function loop(){
    requestAnimationFrame(loop);
    if(!touched){ idle += 0.0016; tYaw = Math.PI + Math.sin(idle) * 0.32; }
    yaw   += (tYaw - yaw) * 0.075;
    pitch += (tPitch - pitch) * 0.075;
    fov   += (tFov - fov) * 0.09;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    renderer.render(scene, camera);
  })();
})();

/* ============================================================
   EVERYTHING ELSE — scroll-driven animation.
   Bails out entirely if the visitor prefers reduced motion.
   ============================================================ */
(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion || typeof gsap === 'undefined'){
    document.body.classList.add('no-motion');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis ---------- */
  var lenis = new Lenis({
    duration: 1.1,
    easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
  });
  gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);

  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var href = a.getAttribute('href');
      var target = href.length > 1 ? document.querySelector(href) : null;
      if(target){ e.preventDefault(); lenis.scrollTo(target, { offset: -20, duration: 1.4 }); }
    });
  });

  /* ---------- Cursor ---------- */
  var dot = document.querySelector('.cursor-dot');
  var outline = document.querySelector('.cursor-outline');
  gsap.set([dot, outline], { xPercent: -50, yPercent: -50 });
  var dotX = gsap.quickTo(dot,'x',{duration:0.12,ease:'power3'});
  var dotY = gsap.quickTo(dot,'y',{duration:0.12,ease:'power3'});
  var outX = gsap.quickTo(outline,'x',{duration:0.45,ease:'power3'});
  var outY = gsap.quickTo(outline,'y',{duration:0.45,ease:'power3'});
  var pointer = { x: 0, y: 0 };
  window.addEventListener('mousemove', function(e){
    dotX(e.clientX); dotY(e.clientY); outX(e.clientX); outY(e.clientY);
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  });
  document.querySelectorAll('a, .genre-card, .hwork-item, .btn, .service-row').forEach(function(el){
    el.addEventListener('mouseenter', function(){ outline.classList.add('hover'); });
    el.addEventListener('mouseleave', function(){ outline.classList.remove('hover'); });
  });

  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      gsap.to(btn, { x:(e.clientX-r.left-r.width/2)*0.35, y:(e.clientY-r.top-r.height/2)*0.35, duration:0.3, ease:'power2.out' });
    });
    btn.addEventListener('mouseleave', function(){
      gsap.to(btn, { x:0, y:0, duration:0.6, ease:'elastic.out(1,0.4)' });
    });
  });

  /* ---------- Text splitting ---------- */
  function splitWords(el){
    var parts = el.innerHTML.split(/(<br\s*\/?>)/i);
    el.innerHTML = parts.map(function(part){
      if(/^<br/i.test(part)) return part;
      return part.split(' ').filter(function(w){ return w.length; }).map(function(w){
        return '<span class="split-word"><span class="split-inner">' + w + '</span></span>';
      }).join(' ');
    }).join('');
  }
  /* Characters are wrapped per-word, otherwise the browser is free to
     break a line between any two inline-block letters ("li / ttle"). */
  function splitChars(el){
    el.innerHTML = el.textContent.split(' ').map(function(word){
      return '<span class="blur-word">' + word.split('').map(function(ch){
        return '<span class="blur-char">' + ch + '</span>';
      }).join('') + '</span>';
    }).join(' ');
    return el.querySelectorAll('.blur-char');
  }

  /* ---------- Preloader + hero intro ----------
     Every block below is optional: this same script runs on the chooser,
     the photography page and the studio page, and each has a different
     set of sections. Anything missing is simply skipped. */
  var heroTitle = document.querySelector('.hero-title');
  var heroChars = heroTitle ? splitChars(heroTitle) : [];
  if(heroChars.length) gsap.set(heroChars, { filter:'blur(14px)', opacity:0, y:12 });

  function playHero(){
    var tl = gsap.timeline({ defaults:{ ease:'power3.out' } });
    if(heroChars.length){
      tl.to(gsap.utils.shuffle(Array.from(heroChars)), { filter:'blur(0px)', opacity:1, y:0, duration:1.1, stagger:0.018 });
    }
    if(document.querySelector('.hero-cta'))    tl.to('.hero-cta',    { opacity:1, duration:0.8 }, '-=0.7');
    if(document.querySelector('.hero-meta'))   tl.to('.hero-meta',   { opacity:1, duration:0.8 }, '-=0.6');
    if(document.querySelector('.hero-hint'))   tl.to('.hero-hint',   { opacity:1, duration:0.8 }, '-=0.5');
    if(document.querySelector('.hero-scroll')) tl.to('.hero-scroll', { opacity:1, duration:0.8 }, '-=0.5');
    if(document.querySelector('.pick-panel'))  tl.to('.pick-panel',  { opacity:1, y:0, duration:1, stagger:0.12 }, '-=0.8');
  }

  var preloader = document.querySelector('.preloader');
  var fillEl = document.querySelector('.preloader-fill');
  var countEl = document.querySelector('.preloader-count');

  if(preloader && fillEl && countEl){
    var counter = { val: 0 };
    gsap.to(counter, {
      val:100, duration:1.3, ease:'power2.inOut',
      onUpdate: function(){
        var v = Math.round(counter.val);
        countEl.textContent = v; fillEl.style.width = v + '%';
      },
      onComplete: function(){
        gsap.to(preloader, {
          yPercent:-100, duration:0.9, ease:'power4.inOut', delay:0.15,
          onComplete: function(){
            preloader.style.display = 'none';
            playHero(); startMonogramIntro(); ScrollTrigger.refresh();
          }
        });
      }
    });
  } else {
    /* no preloader on this page — run the intro straight away */
    playHero(); startMonogramIntro();
  }

  /* ---------- Statement: words brighten as you scroll through ---------- */
  (function(){
    var el = document.querySelector('[data-words]');
    if(!el) return;
    el.innerHTML = el.textContent.split(' ').map(function(w){
      return '<span class="w">' + w + '</span>';
    }).join(' ');
    gsap.to(el.querySelectorAll('.w'), {
      color: '#f4ede3', ease: 'none', stagger: 0.4,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: 0.6 }
    });
  })();

  /* ================================================================
     BACKGROUND 3D — the camera mark, built from real components.
     Scrolling through the top zone bursts it apart; the shards keep
     drifting behind the following sections while ghosted wireframe
     copies of the whole mark hang further back.
     ================================================================ */

  var bg = { blast: 0, intro: 1, progress: 0 };

  function supportsWebGL(){
    try{
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    }catch(e){ return false; }
  }

  function startMonogramIntro(){
    gsap.to(bg, { intro: 0, duration: 1.9, ease: 'power3.out' });
  }

  function initBackground3D(){
    var canvas = document.querySelector('.bg-canvas');
    if(!canvas || typeof THREE === 'undefined' || !supportsWebGL()) return;

    var renderer;
    try{ renderer = new THREE.WebGLRenderer({ canvas:canvas, alpha:true, antialias:true }); }
    catch(e){ return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(0, 0, 9);

    /* gradient environment gives the panels their white-to-black sheen */
    var envCanvas = document.createElement('canvas');
    envCanvas.width = 32; envCanvas.height = 256;
    var ectx = envCanvas.getContext('2d');
    var grad = ectx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, '#ffffff');
    grad.addColorStop(0.30, '#c3c8ce');
    grad.addColorStop(0.52, '#3a3a42');
    grad.addColorStop(0.76, '#141418');
    grad.addColorStop(1.00, '#050506');
    ectx.fillStyle = grad; ectx.fillRect(0, 0, 32, 256);
    var envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    try{
      var cubeRT = new THREE.WebGLCubeRenderTarget(128);
      cubeRT.fromEquirectangularTexture(renderer, envTex);
      scene.environment = cubeRT.texture;
    }catch(e){}

    scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    var key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 6, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0xe8703a, 1.3); rim.position.set(-5, -2, 3); scene.add(rim);

    var group = new THREE.Group();
    scene.add(group);

    /* two materials: cold chrome, and the warm ember accent */
    var matCold = new THREE.MeshStandardMaterial({ color:0x16161a, metalness:0.97, roughness:0.15, envMapIntensity:1.6, side:THREE.DoubleSide });
    var matWarm = new THREE.MeshStandardMaterial({ color:0x2a1409, metalness:0.85, roughness:0.28, envMapIntensity:1.2, emissive:0xe8703a, emissiveIntensity:0.55, side:THREE.DoubleSide });

    /* ================= the camera =================
       Preferred path: load canon_eos_5d_mark_iv.glb and explode its
       sub-meshes. If the file is missing or blocked (opening the page
       straight off disk blocks model fetches), fall back to the
       procedural camera built further down.
       ============================================== */
    var DEPTH = 0.9;
    var shards = [];

    /* burst data — `unit` converts world distance into the mesh's own
       local space, so scaled GLB parts travel as far as procedural ones */
    function shardData(unit){
      var u = unit || 1;
      return {
        dir: new THREE.Vector3((Math.random()-0.5)*3.4*u, (Math.random()-0.5)*3.0*u, (Math.random()-0.5)*3.4*u),
        spin: new THREE.Vector3((Math.random()-0.5)*4, (Math.random()-0.5)*4, (Math.random()-0.5)*4),
        drift: new THREE.Vector3((Math.random()-0.5)*0.5*u, (Math.random()-0.5)*0.35*u, (Math.random()-0.5)*0.5*u)
      };
    }

    function addShard(mesh, unit){
      var d = shardData(unit);
      d.home = mesh.position.clone();
      d.homeRot = mesh.rotation.clone();
      mesh.userData = d;
      if(!mesh.parent) group.add(mesh);
      shards.push(mesh);
    }

    /* ---- try the real model first ---- */
    var MODEL_URL = 'canon_eos_5d_mark_iv.glb';
    var modelLoaded = false;

    if(location.protocol === 'file:'){
      console.warn(
        '[imora] This page was opened straight from disk (file://). Browsers refuse to ' +
        'fetch .glb files that way, so the hero is showing the built-in placeholder camera. ' +
        'Serve the folder over http (e.g. `python -m http.server 8000`) and open ' +
        'http://localhost:8000/index.html to load ' + MODEL_URL + '.'
      );
    }
    if(typeof THREE.GLTFLoader === 'undefined'){
      console.warn('[imora] GLTFLoader script did not load — check the CDN <script> tag.');
    }

    if(typeof THREE.GLTFLoader !== 'undefined'){
      var gltfLoader = new THREE.GLTFLoader();
      if(typeof THREE.DRACOLoader !== 'undefined'){
        try{
          var draco = new THREE.DRACOLoader();
          draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
          gltfLoader.setDRACOLoader(draco);
        }catch(e){}
      }
      gltfLoader.load(MODEL_URL, function(gltf){
        if(modelLoaded) return;
        modelLoaded = true;
        console.info('[imora] camera model loaded — swapping out the placeholder.');

        var model = gltf.scene;

        /* Centre on origin and scale to roughly 2.6 units across.
           Order matters: scale first, then offset by the centre TIMES
           the scale. Setting position before scaling leaves any model
           that isn't authored around its origin sitting off-screen. */
        var box = new THREE.Box3().setFromObject(model);
        var size = box.getSize(new THREE.Vector3());
        var mid = box.getCenter(new THREE.Vector3());
        var span = Math.max(size.x, size.y, size.z) || 1;
        var s = 2.6 / span;

        model.scale.setScalar(s);
        model.position.set(-mid.x * s, -mid.y * s, -mid.z * s);
        group.add(model);

        /* only now retire the procedural stand-in, so a failure above
           leaves us with a camera rather than an empty hero */
        shards = shards.filter(function(m){
          if(m.userData && m.userData.__proc){ group.remove(m); return false; }
          return true;
        });

        /* every sub-mesh becomes a shard so the blast disassembles it */
        var unit = 1 / s;
        model.traverse(function(o){
          if(o.isMesh){
            if(o.material){
              o.material.envMapIntensity = 1.5;
              o.material.needsUpdate = true;
            }
            addShard(o, unit);
          }
        });
      }, undefined, function(err){
        /* couldn't fetch or parse — keep the procedural camera */
        console.error(
          '[imora] could not load "' + MODEL_URL + '" — showing the placeholder camera instead.',
          err
        );
      });
    }

    /* --- rounded, bevelled slab helper --- */
    function roundedRect(w, h, r){
      var s = new THREE.Shape();
      s.moveTo(-w/2 + r, -h/2);
      s.lineTo(w/2 - r, -h/2);
      s.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
      s.lineTo(w/2, h/2 - r);
      s.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
      s.lineTo(-w/2 + r, h/2);
      s.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
      s.lineTo(-w/2, -h/2 + r);
      s.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
      return s;
    }
    function slabGeo(w, h, d, r){
      var g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
        depth: d, bevelEnabled: true, bevelThickness: 0.035,
        bevelSize: 0.035, bevelSegments: 3, curveSegments: 14
      });
      g.translate(0, 0, -d / 2);
      return g;
    }

    /* --- textures --- */
    function makeTex(w, h, draw, repX, repY){
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(c);
      if(repX || repY){
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(repX || 1, repY || 1);
      }
      return t;
    }

    /* pebbled leather body covering */
    var leatherTex = makeTex(512, 512, function(x, w, h){
      x.fillStyle = '#141416'; x.fillRect(0, 0, w, h);
      for(var i = 0; i < 26000; i++){
        var v = 18 + Math.random() * 34;
        x.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 3) + ',' + (0.25 + Math.random() * 0.5) + ')';
        var s = 2 + Math.random() * 3;
        x.fillRect(Math.random() * w, Math.random() * h, s, s);
      }
    }, 3, 2);

    /* vertical ribs for the focus ring */
    var ribTex = makeTex(512, 64, function(x, w, h){
      x.fillStyle = '#1b1b1e'; x.fillRect(0, 0, w, h);
      for(var i = 0; i < 96; i++){
        x.fillStyle = i % 2 ? '#333338' : '#101013';
        x.fillRect(i * (w / 96), 0, (w / 96) * 0.55, h);
      }
    });

    /* --- materials --- */
    var matLeather = new THREE.MeshStandardMaterial({ map: leatherTex, color: 0x9a9a9a, roughness: 0.92, metalness: 0.05 });
    var matSteel   = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.28, metalness: 0.95, envMapIntensity: 1.7 });
    var matBlack   = new THREE.MeshStandardMaterial({ color: 0x121215, roughness: 0.55, metalness: 0.35 });
    var matRib     = new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.5, metalness: 0.7, envMapIntensity: 1.2 });
    var matGlass   = new THREE.MeshStandardMaterial({ color: 0x0b1a2c, roughness: 0.04, metalness: 1.0, envMapIntensity: 2.6 });

    /* --- body --- */
    var body = new THREE.Mesh(slabGeo(2.55, 1.5, DEPTH, 0.16), matLeather);
    addShard(body);

    /* --- top plate --- */
    var topPlate = new THREE.Mesh(slabGeo(2.5, 0.34, DEPTH * 0.94, 0.08), matSteel);
    topPlate.position.y = 0.9;
    addShard(topPlate);

    /* --- pentaprism hump --- */
    var prism = new THREE.Mesh(slabGeo(0.78, 0.4, DEPTH * 0.72, 0.07), matSteel);
    prism.position.set(0, 1.24, 0);
    addShard(prism);

    /* --- hot shoe --- */
    var shoe = new THREE.Mesh(slabGeo(0.34, 0.12, 0.26, 0.03), matBlack);
    shoe.position.set(0, 1.5, 0);
    addShard(shoe);

    /* --- dials, shutter button, film-advance --- */
    function dial(r, hgt, mat){
      var d = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.94, hgt, 30), mat);
      return d;
    }
    var dialL = dial(0.2, 0.16, matSteel); dialL.position.set(-0.92, 1.14, 0); addShard(dialL);
    var dialR = dial(0.22, 0.16, matSteel); dialR.position.set(0.86, 1.14, 0); addShard(dialR);
    var shutter = dial(0.1, 0.1, matWarm); shutter.position.set(0.86, 1.26, 0); addShard(shutter);

    /* --- lens: mount ring, barrel, ribbed focus ring, front ring --- */
    function tube(rTop, rBot, len, mat, z){
      var m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 46, 1, true), mat);
      m.rotation.x = Math.PI / 2;
      m.position.z = z;
      return m;
    }
    var zf = DEPTH / 2;
    addShard(tube(0.68, 0.68, 0.14, matSteel, zf + 0.07));     /* mount */
    addShard(tube(0.60, 0.62, 0.30, matBlack, zf + 0.29));     /* barrel */
    var focus = tube(0.63, 0.63, 0.34, matRib, zf + 0.60);     /* ribbed focus ring */
    addShard(focus);
    addShard(tube(0.55, 0.60, 0.16, matSteel, zf + 0.85));     /* front ring */

    /* front element — coated glass, slightly domed */
    var glass = new THREE.Mesh(new THREE.SphereGeometry(0.53, 40, 24, 0, Math.PI * 2, 0, 0.72), matGlass);
    glass.rotation.x = Math.PI / 2;   /* dome the cap toward the viewer */
    glass.position.z = zf + 0.80;
    addShard(glass);

    /* lens cap ring highlight */
    var innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.022, 10, 44), matSteel);
    innerRing.position.z = zf + 0.92;
    addShard(innerRing);

    /* --- strap lugs --- */
    [-1.32, 1.32].forEach(function(x){
      var lug = new THREE.Mesh(slabGeo(0.14, 0.2, 0.16, 0.04), matSteel);
      lug.position.set(x, 0.62, 0);
      addShard(lug);
    });

    /* tag the procedural build so the real model can replace it on load */
    if(!modelLoaded) shards.forEach(function(m){ m.userData.__proc = true; });

    /* silhouette used for the ghosted wireframe copies behind the camera */
    var specs = [
      { x:0,    y:0,    w:2.55, h:1.5  },
      { x:0,    y:0.9,  w:2.5,  h:0.34 },
      { x:0,    y:1.24, w:0.78, h:0.4  }
    ];

    /* ---- ghosted wireframe copies of the whole mark ---- */
    var ghosts = [];
    for(var gi = 0; gi < 3; gi++){
      var gGroup = new THREE.Group();
      specs.forEach(function(sp){
        var eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(sp.w, sp.h, DEPTH));
        var lm = new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.09 });
        var ln = new THREE.LineSegments(eg, lm);
        ln.position.set(sp.x, sp.y, 0);
        gGroup.add(ln);
      });
      var sc = 1.7 + gi * 1.5;
      gGroup.scale.setScalar(sc);
      gGroup.position.z = -3 - gi * 4;
      gGroup.userData = { speed: 0.0016 - gi * 0.0004, base: sc };
      scene.add(gGroup); ghosts.push(gGroup);
    }

    /* ---- ember streaks ---- */
    var streaks = [];
    var streakColors = [0xe8703a, 0xffffff, 0xc9a76a, 0x6f9ad6];
    for(var si = 0; si < 16; si++){
      var len = 0.5 + Math.random() * 2.4;
      var sgeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(len, -len * 0.55, 0)
      ]);
      var smat = new THREE.LineBasicMaterial({
        color: streakColors[si % streakColors.length], transparent:true, opacity:0.5
      });
      var st = new THREE.Line(sgeo, smat);
      st.userData = {
        speed: 0.5 + Math.random() * 1.6,
        reset: function(o){
          o.position.set(-9 - Math.random()*6, 5 + Math.random()*6, -2 - Math.random()*7);
        }
      };
      st.userData.reset(st);
      scene.add(st); streaks.push(st);
    }

    /* ---- hold to blast ---- */
    function blastOn(){ gsap.to(bg, { blast:1, duration:0.8, ease:'power2.out' }); }
    function blastOff(){ gsap.to(bg, { blast:0, duration:1.5, ease:'elastic.out(1,0.55)' }); }
    window.addEventListener('pointerdown', function(e){
      if(e.target.closest('a, button')) return;
      if(window.scrollY < window.innerHeight * 1.2) blastOn();
    });
    window.addEventListener('pointerup', blastOff);
    window.addEventListener('pointercancel', blastOff);

    /* ---- sizing ---- */
    function resize(){
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 1 ? 13 : 9;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---- scroll drives the fragmentation across the whole top zone ---- */
    ScrollTrigger.create({
      trigger: '#zone3d', start: 'top top', end: 'bottom bottom', scrub: 0.5,
      onUpdate: function(self){ bg.progress = self.progress; }
    });

    /* ---- render loop ---- */
    var clock = new THREE.Clock();
    var t = 0;
    gsap.ticker.add(function(){
      /* getElapsedTime() would consume the delta, so track time by hand */
      var dt = Math.min(clock.getDelta(), 0.05);
      t += dt;
      var p = bg.progress;

      /* burst ramps in over the first third of the zone, then keeps drifting */
      var burst = Math.min(p / 0.34, 1);
      burst = burst * burst * (3 - 2 * burst);            /* smoothstep */
      var drift = Math.max(0, p - 0.34) * 5.5;
      var spread = burst * 2.4 + drift + bg.blast * 2.2 + bg.intro * 1.6;

      group.rotation.y += 0.0038;
      group.rotation.x += (pointer.y * 0.20 - group.rotation.x) * 0.04;
      group.rotation.z = Math.sin(t * 0.3) * 0.05 + pointer.x * 0.07;
      group.position.y = -p * 1.4;

      shards.forEach(function(m){
        var d = m.userData;
        m.position.copy(d.home)
          .addScaledVector(d.dir, spread)
          .addScaledVector(d.drift, Math.sin(t * 0.4 + d.home.y) * spread * 0.4);
        m.rotation.set(
          d.homeRot.x + d.spin.x * spread * 0.45,
          d.homeRot.y + d.spin.y * spread * 0.45,
          d.homeRot.z + d.spin.z * spread * 0.45
        );
      });

      ghosts.forEach(function(g, i){
        g.rotation.y += g.userData.speed;
        g.rotation.x = Math.sin(t * 0.12 + i) * 0.14;
        g.position.y = Math.sin(t * 0.16 + i * 2) * 0.5 - p * 2.2;
        g.children.forEach(function(ln){
          ln.material.opacity = (0.10 - i * 0.022) * (0.35 + burst * 0.65);
        });
      });

      streaks.forEach(function(st){
        st.position.x += st.userData.speed * dt * 9;
        st.position.y -= st.userData.speed * dt * 5;
        st.material.opacity = 0.42 * (0.25 + burst * 0.75);
        if(st.position.x > 13 || st.position.y < -8) st.userData.reset(st);
      });

      camera.position.x += (pointer.x * 0.75 - camera.position.x) * 0.04;
      camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, group.position.y * 0.35, 0);

      /* fade the whole scene out as the zone ends */
      canvas.style.opacity = String(1 - Math.max(0, (p - 0.86) / 0.14));

      renderer.render(scene, camera);
    });
  }

  /* An error in the 3D scene must never take the rest of the page with
     it — everything below this point registers its own scroll triggers. */
  try{ initBackground3D(); }
  catch(err){ console.error('[imora] hero 3D failed:', err); }

  /* ---------- Section head reveals ---------- */
  function revealHead(block){
    var eyebrow = block.querySelector('.eyebrow');
    var heading = block.querySelector('h2');
    var para = block.querySelector('p');
    var btn = block.querySelector('.btn');
    if(heading){ splitWords(heading); gsap.set(heading.querySelectorAll('.split-inner'), { yPercent:110 }); }
    if(eyebrow) gsap.set(eyebrow, { opacity:0, y:20 });
    if(para) gsap.set(para, { opacity:0, y:20 });
    if(btn) gsap.set(btn, { opacity:0, y:20 });
    ScrollTrigger.create({
      trigger: block, start:'top 85%',
      onEnter: function(){
        var tl = gsap.timeline({ defaults:{ ease:'power3.out' } });
        if(eyebrow) tl.to(eyebrow, { opacity:1, y:0, duration:0.6 }, 0);
        if(heading) tl.to(heading.querySelectorAll('.split-inner'), { yPercent:0, duration:0.9, stagger:0.02 }, 0.08);
        if(para) tl.to(para, { opacity:1, y:0, duration:0.8 }, 0.2);
        if(btn) tl.to(btn, { opacity:1, y:0, duration:0.8 }, 0.3);
      }
    });
  }
  document.querySelectorAll('.section-head').forEach(revealHead);
  var ctaBlock = document.querySelector('.cta .container');
  if(ctaBlock) revealHead(ctaBlock);

  /* ---------- About ---------- */
  if(document.querySelector('.about-grid')){
    gsap.set('.about-img', { clipPath:'inset(0% 0% 100% 0%)' });
    gsap.set('.about-text', { opacity:0, y:40 });
    ScrollTrigger.create({
      trigger:'.about-grid', start:'top 78%',
      onEnter: function(){
        gsap.to('.about-img', { clipPath:'inset(0% 0% 0% 0%)', duration:1.2, ease:'power4.out' });
        gsap.to('.about-text', { opacity:1, y:0, duration:1, ease:'power3.out', delay:0.15 });
      }
    });
  }

  document.querySelectorAll('.about-stats h3').forEach(function(el){
    var target = parseInt(el.textContent, 10);
    var suffix = el.textContent.replace(/[0-9]/g, '');
    var obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el, start:'top 90%', once:true,
      onEnter: function(){
        gsap.to(obj, { val:target, duration:1.6, ease:'power2.out',
          onUpdate: function(){ el.textContent = Math.round(obj.val) + suffix; } });
      }
    });
  });

  /* ---------- Key facts: the card plane tilts up into place ---------- */
  (function(){
    var grid = document.querySelector('.kf-grid');
    if(!grid) return;

    /* whole plane starts pitched back and skewed, then straightens on scroll */
    gsap.fromTo(grid,
      { rotateX: 24, rotateZ: 3.5, y: 90, scale: 0.9 },
      {
        rotateX: 0, rotateZ: 0, y: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.kf', start: 'top 62%', end: 'top -5%', scrub: 0.6 }
      }
    );

    /* each card fades up slightly behind the plane movement */
    gsap.utils.toArray('.kf-card').forEach(function(card, i){
      gsap.fromTo(card,
        { opacity: 0.15, y: 40 },
        {
          opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: '.kf', start: 'top ' + (60 - i * 4) + '%', end: 'top 8%', scrub: 0.6 }
        }
      );
    });

    gsap.from('.kf-head > *', {
      opacity: 0, y: 34, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.kf', start: 'top 78%' }
    });
    gsap.from('.kf-logos b', {
      opacity: 0, y: 18, duration: 0.7, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: '.kf-partners', start: 'top 88%' }
    });
  })();

  /* ---------- Selected work: vertical scroll drives horizontal travel ---------- */
  (function(){
    var inner = document.querySelector('.hwork-inner');
    var sect = document.querySelector('.hwork');
    if(!inner || !sect || window.innerWidth <= 900) return;

    /* measure the track itself — scrollWidth can read short while the
       section is clipped, which would cut the travel distance */
    var getDistance = function(){
      var w = 0;
      Array.prototype.forEach.call(inner.children, function(c){
        w += c.getBoundingClientRect().width;
      });
      return Math.max(0, w - window.innerWidth);
    };

    gsap.to(inner, {
      x: function(){ return -getDistance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: sect,
        start: 'top top',
        end: function(){ return '+=' + getDistance(); },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* the lead heading eases in just before the track starts moving */
    gsap.from('.hwork-lead > *', {
      opacity: 0, y: 40, duration: 0.9, stagger: 0.14, ease: 'power3.out',
      scrollTrigger: { trigger: sect, start: 'top 55%' }
    });
  })();

  /* ================================================================
     STONE SERVICES
     A rock drops in and grows, the stacked wordmark scatters apart,
     the rock resolves into a carved square slab, and the five service
     cards fly in from opposite corners.
     ================================================================ */
  (function(){
    var sect = document.querySelector('.stone');
    var sticky = document.querySelector('.stone-sticky');
    var canvas = document.querySelector('.stone-canvas');
    if(!sect || !sticky) return;

    /* --- split the stacked type into characters --- */
    var chars = [];
    document.querySelectorAll('.st-line').forEach(function(line){
      var txt = line.textContent;
      line.innerHTML = txt.split('').map(function(c){ return '<b>' + c + '</b>'; }).join('');
      line.querySelectorAll('b').forEach(function(b){
        b.__d = {
          x: (Math.random() - 0.5) * 900,
          y: (Math.random() - 0.5) * 700,
          r: (Math.random() - 0.5) * 150,
          s: 0.6 + Math.random() * 1.2
        };
        chars.push(b);
      });
    });

    var st = { p: 0 };

    /* --- 3D rock --- */
    var renderer, scene, camera, rock, slab;
    if(canvas && typeof THREE !== 'undefined' && supportsWebGL()){
      try{
        renderer = new THREE.WebGLRenderer({ canvas:canvas, alpha:true, antialias:true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0, 0, 7);

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        var k = new THREE.DirectionalLight(0xffffff, 2.1); k.position.set(-4, 6, 5); scene.add(k);
        var f = new THREE.DirectionalLight(0x8fa6c4, 0.8); f.position.set(5, -3, 2); scene.add(f);

        /* cheap value noise so the shapes read as stone, not geometry */
        function noise(x, y, z){
          return Math.sin(x * 2.1 + y * 1.3) * Math.cos(y * 1.9 - z * 2.2) * 0.5
               + Math.sin(x * 4.7 - z * 3.1) * 0.28
               + Math.cos(y * 7.3 + x * 5.1) * 0.13;
        }
        function roughen(geo, amount){
          var pos = geo.attributes.position;
          var v = new THREE.Vector3();
          for(var i = 0; i < pos.count; i++){
            v.fromBufferAttribute(pos, i);
            var n = noise(v.x, v.y, v.z);
            var len = v.length() || 1;
            v.addScaledVector(v.clone().divideScalar(len), n * amount);
            pos.setXYZ(i, v.x, v.y, v.z);
          }
          pos.needsUpdate = true;
          geo.computeVertexNormals();
          return geo;
        }

        var stoneMat = new THREE.MeshStandardMaterial({
          color: 0x9c968a, roughness: 0.98, metalness: 0.02, transparent: true
        });

        rock = new THREE.Mesh(roughen(new THREE.IcosahedronGeometry(1.25, 5), 0.20), stoneMat);
        scene.add(rock);

        /* ---- swap the generated rock for the real model ----
           `rock` may end up being a Group rather than a Mesh, so opacity
           is applied by walking the object instead of touching .material. */
        var ROCK_URL = 'camera_lens.glb';
        if(typeof THREE.GLTFLoader !== 'undefined'){
          var rockLoader = new THREE.GLTFLoader();
          if(typeof THREE.DRACOLoader !== 'undefined'){
            try{
              var rd = new THREE.DRACOLoader();
              rd.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
              rockLoader.setDRACOLoader(rd);
            }catch(e){}
          }
          rockLoader.load(ROCK_URL, function(gltf){
            var m = gltf.scene;

            /* scale first, then offset by centre × scale */
            var b = new THREE.Box3().setFromObject(m);
            var sz = b.getSize(new THREE.Vector3());
            var ct = b.getCenter(new THREE.Vector3());
            var kk = 2.6 / (Math.max(sz.x, sz.y, sz.z) || 1);
            m.scale.setScalar(kk);
            m.position.set(-ct.x * kk, -ct.y * kk, -ct.z * kk);

            /* let it fade with the morph, and pick up the scene lighting */
            m.traverse(function(o){
              if(o.isMesh && o.material){
                o.material.transparent = true;
                o.material.envMapIntensity = 1.2;
                o.material.needsUpdate = true;
              }
            });

            /* wrap it so position/scale/rotation still drive cleanly */
            var holder = new THREE.Group();
            holder.add(m);
            scene.add(holder);

            scene.remove(rock);
            rock = holder;
            console.info('[imora] services model loaded:', ROCK_URL);
          }, undefined, function(err){
            console.warn('[imora] could not load "' + ROCK_URL +
              '" — keeping the generated rock.' +
              (location.protocol === 'file:'
                ? ' (Opened from disk; .glb needs an http server.)' : ''), err);
          });
        }

        /* works for both a single mesh and a loaded model tree */
        function setRockOpacity(v){
          rock.traverse(function(o){
            if(o.isMesh && o.material){
              o.material.transparent = true;
              o.material.opacity = v;
            }
          });
        }

        /* ---------------------------------------------------------------
           THE APERTURE
           Rather than morphing into a slab, the lens simply turns to face
           you. This group sits at the same place and fades in over the
           second half — barrel ring, dark glass, and eight iris blades
           that close as the section resolves.
           --------------------------------------------------------------- */
        slab = new THREE.Group();

        var apMetal = new THREE.MeshStandardMaterial({
          color: 0x1c1c20, roughness: 0.34, metalness: 0.92,
          transparent: true, opacity: 0
        });
        var apBlade = new THREE.MeshStandardMaterial({
          color: 0x2a2a30, roughness: 0.42, metalness: 0.78,
          transparent: true, opacity: 0, side: THREE.DoubleSide
        });
        var apGlass = new THREE.MeshStandardMaterial({
          color: 0x08111c, roughness: 0.05, metalness: 1.0,
          transparent: true, opacity: 0
        });

        /* outer barrel — a shallow ring seen face-on */
        var apRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.13, 18, 64), apMetal);
        slab.add(apRing);

        /* a second, tighter ring for depth */
        var apRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.055, 14, 56), apMetal);
        apRing2.position.z = 0.07;
        slab.add(apRing2);

        /* the dark glass behind the blades */
        var apGlassMesh = new THREE.Mesh(new THREE.CircleGeometry(1.02, 64), apGlass);
        apGlassMesh.position.z = -0.14;
        slab.add(apGlassMesh);

        /* eight blades, each a flat wedge pivoting around the centre */
        var blades = [];
        for(var bi = 0; bi < 8; bi++){
          var shape = new THREE.Shape();
          shape.moveTo(0, 0);
          shape.lineTo(1.16, 0.30);
          shape.lineTo(1.16, -0.62);
          shape.lineTo(0.10, -0.34);
          shape.lineTo(0, 0);
          var blade = new THREE.Mesh(new THREE.ShapeGeometry(shape), apBlade);
          blade.rotation.z = (bi / 8) * Math.PI * 2;
          blade.position.z = 0.02 + bi * 0.002;   /* stop them z-fighting */
          blade.userData.base = blade.rotation.z;
          slab.add(blade);
          blades.push(blade);
        }
        slab.userData.blades = blades;

        /* every part shares the fade, so one helper drives them all */
        slab.userData.mats = [apMetal, apRing2.material, apBlade, apGlass];

        scene.add(slab);

        var resizeStone = function(){
          var w = sticky.clientWidth, h = sticky.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resizeStone();
        window.addEventListener('resize', resizeStone);

        var t2 = 0;   /* local clock, for the blades' idle shimmer */
        gsap.ticker.add(function(){
          var p = st.p;
          t2 += 0.016;

          /* 0 → 0.16 : falls in and grows */
          var drop = Math.min(p / 0.16, 1);
          var ease = 1 - Math.pow(1 - drop, 3);
          var y = 7 - ease * 7;
          var scale = 0.28 + ease * 0.72;

          /* 0.34 → 0.60 : the lens swings round to face the viewer */
          var turn = Math.min(Math.max((p - 0.34) / 0.26, 0), 1);
          var turnE = turn * turn * (3 - 2 * turn);          /* smoothstep */

          /* it keeps drifting the whole way — never dissolves */
          rock.position.y = y;
          rock.scale.setScalar(scale * (1 + p * 0.35));
          rock.rotation.x = 0.25 + p * 0.45 - turnE * 0.62;  /* level off */
          rock.rotation.y += 0.0032 * (1 - turnE);           /* slow the spin */
          rock.rotation.y *= (1 - turnE * 0.06);             /* settle head-on */
          setRockOpacity(1);
          rock.visible = true;

          /* the aperture fades up behind it and the blades close in */
          var apOpen = Math.min(Math.max((p - 0.46) / 0.22, 0), 1);
          slab.position.y = y * 0.35;
          slab.position.z = -0.9;
          slab.scale.setScalar(0.72 + turnE * 0.5 + p * 0.22);
          slab.rotation.z = turnE * 0.22;
          slab.visible = turnE > 0.01;

          var fade = turnE * 0.9;
          slab.userData.mats.forEach(function(mt){ mt.opacity = fade; });

          slab.userData.blades.forEach(function(bl, i){
            /* closing the iris = each blade rotating in a little */
            bl.rotation.z = bl.userData.base + apOpen * 0.42 + Math.sin(t2 + i) * 0.012;
          });

          renderer.render(scene, camera);
        });
      }catch(e){ /* no WebGL — the type and cards still animate */ }
    }

    /* --- scroll timeline --- */
    ScrollTrigger.create({
      trigger: sect, start: 'top top', end: 'bottom bottom', scrub: 0.5,
      onUpdate: function(self){
        var p = self.progress;
        st.p = p;

        /* light -> dark as the rock lands */
        var dark = Math.min(p / 0.2, 1);
        var c = Math.round(215 - dark * 205);
        sticky.style.background = 'rgb(' + c + ',' + c + ',' + (c + 2) + ')';
        var ink = dark > 0.5 ? 'rgba(240,237,232,0.92)' : '#1b1b1b';
        sticky.querySelectorAll('.stone-label,.stone-foot,.stone-link').forEach(function(el){ el.style.color = ink; });

        /* Type: bright while assembled, then scatters and fades right down.
           It has to get out of the way — once the cards are in, anything
           still floating behind them just makes the copy hard to read. */
        var scatter = Math.min(Math.max((p - 0.20) / 0.20, 0), 1);
        var quiet   = Math.min(Math.max((p - 0.44) / 0.16, 0), 1);
        chars.forEach(function(b){
          var d = b.__d;
          b.style.transform =
            'translate(' + d.x * scatter + 'px,' + d.y * scatter + 'px) ' +
            'rotate(' + d.r * scatter + 'deg) scale(' + (1 + (d.s - 1) * scatter) + ')';
          b.style.opacity = String((1 - scatter * 0.86) * (1 - quiet * 0.75));
          b.style.color = dark > 0.5 ? '#e8e5df' : '#1b1b1b';
        });

        /* cards slide in from their own side — left column from the left,
           right column from the right — staggered top to bottom */
        var cardsIn = Math.min(Math.max((p - 0.50) / 0.28, 0), 1);
        var out = Math.min(Math.max((p - 0.94) / 0.06, 0), 1);
        [['.c1',-1],['.c4',1],['.c2',-1],['.c5',1],['.c3',-1],['.c6',1]].forEach(function(cfg, i){
          var el = sticky.querySelector(cfg[0]);
          if(!el) return;
          var t = Math.min(Math.max((cardsIn * 1.45) - i * 0.075, 0), 1);
          var e = 1 - Math.pow(1 - t, 3);
          el.style.opacity = String(e * (1 - out));
          el.style.transform = 'translateX(' + cfg[1] * (1 - e) * 42 + 'vw)';
        });
      }
    });
  })();

  /* ---------- Curtain reveals ---------- */
  gsap.utils.toArray('.genre-card').forEach(function(card, i){
    gsap.set(card, { clipPath:'inset(0% 0% 100% 0%)' });
    ScrollTrigger.create({ trigger:card, start:'top 88%', onEnter:function(){
      gsap.to(card, { clipPath:'inset(0% 0% 0% 0%)', duration:1, ease:'power4.out', delay:(i%4)*0.08 });
    }});
  });

  /* ---------- Service rows ---------- */
  gsap.utils.toArray('.service-row').forEach(function(row){
    gsap.set(row, { opacity:0, x:-40 });
    ScrollTrigger.create({ trigger:row, start:'top 90%', onEnter:function(){
      gsap.to(row, { opacity:1, x:0, duration:0.9, ease:'power3.out' });
    }});
  });

  /* ---------- Testimonials ---------- */
  gsap.utils.toArray('.testi-card').forEach(function(card, i){
    gsap.set(card, { opacity:0, y:40 });
    ScrollTrigger.create({ trigger:card, start:'top 92%', onEnter:function(){
      gsap.to(card, { opacity:1, y:0, duration:0.9, ease:'power3.out', delay:i*0.06 });
    }});
  });

  /* ---------- Frames in Motion: cards ride a huge circle ----------
     Each card is placed at its own angle on a circle whose centre sits
     well below the viewport, so the run reads as a shallow arc. Scroll
     rotates the whole wheel, sweeping the frames across and away. */
  (function(){
    var sect = document.querySelector('.motion');
    var wheel = document.querySelector('.wheel');
    if(!sect || !wheel) return;

    var cards = Array.prototype.slice.call(wheel.querySelectorAll('.wcard'));
    var R = window.innerWidth < 900 ? 700 : 980;   /* circle radius, px */
    var STEP = window.innerWidth < 900 ? 13 : 9.4; /* degrees between cards */
    var SPAN = (cards.length - 1) * STEP;

    cards.forEach(function(card, i){
      var a = -SPAN / 2 + i * STEP;
      /* sit on the circle, then counter-rotate most of the way back so
         the frame stays legible but still leans along the arc */
      card.style.transform =
        'rotate(' + a + 'deg) translateY(' + -R + 'px) rotate(' + (-a * 0.82) + 'deg)';
    });

    /* start with the run off to the right, sweep it left past centre */
    var FROM = SPAN / 2 + 26;
    var TO   = -SPAN / 2 - 26;
    var t1 = sect.querySelector('.motion-t1');
    var t2 = sect.querySelector('.motion-t2');

    ScrollTrigger.create({
      trigger: sect, start: 'top top', end: 'bottom bottom', scrub: 0.6,
      onUpdate: function(self){
        var p = self.progress;
        wheel.style.transform = 'rotate(' + (FROM + (TO - FROM) * p) + 'deg)';
        /* the two big words drift apart as the arc passes */
        if(t1) t1.style.transform = 'translateX(' + (-p * 16) + 'vw)';
        if(t2) t2.style.transform = 'translateX(' + (p * 16) + 'vw)';
      }
    });

    /* the grid below fades up once the arc has run out */
    gsap.from('.mgrid figure', {
      opacity: 0, y: 60, duration: 0.9, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.mgrid', start: 'top 78%' }
    });
  })();

  /* ---------- Recalculate once images have settled ----------
     Photos load after first paint and change the page height, which
     leaves every pinned/scrubbed trigger measuring against stale
     positions. Refresh on load and after the last image arrives. */
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });

  (function(){
    var imgs = Array.prototype.slice.call(document.images);
    var left = imgs.filter(function(i){ return !i.complete; }).length;
    if(!left) return;
    imgs.forEach(function(img){
      if(img.complete) return;
      var done = function(){
        left--;
        if(left <= 0) ScrollTrigger.refresh();
      };
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
  })();
})();
