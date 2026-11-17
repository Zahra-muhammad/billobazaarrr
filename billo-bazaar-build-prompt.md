# Build the Billo Bazaar website (billobazaar.pk), exact spec

You are rebuilding a finished, approved website. Match every value below exactly. Do not redesign, rename, "improve", or swap fonts, colours, sizes, easing or timings. If `billo-bazaar-index.html` is in this folder, it is the working reference: open it and copy values from it whenever anything here is unclear.

---

## 0. Stack and project

- Next.js (App Router) + TypeScript, deploy-ready for Vercel.
- GSAP 3.12.5 with ScrollTrigger (npm `gsap`, `@gsap/react` → `useGSAP`).
- Plain CSS (global stylesheet or CSS modules). **No Tailwind.**
- Fonts via `next/font/google`.
- Keep all copy and contact details in `/data/site.ts`.
- Components: `Loader`, `Nav`, `Hero`, `MenuPill`, `BigMenu`, `PageTransition`, `Footer`, `LogoSymbol`, `PencilFilters`.
- Assets: `/public/hero.mp4` (the user supplies the video).

---

## 1. Design tokens

```css
:root {
  --cream: #EFEEEA;      /* logo background colour, main light */
  --paper: #F7F5F0;
  --maroon: #3B0A0A;     /* logo colour, main dark */
  --maroon-2: #5A1A17;
  --muted: #6B4A45;
  --blush: #E9B4C2;      /* italic accent words in the hero and footer */
  --marigold: #E9A23B;   /* thread, needle thread, wheel knob, button hover */
  --graphite: #292624;
  --display: "Bricolage Grotesque", "Arial Narrow", Arial, sans-serif;
  --serif: "Instrument Serif", Georgia, "Times New Roman", serif;
  --body: Inter, system-ui, -apple-system, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
```

Other fixed colours: footer background `#240606`, footer body text `#D9C2BD`, footer mono labels `#C99A92`, giant footer wordmark `#3A0E0D`, hero fallback background `#2A0808`, menu oval background `#DCCBB2` (beige), hero paragraph `#EADAD5`.

**Fonts (Google):**
- Bricolage Grotesque: axes opsz 12..96, wdth 75..100, wght 600..800
- Inter: 400, 500, 600
- Instrument Serif: regular + italic
- JetBrains Mono: 400, 500

**Global rules:**
- `body`: background `--cream`, colour `--maroon`, Inter 17px, line-height 1.6, `overflow-x: hidden`.
- **Scroll bar hidden everywhere** (`scrollbar-width: none` on html and body, `::-webkit-scrollbar { display: none }`). Scrolling still works normally.
- `em` = Instrument Serif italic 400, letter-spacing -0.01em.
- Focus ring: `outline: 2px solid var(--marigold); outline-offset: 4px`.
- `h1`/`h2`: Bricolage 800, `font-stretch: 78%`, letter-spacing -0.035em, line-height 0.9, `text-wrap: balance`. An `em` inside a heading is 1.06em, normal stretch, letter-spacing -0.02em.
- `.wrap`: max-width 1240px, centred, side padding `max(clamp(20px, 5vw, 64px), safe-area)`.
- **Buttons (`.btn`):** Inter 600 13px, letter-spacing 0.16em, uppercase, padding 19px 30px, 1.5px border, radius 999px, background and colour transition 0.25s. Hover: background and border marigold, text maroon.

---

## 2. The logo (critical)

- The logo is the user's **traced vector artwork**, not a font. Copy the `<path id="logoPath" …>` data unchanged from `billo-bazaar-index.html` into `LogoSymbol` and reuse it everywhere with `<use href="#logoPath">`.
- **Full logo:** double-outlined oval, two quatrefoil flowers on the sides, "STUDENTS TO" curved on top, بلّو بازار in the middle, a small ".pk", and "ENTREPRENEURS." curved underneath.
  - viewBox `328 623 1345 753`.
- **Wordmark only (بلّو بازار + .pk):** viewBox `584 783 781 357` on the same path. The SVG crops the rest.
- Never replace the Urdu with a font.

