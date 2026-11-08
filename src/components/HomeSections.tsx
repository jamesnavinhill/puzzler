import React from 'react';
import FileUpload from './FileUpload';
import BrandMark from './BrandMark';
import { GalleryImage, galleryImages } from '../data/gallery.generated';

interface HomeSectionsProps {
  onArtworkSelect: (image: GalleryImage) => void;
  onImageSelect: (file: File) => void;
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onGenerateAi: () => void;
  isGenerating: boolean;
  isProcessing: boolean;
}

const STEPS = [
  {
    title: 'Choose the art',
    copy: 'Pick a piece from the carousel or the collection.',
  },
  {
    title: 'Set the cut',
    copy: '25, 100, or 250 pieces. Your evening, your pace.',
  },
  {
    title: 'Piece it together',
    copy: 'Drag, snap, zoom. The art comes back together.',
  },
];

const HomeSections: React.FC<HomeSectionsProps> = ({
  onArtworkSelect,
  onImageSelect,
  aiPrompt,
  onAiPromptChange,
  onGenerateAi,
  isGenerating,
  isProcessing,
}) => {
  return (
    <div className="relative z-10">
      <section className="border-t border-line/70" aria-labelledby="approach-title">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-end">
            <h2
              id="approach-title"
              className="max-w-lg text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-ink sm:text-4xl"
            >
              A slow evening, one piece at a time.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted md:justify-self-end">
              Every puzzle starts with a Navin Hill original — or an image of your
              own. No timers, no scores. Just the art, the music, and the quiet
              work of putting it back together.
            </p>
          </div>

          <ol className="mt-10 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.title}
                className="rounded-2xl border border-line bg-panel/45 p-5"
              >
                <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="border-t border-line/70"
        aria-labelledby="collection-title"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2
            id="collection-title"
            className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl"
          >
            The collection
          </h2>

          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => onArtworkSelect(image)}
                aria-label={`Start a puzzle from ${image.title}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-panel-2"
              >
                <img
                  src={image.thumb}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 truncate px-2.5 pb-2 text-left text-[10px] font-medium text-white/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {image.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line/70" aria-labelledby="create-title">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2
            id="create-title"
            className="max-w-lg text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl"
          >
            Start from your own image.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="relative flex items-center justify-center rounded-3xl border border-line bg-panel/55 p-5 sm:p-6">
              {isProcessing ? (
                <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-panel/40">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
                  <p className="text-xs font-semibold text-ink">Preparing your image</p>
                </div>
              ) : (
                <FileUpload compact onImageSelect={onImageSelect} />
              )}
            </div>

            <div className="flex flex-col justify-center rounded-3xl border border-line bg-panel/55 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-ink">Make one with AI</h3>

              <div className="mt-4 flex items-center gap-2">
                <label htmlFor="ai-prompt" className="sr-only">
                  Describe the image to generate
                </label>
                <input
                  id="ai-prompt"
                  value={aiPrompt}
                  maxLength={300}
                  onChange={(event) => onAiPromptChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      onGenerateAi();
                    }
                  }}
                  placeholder="A greenhouse on a winter night…"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-canvas/55 px-3.5 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onGenerateAi}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isGenerating ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" />
                      Making
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-7 w-auto" />
            <span className="text-xs text-muted">Puzzler by Navin Hill</span>
          </div>

          <nav className="flex items-center gap-5 text-xs font-medium text-muted">
            <a
              href="https://navinhill.com"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              navinhill.com
            </a>
            <a
              href="https://x.com/navin_hill"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              X
            </a>
            <a
              href="https://github.com/jamesnavinhill"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default HomeSections;
