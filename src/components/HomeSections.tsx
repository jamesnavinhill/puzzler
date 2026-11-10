import React, { useRef, useState } from 'react';
import FileUpload from './FileUpload';
import BrandMark from './BrandMark';
import { BRAND_ASSETS } from '../data/brand';
import { ModelKey, ModelPickerButton } from './ModelPickerButton';
import { GalleryImage, galleryImages } from '../data/gallery.generated';

interface HomeSectionsProps {
  onArtworkSelect: (image: GalleryImage) => void;
  onImageSelect: (file: File) => void;
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onGenerateAi: () => void;
  isGenerating: boolean;
  isProcessing: boolean;
  selectedModel: ModelKey;
  onSelectedModelChange: (model: ModelKey) => void;
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
  selectedModel,
  onSelectedModelChange,
}) => {
  const [gallerySource, setGallerySource] = useState<'nh' | 'globe'>('nh');
  const gallerySectionRef = useRef<HTMLElement>(null);

  const handleScrollToGallery = (event: React.MouseEvent) => {
    event.preventDefault();
    gallerySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative z-10">
      {/* Space between 1-2-3 and bottom of hero is identical to previous hero-to-divider space */}
      <div className="h-32 sm:h-40" aria-hidden="true" />

      <section aria-label="How it works">
        <div className="mx-auto max-w-6xl px-5">
          <h2
            id="create-title"
            className="flex flex-wrap items-baseline justify-center gap-x-8 gap-y-3 text-center text-[clamp(1.5rem,3.6vw,2.4rem)] font-bold leading-tight tracking-[-0.035em] text-ink sm:gap-x-12"
          >
            {STEPS.map((step, index) => (
              <span key={step} className="inline-flex items-baseline gap-2.5 sm:gap-3">
                <span className="text-[0.85em] font-extrabold tabular-nums text-accent">
                  0{index + 1}
                </span>
                <span>{step}</span>
              </span>
            ))}
          </h2>
        </div>
      </section>

      {/* Cards section (no divider above, space between 1-2-3 preserved, bottom expanded) */}
      <section aria-label="Image creation options">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-14">
          <h3 className="text-center text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-ink mb-8 sm:mb-10">
            Upload your own, generate with AI, or choose from the{' '}
            <a
              href="#gallery-section"
              onClick={handleScrollToGallery}
              className="text-accent transition-colors hover:brightness-110 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Gallery
            </a>
          </h3>

          <div className="mx-auto flex flex-col sm:flex-row items-stretch justify-center gap-5 sm:gap-6 max-w-3xl">
            {/* Card 1: Upload an image */}
            <div className="flex h-[17rem] w-full sm:w-[13.5rem] shrink-0 flex-col rounded-2xl border border-line/80 bg-panel/50 p-6 shadow-sm backdrop-blur-sm transition-colors hover:border-line">
              {isProcessing ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line/60 bg-canvas/30 text-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                  <span className="text-[10px] font-medium text-muted">Preparing…</span>
                </div>
              ) : (
                <FileUpload onImageSelect={onImageSelect} />
              )}
            </div>

            {/* Card 2: Generate an Image */}
            <div className="flex h-[17rem] flex-1 flex-col rounded-2xl border border-line/80 bg-panel/50 p-6 shadow-sm backdrop-blur-sm transition-colors hover:border-line">
              <div className="flex flex-1 flex-col justify-between gap-3">
                <label htmlFor="ai-prompt" className="sr-only">
                  Describe the image to generate
                </label>
                <textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  maxLength={300}
                  onChange={(event) => onAiPromptChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      onGenerateAi();
                    }
                  }}
                  placeholder="A greenhouse on a winter night…"
                  className="w-full flex-1 resize-none rounded-xl border border-line/80 bg-canvas/40 p-3 text-xs sm:text-sm leading-relaxed text-ink placeholder:text-muted/40 focus:border-accent/70 focus:bg-canvas/60 focus:outline-none transition-colors"
                />

                <div className="flex h-11 items-center gap-2.5">
                  <ModelPickerButton
                    selectedModel={selectedModel}
                    onModelChange={onSelectedModelChange}
                  />
                  <button
                    type="button"
                    onClick={onGenerateAi}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs sm:text-sm font-bold text-on-accent transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" />
                        Making…
                      </>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery section (no divider line underneath the cards) */}
      <section ref={gallerySectionRef} id="gallery-section" aria-labelledby="gallery-title" className="scroll-mt-6">
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="gallery-title"
              className="text-2xl font-semibold tracking-[-0.03em] text-accent sm:text-3xl"
            >
              Gallery
            </h2>

            <div
              role="group"
              aria-label="Gallery filter"
              className="inline-flex items-center rounded-xl border border-line/80 bg-panel/50 p-1 shadow-sm backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() => setGallerySource('nh')}
                aria-label="Navin Hill collection"
                aria-pressed={gallerySource === 'nh'}
                title="Navin Hill collection"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  gallerySource === 'nh'
                    ? 'border-accent/70 bg-accent/15 text-accent shadow-sm'
                    : 'border-transparent text-muted/60 hover:border-line/60 hover:bg-canvas/40 hover:text-ink'
                }`}
              >
                <img
                  src={BRAND_ASSETS.ICON_DARK}
                  alt=""
                  aria-hidden="true"
                  className={`h-4 w-4 object-contain block dark:hidden transition-opacity ${
                    gallerySource === 'nh' ? 'opacity-100' : 'opacity-40'
                  }`}
                />
                <img
                  src={BRAND_ASSETS.ICON_WHITE}
                  alt=""
                  aria-hidden="true"
                  className={`h-4 w-4 object-contain hidden dark:block transition-opacity ${
                    gallerySource === 'nh' ? 'opacity-100' : 'opacity-40'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setGallerySource('globe')}
                aria-label="Community generated creations"
                aria-pressed={gallerySource === 'globe'}
                title="Community generated creations"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  gallerySource === 'globe'
                    ? 'border-accent/70 bg-accent/15 text-accent shadow-sm'
                    : 'border-transparent text-muted/60 hover:border-line/60 hover:bg-canvas/40 hover:text-ink'
                }`}
              >
                <svg
                  className={`h-4 w-4 transition-colors ${
                    gallerySource === 'globe' ? 'text-accent' : 'text-muted/60'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 12h18M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9 14.5 14.5 0 01-4-9 14.5 14.5 0 014-9z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {gallerySource === 'nh' ? (
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
          ) : (
            <div className="mt-7 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 bg-panel/30 py-16 px-4 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-panel-2 text-muted mb-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={1.7} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 12h18M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9 14.5 14.5 0 01-4-9 14.5 14.5 0 014-9z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-ink">Global generated feed</p>
              <p className="mt-1 text-xs text-muted max-w-sm">
                Community generated puzzles will appear here. Create your own puzzle using the generator above!
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-7 w-auto" />
            <span className="text-xs text-muted">Puzzled by Navin Hill</span>
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
