import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "./style.css";
import sun from "@phosphor-icons/core/assets/regular/sun.svg";
import moon from "@phosphor-icons/core/assets/regular/moon.svg";
import arrow from "@phosphor-icons/core/assets/regular/arrow-right.svg";
import speaker from "@phosphor-icons/core/assets/regular/speaker-high.svg";
import muted from "@phosphor-icons/core/assets/regular/speaker-slash.svg";
import pencil from "@phosphor-icons/core/assets/regular/pencil-simple.svg";
import heart from "@phosphor-icons/core/assets/regular/heart.svg";
import heartFill from "@phosphor-icons/core/assets/fill/heart-fill.svg";
import star from "@phosphor-icons/core/assets/fill/star-four-fill.svg";
import close from "@phosphor-icons/core/assets/regular/x.svg";
import sparkle from "@phosphor-icons/core/assets/regular/sparkle.svg";
import { createAudio } from "./sound.js";
import { heartPoint } from "./heart.js";
import { codaFor } from "./moonphase.js";

const defaults = {
  name: "Alka",
  signature: "Always yours, in every orbit",
  message:
    "In the whole solar system, the whole galaxy, the whole entire universe, you are my person.\n\nYes, we have our petty squabbles (some of them very, very petty). But however far we drift, we always find our way back to each other and make it work. That\u2019s my favourite thing about us.\n\nHappy birthday, my love. Here\u2019s to another trip around the sun together, squabbles and all.",
};
const phases = ["envelope", "letter", "orbit", "stars", "wish", "finale"];
const steps = { envelope: 0, letter: 1, orbit: 4, stars: 3, wish: 2, finale: 2 };
function readCard() {
  try {
    const encoded = new URLSearchParams(location.hash.slice(1)).get("card");
    if (!encoded || encoded.length > 16000) return { ...defaults };
    const data = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
      ),
    );
    return Object.fromEntries(
      ["name", "signature", "message"].map((key, i) => [
        key,
        typeof data[key] === "string" && data[key].trim()
          ? data[key].slice(0, [32, 80, 1600][i])
          : defaults[key],
      ]),
    );
  } catch {
    return { ...defaults };
  }
}
const card = readCard();
// Until the 3D scene is ready (or known to be unavailable), show neither envelope.
document.documentElement.classList.add("booting");
const audio = createAudio();
let phase = "envelope",
  // Music is on unless she turns it off. Browsers let it begin only at her first touch.
  soundOn = true,
  scene,
  opening = false,
  transitionTimer;
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const icon = (src, cls = "") =>
  `<img class="icon ${cls}" src="${src}" alt="" aria-hidden="true">`;

