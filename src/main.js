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
import star from "@phosphor-icons/core/assets/fill/star-four-fill.svg";
import close from "@phosphor-icons/core/assets/regular/x.svg";
import { createAudio } from "./sound.js";
import { heartPoint } from "./heart.js";

const defaults = {
  name: "Alka",
  signature: "All my love, always",
  message:
    "Somehow, in this very big universe, I got to find you. And of all the things life has surprised me with, you are my favourite.\n\nI hope this next trip around the sun brings you the kind of happiness you give me: the little everyday kind, and the big, can't-stop-smiling kind.\n\nHappy birthday, my love. I'm so lucky to be in your orbit.",
};
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
const audio = createAudio();
let phase = "envelope",
  soundOn = false,
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
        <button class="icon-button sound-button" aria-label="Turn on music" aria-pressed="false">${icon(muted)}</button>
        <button class="icon-button edit-button" aria-label="Personalise your card">${icon(pencil)}</button>
      </div>
    </header>
    <main class="world" aria-label="Your birthday adventure">
      <div class="opening-caption"><p>Special delivery</p><h1>For my favourite person.</h1></div>
      <div class="orbit orbit-one" aria-hidden="true"></div><div class="orbit orbit-two" aria-hidden="true"></div>
      <div id="scene" aria-hidden="true"></div>
      <button class="moon-hit" aria-label="Spin the moon"></button>
      <div class="fallback-envelope" aria-hidden="true"><div class="fallback-flap"></div><span>For <span class="recipient-name"></span>,<br><em>with all my love.</em></span><span class="fallback-seal">${icon(sun)}</span></div>
      <button class="envelope-hit" aria-label="Open your birthday envelope"></button>
      <article class="letter" aria-label="A love letter for you" tabindex="-1" hidden>
        <div class="letter-border">${icon(sun, "letter-sun")}
          <p class="letter-eyebrow">YOU ARE MY FAVOURITE KIND OF MAGIC</p>
          <h2 class="letter-greeting"></h2><div class="letter-body"></div>
          <p class="letter-signature"></p><button class="paper-next" aria-label="Put away your letter and catch stars">${icon(heart, "letter-heart")}</button>
        </div>
      </article>
      <section class="stardust" aria-label="Catch five stars to make a birthday wish" hidden>
        <div class="game-caption"><p>A little stardust for your wish.</p><h2>Catch the stars.</h2></div>
        <div class="star-field"><canvas class="constellation" aria-hidden="true"></canvas><button class="heart-control" aria-label="Touch your completed heart to make a wish" hidden></button></div>
        <div class="star-score" role="status" aria-label="0 of 5 stars caught"></div>
      </section>
      <div class="wish-caption" hidden><p>One last thing…</p><h2>Make a wish.</h2></div>
      <button class="flame-hit" aria-label="Blow out your birthday candle" hidden><span class="flame-ring" aria-hidden="true"></span></button>
      <div class="fallback-cake" aria-hidden="true"><span class="fallback-candle"><span class="fallback-fire"></span></span><span class="cake-icing"></span></div>
      <div class="finale" tabindex="-1" hidden><p>Another trip around the sun.</p><h2>Happy birthday,<br><em class="recipient-name"></em></h2><span>You’re my favourite person.</span></div>
      <div class="burst-layer" aria-hidden="true"></div>
    </main>
    <footer class="interaction-bar">
      <p class="hint" aria-live="polite">Drag the envelope. Tap it to open.</p>
      <div class="journey" aria-label="Adventure progress"><span class="active"></span><span></span><span></span><span></span></div>
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
    <p>Moon texture: <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noreferrer">NASA’s Scientific Visualization Studio</a>, from Lunar Reconnaissance Orbiter data.</p>
    <p>Fonts: <a href="https://github.com/CatharsisFonts/Cormorant" target="_blank" rel="noreferrer">Cormorant Garamond</a> and <a href="https://github.com/sharanda/manrope" target="_blank" rel="noreferrer">Manrope</a>. Icons: <a href="https://phosphoricons.com" target="_blank" rel="noreferrer">Phosphor</a>.</p>
    <p>Built with Three.js. Paper, stars, cake, and original music created in your browser.</p>
  </dialog>
