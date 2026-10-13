# Asset sources

## Included

The kiss imprint, `public/assets/kiss.webp`, was generated for this card with the built-in ImageGen tool. It is a transparent dusty rose lipstick print, optimized to a 384px transparent WebP (about 61 KB). The original is retained at `artifacts/generated-kiss-original.png`, which is excluded from publication.

| Asset                                                                           | Source                                                                                                             | Usage and license                                                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moon surface, `public/assets/moon.jpg`                                          | [NASA Scientific Visualization Studio, CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/), Ernie Wright; LRO/LROC data | Unmodified 2019 `lroc_color_poles_1k.jpg`, 1024 × 512. Credit NASA’s Scientific Visualization Studio. See [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). |
| Earth, `public/assets/earth.jpg`                                                | [NASA Visible Earth, Blue Marble Next Generation, December, topography and bathymetry](https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry), NASA Earth Observatory, Reto Stöckli | Public domain NASA imagery. Downsampled to 1024 × 512 with a slight saturation and brightness grade to sit in the card's palette. |
| Earth clouds, `public/assets/earth-clouds.jpg`                                  | [NASA Visible Earth, Blue Marble clouds](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds), NASA Earth Observatory, Reto Stöckli | Public domain NASA imagery. Greyscale, downsampled to 768 × 384, used as a transparency map. |
| Cormorant Garamond                                                              | [Catharsis Fonts](https://github.com/CatharsisFonts/Cormorant), bundled through Fontsource                         | SIL Open Font License 1.1; local normal, medium, and italic Latin fonts. License copied to `public/assets/licenses/cormorant-garamond.txt`.                                                        |
| Manrope                                                                         | [Mikhail Sharanda / Manrope](https://github.com/sharanda/manrope), bundled through Fontsource                      | SIL Open Font License 1.1; local 400, 500, and 600 Latin fonts. License copied to `public/assets/licenses/manrope.txt`.                                                                            |
| Interface icons                                                                 | [Phosphor Icons](https://github.com/phosphor-icons/core)                                                           | MIT. Icons imported from the official package. License copied to `public/assets/licenses/phosphor.txt`.                                                                                            |
| Three.js                                                                        | [Three.js](https://github.com/mrdoob/three.js)                                                                     | MIT. License copied to `public/assets/licenses/three.txt`.                                                                                                                                         |
| Paper grain, envelope, postmark, seal, gold stars, cake, candle, particles, constellation, spiral galaxies | Original Three.js geometry, shaders, Canvas 2D, CSS                                                                         | Created for this project.                                                                                                                                                                          |
| Music-box melody and chimes                                                     | Original synthesis using Web Audio                                                                                 | Generated locally from sine oscillators. No third-party recording or streaming service.                                                                                                            |

NASA's original host was unreachable from the development machine. The identical named 139,068-byte texture was retrieved from [this GitHub mirror](https://github.com/kirbycope/godot-3d-player-controller-v2/blob/main/assets/textures/nasa/lroc_color_poles_1k.jpg). The original NASA item remains the source and credit.

## Design and implementation references

- [Paperless Post, Solar System birthday card](https://www.paperlesspost.com/card/solar-system?category=birthday_cards_for_him&variant=13421): researched celestial stationery as a direction; no assets copied.
- [Three.js colour management](https://threejs.org/manual/pages/color-management.html): sRGB colour textures and renderer output.
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): capped pixel ratio, optional WebGL, and renderer disposal.
- [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): build and artifact deployment workflow.

Runtime assets are self-hosted. External links only appear in the optional credits panel.

## Enhancements research

- [Apple: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games/): direct manipulation and comfortable touch targets informed the object-led experience. Its native guidance is applied here to a web card.
- [Three.js DecalGeometry](https://threejs.org/docs/pages/DecalGeometry.html): lipstick imprints project onto the heart surface and are converted into the heart's local coordinates, so they turn with it.
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events): captured drag and hold gestures, with cancellation recovery.
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): audio begins through a deliberate sound-control gesture; the original music remains local.
- [MDN page transition persistence](https://developer.mozilla.org/en-US/docs/Web/API/PageTransitionEvent/persisted): preserving the WebGL scene and sound preference when the card returns from the browser's Back/Forward cache.
- [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) and [Interface Sounds](https://kenney.nl/assets/interface-sounds): reviewed their CC0 options. Kept the original synthesized audio and procedural particles to match the card's existing materials and palette.
- [MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion): decorative trails and swoops disappear while all actions remain usable.

## Kiss texture generation prompt

Mode: built-in ImageGen, transparent background. Final project asset: `public/assets/kiss.webp`.

> Use case: stylized-concept. Asset type: transparent decal texture for an intimate celestial birthday card, used at 50-100 pixels. Create one beautiful natural lipstick kiss imprint, frontal lips pressed gently onto paper. Dusty rose and muted rose-gold pigment (#bf7e7b family), delicate real lipstick ridges and tiny irregular gaps with genuine transparency between pigment marks. Elegant, affectionate, tender, tactile, vintage stationery. Upper and lower lip impressions only, recognizable kiss mark, slightly asymmetric natural print. Centered horizontally in a square canvas with generous transparent padding, imprint fills 70 percent of width. Completely transparent background. Flat pigment imprint, no face, no teeth, no physical 3D lips, no text, no watermark, no hearts, no decorative stars, no shadows behind the imprint.