---

## 3. Shared pencil "boil" filters

```html
<filter id="pencil" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence id="boil" type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1"/>
  <feDisplacementMap in="SourceGraphic" scale="4"/>
</filter>
<filter id="pencilRough" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence id="boil2" type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3"/>
  <feDisplacementMap in="SourceGraphic" scale="6"/>
</filter>
```

**"Boiling" = hand-drawn jitter:** while an animation runs, a `setInterval` cycles the turbulence `seed` from 1 to 40, then back to 1.
- Loader: every 160ms.
- Page transition: every 130ms, updating both filters.
- Stop the interval when the animation ends.

---

## 4. Intro loader (plays on every page load, about 6 seconds)

### Layout
- Fixed full screen, z-index 30. While it runs, `html` gets `overflow: hidden`.
- **Background panel** `#logoPanel`: `#EFEEEA`, flex column, centred, gap 20px, padding 24px.
- **Full logo SVG** `#logoSvg`: width `min(80vw, 600px)`, `overflow: visible`.
- **Mini handwheel** `#miniWheel`: 52×52px, under the logo.
  - viewBox `-60 -60 120 120`, pencil filter, stroke `#3B0A0A`, round caps.
  - Outer circle r50 (stroke 5), inner circle r41 (2.4), hub r8 (3.6).
  - Spokes group, stroke 4.4: five lines from (0,-8)→(0,-40), (7.6,-2.5)→(38,-12.4), (4.7,6.5)→(23.5,32.4), (-4.7,6.5)→(-23.5,32.4), (-7.6,-2.5)→(-38,-12.4).
  - Handle knob: circle cx20 cy-42 r5, stroke `#E9A23B`, width 3.4.
- **Counter** "00"–"100": bottom-right (right 64px, bottom 26px), Instrument Serif italic 22px, graphite, tabular numbers.
- **"Skip intro" button:** bottom-left 20px, Inter 500 12px, letter-spacing 0.16em, uppercase, graphite text, border 1px `rgba(41,38,36,0.35)`, padding 14px 18px. It jumps the timeline to its end.

### Stitching layers inside `#logoSvg`

1. **Stitches layer.**
   - `<use href="#logoPath">` with `fill: none`, stroke `#3B0A0A`, width 3.4, round caps.
   - Its dash pattern makes running stitches: `stroke-dasharray = (11 / L) (8 / L)`, where L is the logo path's total length (the path uses `pathLength=1`).
   - The layer sits inside a group with the pencil filter, masked by `#stitchMask`.
2. **Reveal mask** `#stitchMask` (`maskUnits="userSpaceOnUse"`, x250 y540 w1500 h920).
   - On first run, split the logo path's `d` at every `M` and create one `<path>` per sub-path inside it: white stroke, width 16, round caps, `fill: none`.
   - Each sub-path gets `stroke-dasharray = len len` and `stroke-dashoffset = len` (its own real length).
3. **Fill layer** `#logoFill`: the logo filled `#3B0A0A`, opacity 0.
4. **Needle** `#needleG`, opacity 0. Its inner `#needleBob` uses the pencil filter.
   - Shaft: line (0,0)→(64,-64), stroke `#6E6862` width 5, then a highlight on the same line, stroke `#C9C4BD` width 2.
   - Eye: ellipse cx56 cy-56 rx3 ry7 rotated 45°, stroke `#3B0A0A` width 2.
   - Thread: curve `M56 -56 C90 -70 96 -110 140 -112`, stroke `#E9A23B` width 3.

### Stitching motion

`sew.p` goes 0 → 1. On every update:
- **Reveal:** every mask sub-path gets `dashoffset = len × (1 − p)`, so **all parts of the logo are sewn at the same time**.
- **Needle position:** the needle follows the longest sub-path (the outer oval) at `getPointAtLength(p × len)`.
- **Needle bob:** `translateY(sin(p × 40) × 6 − 4)`.

### Timeline (seconds from start)