`;
const experience = document.querySelector(".experience");
const world = document.querySelector(".world");
const letter = document.querySelector(".letter");
const hint = document.querySelector(".hint");
const flameHit = document.querySelector(".flame-hit");
const editor = document.querySelector("#editor");
const form = document.querySelector("#card-form");
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
let theme = matchMedia("(prefers-color-scheme: dark)").matches
  ? "night"
  : "day";
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
function setPhase(next) {
  stopHold();
  phase = next;
  document
    .querySelector(".moon-hit")
    .setAttribute(
      "aria-label",
      phase === "finale" ? "Play again by touching the moon" : "Spin the moon",
    );
  experience.dataset.phase = phase;
  letter.hidden = phase !== "letter";
  document.querySelector(".stardust").hidden = phase !== "stars";
  document.querySelector(".wish-caption").hidden = phase !== "wish";
  document.querySelector(".finale").hidden = phase !== "finale";
  flameHit.hidden = phase !== "wish";
  hint.textContent = {
    envelope: "Drag the envelope. Tap it to open.",
    letter: "Swipe your letter up when you’re ready.",
    stars: "Tap the five golden stars.",
    wish: "Turn the cake. Hold the flame to make a wish.",
    finale: "Tap the moon to do it all again.",
  }[phase];
  document
    .querySelectorAll(".journey span")
    .forEach((dot, i) =>
      dot.classList.toggle(
        "active",
        i <= ["envelope", "letter", "stars", "wish", "finale"].indexOf(phase),
      ),
    );
  scene?.setStep(
    { envelope: 0, letter: 1, stars: 3, wish: 2, finale: 2 }[phase],
  );
  if (phase === "letter") {
    letter.style.removeProperty("animation");
    requestAnimationFrame(() => {
      const long = letter.scrollHeight > letter.clientHeight + 2;
      letter.classList.toggle("long-letter", long);
      if (long)
        hint.textContent = "Read your letter, then tap its little heart.";
    });
    letter.focus({ preventScroll: true });
  }
  if (phase === "stars") resetStars();
  if (phase === "finale") {
    scene?.celebrate();
    if (soundOn) audio.celebrate();
    celebrateScreen();
    document.querySelector(".finale").focus({ preventScroll: true });
  }
}
function openEnvelope() {
  if (phase !== "envelope" || opening) return;
  opening = true;
  experience.classList.add("opening");
  scene?.setStep(1);
  if (soundOn) audio.chime();
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
  .addEventListener("click", () => setPhase("stars"));
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
  if (leave) setPhase("stars");
}
letter.addEventListener("pointerup", () => releaseLetter());
letter.addEventListener("pointercancel", () => releaseLetter(true));
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
  if (caught.has(i) || phase !== "stars") return;
  caught.add(i);
  scene?.collectStar(i);
  const button = field.querySelectorAll(".catch-star")[i];
  if (button) {
    button.classList.add("caught");
    button.disabled = true;
  }
  if (soundOn) audio.chime();
  updateScore();
  drawConstellation();
  if (caught.size === 5) {
    document.querySelector(".game-caption h2").textContent =
      "You’re my universe.";
    hint.textContent = "Tap the heart to make your wish.";
    heartControl.hidden = false;
  }
}
function resetStars() {
  heartControl.hidden = true;
  caught.clear();
  field.querySelectorAll(".catch-star").forEach((el) => el.remove());
  document.querySelector(".game-caption h2").textContent = "Catch the stars.";
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
  if (phase !== "wish" || holdStart) return;
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
document.querySelector(".theme-button").addEventListener("click", () => {
  theme = theme === "night" ? "day" : "night";
  setTheme();
  try {
    localStorage.setItem("orbit-theme", theme);
  } catch {}
});
document.querySelector(".sound-button").addEventListener("click", async () => {
  try {
    soundOn = await audio.toggle();
  } catch {
    soundOn = false;
  }
  const b = document.querySelector(".sound-button");
  b.setAttribute("aria-pressed", String(soundOn));
  b.setAttribute("aria-label", soundOn ? "Turn off music" : "Turn on music");
  b.querySelector("img").src = soundOn ? speaker : muted;
});
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
      lastY = -1000;
    scene = createScene(host, {
      name: card.name,
      theme,
      reducedMotion: reduce.matches,
      onEnvelopeTap: openEnvelope,
      onStarTap: collectStar,
      onHeartTap() {
        if (phase === "stars" && caught.size === 5) setPhase("wish");
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
      onSparkleTap(x, y) {
        const r = world.getBoundingClientRect();
        burst(x - r.x, y - r.y);
        if (soundOn) audio.chime();
      },
      onMoonPosition(x, y) {
        const moonButton = document.querySelector(".moon-hit");
        moonButton.style.transform = `translate3d(${x * host.clientWidth + host.offsetLeft - 45}px,${y * host.clientHeight - 45}px,0)`;
      },
      onFlamePosition(x, y) {
        const px = x * host.clientWidth + host.offsetLeft - 52,
          py = y * host.clientHeight - 55;
        if (Math.abs(px - lastX) > 1 || Math.abs(py - lastY) > 1) {
          flameHit.style.transform = `translate3d(${px}px,${py}px,0)`;
          flameHit.style.left = "0";
          flameHit.style.top = "0";
          lastX = px;
          lastY = py;
        }
      },
    });
    if (scene) {
      document.documentElement.classList.add("has-webgl");
      scene.setStep(
        { envelope: 0, letter: 1, stars: 3, wish: 2, finale: 2 }[phase],
      );
      if (phase === "finale") scene.celebrate();
    }
  })
  .catch((error) => console.warn("Using the card fallback.", error));
reduce.addEventListener("change", (event) =>
  scene?.setReducedMotion(event.matches),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopHold();
});
window.addEventListener(
  "pagehide",
  () => {
    clearTimeout(transitionTimer);
    stopHold();
    scene?.dispose();
    audio.dispose();
  },
  { once: true },
);
