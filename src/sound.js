// An original, quiet pentatonic music box. Everything is synthesized locally.
export function createAudio() {
  let context,
    bus,
    timer,
    transition,
    paperBuffer,
    enabled = false,
    visible = !document.hidden,
    disposed = false,
    revision = 0,
    note = 0,
    hushed = false,
    noiseBuffer;
  const sequence = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
  const starNotes = [523.25, 587.33, 659.25, 783.99, 880];
  const voices = new Map();
  const effectNodes = [];

  function clearTimer() {
    clearInterval(timer);
    timer = undefined;
  }
  function track(source, nodes) {
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      voices.delete(source);
      nodes.forEach((node) => node.disconnect());
    };
    voices.set(source, cleanup);
    source.onended = cleanup;
  }
  function stopVoices() {
    for (const [source, cleanup] of voices) {
      try {
        source.stop();
      } catch {}
      cleanup();
    }
  }
  function createContext() {
    if (context) return true;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    try {
      context = new Audio();
      bus = context.createGain();
      bus.gain.value = 0.48;
      bus.connect(context.destination);

      // One soft, filtered reflection adds depth without a feedback loop.
      const echo = context.createDelay(0.5),
        filter = context.createBiquadFilter(),
        wet = context.createGain();
      echo.delayTime.value = 0.185;
      filter.type = "lowpass";
      filter.frequency.value = 2700;
      filter.Q.value = 0.4;
      wet.gain.value = 0.11;
      bus.connect(echo);
      echo.connect(filter);
      filter.connect(wet);
      effectNodes.push(echo, filter, wet);
      if (context.createStereoPanner) {
        const pan = context.createStereoPanner();
        pan.pan.value = 0.22;
        wet.connect(pan);
        pan.connect(context.destination);
        effectNodes.push(pan);
      } else wet.connect(context.destination);
      return true;
    } catch {
      bus?.disconnect();
      effectNodes.splice(0).forEach((node) => node.disconnect());
      const failedContext = context;
      context = undefined;
      bus = undefined;
      failedContext?.close().catch(() => {});
      return false;
    }
  }
  function canPlay() {
    return (
      context &&
      enabled &&
      visible &&
      !disposed &&
      context.state === "running" &&
      voices.size < 32
    );
  }
  function play(frequency, delay = 0, volume = 0.1, duration = 2.2) {
    if (!canPlay()) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(bus);
    track(oscillator, [oscillator, gain]);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.1);
  }
  function schedule() {
    if (!canPlay() || document.hidden || hushed) return;
    play(sequence[note++ % sequence.length]);
    if (note % 4 === 0) play(130.81, 0, 0.045);
  }
  function synchronize(resetOnFailure = false) {
    const request = ++revision;
    clearTimer();
    if (!enabled || !visible) stopVoices();
    if (!context || disposed) return Promise.resolve(enabled);
    const apply = async () => {
      if (disposed || request !== revision) return enabled;
      if (enabled && visible) {
        await context.resume();
        if (!disposed && request === revision && enabled && visible) {
          schedule();
          timer = setInterval(schedule, 900);
        }
      } else await context.suspend();
      return enabled;
    };
    // The first resume runs inside the tap; later changes are serialized.
    const operation = (transition ? transition.then(apply, apply) : apply()).catch(
      () => {
        if (request === revision && !disposed) {
          if (resetOnFailure) enabled = false;
          clearTimer();
          stopVoices();
        }
        return enabled;
      },
    );
    transition = operation;
    operation.then(() => {
      if (transition === operation) transition = undefined;
    });
    return operation;
  }
  return {
    get running() {
      return Boolean(context && enabled && context.state === "running");
    },
    setEnabled(value) {
      const next = Boolean(value);
      if (disposed || (next && !createContext())) return Promise.resolve(false);
      // On iPhone this is music, so it should play like music even with the silent switch on.
      try {
        if (next && navigator.audioSession) navigator.audioSession.type = "playback";
      } catch {}
      if (next && context.state !== "running") context.resume().catch(() => {});
      if (enabled === next && (!next || context.state === "running"))
        return transition || Promise.resolve(enabled);
      enabled = next;
      return synchronize(true);
    },
    toggle() {
      if (disposed || !createContext()) return Promise.resolve(false);
      enabled = !enabled;
      return synchronize(true);
    },
    setVisible(value) {
      const next = Boolean(value);
      if (disposed) return Promise.resolve(false);
      if (visible === next) return transition || Promise.resolve(enabled);
      visible = next;
      return synchronize();
    },
    chime(index) {
      if (Number.isInteger(index)) {
        const frequency = starNotes[Math.max(0, Math.min(4, index))];
        play(frequency, 0, 0.085, 1.5);
        play(frequency * 2, 0.075, 0.018, 0.9);
      } else {
        play(523.25);
        play(659.25, 0.15);
      }
    },
    kiss() {
      play(659.25, 0, 0.065, 0.85);
      play(783.99, 0.1, 0.042, 1);
      play(1046.5, 0.22, 0.024, 0.8);
    },
    paper() {
      if (!canPlay()) return;
      if (!paperBuffer) {
        const length = Math.ceil(context.sampleRate * 0.19);
        paperBuffer = context.createBuffer(1, length, context.sampleRate);
        const samples = paperBuffer.getChannelData(0);
        let seed = 71;
        for (let i = 0; i < length; i++) {
          seed = (seed * 16807) % 2147483647;
          samples[i] = (seed / 2147483647) * 2 - 1;
        }
      }
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter(),
        gain = context.createGain(),
        now = context.currentTime;
      source.buffer = paperBuffer;
      filter.type = "bandpass";
      filter.frequency.value = 1450;
      filter.Q.value = 0.5;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.018, now + 0.025);
      gain.gain.linearRampToValueAtTime(0.004, now + 0.07);
      gain.gain.linearRampToValueAtTime(0.012, now + 0.11);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      track(source, [source, filter, gain]);
      source.start(now);
      source.stop(now + 0.19);
    },
    // The music box holds its breath for the widest view, then plays on.
    hush(value) {
      hushed = Boolean(value);
    },
    // Air moving past: a filtered noise sweep, up for leaving and down for coming home.
    whoosh(direction = 1) {
      if (!canPlay()) return;
      if (!noiseBuffer) {
        const length = Math.ceil(context.sampleRate * 1.1);
        noiseBuffer = context.createBuffer(1, length, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let seed = 17;
        for (let i = 0; i < length; i++) {
          seed = (seed * 16807) % 2147483647;
          data[i] = (seed / 2147483647) * 2 - 1;
        }
      }
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter(),
        gain = context.createGain(),
        now = context.currentTime;
      source.buffer = noiseBuffer;
      filter.type = "bandpass";
      filter.Q.value = 0.9;
      filter.frequency.setValueAtTime(direction > 0 ? 450 : 1500, now);
      filter.frequency.exponentialRampToValueAtTime(direction > 0 ? 1500 : 420, now + 0.9);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.022, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      track(source, [source, filter, gain]);
      source.start(now);
      source.stop(now + 1.1);
    },
    // A soft lub-dub when the Earth and Moon become two little dots.
    heartbeat() {
      play(98, 0, 0.09, 0.35);
      play(130.81, 0.22, 0.07, 0.42);
    },
    breath() {
      play(392, 0, 0.02, 0.6);
      play(261.63, 0.12, 0.018, 0.9);
    },
    // A small rising sigh as they drift apart, and a resolving chime when they meet again.
    drift() {
      play(329.63, 0, 0.032, 1.1);
      play(293.66, 0.22, 0.026, 1.2);
    },
    reunion() {
      play(392, 0, 0.05, 1.3);
      play(523.25, 0.16, 0.08, 2);
      play(659.25, 0.3, 0.035, 1.6);
      play(1046.5, 0.42, 0.016, 1.2);
    },
    celebrate() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => play(f, i * 0.18));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      enabled = false;
      revision++;
      clearTimer();
      stopVoices();
      bus?.disconnect();
      effectNodes.forEach((node) => node.disconnect());
      paperBuffer = undefined;
      noiseBuffer = undefined;
      context?.close().catch(() => {});
    },
  };
}