| t | What happens |
|---|---|
| 0 | Counter tween 0→100 over 4.6s, `power1.inOut`. Wheel spin speed tween 0.4 → 1.6 over 4.6s, `sine.in`. Needle fades in over 0.2s. |
| 0.05 | `sew.p` 0→1 over **4.0s**, `sine.inOut`. |
| 0.1 | Mini wheel fades in over 0.5s, `power1.out`. |
| 3.9 | `#logoFill` opacity → 1 over 0.7s, `sine.inOut`. |
| 4.0 | Stitch layer fades out over 0.7s. Needle fades out and lifts 30px over 0.35s, `power2.in`. |
| 4.6 | Mini wheel → opacity 0, scale 0.6, over 0.45s, `power2.inOut`. Counter and Skip fade out over 0.4s. |
| 4.7 | Stop the boil interval. |
| 4.85 | **Fly to nav** (see below). |
| 4.95 | `#logoPanel` background → transparent over 1.0s, `sine.inOut`, revealing the site behind. |
| 5.05 | Hero `.reveal` items (headline, paragraph, buttons) go from opacity 0, y 28 to visible over 0.9s, stagger 0.1, `power3.out`. They must stay hidden during the intro and animate **only once**. |
| 5.3 | Dispatch `billo:ready` so ScrollTrigger refreshes. |
| 5.6 | Nav "Join us" and the menu pill fade in over 0.8s, `sine.out`. |
| ~6.0 | End: loader fades out over 0.35s, then is hidden. Remove `overflow: hidden`. |

**Wheel spin:** on every GSAP tick, `theta += speed × 6 × deltaRatio`, applied as `rotate(theta)` to the mini wheel's spokes group.

**Fly to nav (t = 4.85):**
- Create a fixed SVG `#flyer` (wordmark viewBox) placed exactly over the wordmark area of the big logo. With `k = logoSvg.width / 1345`, its position is:
  - left: `logoLeft + 256k`
  - top: `logoTop + 160k`
  - width: `781k`
  - height: `357k`
- Fade `#logoSvg` out over 0.35s.
- Tween the flyer to the exact box of the nav logo (top-left) over **1.15s, `expo.inOut`**, changing colour from `#3B0A0A` to `#EFEEEA`.
- When the loader ends, hide the flyer and show the real nav logo, which stays at opacity 0 until then.

**Replay:** the footer "Replay intro" button scrolls to the top and replays the whole loader.

**`prefers-reduced-motion`:** skip the loader entirely and show everything immediately.

---

## 5. Nav (absolute, over the hero)

- Flex row, space-between. Padding: top 24px, sides `max(clamp(20px, 3.4vw, 60px), safe-area)`.
- **Left:** the wordmark logo SVG, height 52px (40px under 640px), colour cream, links to `#top`.
- **Right:** "JOIN US", Inter 600 13px, letter-spacing 0.06em, uppercase, cream, a `mailto:` link.
  - Hover: a 1.5px underline at bottom 6px scales in from the left (`scaleX` 0 → 1, 0.3s).
- **Nothing else** in the top nav: no other links and no icons.

---

## 6. Hero (the only content section)

- `min-height: 100svh`, border-box, flex, content aligned to the bottom and centred. Padding: top 140px, bottom `clamp(120px, 16vh, 170px)`, so the floating pill never covers the buttons.
- **Video** `#heroVideo`: absolute, fills the hero, `object-fit: cover`, `autoplay muted loop playsInline preload="auto"`, source `/hero.mp4`.
- **Overlay** (`::after`): `linear-gradient(to bottom, rgba(36,6,6,0.25), rgba(36,6,6,0.15) 40%, rgba(36,6,6,0.7))`.
- **Placeholder text** (until the video plays): "[ Your full-screen video goes here ]", JetBrains Mono 500 13px, letter-spacing 0.14em, uppercase, cream at 45%, centred vertically. Hide it on the video's `playing` event.
- **Content** (centred column, gap 24px):
  - `h1`: "From fashion student to *fashion brand.*" at `clamp(52px, 8.6vw, 140px)`, cream. The em "fashion brand." is blush.
  - Paragraph: "We help fashion students launch their own labels. Factories, customers, marketing, exhibitions and investors, all in one place, so talent doesn't stop at graduation." Max-width 56ch, 18px, colour `#EADAD5`.
  - Buttons:
    - "I'M A DESIGNER": solid, cream background, maroon text.
    - "PARTNER WITH US": outline in cream.
    - Both hover to marigold.
