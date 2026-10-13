# For Alka, with love

A phone-first birthday keepsake about one idea: she is my person in the solar system, the galaxy and the whole universe, and however far we drift over petty squabbles, we always come back. Tap the floating envelope, read the letter, pull the moon away from the Earth and watch it swing back, collect five stars into a heart in front of a turning galaxy, and hold the candle to make a wish. Includes an original music-box soundtrack, a replay, and editable card copy.

The bottom text is guidance only. Drag the 3D envelope to turn it, then tap it to open. Swipe the letter upward (or touch its printed heart) to put it away. In the little orbit, drag the moon away from the Earth and let go (or just tap it); touch the Earth to zoom out. Touch the five 3D stars, then the completed heart. Drag the cake to rotate it and hold the actual candle flame. The moon spins when touched and restarts the experience after the birthday finale. Small decorative stars also respond to touch.

Double-tap the letter to receive a lipstick kiss. In the finale, the rose-gold heart charm holds endless kisses from the sender: touch it for another, or drag to turn it. The imprints stay attached to the turning heart. Stardust follows object drags, collecting stars plays ascending notes, and the moon releases a shooting star. Holding the candle draws a small spiral of light into its flame.

## Run

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To view on another device on the same Wi-Fi, run `npm run dev -- --host 0.0.0.0` and open the computer's LAN address on port 5173. Clipboard sharing requires HTTPS or localhost; a selectable link is provided otherwise.

```sh
npm run build
npm run preview
```

## Personalise

Open the card with `#edit` at the end of the URL to show the pencil button, which edits the recipient, letter, and sign-off. Recipients never see it. Copy a link after editing to share those changes. The card data lives in the URL fragment, which is not sent to the hosting server; anyone with the complete link can read it. Editing alone is temporary and resets on refresh. To permanently change the default copy, edit `defaults` in `src/main.js`.

The music box starts when the envelope is opened (a deliberate tap) and can be muted from the speaker button. No microphone, device motion, account, analytics, or external runtime requests are used. The fonts and moon texture are bundled locally.

## GitHub Pages

The included `.github/workflows/deploy.yml` builds and deploys on pushes to `main`. Create or choose a repository, push this folder to its `main` branch, and set **Settings → Pages → Source → GitHub Actions**. The site has no server dependencies, and Vite's relative asset paths support both repository Pages URLs and custom domains.

Repository: [dementor07/a-little-orbit](https://github.com/dementor07/a-little-orbit). Pages must be enabled once (Source: GitHub Actions); the workflow then tests, builds and deploys every push to `main`. Live URL: `https://dementor07.github.io/a-little-orbit/`.

## Implementation

- `src/main.js`: experience state, card editing, star game, candle hold, accessibility.
- `src/scene.js`: Three.js envelope, paper textures, NASA-textured moon, cake, candle, confetti.
- `src/interactions.js`: raycast picking, captured touch gestures, object rotation, collectible star meshes, and the 3D heart.
- `src/heart.js`: one symmetric heart curve shared by the 3D scene and Canvas fallback.
- `src/magic.js`: the rose-gold kiss charm, spaced surface decals, a bounded stardust pool, shooting stars, reunion hearts, and candle magic.
- `src/orbit.js`: the Earth and moon orbit, the stretchy pull, and the spring that always brings the moon back (`src/motion.js`).
- `src/galaxy.js`: the procedural spiral galaxy and the finale's distant galaxies.
- `src/kisses.js`: where kisses land on the heart.
- `src/sound.js`: original Web Audio music-box melody and interaction sounds.
- `src/style.css`: a single phone-sized viewport, safe areas, accessible touch targets, daylight colours, and reduced-motion handling.

The experience fits the dynamic viewport. Long custom letters scroll within the paper. On devices without WebGL, a lightweight envelope and candle fallback preserves the complete interaction flow. Keyboard users can activate all stars and blow out the candle with Enter or Space.

## Research and asset credits

See [ASSETS.md](ASSETS.md) for sources and license details. All artwork is either credited source imagery or original geometry and canvas drawings. No invitation vendor's illustrations or card designs were copied.
