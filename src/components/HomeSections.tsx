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

const STEPS = ['Choose your art', 'Select a cut', 'Put it together!'];

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
      <section className="border-t border-line/70" aria-labelledby="collection-title">
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
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line/70" aria-labelledby="create-title">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2
            id="create-title"
            className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-3 text-center text-[clamp(1.05rem,3.2vw,1.75rem)] font-semibold leading-none tracking-[-0.04em] text-ink sm:gap-x-9"
          >
            {STEPS.map((step, index) => (
              <span key={step} className="inline-flex items-baseline gap-2">
                <span className="text-[0.78em] font-bold tabular-nums text-accent">
                  0{index + 1}
                </span>
                <span>{step}</span>
              </span>
            ))}
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:gap-5">
            <div className="flex flex-col rounded-2xl border border-line bg-panel/55 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-ink">Start from your own image.</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Drop a JPG, PNG, or WebP. It stays on your device.
              </p>

              <div className="mt-4">
                {isProcessing ? (
                  <div className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-canvas/55">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                    <p className="text-sm font-semibold text-ink">Preparing your image</p>
                  </div>
                ) : (
                  <FileUpload onImageSelect={onImageSelect} />
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-line bg-panel/55 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-ink">Or make one with AI.</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Describe a scene and we&apos;ll generate the artwork.
              </p>

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
                  className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-canvas/55 px-3.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onGenerateAi}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-on-accent transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
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