document.querySelector("#app").innerHTML = `
  <div class="sky" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div>
  <div class="experience" data-phase="envelope">
    <header class="controls">
      <span class="dedication">${icon(heart)}<span>FOR <span class="recipient-name"></span></span></span>
      <div class="controls-right">
        <button class="icon-button sound-button" aria-label="Turn off music" aria-pressed="true">${icon(speaker)}</button>
        <button class="icon-button edit-button" aria-label="Personalise your card">${icon(pencil)}</button>
        <button class="icon-button about-button" aria-label="About this card">${icon(sparkle)}</button>
      </div>
    </header>
    <main class="world" aria-label="Your birthday adventure">
      <div class="opening-caption"><p>Special delivery</p><h1>For my person.</h1></div>
      <div class="orbit orbit-one" aria-hidden="true"></div><div class="orbit orbit-two" aria-hidden="true"></div>
      <div id="scene" aria-hidden="true"></div>
      <button class="moon-hit" aria-label="Spin the moon"></button>
      <button class="kiss-hit" aria-label="Receive a kiss from me" hidden>${icon(heartFill, "kiss-fallback-heart")}</button>
      <div class="fallback-envelope" aria-hidden="true"><div class="fallback-flap"></div><span>For <span class="recipient-name"></span>,<br><em>with all my love.</em></span><span class="fallback-seal">${icon(sun)}</span></div>
      <button class="envelope-hit" aria-label="Open your birthday envelope"></button>
      <article class="letter" aria-label="A love letter for you" tabindex="-1" hidden>
        <div class="letter-border">${icon(sun, "letter-sun")}
          <p class="letter-eyebrow">YOU, ME &amp; THE WHOLE UNIVERSE</p>
          <h2 class="letter-greeting"></h2><div class="letter-body"></div>
          <p class="letter-signature"></p><p class="letter-ps">P.S. Next, try pulling the moon away from the Earth. It always comes back. So do I.</p><button class="paper-next" aria-label="Put away your letter">${icon(heart, "letter-heart")}</button>
        </div>
      </article>
      <section class="little-orbit" aria-label="The Earth and the moon" hidden>
        <div class="orbit-caption"><p></p><h2></h2></div>
        <div class="fallback-orbit" aria-hidden="true"><span class="fallback-earth"></span><span class="fallback-path"><span class="fallback-moon"></span></span></div>
        <button class="orbit-moon-hit" aria-label="Pull the moon away from the Earth"></button>
        <button class="orbit-earth-hit" aria-label="Touch the Earth to zoom out"></button>
      </section>
      <section class="stardust" aria-label="Catch five stars to make a birthday wish" hidden>
        <div class="game-caption"><p></p><h2></h2></div>
        <div class="star-field"><canvas class="constellation" aria-hidden="true"></canvas><button class="heart-control" aria-label="Touch your completed heart to make a wish" hidden></button></div>
        <div class="star-score" role="status" aria-label="0 of 5 stars caught"></div>
      </section>
      <div class="wish-caption" hidden><p>One last thing…</p><h2>Make a wish.</h2></div>
      <button class="flame-hit" aria-label="Blow out your birthday candle" hidden><span class="flame-ring" aria-hidden="true"></span></button>
      <div class="fallback-cake" aria-hidden="true"><span class="fallback-candle"><span class="fallback-fire"></span></span><span class="cake-icing"></span></div>
      <div class="finale" tabindex="-1" hidden><p>In the whole universe, it’s you.</p><h2>Happy birthday,<br><em class="recipient-name"></em></h2><span>A few kisses, from me to you.</span></div>
      <p class="kiss-whisper" role="status" aria-live="polite" hidden></p>
      <span class="us-tag" aria-hidden="true"><span>us</span></span>
      <div class="burst-layer" aria-hidden="true"></div>
    </main>
    <div class="veil" aria-hidden="true"></div>
    <footer class="interaction-bar">
      <p class="hint" aria-live="polite">Unwrapping a little universe…</p>
      <div class="journey" aria-label="Adventure progress"><span class="active"></span><span></span><span></span><span></span><span></span><span></span></div>
    </footer>
  </div>
  <dialog id="editor" class="dialog">
    <button class="dialog-close icon-button" aria-label="Close personalisation">${icon(close)}</button><h2>Make it yours.</h2>
    <form id="card-form">
      <label>To<input name="name" maxlength="32" required autocomplete="off"></label>
      <label>Your love note<textarea name="message" maxlength="1600" required rows="6"></textarea></label>
      <label>Sign off<input name="signature" maxlength="80" required autocomplete="off"></label>
      <button class="save-button" type="submit">Save your card ${icon(arrow)}</button>
    </form>
    <button class="share-button">Copy a link to this card</button><p class="share-status" role="status"></p>
    <div class="settings-row"><button class="theme-button">${icon(moon)} Change colours</button><button class="credits-button">Asset credits</button></div>
  </dialog>
  <dialog id="credits" class="dialog credits-dialog">
    <button class="dialog-close icon-button" aria-label="Close credits">${icon(close)}</button><h2>A tiny universe.</h2>
    <p>Earth: <a href="https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry" target="_blank" rel="noreferrer">Blue Marble Next Generation</a> and <a href="https://visibleearth.nasa.gov/images/57747/blue-marble-clouds" target="_blank" rel="noreferrer">Blue Marble clouds</a>, NASA Earth Observatory (Reto Stöckli). Moon: <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noreferrer">CGI Moon Kit</a>, NASA’s Scientific Visualization Studio, from Lunar Reconnaissance Orbiter data.</p>
    <p>Fonts: <a href="https://github.com/CatharsisFonts/Cormorant" target="_blank" rel="noreferrer">Cormorant Garamond</a> and <a href="https://github.com/sharanda/manrope" target="_blank" rel="noreferrer">Manrope</a>. Icons: <a href="https://phosphoricons.com" target="_blank" rel="noreferrer">Phosphor</a>.</p>
    <p>Built with Three.js. Paper, stars, galaxies, cake, and original music created in your browser.</p>
    <button class="theme-button credits-theme">${icon(moon)} Change colours</button>
  </dialog>
`;
const experience = document.querySelector(".experience");
const world = document.querySelector(".world");
const letter = document.querySelector(".letter");
const hint = document.querySelector(".hint");
const flameHit = document.querySelector(".flame-hit");
const editor = document.querySelector("#editor");
const form = document.querySelector("#card-form");
const kissHit = document.querySelector(".kiss-hit");
const kissWhisper = document.querySelector(".kiss-whisper");
const usTag = document.querySelector(".us-tag");
const veilLayer = document.querySelector(".veil");
document.documentElement.dataset.scale = "home";
// Tapping the two dots out in the galaxy.
let usTapTimer,
  usBefore = null;