- **Scroll effects** (scrubbed, top top → bottom top):
  - The video moves `yPercent: 12` and scales to 1.06.
  - The content moves `yPercent: -18` and fades to 0.2 opacity.

---

## 7. Floating MENU pill (fixed, bottom centre)

- Fixed, z-index 20, `left: 50%`, `translateX(-50%)` (use GSAP `xPercent: -50`), bottom `max(22px, safe-area + 14px)`.
- **Frosted glass:** background `rgba(36,6,6,0.28)`, border 1px `rgba(239,238,234,0.3)`, radius 999px, `box-shadow: 0 18px 40px -18px rgba(0,0,0,0.6)`, `backdrop-filter: blur(16px) saturate(1.3)`. Text cream.
- **Button:** a single word, "MENU" (no icon), Inter 600 13px, letter-spacing 0.1em, uppercase, padding 18px 38px. It reads "CLOSE" while the menu is open.
- **Open state:** pill background solid maroon, cream text, maroon border.
- **Magnetic:** only on devices with a mouse, and not with reduced motion. Use `gsap.quickTo` with duration 0.6, `power3.out`, on the pill's x/y and the label's x/y.
  - On `pointermove`, measure the distance from the pill's resting centre.
  - Within 170px: pill moves `dx × 0.35`, `dy × 0.35`; the label moves `dx × 0.12`, `dy × 0.12`.
  - Otherwise, or when the menu is open, or the pointer leaves the window: everything returns to 0.

---

## 8. Big menu (opens from the pill)

### Shape and animation
- Fixed, inset 0, z-index 19 (under the pill, so CLOSE stays visible). Background `#DCCBB2`, `overflow: hidden`.
- Flex column, centred, gap `clamp(28px, 5vh, 52px)`. Padding: top 60px, bottom 170px, sides `max(20px, safe-area)`.
- **The shape is an oval (stadium), not a full rectangle**, done with `clip-path`:
  - **Closed** = the pill's exact rectangle: `inset(top right bottom left round pillHeight/2)` measured from the pill's live bounding box.
  - **Open** = `inset(4vh 3vw 4vh 3vw round innerHeight/2)`, calculated in px. The page shows around the curved edges.
  - **Open animation:** closed → open, 0.9s, `expo.inOut`.
  - **Close animation:** open → closed, 0.7s, `expo.inOut`, then hide.
  - Update the clip on resize while open.
- While open: `html { overflow: hidden }`.
- **Close with:** the pill (CLOSE), Esc, or a click outside the menu and pill.
- The top nav is **not** shown in the menu (the menu covers it).

### Links
Seven links, uppercase:
1. New labels
2. Designers
3. Drops
4. Exhibitions
5. Our story
6. For designers
7. Partner with us

**Style:** Instrument Serif 400, `clamp(28px, 3.4vw, 48px)`, line-height 1.02, letter-spacing 0.01em, padding 1px 0, colour `rgba(59,10,10,0.5)`. Hover and focus: solid `#3B0A0A`, 0.3s transition. No pink.
- Wrap each link's text in a `<span>` (inline-block), with the link set to `overflow: hidden`.
- **On open:** the spans slide up from `yPercent: 110` to 0, 0.8s, stagger 0.05, delay 0.4, `power3.out`.

### Contact row
- Two centred columns, gap `16px clamp(40px, 8vw, 120px)`:
  - small label "WHATSAPP" with the number under it
  - small label "E-MAIL" with the email under it
