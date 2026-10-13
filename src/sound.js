// An original, quiet pentatonic music box. No recording or microphone permissions.
export function createAudio() {
  let context,
    bus,
    timer,
    enabled = false,
    note = 0;
  const sequence = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
  const voices = new Set();
  function play(frequency, delay = 0, volume = 0.1) {
    if (!context || !enabled) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    oscillator.connect(gain);
    gain.connect(bus);
    oscillator.start(now);
    oscillator.stop(now + 2.3);
    voices.add(oscillator);
    oscillator.onended = () => {
      voices.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  function schedule() {
    if (!document.hidden) {
      play(sequence[note++ % sequence.length]);
      if (note % 4 === 0) play(130.81, 0, 0.045);
    }
  }
  return {
    async toggle() {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        context = new Audio();
        bus = context.createGain();
        bus.gain.value = 0.48;
        bus.connect(context.destination);
      }
      if (enabled) {
        enabled = false;
        clearInterval(timer);
        await context.suspend();
      } else {
        await context.resume();
        enabled = true;
        schedule();
        timer = setInterval(schedule, 900);
      }
      return enabled;
    },
    chime() {
      play(523.25);
      play(659.25, 0.15);
    },
    celebrate() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => play(f, i * 0.18));
    },
    dispose() {
      clearInterval(timer);
      voices.forEach((voice) => {
        try {
          voice.stop();
        } catch {}
      });
      context?.close();
    },
  };
}