const US_LINE = ["That’s us.", "Population: two."];
function onUsTap() {
  if (phase !== "stars" || scene?.busy) return;
  const showing = gameCaption.querySelector("h2").textContent;
  if (showing !== US_LINE[1]) usBefore = [gameCaption.querySelector("p").textContent, showing];
  caption(gameCaption, US_LINE);
  if (soundOn) audio.chime(4);
  clearTimeout(usTapTimer);
  usTapTimer = setTimeout(() => {
    if (phase !== "stars" || gameCaption.querySelector("h2").textContent !== US_LINE[1]) return;
    caption(gameCaption, caught.size === 5 ? ["Of every star in the galaxy,", "you’re my person."] : usBefore);
  }, 3200);
}
// Any tap while the camera travels hurries the journey along (it never jumps).
document.addEventListener(
  "pointerdown",
  () => {
    if (scene?.busy) scene.hurry();
  },
  { capture: true, passive: true },
);
let kisses = 0,
  kissTimer,
  kissReveal,
  lastLetterTap = 0,
  lastLetterPoint,
  letterTapStart;
const kissWords = [
  "A kiss, from me to you.",
  "One for every time we made up.",
  "One for the next squabble. In advance.",
  "One just because you’re my person.",
  "And one more. Always.",
];
const orbitSection = document.querySelector(".little-orbit");
const orbitCaption = document.querySelector(".orbit-caption");
const gameCaption = document.querySelector(".game-caption");
const pullLines = [
  ["Sometimes we drift apart", "over the silliest things…"],
  ["Another petty squabble?", "Watch this…"],
  ["Go on, pull harder.", "Nope."],
];
const reunionLines = [
  ["But every single time,", "we come back."],
  ["Every. Single. Time.", "Told you."],
  ["Still here.", "Still yours."],
];
let pulls = 0,
  reunions = 0,
  driftTimer;
function caption(el, [lead, line]) {
  el.querySelector("p").textContent = lead;
  el.querySelector("h2").textContent = line;
  el.classList.remove("swap");
  void el.offsetWidth;
  el.classList.add("swap");
}
let sulkTimer;
function onPullStart(auto = false) {
  if (phase !== "orbit") return;
  caption(orbitCaption, pullLines[Math.min(pulls++, pullLines.length - 1)]);
  if (!auto) hint.textContent = "Now let go.";
  if (soundOn) audio.drift();
}
// Held too far for too long, the moon sulks (and turns its back). Let go and it comes home.
function onSulk() {
  if (phase !== "orbit") return;
  caption(orbitCaption, ["Fine.", "I’m sulking."]);
  buzz([8, 40, 8]);
  clearTimeout(sulkTimer);
  sulkTimer = setTimeout(() => {
    if (phase === "orbit" && orbitCaption.querySelector("h2").textContent === "I’m sulking.")
      caption(orbitCaption, ["Still sulking.", "…mostly."]);
  }, 2500);
}
function onReunion(sulked = false) {
  if (phase !== "orbit") return;
  clearTimeout(sulkTimer);
  caption(
    orbitCaption,
    sulked ? ["Okay, I can’t even", "stay mad for one orbit."] : reunionLines[Math.min(reunions, reunionLines.length - 1)],
  );
  reunions++;
  experience.dataset.reunions = String(reunions);
  if (soundOn) audio.reunion();
  buzz([14, 70, 22]);
  hint.textContent = "Pull again, or touch the Earth to zoom out.";
}
// Without WebGL (or from the keyboard), the moon drifts off and swings back by itself.
function drift() {
  if (phase !== "orbit") return;
  if (scene) {
    scene.driftMoon();
    return;
  }
  if (orbitSection.classList.contains("drifting")) return;
  onPullStart(true);
  orbitSection.classList.add("drifting");
  driftTimer = setTimeout(
    () => {
      orbitSection.classList.remove("drifting");
      onReunion();
    },
    reduce.matches ? 0 : 1700,
  );
}
function onEarthTap() {
  if (phase !== "orbit" || scene?.busy) return;
  if (reunions) setPhase("stars");
  else drift();
}
document.querySelector(".orbit-moon-hit").addEventListener("click", drift);
document.querySelector(".orbit-earth-hit").addEventListener("click", onEarthTap);
function receiveKiss(point) {
  if (phase !== "finale") return;
  // Kisses wait until the heart has come home and the greeting is showing.
  if (scene && document.querySelector(".finale").dataset.stage !== "home") return;
  scene?.sendKiss(point);
  if (soundOn) audio.kiss();
  if (point) buzz(12);
  kissWhisper.classList.remove("coda");
  kissWhisper.textContent = kissWords[kisses++ % kissWords.length];
  kissWhisper.hidden = false;
  if (kisses === 3) {
    clearTimeout(codaTimer);
    codaTimer = setTimeout(showCoda, 3000);
  }
  experience.dataset.kisses = String(kisses);
  clearTimeout(kissTimer);
  kissTimer = setTimeout(() => (kissWhisper.hidden = true), 2600);
  if (!scene) {
    const r = world.getBoundingClientRect();
    burst(r.width * 0.5, r.height * 0.4, 18);
  }
}
kissHit.addEventListener("click", () => receiveKiss());
const field = document.querySelector(".star-field");
const starPositions = [
  [50, 77],
  [15, 44],
  [30, 20],
  [70, 20],
  [85, 44],
];
const caught = new Set();
const heartControl = document.querySelector(".heart-control");
heartControl.addEventListener("click", () => {
  if (phase === "stars" && caught.size === 5) setPhase("wish");
});
document.querySelector(".moon-hit").addEventListener("click", () => {
  if (phase === "finale") setPhase("envelope");
  else scene?.spinMoon();
});
// Night is the card's own sky; the daylight palette stays one tap away in the credits.
let theme = "night";
try {
  theme = localStorage.getItem("orbit-theme") || theme;
} catch {}

