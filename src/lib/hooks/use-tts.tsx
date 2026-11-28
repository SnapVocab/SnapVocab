import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as React from 'react';

export type UseTtsOptions = {
  lang?: string; // default 'en'
  /** Google's slow voice, played slower still: for catching every sound of a word. */
  slow?: boolean;
};

/** Google's slow voice alone is barely slower, so the player slows it down further (pitch is kept). */
export const SLOW_PLAYBACK_RATE = 0.75;
/** No sound after this long (offline, blocked) counts as a failure the screen can react to. */
export const TTS_LOAD_TIMEOUT_MS = 8000;

export function ttsUrl(text: string, lang: string, slow = false) {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob${
    slow ? '&ttsspeed=0.24' : ''}`;
}

export function useTts(defaultOptions: UseTtsOptions = {}) {
  const playerRef = React.useRef<AudioPlayer | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const release = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      }
      catch {}
      playerRef.current = null;
    }
  }, []);

  // Clean up audio player instance on unmount
  React.useEffect(() => release, [release]);

  const speak = React.useCallback(
    async (text: string, options?: UseTtsOptions) => {
      if (!text || !text.trim())
        return;

      const trimmed = text.trim();
      const tryLang = options?.lang || defaultOptions.lang || 'en';
      const slow = options?.slow ?? defaultOptions.slow ?? false;

      release();
      setFailed(false);
      setIsPlaying(true);
      const fail = () => {
        release();
        setIsPlaying(false);
        setFailed(true);
      };

      try {
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: 'mixWithOthers',
          });
        }
        catch {}

        const player = createAudioPlayer(ttsUrl(trimmed, tryLang, slow));
        playerRef.current = player;
        if (slow)
          player.setPlaybackRate(SLOW_PLAYBACK_RATE, 'high');
        let started = false;
        timeoutRef.current = setTimeout(() => {
          if (!started && playerRef.current === player)
            fail();
        }, TTS_LOAD_TIMEOUT_MS);

        player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
          if (playerRef.current !== player)
            return;
          if (/error|fail/i.test(status.playbackState ?? '')) {
            fail();
            return;
          }
          if (status.playing)
            started = true;
          if (status.didJustFinish) {
            setIsPlaying(false);
            release();
          }
        });

        player.play();
      }
      catch (err) {
        console.warn('TTS playback error:', err);
        fail();
      }
    },
    [defaultOptions.lang, defaultOptions.slow, release],
  );

  const stop = React.useCallback(() => {
    release();
    setIsPlaying(false);
  }, [release]);

  return {
    speak,
    stop,
    isPlaying,
    /** The last `speak` produced no sound. Cleared by the next one. */
    failed,
  };
}
