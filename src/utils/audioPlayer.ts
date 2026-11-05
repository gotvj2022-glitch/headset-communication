/**
 * Audio playback utility with Gemini TTS WAV player,
 * Web Speech API fallback, and aviation radio squelch effects.
 */

// Play realistic radio click / squelch tone
export function playRadioClick(type: 'open' | 'close' = 'open') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (type === 'open') {
      osc.frequency.setValueAtTime(1150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else {
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    }
  } catch {
    // Ignore audio context error on initial page load
  }
}

// Play static audio file from URL with squelch radio click
export async function playAudioFileUrl(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      playRadioClick('open');
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        playRadioClick('close');
        resolve();
      };
      audio.onerror = (e) => {
        reject(e);
      };
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Optional pre-recorded static audio map for zero-latency canned aviation phrases
export const STATIC_SCRIPTED_AUDIO_MAP: Record<string, string> = {
  // Common ICAO aviation script phrases (zero network latency)
  'ground:parking brakes released': '',
  'cockpit:parking brakes released': '',
  'ground:parking brakes set': '',
  'cockpit:parking brakes set': '',
  'ground:parking brake set': '',
  'cockpit:parking brake set': '',
  'ground:cleared for pushback': '',
  'cockpit:cleared for pushback': '',
  'ground:contact ground on 121 point 9': '',
  'cockpit:contact ground on 121 point 9': '',
};

export function getStaticScriptedAudioUrl(text: string, speaker: 'Cockpit' | 'Ground'): string | null {
  if (!text) return null;
  const key = `${speaker.toLowerCase()}:${text.trim().toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ')}`;
  return STATIC_SCRIPTED_AUDIO_MAP[key] || null;
}

// Play Base64 WAV from Gemini TTS
export async function playWavAudio(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      playRadioClick('open');
      const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
      audio.onended = () => {
        playRadioClick('close');
        resolve();
      };
      audio.onerror = (e) => {
        reject(e);
      };
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// High-speed zero-latency Web Speech API synthesis
export function speakWithBrowserTts(text: string, speaker: 'Cockpit' | 'Ground' = 'Cockpit'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      playRadioClick('open');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95; // Aviation pace
      utterance.pitch = speaker === 'Cockpit' ? 0.9 : 1.05;

      // Pick best English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('David') ||
            v.name.includes('Daniel') ||
            v.name.includes('English'))
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      let finished = false;
      const done = () => {
        if (!finished) {
          finished = true;
          playRadioClick('close');
          resolve();
        }
      };

      utterance.onend = done;
      utterance.onerror = done;

      // Safety timeout in case browser TTS gets stalled
      setTimeout(done, 10000);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}