function fillCopy() {
  document
    .querySelectorAll(".recipient-name")
    .forEach((el) => (el.textContent = card.name));
  document.querySelector(".letter-greeting").textContent =
    `My dearest ${card.name},`;
  document.querySelector(".letter-signature").textContent = card.signature;
  document.querySelector(".letter-body").replaceChildren(
    ...card.message.split(/\n\s*\n/).map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    }),
  );
  document.title = `For ${card.name}, with love · A little orbit`;
}
// While the camera travels between scales, captions wait; they arrive once it settles.
function travel(on) {
  if (on) experience.dataset.travel = "";
  else delete experience.dataset.travel;
}
let usLineTimer, codaTimer;
function setPhase(next) {
  if (phase === "letter" && next === "orbit" && soundOn) audio.paper();
  const journeying =
    Boolean(scene) &&
    ((phase === "letter" && next === "orbit") || (phase === "orbit" && next === "stars") || (phase === "stars" && next === "wish") || next === "finale");
  if (journeying && soundOn && next !== "finale") audio.whoosh(next === "wish" ? -1 : 1);
  travel(journeying);
  clearTimeout(kissTimer);
  clearTimeout(kissReveal);
  clearTimeout(driftTimer);
  clearTimeout(sulkTimer);
  clearTimeout(usLineTimer);
  clearTimeout(codaTimer);
  audio.hush?.(false);
  delete document.querySelector(".finale").dataset.stage;
  orbitSection.classList.remove("drifting");
  kissWhisper.hidden = true;
  stopHold();
  phase = next;
  kissHit.hidden = phase !== "finale";
  document
    .querySelector(".moon-hit")
    .setAttribute(
      "aria-label",
      phase === "finale" ? "Play again by touching the moon" : "Spin the moon",
    );
  experience.dataset.phase = phase;
  letter.hidden = phase !== "letter";
  orbitSection.hidden = phase !== "orbit";
  document.querySelector(".stardust").hidden = phase !== "stars";
  document.querySelector(".wish-caption").hidden = phase !== "wish";
  document.querySelector(".finale").hidden = phase !== "finale";
  flameHit.hidden = phase !== "wish";
  hint.textContent = {
    envelope: "Drag the envelope. Tap it to open.",
    letter: "Double-tap the paper for a kiss. Swipe up to continue.",
    orbit: scene
      ? "Pull the moon away from the Earth."
      : "Tap the moon.",
    stars: "Tap the five golden stars.",
    wish: "Turn the cake. Hold the flame to make a wish.",
    finale: "Touch the heart for a kiss. The moon starts it again.",
  }[phase];
  document
    .querySelectorAll(".journey span")
    .forEach((dot, i) =>
      dot.classList.toggle(
        "active",
        i <= phases.indexOf(phase),
      ),
    );
  scene?.setStep(steps[phase]);
  if (phase === "orbit") {
    pulls = reunions = 0;
    experience.dataset.reunions = "0";
    caption(orbitCaption, ["In the whole solar system,", "you’re my world."]);
  }
  if (journeying) hint.textContent = "";
  if (phase === "letter") {
    letter.style.removeProperty("animation");
    requestAnimationFrame(() => {
      const long = letter.scrollHeight > letter.clientHeight + 2;
      letter.classList.toggle("long-letter", long);
      if (long)
        hint.textContent =
          "Double-tap for a kiss. Tap its little heart to continue.";
    });
    letter.focus({ preventScroll: true });
  }
  if (phase === "stars") resetStars();
  if (phase === "finale") {
    kisses = 0;
    experience.dataset.kisses = "0";
    const finale = document.querySelector(".finale");
    if (scene) {
      // Her wish rides out to the edge of the universe; the greeting waits for it to come home.
      finale.dataset.stage = "away";
      scene.celebrate();
      if (soundOn) audio.breath?.();
    } else {
      if (soundOn) audio.celebrate();
      celebrateScreen();
      kissReveal = setTimeout(() => receiveKiss(), reduce.matches ? 0 : 1200);
      codaTimer = setTimeout(showCoda, (reduce.matches ? 0 : 1200) + 12000);
      finale.focus({ preventScroll: true });
    }
  }
}
const finaleHint = "Touch the heart for a kiss. The moon starts it again.";
function onBeat(name, timeline) {
  if (name === "arrive") {
    travel(false);
    if (timeline === "liftoff" && phase === "orbit") {
      caption(orbitCaption, ["In the whole solar system,", "you’re my world."]);
      hint.textContent = "Pull the moon away from the Earth.";
    }
    if (timeline === "pullout" && phase === "stars") {
      caption(gameCaption, ["From way out here, you can’t even tell", "we squabble."]);
      hint.textContent = "Tap the five golden stars.";
      usLineTimer = setTimeout(() => {
        if (phase === "stars" && caught.size < 5) caption(gameCaption, ["A little stardust for your wish.", "Catch the stars."]);
      }, 3600);
      if (soundOn) audio.chime();
    }
    if (timeline === "rushHome" && phase === "wish") {
      const wish = document.querySelector(".wish-caption");
      wish.classList.remove("swap");
      void wish.offsetWidth;
      wish.classList.add("swap");
      hint.textContent = "Turn the cake. Hold the flame to make a wish.";
    }
  }
  if (name === "heartbeat" && soundOn) audio.heartbeat?.();
  if (phase !== "finale") return;
  const finale = document.querySelector(".finale");
  if (name === "silence") audio.hush?.(true);
  if (name === "line") {
    finale.dataset.stage = "line";
    if (soundOn) audio.chime();
  }
  if (name === "celebrate") {
    audio.hush?.(false);
    if (soundOn) audio.celebrate();
    celebrateScreen();
  }
  if (name === "home") {
    finale.dataset.stage = "home";
    travel(false);
    hint.textContent = finaleHint;
    finale.focus({ preventScroll: true });
  }
  if (name === "kiss") {
    receiveKiss();
    // A last whisper, true to tonight's sky (sooner if she keeps kissing).
    if (kisses < 3) {
      clearTimeout(codaTimer);
      codaTimer = setTimeout(showCoda, 12000);
    }
  }
}
function showCoda() {
  if (phase !== "finale") return;
  clearTimeout(kissTimer);
  kissWhisper.textContent = codaFor(new Date()).join("\n");
  kissWhisper.hidden = false;
  kissWhisper.classList.add("coda");
  kissTimer = setTimeout(() => {
    kissWhisper.hidden = true;
    kissWhisper.classList.remove("coda");
  }, 6500);
}
function openEnvelope() {
  if (phase !== "envelope" || opening) return;
  opening = true;
  experience.classList.add("opening");
  scene?.setStep(1);
  if (soundOn) audio.chime();
  if (soundOn) audio.paper();
  hint.textContent = "For you, with all my love.";
  transitionTimer = setTimeout(
    () => {
      opening = false;
      experience.classList.remove("opening");
      setPhase("letter");
    },
    reduce.matches ? 0 : 950,
  );
}
document.querySelector(".envelope-hit").addEventListener("click", openEnvelope);
document
  .querySelector(".paper-next")
  .addEventListener("click", () => setPhase("orbit"));
