# For Alka, with love

A phone-first birthday keepsake: tap the floating envelope, read the letter, collect five stars into a heart constellation, and hold the candle to make a wish. Includes an original music-box soundtrack, a replay, and editable card copy.

The bottom text is guidance only. Drag the 3D envelope to turn it, then tap it to open. Swipe the letter upward (or touch its printed heart) to put it away. Touch the five 3D stars, then the completed heart. Drag the cake to rotate it and hold the actual candle flame. The moon spins when touched and restarts the experience after the birthday finale. Small decorative stars also respond to touch.

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

The pencil button edits the recipient, letter, and sign-off. Copy a link after editing to share those changes. The card data lives in the URL fragment, which is not sent to the hosting server; anyone with the complete link can read it. Editing alone is temporary and resets on refresh. To permanently change the default copy, edit `defaults` in `src/main.js`.

Music starts only when the recipient enables the sound button. No microphone, device motion, account, analytics, or external runtime requests are used. The fonts and moon texture are bundled locally.

## GitHub Pages

The included `.github/workflows/deploy.yml` builds and deploys on pushes to `main`. Create or choose a repository, push this folder to its `main` branch, and set **Settings → Pages → Source → GitHub Actions**. The site has no server dependencies, and Vite's relative asset paths support both repository Pages URLs and custom domains.

This workspace has not been published. The workflow is ready once a destination repository is selected.

## Implementation

- `src/main.js`: experience state, card editing, star game, candle hold, accessibility.
- `src/scene.js`: Three.js envelope, paper textures, NASA-textured moon, cake, candle, confetti.
- `src/interactions.js`: raycast picking, captured touch gestures, object rotation, collectible star meshes, and the 3D heart.
- `src/heart.js`: one symmetric heart curve shared by the 3D scene and Canvas fallback.
- `src/sound.js`: original Web Audio music-box melody and interaction sounds.
- `src/style.css`: a single phone-sized viewport, safe areas, accessible touch targets, daylight colours, and reduced-motion handling.

The experience fits the dynamic viewport. Long custom letters scroll within the paper. On devices without WebGL, a lightweight envelope and candle fallback preserves the complete interaction flow. Keyboard users can activate all stars and blow out the candle with Enter or Space.

## Research and asset credits

See [ASSETS.md](ASSETS.md) for sources and license details. All artwork is either credited source imagery or original geometry and canvas drawings. No invitation vendor's illustrations or card designs were copied.
