# Asset sources

## Included

| Asset                                                                           | Source                                                                                                             | Usage and license                                                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moon surface, `public/assets/moon.jpg`                                          | [NASA Scientific Visualization Studio, CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/), Ernie Wright; LRO/LROC data | Unmodified 2019 `lroc_color_poles_1k.jpg`, 1024 × 512. Credit NASA’s Scientific Visualization Studio. See [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). |
| Cormorant Garamond                                                              | [Catharsis Fonts](https://github.com/CatharsisFonts/Cormorant), bundled through Fontsource                         | SIL Open Font License 1.1; local normal, medium, and italic Latin fonts. License copied to `public/assets/licenses/cormorant-garamond.txt`.                                                        |
| Manrope                                                                         | [Mikhail Sharanda / Manrope](https://github.com/sharanda/manrope), bundled through Fontsource                      | SIL Open Font License 1.1; local 400, 500, and 600 Latin fonts. License copied to `public/assets/licenses/manrope.txt`.                                                                            |
| Interface icons                                                                 | [Phosphor Icons](https://github.com/phosphor-icons/core)                                                           | MIT. Icons imported from the official package. License copied to `public/assets/licenses/phosphor.txt`.                                                                                            |
| Three.js                                                                        | [Three.js](https://github.com/mrdoob/three.js)                                                                     | MIT. License copied to `public/assets/licenses/three.txt`.                                                                                                                                         |
| Paper grain, envelope, seal, gold stars, cake, candle, particles, constellation | Original Three.js geometry, Canvas 2D, CSS                                                                         | Created for this project.                                                                                                                                                                          |
| Music-box melody and chimes                                                     | Original synthesis using Web Audio                                                                                 | Generated locally from sine oscillators. No third-party recording or streaming service.                                                                                                            |

NASA's original host was unreachable from the development machine. The identical named 139,068-byte texture was retrieved from [this GitHub mirror](https://github.com/kirbycope/godot-3d-player-controller-v2/blob/main/assets/textures/nasa/lroc_color_poles_1k.jpg). The original NASA item remains the source and credit.

## Design and implementation references

- [Paperless Post, Solar System birthday card](https://www.paperlesspost.com/card/solar-system?category=birthday_cards_for_him&variant=13421): researched celestial stationery as a direction; no assets copied.
- [Three.js colour management](https://threejs.org/manual/pages/color-management.html): sRGB colour textures and renderer output.
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): capped pixel ratio, optional WebGL, and renderer disposal.
- [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): build and artifact deployment workflow.

Runtime assets are self-hosted. External links only appear in the optional credits panel.
