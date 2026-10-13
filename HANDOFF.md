# Handoff

The card is a phone-first birthday keepsake for Alka. Theme: she is his person in the solar system, the galaxy and the universe; they have petty squabbles, but they always come back to each other and make it work.

## Design constraints

- Preserve the paper, letter, music, 3D envelope, moon, cake, and gold/rose palette. Photoreal NASA Earth and moon deliberately contrast with the cute, hand-made elements.
- Bottom text is plain guidance only. No footer action buttons; actions happen on the objects.
- Kisses are from the sender to Alka.

## Flow

1. Envelope (now with a "Milky Way · Solar System · Earth" postmark; the insert reads "my person, in every universe" as it slides out). Opening it starts the music box.
2. Letter, rewritten around the theme. Double-tap for a lipstick kiss; swipe up or touch its heart.
3. The little orbit (solar system): the card's moon joins an orbit around a NASA Earth. Pull the moon away, a stardust thread stretches, let go and it swings back; a little heart blooms when they meet. Captions change with each pull. Touch the Earth to zoom out. A tap on the moon (or the keyboard) sends it drifting off and back by itself.
4. Stars (galaxy): a procedural gold/rose spiral galaxy turns behind the five collectible stars. Completing the heart reads "Of every star in the galaxy, you’re my person."
5. Wish: hold the candle flame.
6. Finale (universe): "In the whole universe, it’s you." The wish rises from the candle as the rose-gold heart; distant galaxies fade in. Kisses now land in six spaced places instead of piling up.

## Other changes

- The pencil editor only appears with `#edit` in the URL. A sparkle button opens the credits and colour switch for everyone.
- Night is the default theme (the galaxy reads best on it); day remains available.
- Six progress dots for six phases; header reads "FOR ALKA".
- Pure helpers (`src/motion.js`, `src/kisses.js`, galaxy generator) are covered by `tests/orbit.test.js`.

## Deployment

- `.github/workflows/deploy.yml` builds, tests and deploys on pushes to `main`.
- The first run failed at `configure-pages` because Pages is not enabled. Enable **Settings → Pages → Source → GitHub Actions** once, then push to `main` (or re-run the workflow).
- Live URL: `https://dementor07.github.io/a-little-orbit/`.