- **Styling:** labels Inter 12px at `rgba(59,10,10,0.55)`. Values Inter 500 14px, letter-spacing 0.12em, uppercase, maroon, `user-select: all`.
- **On open:** fades up from y 16, 0.7s, delay 0.75.

### Side artwork (two canvases)
- **Placement:** `.bmart`, absolute, full height, width `min(24vw, 360px)`. Left one at `left: 7vw`. The right one at `right: 7vw` is mirrored (`scaleX(-1)`). Under 760px: width 22vw, opacity 0.55. `pointer-events: none`.
- **Drawing,** on open and on resize. On an offscreen canvas the same size, draw marigold blooms and leaves as a mask, using a seeded random generator (`seed = (seed × 9301 + 49297) % 233280`). The left canvas uses seed 11, the right seed 29.
- **Each bloom:** 4 layers. Layer radius `R × (1 − layer × 0.22)`, petal count k = 7 + 2 × layer, random rotation.
  - Petal radius formula: `r × (0.72 + 0.28 × |cos(k·t/2 + rot)|) × (0.92 + rand × 0.08)`.
  - Layer fill alpha alternates 1 / 0.45, plus a centre dot at 0.3 alpha.
- **Each leaf:** two quadratic curves, alpha 0.7.
- **Stacking down the canvas:**
  - Start at y = 8% of the height.
  - Bloom radius: `W × (0.34 + rand × 0.22)`. Bloom x: `W × (0.18 + rand × 0.42)`.
  - Add one leaf, and 60% of the time a smaller bloom at half radius.
  - Step down `R × (1.6 + rand × 0.5)`.
- **Turn the mask into thread lines:** draw maroon `#3B0A0A` rectangles every 5px across and 2px down wherever the mask has alpha.
  - Solid areas: 3px wide, with random 6% gaps.
  - Lighter areas: 2px wide, with probability `alpha × 0.85`.
  - Use devicePixelRatio, capped at 2.
- **On open:** the canvases reveal top to bottom (`clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)`), 1.4s, delay 0.3, `power2.inOut`.

---

## 9. Page transition (when a menu link is clicked)

1. Close the menu.
2. A fixed overlay `#pt` (z-index 40, background **maroon `#3B0A0A`**) grows as `clip-path: circle()` from **the exact click point** to a radius covering the farthest corner + 20px, over 0.85s, `power3.inOut`.
3. **The big sketched wheel** in the centre: SVG viewBox `-130 -130 260 260`, width `min(260px, 60vw)`, `pencilRough` filter, stroke **cream `#EFEEEA`**, round caps.
   - Outer rim r100 (stroke 4); a doubled sketch rim at cx2.5, cy-2, r99 (1.8, opacity 0.45); inner ring r82 (2.2); hub r23 (2) and r12 (3.2).
   - Spokes group, stroke 5: five lines from (0,-13)→(0,-80), (12.4,-4)→(76,-24.7), (7.6,10.5)→(47,64.7), (-7.6,10.5)→(-47,64.7), (-12.4,-4)→(-76,-24.7).
   - Handle knob: cx38, cy-84, r9, marigold, stroke 4.
   - Every part has `pathLength=1` and **draws itself in**: dashoffset 1 → 0, 0.7s, stagger 0.04, starting at 0.55s, `power2.out`.
   - **Ghost spokes** (blur): three copies of the spokes rotated -6°, -12° and -18°, stroke 2, opacity `0.4 × fast`.
   - **Motion arcs:** circles r112 (dasharray 90 520), r122 (70 560, offset 250) and r104 (60 480, offset 420), stroke 2.2, opacity `0.6 × fast`, rotating at 1.3× the wheel speed.
   - Here `fast = clamp((speed − 1.4) / 2, 0, 1)`.
4. **Spin:** speed goes 0.7 → 4.2 over **3s**, `power1.in`, starting at 0.6s (`theta += speed × 6 × deltaRatio`).
5. At 3.5s run the navigation: go to the route, or open `mailto:` links.
6. At 3.6s the wheel fades out and scales to 0.7 over 0.4s, `power2.in`.
7. At 3.85s the overlay fades out over 0.8s, `sine.inOut`.
8. At 3.95s the new page's `.reveal` items rise in: y 28 → 0, 0.9s, stagger 0.1.

