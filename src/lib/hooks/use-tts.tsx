import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as React from 'react';

export type UseTtsOptions = {
  lang?: string; // default 'en'
};

export function useTts(defaultOptions: UseTtsOptions = {}) {
  const playerRef = React.useRef<AudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Clean up audio player instance on unmount
  React.useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.remove();
        }
        catch {}
        playerRef.current = null;
      }
    };
  }, []);

  const speak = React.useCallback(
    async (text: string, options?: UseTtsOptions) => {
      if (!text || !text.trim())
        return;

      const trimmed = text.trim();
      const tryLang = options?.lang || defaultOptions.lang || 'en';
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        trimmed,
      )}&tl=${tryLang}&client=tw-ob`;

      try {
        setIsPlaying(true);

        // Remove previous player if exists
        if (playerRef.current) {
          try {
            playerRef.current.remove();
          }
          catch {}
          playerRef.current = null;
        }

        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: 'mixWithOthers',
          });
        }
        catch {}

        const player = createAudioPlayer(ttsUrl);
        playerRef.current = player;

        player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            try {
              player.remove();
            }
            catch {}
            if (playerRef.current === player) {
              playerRef.current = null;
            }
          }
        });

        player.play();
      }
      catch (err) {
        console.warn('TTS playback error:', err);
        setIsPlaying(false);
      }
    },
    [defaultOptions.lang],
  );

  const stop = React.useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      }
      catch {}
      playerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    speak,
    stop,
    isPlaying,
  };
}