let letterDrag = null;
letter.addEventListener("pointerdown", (event) => {
  if (
    event.target.closest("button") ||
    phase !== "letter" ||
    letter.scrollHeight > letter.clientHeight + 2
  )
    return;
  letterDrag = { id: event.pointerId, y: event.clientY, dy: 0 };
  letter.setPointerCapture(event.pointerId);
  letter.style.animation = "none";
});
letter.addEventListener("pointermove", (event) => {
  if (!letterDrag || letterDrag.id !== event.pointerId) return;
  letterDrag.dy = Math.min(30, event.clientY - letterDrag.y);
  letter.style.transform = `translate(-50%,calc(-50% + ${letterDrag.dy}px)) rotate(${-1.5 - letterDrag.dy * 0.015}deg)`;
  letter.style.opacity = String(Math.max(0.3, 1 + letterDrag.dy / 450));
});
function releaseLetter(cancel = false) {
  if (!letterDrag) return;
  const leave = !cancel && letterDrag.dy < -65;
  letterDrag = null;
  letter.style.removeProperty("transform");
  letter.style.removeProperty("opacity");
  if (leave) setPhase("orbit");
}
letter.addEventListener("pointerup", () => releaseLetter());
letter.addEventListener("pointercancel", () => releaseLetter(true));
letter.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  letterTapStart = {
    x: event.clientX,
    y: event.clientY,
    time: performance.now(),
  };
});
letter.addEventListener("pointerup", (event) => {
  if (!letterTapStart || phase !== "letter") return;
  const tap = letterTapStart;
  letterTapStart = null;
  if (
    Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 9 ||
    performance.now() - tap.time > 400
  )
    return;
  const now = performance.now();
  if (
    now - lastLetterTap < 340 &&
    lastLetterPoint &&
    Math.hypot(
      event.clientX - lastLetterPoint.x,
      event.clientY - lastLetterPoint.y,
    ) < 28
  ) {
    const r = letter.getBoundingClientRect(),
      stamp = document.createElement("span");
    stamp.className = "paper-kiss";
    stamp.setAttribute("aria-hidden", "true");
    stamp.style.cssText = `left:${Math.max(12, Math.min(letter.clientWidth - 88, event.clientX - r.left - 44))}px;top:${Math.max(12, Math.min(letter.scrollHeight - 88, event.clientY - r.top + letter.scrollTop - 44))}px;--kiss-angle:${(Math.random() - 0.5) * 34}deg;`;
    const image = document.createElement("img");
    image.src = `${import.meta.env.BASE_URL}assets/kiss.webp`;
    image.alt = "";
    stamp.append(image);
    letter.append(stamp);
    const marks = letter.querySelectorAll(".paper-kiss");
    if (marks.length > 6) marks[0].remove();
    if (soundOn) audio.kiss();
    hint.textContent = "A little kiss, from me to you.";
    lastLetterTap = 0;
    clearTimeout(kissTimer);
    kissTimer = setTimeout(() => {
      if (phase === "letter")
        hint.textContent = letter.classList.contains("long-letter")
          ? "Double-tap for a kiss. Tap its little heart to continue."
          : "Double-tap the paper for a kiss. Swipe up to continue.";
    }, 2200);
  } else {
    lastLetterTap = now;
    lastLetterPoint = { x: event.clientX, y: event.clientY };
  }
});
letter.addEventListener("pointercancel", () => (letterTapStart = null));
function burst(x, y, count = 12) {
  if (reduce.matches) return;
  const layer = document.querySelector(".burst-layer");
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span"),
      angle = (i * Math.PI * 2) / count;
    p.className = "particle";
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(angle) * (45 + Math.random() * 60)}px;--dy:${Math.sin(angle) * (45 + Math.random() * 60)}px;--turn:${Math.random() * 200}deg;`;
    p.innerHTML = icon(star);
    layer.append(p);
    p.addEventListener("animationend", () => p.remove(), { once: true });
  }
}
function celebrateScreen() {
  const r = world.getBoundingClientRect();
  burst(r.width * 0.5, r.height * 0.45, 24);
}
function drawConstellation() {
  if (scene) return;
  const canvas = document.querySelector(".constellation"),
    r = field.getBoundingClientRect(),
    dpr = Math.min(devicePixelRatio, 2);
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const scale = Math.min(r.width, r.height) * 0.42;
  ctx.strokeStyle = theme === "night" ? "#ead38e" : "#526a70";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const count = Math.floor((400 * caught.size) / 5);
  for (let i = 0; i <= count; i++) {
    const p = heartPoint((i / 400) * Math.PI * 2),
      x = r.width / 2 + p.x * scale,
      y = r.height / 2 - p.y * scale;
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
function collectStar(i) {
  if (caught.has(i) || phase !== "stars" || scene?.busy) return;
  caught.add(i);
  scene?.collectStar(i);
  const button = field.querySelectorAll(".catch-star")[i];
  if (button) {
    button.classList.add("caught");
    button.disabled = true;
  }
  if (soundOn) audio.chime(caught.size - 1);
  updateScore();
  drawConstellation();
  if (caught.size === 5) {
    clearTimeout(usTapTimer);
    clearTimeout(usLineTimer);
    caption(gameCaption, ["Of every star in the galaxy,", "you’re my person."]);
    hint.textContent = "Tap the heart to make your wish.";
    heartControl.hidden = false;
  }
}
function resetStars() {
  heartControl.hidden = true;
  caught.clear();
  field.querySelectorAll(".catch-star").forEach((el) => el.remove());
  gameCaption.querySelector("p").textContent = "A little stardust for your wish.";
  gameCaption.querySelector("h2").textContent = "Catch the stars.";
  starPositions.forEach(([x, y], i) => {
    const button = document.createElement("button");
    button.className = "catch-star";
    button.style.cssText =
      "left:" + x + "%;top:" + y + "%;--delay:" + i * -0.8 + "s";
    button.setAttribute("aria-label", "Catch star " + (i + 1));
    button.innerHTML = icon(star);
    button.addEventListener("click", () => collectStar(i));
    button.addEventListener("focus", () => scene?.highlightStar(i));
    button.addEventListener("blur", () => scene?.highlightStar(-1));
    field.append(button);
  });
  updateScore();
  requestAnimationFrame(drawConstellation);
}
function updateScore() {
  const score = document.querySelector(".star-score");
  score.innerHTML = Array.from(
    { length: 5 },
    (_, i) =>
      `<span class="${i < caught.size ? "lit" : ""}">${icon(star)}</span>`,
  ).join("");
  score.setAttribute("aria-label", `${caught.size} of 5 stars caught`);
}
new ResizeObserver(() => {
  if (phase === "stars") drawConstellation();
}).observe(field);

let holdStart = 0,
  holdFrame = 0;
function stopHold() {
  cancelAnimationFrame(holdFrame);
  holdStart = 0;
  experience.style.setProperty("--wish", 0);
  scene?.setWishProgress(0);
}
function finishWish() {
  if (phase !== "wish") return;
  stopHold();
  setPhase("finale");
}
function startHold(event) {
  if (phase !== "wish" || holdStart || scene?.busy) return;
  if (event.type === "pointerdown") {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  holdStart = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - holdStart) / 1350);
    experience.style.setProperty("--wish", p);
    scene?.setWishProgress(p);
    if (p === 1) finishWish();
    else holdFrame = requestAnimationFrame(tick);
  };
  holdFrame = requestAnimationFrame(tick);
}
function releaseWish() {
  if (holdStart && performance.now() - holdStart >= 1350) finishWish();
  else stopHold();
}
for (const button of [flameHit]) {
  button.addEventListener("pointerdown", startHold);
  button.addEventListener("pointerup", releaseWish);
  button.addEventListener("pointercancel", stopHold);
  button.addEventListener("lostpointercapture", stopHold);
  button.addEventListener("click", (e) => {
    if (e.detail === 0) finishWish();
  });
}
function setTheme() {
  document.documentElement.dataset.theme = theme;
  scene?.setTheme(theme);
  if (phase === "stars") drawConstellation();
}
setTheme();
document.querySelectorAll(".theme-button").forEach((button) =>
  button.addEventListener("click", () => {
    theme = theme === "night" ? "day" : "night";
    setTheme();
    try {
      localStorage.setItem("orbit-theme", theme);
    } catch {}
  }),
);
function wakeSound(event) {
  if (!soundOn || audio.running || event.target.closest?.(".sound-button")) return;
  audio.setEnabled(true);
}
for (const type of ["pointerdown", "pointerup", "touchend", "click", "keydown"])
  document.addEventListener(type, wakeSound, { capture: true, passive: true });
document.querySelector(".sound-button").addEventListener("click", (event) => {
  soundOn = !soundOn;
  audio.setEnabled(soundOn);
  const b = event.currentTarget;
  b.setAttribute("aria-pressed", String(soundOn));
  b.setAttribute("aria-label", soundOn ? "Turn off music" : "Turn on music");
  b.querySelector("img").src = soundOn ? speaker : muted;
});
// A long press is a gesture here, never a selection or a context menu.
for (const type of ["selectstart", "contextmenu", "dragstart"])
  experience.addEventListener(type, (event) => event.preventDefault());
const buzz = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
};
// The pencil is for the sender: open the card with #edit to personalise it.
function syncEditing() {
  document.documentElement.classList.toggle(
    "editing",
    new URLSearchParams(location.hash.slice(1)).has("edit"),
  );
}
syncEditing();
document
  .querySelector(".about-button")
  .addEventListener("click", () => document.querySelector("#credits").showModal());
document.querySelector(".edit-button").addEventListener("click", () => {
  for (const k of ["name", "message", "signature"])
    form.elements[k].value = card[k];
  document.querySelector(".share-status").textContent = "";
  editor.showModal();
});
document
  .querySelectorAll(".dialog-close")
  .forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
document
  .querySelector(".credits-button")
  .addEventListener("click", () =>
    document.querySelector("#credits").showModal(),
  );
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (
    ["name", "message", "signature"].some((k) => !form.elements[k].value.trim())
  )
    return;
  for (const k of ["name", "message", "signature"])
    card[k] = form.elements[k].value.trim();
  fillCopy();
  scene?.updateName(card.name);
  editor.close();
});
document.querySelector(".share-button").addEventListener("click", async () => {
  const values = Object.fromEntries(
    ["name", "message", "signature"].map((k) => [
      k,
      form.elements[k].value.trim() || card[k],
    ]),
  );
  const encoded = btoa(
    Array.from(new TextEncoder().encode(JSON.stringify(values)), (b) =>
      String.fromCharCode(b),
    ).join(""),
  );
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ card: encoded });
  const status = document.querySelector(".share-status");
  try {
    await navigator.clipboard.writeText(url.href);
    status.textContent = "Link copied. Ready to send.";
  } catch {
    status.textContent = "Copy this link:";
    const input = document.createElement("input");
    input.readOnly = true;
    input.value = url.href;
    status.append(input);
    input.select();
  }
});
let seed = 41;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
for (let i = 0; i < 70; i++) {
  const point = document.createElement("span");
  point.style.cssText = `left:${random() * 100}%;top:${random() * 100}%;opacity:${random() * 0.5 + 0.15};--size:${i % 8 ? 1.5 : 3}px;`;
  document.querySelector(".sky").append(point);
}
fillCopy();
window.addEventListener("hashchange", () => {
  syncEditing();
  Object.assign(card, readCard());
  fillCopy();
  scene?.updateName(card.name);
  clearTimeout(transitionTimer);
  opening = false;
  experience.classList.remove("opening");
  editor.close();
  setPhase("envelope");
});
import("./scene.js")
  .then(async ({ createScene }) => {
    await document.fonts.ready;
    const host = document.querySelector("#scene");
    let lastX = -1000,
      lastY = -1000,
      lastMoonX = -1000,
      lastMoonY = -1000,
      lastKissX = -1000,
      lastKissY = -1000;
    scene = createScene(host, {
      name: card.name,
      theme,
      reducedMotion: reduce.matches,
      onEnvelopeTap: openEnvelope,
      onStarTap: collectStar,
      onHeartTap() {
        if (phase === "stars" && caught.size === 5) setPhase("wish");
      },
      onKissTap: receiveKiss,
      onKissPosition(x, y) {
        const px = x - 60,
          py = y - 60;
        if (Math.abs(px - lastKissX) > 1 || Math.abs(py - lastKissY) > 1) {
          kissHit.style.transform = `translate3d(${px}px,${py}px,0)`;
          lastKissX = px;
          lastKissY = py;
        }
      },
      onPullStart,
      onReunion,
      onSulk,
      onEarthTap,
      onBeat,
      onScale(name) {
        document.documentElement.dataset.scale = name;
      },
      onUsTap,
      onUs(x, y, dots, tag, veil) {
        usTag.style.transform = `translate3d(${x - 22}px,${y - 22}px,0)`;
        usTag.style.setProperty("--tag", String(tag * Math.min(1, dots)));
        veilLayer.style.opacity = String(veil * 0.14);
      },
      onPullEnd() {
        if (phase === "orbit" && hint.textContent === "Now let go.") hint.textContent = "";
      },
      onWishStart: startHold,
      onWishEnd: releaseWish,
      onWishCancel: stopHold,
      onMoonTap() {
        if (phase === "finale") setPhase("envelope");
        else if (soundOn) audio.chime();
      },
      onCakeTap() {
        if (soundOn) audio.chime();
      },
      onSkyTap() {
        if (soundOn) audio.chime(Math.floor(Math.random() * 5));
      },
      onSparkleTap(x, y) {
        const r = world.getBoundingClientRect();
        burst(x - r.x, y - r.y);
        if (soundOn) audio.chime();
      },
      onMoonPosition(x, y) {
        const moonButton = document.querySelector(".moon-hit");
        const px = x - 45,
          py = y - 45;
        if (Math.abs(px - lastMoonX) > 1 || Math.abs(py - lastMoonY) > 1) {
          moonButton.style.transform = `translate3d(${px}px,${py}px,0)`;
          lastMoonX = px;
          lastMoonY = py;
        }
      },
      onFlamePosition(x, y) {
        const px = x - 52,
          py = y - 55;
        if (Math.abs(px - lastX) > 1 || Math.abs(py - lastY) > 1) {
          flameHit.style.transform = `translate3d(${px}px,${py}px,0)`;
          flameHit.style.left = "0";
          flameHit.style.top = "0";
          lastX = px;
          lastY = py;
        }
      },
    });
    document.documentElement.classList.remove("booting");
    if (phase === "envelope" && !opening) hint.textContent = "Drag the envelope. Tap it to open.";
    if (scene) {
      document.documentElement.classList.add("has-webgl");
      scene.setStep(steps[phase]);
      scene.setTheme(theme);
      if (phase === "stars")
        caught.forEach((index) => scene.collectStar(index));
      if (phase === "finale") scene.celebrate();
    }
  })
  .catch((error) => {
    document.documentElement.classList.remove("booting");
    if (phase === "envelope" && !opening) hint.textContent = "Tap the envelope to open it.";
    console.warn("Using the card fallback.", error);
  });
reduce.addEventListener("change", (event) =>
  scene?.setReducedMotion(event.matches),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopHold();
  audio.setVisible(!document.hidden);
});
window.addEventListener("pageshow", () => audio.setVisible(!document.hidden));
window.addEventListener("pagehide", (event) => {
  audio.setVisible(false);
  if (event.persisted) {
    stopHold();
    return;
  }
  clearTimeout(transitionTimer);
  clearTimeout(kissTimer);
  clearTimeout(kissReveal);
  clearTimeout(driftTimer);
  stopHold();
  scene?.dispose();
  audio.dispose();
});
