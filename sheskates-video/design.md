---
name: Street Warmth
colors:
  primary: "#0f0d0b"
  on-primary: "#f5f0e8"
  accent-amber: "#E8891A"
  accent-concrete: "#9a928b"
  accent-energy: "#c84214"
  surface-warm: "#1e1a15"
typography:
  headline:
    fontFamily: Outfit
    fontSize: 7rem
    fontWeight: 900
    textTransform: uppercase
    letterSpacing: -0.02em
  impact:
    fontFamily: Outfit
    fontSize: 12rem
    fontWeight: 900
    textTransform: uppercase
    letterSpacing: -0.04em
  body:
    fontFamily: Outfit
    fontSize: 1.5rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Outfit
    fontSize: 0.9rem
    fontWeight: 600
    textTransform: uppercase
    letterSpacing: 0.15em
rounded:
  none: 0px
  sm: 3px
spacing:
  sm: 12px
  md: 24px
  lg: 60px
  xl: 120px
motion:
  energy: high
  easing:
    entry: "expo.out"
    exit: "power4.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.4
    hold: 2.5
    transition: 0.5
  atmosphere:
    - grain-overlay
    - radial-glow-amber
    - ghost-type-background
    - motion-blur-streaks
    - vignette
  transition: whip-pan
---

## Overview
Raw, authentic skateboarding energy meets inclusive community warmth. Dark warm base (#0f0d0b) — like asphalt at golden hour. Amber accents cut through the darkness. Typography is heavy, impactful, uppercase. Energy is high but not aggressive.

## Colors
- **primary** (#0f0d0b): Near-black base, warm undertone. Every scene.
- **on-primary** (#f5f0e8): Warm off-white text. Readable against dark.
- **accent-amber** (#E8891A): Golden hour energy. CTA hits, rule lines, structural elements.
- **accent-concrete** (#9a928b): Muted concrete gray. Labels, secondary text.
- **accent-energy** (#c84214): Burnt orange-red. Impact words, high-energy moments.
- **surface-warm** (#1e1a15): Slightly lighter background for layering.

## Typography
Outfit at maximum weight (900) for impact type. Uppercase. Tight tracking at large sizes. At video scale: impact type 160-200px, headline 100-130px, labels 20-28px.

## Do's
- Use dark overlays on images to maintain text legibility
- Amber rule lines as structural dividers — animate scaleX 0→1
- Ghost type in background at 8-12% opacity (large, faded, atmospheric)
- Vignette on every scene
- Motion blur / speed lines during action sequences

## Don'ts
- No neon colors, no cyberpunk aesthetic
- No artificial HDR / tone-mapped look
- No overly polished studio quality — keep it raw and authentic
- No centered-only compositions — anchor to edges
