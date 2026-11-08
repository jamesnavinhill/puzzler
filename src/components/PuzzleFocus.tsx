import React, { useCallback, useEffect, useRef, useState } from 'react';
import PuzzleCutPreview from './PuzzleCutPreview';

interface PuzzleFocusProps {
  src: string;
  alt: string;
  onClose: () => void;
  onStart: (pieces: number) => void;
}

const PIECE_COUNTS = [25, 100, 250];

const PuzzleFocus: React.FC<PuzzleFocusProps> = ({ src, alt, onClose, onStart }) => {
  const [preview, setPreview] = useState<number | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img) {
      return;
    }

    setDisplaySize({ width: img.offsetWidth, height: img.offsetHeight });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = window.setTimeout(() => panelRef.current?.focus(), 60);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0907]/92 p-4 backdrop-blur-2xl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to the carousel"
        className="fixed right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white sm:right-5 sm:top-5"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a puzzle size"
        tabIndex={-1}
        className="animate-focus-in relative outline-none motion-reduce:animate-none"
      >
        <div className="relative overflow-hidden rounded-xl bg-panel-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={measure}
            draggable={false}
            className="relative z-0 block h-auto w-auto object-contain"
            style={{
              maxWidth: 'min(clamp(23.1rem, 50.6vw, 50.6rem), 92vw)',
              maxHeight: 'calc(100dvh - 4.5rem)',
            }}
          />

          {preview !== null && (
            <PuzzleCutPreview
              pieceCount={preview}
              width={displaySize.width}
              height={displaySize.height}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

          <div
            className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 sm:pb-4"
            onPointerLeave={() => setPreview(null)}
          >
            <div className="flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full border border-white/15 bg-black/35 p-1 backdrop-blur-md">
              {PIECE_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-label={`Start a ${count}-piece puzzle`}
                  onPointerEnter={() => setPreview(count)}
                  onFocus={() => setPreview(count)}
                  onBlur={() => setPreview(null)}
                  onClick={() => onStart(count)}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:bg-white/15 focus-visible:text-white sm:px-4"
                >
                  <span className="tabular-nums">{count}</span>
                  <span className="ml-1.5 text-[11px] font-normal text-white/55">pieces</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleFocus;
