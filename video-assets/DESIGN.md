# DESIGN.md — Foreclosure Recovery Inc. dashboard video set

HyperFrames visual identity for the usforeclosureleads.com agent-dashboard overview videos.
Mirrors the SIN HyperFrames pipeline (HTML + GSAP + data-* timing, 3 aspect ratios, MiniMax voiceover).

## Style Prompt
Premium fintech / legal-tech. Dark cinematic navy canvas with warm gold light accents and a single
red urgency note. Confident, calm, trustworthy — not flashy. Full-bleed AI hero poster behind a navy
scrim, crisp serif headline, clean sans body, subtle parallax/Ken-Burns drift on the background, gold
underline sweeps on key phrases. Motion is smooth and slow (cinematic), never bouncy.

## Colors (hardcoded — no CSS vars)
- Navy (base):      `#09274C`
- Navy deep:        `#06182f`
- Gold (accent):    `#C8A84B`
- Gold light:       `#E8D48A`
- Red (urgency):    `#D82221`
- Cream (text on navy): `#F4F1E9`
- Muted text:       `#A9B6C7`
- Card surface:     `rgba(255,255,255,0.06)` over navy, 1px `rgba(200,168,75,0.35)` border

## Typography
- Display / headlines: **Fraunces** (serif, 600/700)
- Body / labels:       **Inter** (400/500/600/700)
- Fonts live in `video-assets/_fonts/` (copied from the SIN set).

## Motion (see hyperframes house-style)
- Background poster: slow 8–12s Ken-Burns scale 1.0→1.08 + 2–3% drift.
- Headlines: gsap.from opacity 0 / y +40 / 0.8s power3.out, staggered.
- Gold underline sweep on the key phrase per scene (scaleX 0→1, 0.6s).
- Scene crossfades 0.5s. Voiceover drives duration (timing.json per section).

## What NOT to do
- No bright/light backgrounds (this is the dark counterpart to SIN's cream).
- No bouncy/elastic easing, no spinning logos, no stock-video clichés.
- No more than one red element per scene (red = urgency/deadline only).
- No embedded text in the AI posters — all text is HyperFrames overlay.
- Never claim guaranteed recovery; surplus figures are "preliminary, subject to verification".

## Brand voice (company)
"Foreclosure Recovery Inc." (never "US Foreclosure Recovery"). "We", not "I". Say "state", not "county".
Phone (888) 545-8007. Agent platform = usforeclosureleads.com; claimant brand = usforeclosurerecovery.com.
