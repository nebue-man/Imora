# Imora — website guide

Everything you need to run, edit and publish the site. Written to be followed
top to bottom, no coding background assumed.

---

## 1. Start here — viewing the site

**Double-click `START-SITE.bat`.**

A black window opens and your browser goes to `http://localhost:8000/index.html`.

- **Keep the black window open** while you're looking at the site. Closing it stops the server.
- If the page looks blank for a second, just refresh — the browser sometimes opens before the server is ready.

### Why not just double-click the HTML file?

Because the 3D models won't load. Browsers refuse to read `.glb` model files
from your hard drive directly (`file://`) — it's a security rule, not a bug in
the site. Open it that way and you'll see simplified stand-in shapes instead of
the real Canon camera and lens.

**Rule of thumb:** the address bar must say `http://localhost:8000/…`,
never `file:///C:/…`

If the launcher says Python isn't installed, get it free from the Microsoft
Store, then run the file again.

---

## 2. What's in this folder

The site is **three pages**:

```
index.html  ─┬─►  photography.html   (weddings, portraits, product,
             │                        events, commercial, film)
             └─►  studio.html        (podcast studio & room hire)
```

`index.html` is a split entry screen — visitors pick a side and go.

| File | What it is |
|---|---|
| `index.html` | **Entry screen.** The two-panel chooser. |
| `photography.html` | Photography & videography — the shoots. |
| `studio.html` | Studio services — the podcast room. |
| `styles.css` | All the visual styling — colours, fonts, spacing, layout. |
| `main.js` | All the movement — scroll animations, 3D scenes, WhatsApp links. |
| `canon_eos_5d_mark_iv.glb` | 3D camera model shown in the hero. |
| `camera_lens.glb` | 3D lens model in the services section. |
| `START-SITE.bat` | Double-click launcher for the local server. |
| `README.md` | This guide. |

**Safe to delete:** `imora.html` and `podcast.html`. These are older versions,
kept only until you've confirmed the new build works. Nothing links to them.

---

## 3. The site, section by section

In scroll order:

1. **Hero** — 3D Canon camera, slowly rotating. *Hold the mouse down* and it
   bursts apart into its components; let go and it reassembles.
2. **Statement** — the sentence brightens word by word as you scroll.
3. **Values + marquee** — studio positioning.
4. **What we shoot** — the five services as image cards.
5. **Key facts** — three stat cards that tilt up into place on a light background.
6. **Selected work** — scroll down and the projects travel sideways.
7. **Services (the big one)** — the background fades from light to dark, the 3D
   lens drops in and grows, the stacked words scatter apart, and five service
   cards fly in from the corners.
8. **What's included** — plain list of all seven offerings.
9. **Client stories** — testimonials.
10. **Frames in Motion** — photos sweep across on a curved arc, then settle into a grid.
11. **Videography** — showreel player plus the three video offerings
    (wedding films, brand films, social reels).
12. **Podcast studio** — teaser, then a **draggable 360° room** (drag to look
    around, scroll to zoom, buttons jump to preset views), the three-camera
    setup, specs, and full equipment list.
13. **Contact + footer.**

---

## 4. Making changes

All text lives in `index.html`. Open it in Notepad, VS Code, or any text editor.
Find the words you want to change, type over them, save, refresh the browser.

### Your WhatsApp number — do this first

Open `main.js`. **Line 12:**

```js
var WA_NUMBER = '910000000000';   // <-- REPLACE
```

Replace with your real number in international format — **digits only**, no `+`,
spaces or dashes. For India: country code `91` followed by the number, e.g.
`919824182099`.

Every WhatsApp button on the site uses this one line: the floating green button,
"Book on WhatsApp", and "Register interest".

### Swapping in your own photos

Right now every photo is a placeholder from Unsplash. In `index.html` you'll see
lines like:

```html
<img src="https://images.unsplash.com/photo-1519741497674-..." alt="Wedding photography">
```

To use your own: put your image files in this folder and change the `src` to the
filename, e.g.

```html
<img src="my-wedding-photo.jpg" alt="Wedding photography">
```

Keep images under about 500 KB each or the site will feel slow.

### Adding your showreel

The videography section has a player with a placeholder poster. To make it play
a real film, open `index.html`, find this line:

```html
<div class="reel-stage" id="showreel" data-video="">
```

Put your video in the empty `data-video=""`:

**YouTube** — take the video ID from the URL (the part after `v=`) and use:
```html
data-video="https://www.youtube.com/embed/YOUR_VIDEO_ID"
```

**Vimeo** — take the number from the URL:
```html
data-video="https://player.vimeo.com/video/YOUR_VIDEO_ID"
```

**A file on your computer** — copy the `.mp4` into this folder, then:
```html
data-video="showreel.mp4"
```

Anything ending `.mp4`, `.webm` or `.mov` plays in a normal video player;
anything else is treated as an embed link. Clicking the poster starts it.

While `data-video` is empty, clicking says "No showreel added yet". Also replace
the poster image just above it, and delete the grey line underneath that reads
*"Placeholder. Drop your reel in…"*.

### Colours and fonts

Top of `styles.css`:

```css
--bg:      #050506;   /* page background (near-black) */
--cream:   #f4ede3;   /* main text */
--gold:    #c9a76a;   /* accent — eyebrows, buttons */
--ember:   #e8703a;   /* orange highlight */
```

Change these and the whole site follows.

---

## 5. Content that still needs you

These are my placeholders. They read convincingly but **they are invented** —
please replace before showing this to anyone:

- **WhatsApp number** — currently `910000000000`
- **Phone and email** in the footer
- **All statistics** — "9+ years", "420+ projects", "1.5K shoots", "20+ team",
  "90% rebook". I made these up.
- **Client testimonials and names** — all fictional
- **"Trusted by" logos** — Lumen, Vestra, Northbound, Atelier 9, Solace are invented
- **Project names** — The Mehta Wedding, Studio Nine, Northbound, Quiet Portraits
- **Podcast equipment list** — a sensible three-camera setup, but not *your* kit.
  Same for the specs (4K, 4 guests, 7-day turnaround) and room size.
- **Est. 2016** — check this is right

---

## 6. Still open from your brief

Questions from your planning document that I didn't invent answers to:

- **Target audience / ideal client** — left blank in your notes
- **Pricing** — a packages page, or "contact for pricing"?
- **Private client galleries** — password-protected delivery for finished photos?
- **Blog** — useful for search traffic, common for photographers
- **Print or digital sales**
- **Instagram feed embed**
- **Showreel** — you mentioned videography; worth a video section?

Each of these changes the build meaningfully, so tell me which you want.

---

## 7. Publishing it

The site is plain HTML/CSS/JS — it works on any host. Easiest free options:

- **Netlify Drop** (netlify.com/drop) — drag this whole folder onto the page. Done.
- **Vercel**, **Cloudflare Pages**, or **GitHub Pages** — all similar.

Once it's on real hosting, everything is served over http automatically, so the
3D models load without the launcher. The local-server step is only needed while
previewing from your own computer.

---

## 8. If something looks wrong

Press **F12** in Chrome and click the **Console** tab. Messages starting with
`[imora]` explain what happened, for example:

- `could not load "camera_lens.glb"` — usually means you opened the file directly
  instead of using `START-SITE.bat`
- `WhatsApp links point at a placeholder number` — section 4 above

Send me a screenshot of that console tab and I can tell you exactly what's wrong.
