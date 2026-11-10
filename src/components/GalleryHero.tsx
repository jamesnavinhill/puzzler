import React, { useEffect, useRef, useState } from 'react';
import { GalleryImage, galleryImages } from '../data/gallery.generated';
import GeneratePuzzleButton from './GeneratePuzzleButton';
import PuzzleCutPreview from './PuzzleCutPreview';

interface GalleryHeroProps {
  index: number;
  onIndexChange: (index: number) => void;
  onStart: (image: GalleryImage, pieces: number) => void;
}

const OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const SCALES = [1, 0.86, 0.73, 0.62, 0.52];
const OPACITIES = [1, 0.84, 0.6, 0.36, 0.16];
const BLURS = [0, 1.25, 3, 5, 7];
const PIECE_COUNTS = [25, 100, 250];

const REVEAL =
  'opacity-0 transition-opacity duration-200 max-md:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100';
const REVEAL_INTERACTIVE = `${REVEAL} pointer-events-none max-md:pointer-events-auto group-hover:pointer-events-auto group-focus-within:pointer-events-auto [@media(hover:none)]:pointer-events-auto`;

const normalize = (value: number) =>
  ((value % galleryImages.length) + galleryImages.length) % galleryImages.length;

const GalleryHero: React.FC<GalleryHeroProps> = ({ index, onIndexChange, onStart }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPieces, setSelectedPieces] = useState(100);
  const [previewPieces, setPreviewPieces] = useState(100);
  const [activeSize, setActiveSize] = useState({ width: 0, height: 0 });
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);
  const wheelLock = useRef(0);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const activeIndex = normalize(index);
  const activeImage = galleryImages[activeIndex];

  useEffect(() => {
    setPreviewPieces(selectedPieces);
  }, [activeIndex, selectedPieces]);

  useEffect(() => {
    const card = activeCardRef.current;
    if (!card) {
      return;
    }

    const measure = () => {
      setActiveSize({ width: card.clientWidth, height: card.clientHeight });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);

    return () => observer.disconnect();
  }, [activeIndex]);

  const move = (direction: number) => {
    // Always wrap, so the coverflow never hits a dead end.
    onIndexChange(normalize(index + direction));
  };

  const endDrag = (clientX?: number) => {
    if (dragStartX.current === null) {
      return;
    }

    const delta = (clientX ?? dragStartX.current) - dragStartX.current;
    dragStartX.current = null;
    setDragX(0);
    setIsDragging(false);

    if (Math.abs(delta) > 42) {
      move(delta > 0 ? -1 : 1);
    }

    // Let the click that follows this pointerup see the drag flag, then clear it.
    window.setTimeout(() => {
      didDrag.current = false;
    }, 0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    dragStartX.current = event.clientX;
    didDrag.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) {
      return;
    }

    const delta = event.clientX - dragStartX.current;
    if (Math.abs(delta) > 6) {
      didDrag.current = true;
    }
    setDragX(delta);
  };

  const handleCardClick = (offset: number) => {
    if (didDrag.current) {
      return;
    }

    if (offset !== 0) {
      move(offset);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) < 12 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
      return;
    }

    const now = Date.now();
    if (now - wheelLock.current < 240) {
      return;
    }
    wheelLock.current = now;
    move(event.deltaX > 0 ? 1 : -1);
  };

  const stopDrag = (event: React.PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <section
      aria-label="Puzzle your art"
      className="relative flex h-[calc(100dvh-4rem)] flex-col items-center overflow-hidden"
    >
      {/* Top zone: Title naturally centered between header and carousel */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-5">
        <h1
          className="whitespace-nowrap text-center leading-[1.02] tracking-[-0.045em] text-ink"
          style={{
            fontFamily: "'Young Serif', serif",
            fontWeight: 400,
            fontSize: 'var(--title-size)',
          }}
        >
          Puzzle your <span className="text-accent">Art.</span>
        </h1>
      </div>

      {/* Middle zone: Carousel */}
      <div className="relative flex shrink-0 w-full items-center justify-center px-5 sm:px-0">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Selected artwork"
          tabIndex={0}
          className="relative h-[var(--hero-card)] max-h-full w-full touch-pan-y select-none overflow-hidden outline-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endDrag(event.clientX)}
          onPointerCancel={() => endDrag()}
          onPointerLeave={() => {
            if (dragStartX.current !== null) {
              endDrag();
            }
          }}
          onWheel={handleWheel}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              move(event.key === 'ArrowRight' ? 1 : -1);
            }
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_62%)]" />

          <div
            className="absolute inset-0"
            style={{
              transform: `translateX(${dragX}px)`,
              transition: isDragging
                ? 'none'
                : 'transform 420ms cubic-bezier(0.2, 0.7, 0.2, 1)',
            }}
          >
            {OFFSETS.map((offset) => {
              const image = galleryImages[normalize(index + offset)];
              const depth = Math.abs(offset);
              const isActive = offset === 0;

              const cardStyle: React.CSSProperties = {
                transform: `translate(-50%, -50%) translateX(calc(${offset} * 38%)) scale(${
                  SCALES[depth] ?? 0.48
                })`,
                opacity: OPACITIES[depth] ?? 0.1,
                filter: isActive ? 'none' : `blur(${BLURS[depth] ?? 8}px)`,
                zIndex: isActive ? 40 : 20 - depth,
                transition: isDragging
                  ? 'none'
                  : 'transform 520ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 420ms ease, filter 420ms ease',
              };

              if (isActive) {
                return (
                  <div
                    key={image.id}
                    ref={activeCardRef}
                    role="group"
                    aria-label={`${image.title}, selected`}
                    className="group absolute left-1/2 top-1/2 aspect-square w-[var(--hero-card)] overflow-hidden rounded-2xl bg-panel-2 shadow-2xl"
                    style={cardStyle}
                  >
                    <img
                      src={image.thumb}
                      alt={image.alt}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 z-10 ${REVEAL}`}
                    >
                      <PuzzleCutPreview
                        pieceCount={previewPieces}
                        width={activeSize.width}
                        height={activeSize.height}
                      />
                    </div>

                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-black/60 via-black/15 to-transparent ${REVEAL}`}
                    />

                    <div
                      className={`absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-3 sm:pt-4 ${REVEAL_INTERACTIVE}`}
                      onPointerDown={stopDrag}
                    >
                      <div
                        role="group"
                        aria-label="Puzzle size"
                        className="flex w-[var(--control-pill-w)] items-center gap-0.5 rounded-full border border-white/15 bg-black/35 p-1 backdrop-blur-md"
                      >
                        {PIECE_COUNTS.map((count) => {
                          const isSelected = selectedPieces === count;

                          return (
                            <button
                              key={count}
                              type="button"
                              aria-label={`Use ${count} pieces`}
                              aria-pressed={isSelected}
                              onPointerDown={stopDrag}
                              onClick={() => {
                                setSelectedPieces(count);
                                setPreviewPieces(count);
                              }}
                              onPointerEnter={() => setPreviewPieces(count)}
                              onPointerLeave={() => setPreviewPieces(selectedPieces)}
                              onFocus={() => setPreviewPieces(count)}
                              onBlur={() => setPreviewPieces(selectedPieces)}
                              className={`flex h-7 min-w-0 flex-1 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors sm:h-8 sm:text-xs ${
                                isSelected
                                  ? 'bg-accent text-on-accent'
                                  : 'text-white/80 hover:bg-white/15 hover:text-white'
                              }`}
                            >
                              {count}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={image.id}
                  type="button"
                  tabIndex={-1}
                  aria-label={`Select ${image.title}`}
                  onClick={() => handleCardClick(offset)}
                  className="group absolute left-1/2 top-1/2 aspect-square w-[var(--hero-card)] overflow-hidden rounded-2xl bg-panel-2 shadow-2xl"
                  style={cardStyle}
                >
                  <img
                    src={image.thumb}
                    alt={image.alt}
                    loading={depth <= 1 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                  />
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[7%] bg-gradient-to-r from-canvas via-canvas/55 to-transparent sm:w-[10%]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-[7%] bg-gradient-to-l from-canvas via-canvas/55 to-transparent sm:w-[10%]" />

          <p className="sr-only" aria-live="polite">
            Selected artwork: {activeImage?.title}
          </p>
        </div>
      </div>

      {/* Bottom zone: Mirrors the title placement under the carousel */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-5">
        <GeneratePuzzleButton
          onClick={() => onStart(activeImage, selectedPieces)}
        />
      </div>
    </section>
  );
};

export default GalleryHero;
