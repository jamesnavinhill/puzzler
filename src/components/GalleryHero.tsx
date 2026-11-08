import React, { useRef, useState } from 'react';
import { GalleryImage, galleryImages } from '../data/gallery.generated';

interface GalleryHeroProps {
  index: number;
  onIndexChange: (index: number) => void;
  onGenerate: (image: GalleryImage) => void;
}

const OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const SCALES = [1, 0.86, 0.73, 0.62, 0.52];
const OPACITIES = [1, 0.84, 0.6, 0.36, 0.16];
const BLURS = [0, 1.25, 3, 5, 7];

const normalize = (value: number) =>
  ((value % galleryImages.length) + galleryImages.length) % galleryImages.length;

const GalleryHero: React.FC<GalleryHeroProps> = ({ index, onIndexChange, onGenerate }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);
  const wheelLock = useRef(0);

  const activeIndex = normalize(index);
  const activeImage = galleryImages[activeIndex];

  const move = (direction: number) => {
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

  return (
    <section
      aria-label="Puzzle the art"
      className="relative flex h-[calc(100dvh-4rem)] flex-col items-center overflow-hidden pt-6 sm:pt-8"
    >
      <h1 className="shrink-0 whitespace-nowrap px-5 text-center text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">
        Puzzle the <span className="text-accent">art.</span>
      </h1>

      <div className="relative mt-4 flex min-h-0 w-full flex-1 items-center sm:mt-5">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Selected artwork"
          tabIndex={0}
          className="relative h-[var(--hero-card)] max-h-full w-full touch-pan-y select-none overflow-hidden outline-none [--hero-card:clamp(18rem,39vw,39rem)]"
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

              return (
                <button
                  key={image.id}
                  type="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={
                    isActive ? `${image.title}, selected` : `Select ${image.title}`
                  }
                  onClick={() => handleCardClick(offset)}
                  className="group absolute left-1/2 top-1/2 aspect-square w-[var(--hero-card)] overflow-hidden rounded-2xl bg-panel-2 shadow-2xl"
                  style={{
                    transform: `translate(-50%, -50%) translateX(calc(${offset} * 38%)) scale(${
                      SCALES[depth] ?? 0.48
                    })`,
                    opacity: OPACITIES[depth] ?? 0.1,
                    filter: isActive ? 'none' : `blur(${BLURS[depth] ?? 8}px)`,
                    zIndex: 20 - depth,
                    transition: isDragging
                      ? 'none'
                      : 'transform 520ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 420ms ease, filter 420ms ease',
                  }}
                >
                  <img
                    src={image.thumb}
                    alt={image.alt}
                    loading={depth <= 1 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                  />
                  <span
                    className={`pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ${
                      isActive ? 'ring-white/15' : 'ring-white/5'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[7%] bg-gradient-to-r from-canvas via-canvas/55 to-transparent sm:w-[10%]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-[7%] bg-gradient-to-l from-canvas via-canvas/55 to-transparent sm:w-[10%]" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-32 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-50 flex justify-center px-5 sm:bottom-6">
            <button
              type="button"
              onClick={() => onGenerate(activeImage)}
              onPointerDown={(event) => event.stopPropagation()}
              className="pointer-events-auto group inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-on-accent shadow-[0_16px_38px_-16px_color-mix(in_srgb,var(--accent)_85%,transparent)] transition-all hover:brightness-105 active:scale-[0.985] sm:px-8 sm:py-4 sm:text-base"
            >
              Generate a puzzle
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Selected artwork: {activeImage?.title}
        </p>
      </div>

    </section>
  );
};

export default GalleryHero;