Ignore extra clicks while a transition is running. With reduced motion, navigate instantly.

---

## 10. Footer (FinApt-style)

- Background `#240606`, text `#D9C2BD`, `overflow: hidden`.
- **Grid:** `minmax(0,1.7fr)` plus 3 × `minmax(0,1fr)`, gap 48px 40px, padding 96px top and 40px bottom.
  - Under 1000px: 2 columns, with the first block spanning full width.
  - Under 600px: 1 column.
- **Mono labels:** JetBrains Mono 500 13px, letter-spacing 0.14em, uppercase, `#C99A92`, written in brackets like "[ WHAT WE DO ]".

**Column 1 (column gap 22px):**
- Wordmark SVG, height 58px, cream.
- "[ START A CONVERSATION ]"
- `h2` "Your label *starts here.*" at `clamp(44px, 5.6vw, 84px)`, cream, with "starts here." in blush; margin-top 28px.
- Link "Start with Billo Bazaar →": Inter 600 20px, cream. The arrow is a 22px SVG that slides 6px right on hover (0.25s).

**Column 2:** "[ WHAT WE DO ]", then plain-text items:
- Institutional collaboration
- Brand launch
- Manufacturing support
- Marketplace
- Marketing & advertising
- Physical exhibitions
- Investment opportunities

**Column 3:** "[ BAZAAR ]", then links: Home, For designers, For institutions, For manufacturers, For investors.

**Column 4:** "[ FIND US ]", then:
- address + "Pakistan"
- email, then WhatsApp
- "Instagram · TikTok", then LinkedIn
- hours (15px, `#C99A92`)

**List styles:** gap 12px; items 17px, line-height 1.45, cream; links hover to marigold.

**Giant wordmark:**
- The wordmark SVG at `width: min(100%, 1300px)`, colour `#3A0E0D`, `pointer-events: none`.
- `margin-bottom: -9vw`, so it **runs under the bottom bar and gets cut off by the page edge**.
- Rises in `yPercent: 35` → 0, 1.4s, `power3.out`, when the footer reaches 80% of the viewport.

**Bottom bar** (above the giant wordmark, transparent background):
- Top border 1px `rgba(239,238,234,0.12)`, padding 26px, flex space-between, wraps, 14px.
- Contents: "© 2026 Billo Bazaar · billobazaar.pk", a "REPLAY INTRO" pill button, and "STUDENTS TO ENTREPRENEURS · PAKISTAN" in mono.
- **Button style:** mono 12px, border 1px `rgba(239,238,234,0.25)`, cream text, padding 12px 16px, radius 999px.

---

## 11. Pages and data

- `/` is the hero + footer described above.
- Menu routes: `/labels`, `/designers`, `/drops`, `/exhibitions`, `/story`. Create placeholder pages that reuse the nav, pill, big menu, transition and footer, each with a centred heading in the same hero style. Route changes play the wheel transition.
- "For designers" and "Partner with us" open `mailto:`.
- Put these placeholders in `/data/site.ts` and list them at the end: `[YOUR EMAIL]`, `[YOUR NUMBER]`, `[YOUR ADDRESS]`, `[YOUR HOURS]`, `[@YOUR HANDLE]`.

## 12. Accessibility and quality

- The loader, transition overlay, art canvases and giant wordmark are `aria-hidden`.
- Real `<button>` and `<a>` elements, with `aria-expanded` on the pill.
- Esc closes the menu.
- Handle safe-area insets.
- No horizontal scroll at 390px.
- Respect `prefers-reduced-motion` everywhere.

## 13. When done

Run the site and compare it side by side with `billo-bazaar-index.html` at 1920, 1440, 768 and 390px wide. Check the loader timings, menu open and close, the transition and the footer, and fix any difference. Then list what is still a placeholder.
