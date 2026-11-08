import React from 'react';
import FileUpload from './FileUpload';
import BrandMark from './BrandMark';
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

          <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:gap-6 md:grid-cols-2">
            {/* Card 1: Upload an image */}
            <div className="flex h-[17rem] flex-col justify-between rounded-2xl border border-line/80 bg-panel/50 p-6 shadow-sm backdrop-blur-sm transition-colors hover:border-line">
              <h3 className="h-6 text-center text-sm font-semibold tracking-[-0.015em] text-ink">
                Upload an image
              </h3>

              <div className="mt-3.5 flex flex-1 flex-col justify-between">
                {isProcessing ? (
                  <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-line/60 bg-canvas/30 text-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
                    <span className="text-xs font-medium text-muted">Preparing image…</span>
                  </div>
                ) : (
                  <FileUpload onImageSelect={onImageSelect} />
                )}

                <div className="flex h-11 items-center justify-center">
                  <p className="text-center text-xs text-muted/60">
                    PNG, JPEG, WebP · 15MB max
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Generate an Image */}
            <div className="flex h-[17rem] flex-col justify-between rounded-2xl border border-line/80 bg-panel/50 p-6 shadow-sm backdrop-blur-sm transition-colors hover:border-line">
              <h3 className="h-6 text-center text-sm font-semibold tracking-[-0.015em] text-ink">
                Generate an Image
              </h3>

              <div className="mt-3.5 flex flex-1 flex-col justify-between">
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
                  className="h-32 w-full resize-none rounded-xl border border-line/80 bg-canvas/40 p-3 text-xs sm:text-sm leading-relaxed text-ink placeholder:text-muted/40 focus:border-accent/70 focus:bg-canvas/60 focus:outline-none transition-colors"
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
