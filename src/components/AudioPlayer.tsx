import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NAVIN_HILL_ALBUMS, NAVIN_HILL_TRACKS } from '../data/audio';

const VOLUME_KEY = 'puzzled.volume.v1';
const LEGACY_VOLUME_KEY = 'puzzler.volume.v1';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
};

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplayRef = useRef(false);
  const titleViewportRef = useRef<HTMLSpanElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [titleShift, setTitleShift] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const stored =
        window.localStorage.getItem(VOLUME_KEY) ??
        window.localStorage.getItem(LEGACY_VOLUME_KEY);
      if (stored === null) {
        return 0.5;
      }
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.5;
    } catch {
      return 0.5;
    }
  });

  const currentTrack = NAVIN_HILL_TRACKS[currentIndex];
  const currentAlbum = NAVIN_HILL_ALBUMS.find(
    (album) => album.id === currentTrack.albumId
  );
  const displayTitle = hasError ? 'Stream unavailable' : currentTrack.title;
  const trackIndexById = useMemo(
    () => new Map(NAVIN_HILL_TRACKS.map((track, index) => [track.id, index])),
    []
  );

  useEffect(() => {
    const viewport = titleViewportRef.current;
    const text = titleTextRef.current;
    if (!viewport || !text) {
      return;
    }

    const measure = () => {
      const overflow = text.scrollWidth - viewport.clientWidth;
      setTitleOverflows(overflow > 1);
      setTitleShift(overflow > 1 ? overflow + 8 : 0);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [displayTitle]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }

    try {
      window.localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* Private browsing may reject localStorage writes. */
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    audio.load();

    if (autoplayRef.current) {
      autoplayRef.current = false;
      setIsLoading(true);
      void audio.play().catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
      });

      navigator.mediaSession.setActionHandler('play', () => {
        void audioRef.current?.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0;
          return;
        }
        setCurrentIndex((index) =>
          (index - 1 + NAVIN_HILL_TRACKS.length) % NAVIN_HILL_TRACKS.length
        );
        autoplayRef.current = true;
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        setCurrentIndex((index) => (index + 1) % NAVIN_HILL_TRACKS.length);
        autoplayRef.current = true;
      });
    } catch {
      /* Media Session is best-effort. */
    }
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const selectTrack = useCallback(
    (index: number, autoplay = true, closeQueue = true) => {
      const normalized =
        ((index % NAVIN_HILL_TRACKS.length) + NAVIN_HILL_TRACKS.length) %
        NAVIN_HILL_TRACKS.length;

      if (closeQueue) {
        setShowQueue(false);
      }

      if (normalized === currentIndex) {
        if (autoplay) {
          setHasError(false);
          void audioRef.current?.play().catch(() => setIsPlaying(false));
        }
        return;
      }

      autoplayRef.current = autoplay;
      setCurrentIndex(normalized);
    },
    [currentIndex]
  );

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      setHasError(false);
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  const playNext = () => selectTrack(currentIndex + 1, true, false);

  const playPrevious = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    selectTrack(currentIndex - 1, true, false);
  };

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="metadata"
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={playNext}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setIsLoading(false);
        }}
      />

      <div className="grid w-[clamp(9rem,50vw,13.5rem)] shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 rounded-full border border-line bg-panel/85 p-1.5 shadow-sm backdrop-blur-xl sm:w-[22rem] md:w-[27rem] lg:w-[30rem]">
        <button
          type="button"
          onClick={() => setShowQueue((open) => !open)}
          className="group min-w-0 justify-self-stretch rounded-full px-2 py-0.5 text-center"
          aria-label="Open Navin Hill playlist"
          aria-expanded={showQueue}
          aria-haspopup="dialog"
          title="Open playlist"
        >
          <span className="block min-w-0">
            <span
              ref={titleViewportRef}
              className={`block overflow-hidden whitespace-nowrap ${
                titleOverflows ? 'text-left' : 'text-center'
              }`}
            >
              <span
                key={currentTrack.id}
                ref={titleTextRef}
                className={`inline-block text-[11px] font-semibold leading-tight text-ink transition-colors group-hover:text-accent ${
                  titleOverflows ? 'title-marquee' : ''
                }`}
                style={{ '--title-shift': `-${titleShift}px` } as React.CSSProperties}
              >
                {displayTitle}
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted transition-colors group-hover:text-ink">
              {currentTrack.album} · {currentTrack.trackNumber}/
              {currentAlbum?.tracks.length ?? 0}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center justify-center gap-0.5">
          <span className="hidden h-5 w-px bg-line/70 md:block" aria-hidden="true" />

          <button
            type="button"
            onClick={playPrevious}
            aria-label="Previous track"
            title="Previous"
            className="hidden h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-panel-2 hover:text-ink sm:grid"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            title={isPlaying ? 'Pause' : 'Play'}
            className="grid h-9 w-9 place-items-center rounded-full bg-accent text-on-accent shadow-sm transition-transform hover:brightness-105 active:scale-95"
          >
            {isLoading && isPlaying ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" />
            ) : isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={playNext}
            aria-label="Next track"
            title="Next"
            className="hidden h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-panel-2 hover:text-ink sm:grid"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <span className="hidden h-5 w-px bg-line/70 md:block" aria-hidden="true" />
        </div>

        <div className="hidden min-w-0 items-center justify-center gap-1 md:flex">
          <button
            type="button"
            onClick={() => setVolume((value) => (value > 0 ? 0 : 0.5))}
            aria-label={volume === 0 ? 'Unmute music' : 'Mute music'}
            title={volume === 0 ? 'Unmute' : 'Mute'}
            className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:text-ink"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 3.23v17.54a1 1 0 01-1.64.77L6.73 17H3a1 1 0 01-1-1v-8a1 1 0 011-1h3.73l5.63-4.54A1 1 0 0114 3.23zM17.54 8.46a1 1 0 10-1.41 1.41 3 3 0 010 4.24 1 1 0 001.41 1.41 5 5 0 000-7.06z" />
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Music volume"
            className="volume-range h-1 w-16 cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${
                volume * 100
              }%, var(--app-line) ${volume * 100}%, var(--app-line) 100%)`,
            }}
          />
        </div>
      </div>

      {showQueue && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#0b0907]/45 backdrop-blur-[2px]"
            onMouseDown={() => setShowQueue(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Navin Hill playlist"
            className="fixed left-1/2 top-[4.6rem] z-50 flex max-h-[min(70vh,34rem)] w-[min(27rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl animate-rise-in"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
              <h2 className="text-sm font-semibold text-ink">
                Navin Hill · {NAVIN_HILL_TRACKS.length} tracks
              </h2>
              <button
                type="button"
                onClick={() => setShowQueue(false)}
                aria-label="Close playlist"
                className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-2">
              {NAVIN_HILL_ALBUMS.map((album) => (
                <div key={album.id} className="pb-1">
                  <div className="flex items-center justify-between px-3 pb-1 pt-3">
                    <p className="text-xs font-medium text-muted">
                      {album.title}
                    </p>
                    <span className="text-[10px] text-muted/70">{album.tracks.length}</span>
                  </div>

                  {album.tracks.map((track) => {
                    const trackIndex = trackIndexById.get(track.id) ?? 0;
                    const isCurrent = track.id === currentTrack.id;

                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => selectTrack(trackIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isCurrent
                            ? 'bg-accent/12 text-ink'
                            : 'text-muted hover:bg-panel-2 hover:text-ink'
                        }`}
                      >
                        <span
                          className={`w-5 shrink-0 text-right text-[11px] tabular-nums ${
                            isCurrent ? 'text-accent' : 'text-muted/60'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <span className="inline-flex h-3 items-end gap-0.5" aria-label="Playing">
                              <span className="h-2 w-0.5 animate-pulse rounded-full bg-accent" />
                              <span className="h-3 w-0.5 animate-pulse rounded-full bg-accent [animation-delay:120ms]" />
                              <span className="h-1.5 w-0.5 animate-pulse rounded-full bg-accent [animation-delay:240ms]" />
                            </span>
                          ) : (
                            String(track.trackNumber).padStart(2, '0')
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{track.title}</span>

                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[10px] text-muted">
              <span className="tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <a
                href="https://navinhill.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                navinhill.com
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
