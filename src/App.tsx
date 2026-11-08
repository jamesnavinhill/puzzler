import React, { useEffect, useState } from 'react';
import AudioPlayer from './components/AudioPlayer';
import BrandMark from './components/BrandMark';
import GalleryHero from './components/GalleryHero';
import HomeSections from './components/HomeSections';
import PuzzleCanvas from './components/PuzzleCanvas';
import PuzzleFocus from './components/PuzzleFocus';
import ThemeCustomizer from './components/ThemeCustomizer';
import { GalleryImage, galleryImages } from './data/gallery.generated';
import {
  accentColor,
  getAccentContrast,
  loadTheme,
  THEME_STORAGE_KEY,
} from './theme';
import { GameSettings, ThemeConfig } from './types';

type GameState = 'home' | 'playing' | 'completed';

interface FocusTarget {
  src: string;
  alt: string;
}

const difficultyFor = (pieces: number): GameSettings['difficulty'] =>
  pieces === 25 ? 'easy' : pieces === 250 ? 'hard' : 'medium';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('home');
  const [image, setImage] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    difficulty: 'medium',
    pieceCount: 100,
    showPreview: true,
  });

  const [theme, setTheme] = useState<ThemeConfig>(() => loadTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-hue', String(theme.hue));
    root.style.setProperty('--accent-sat', `${theme.saturation}%`);
    root.style.setProperty('--accent-light', `${theme.lightness}%`);
    root.style.setProperty('--accent', accentColor(theme.hue, theme.saturation, theme.lightness));
    root.style.setProperty(
      '--on-accent',
      getAccentContrast(theme.hue, theme.saturation, theme.lightness)
    );
    root.classList.toggle('dark', theme.isDark);
    document.body.classList.toggle('dark-mode', theme.isDark);
    root.style.colorScheme = theme.isDark ? 'dark' : 'light';

    const themeColour = document.getElementById('theme-color');
    themeColour?.setAttribute('content', theme.isDark ? '#171311' : '#f4f0e7');

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      /* Private browsing may reject localStorage writes. */
    }
  }, [theme]);

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Choose a JPG, PNG or WebP.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setCompletionPercent(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1600;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          setError('This browser could not prepare that image.');
          setIsProcessing(false);
          return;
        }

        context.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        setFocus({ src: optimizedDataUrl, alt: 'Your photo' });
        setIsProcessing(false);
      };

      img.onerror = () => {
        setError('Failed to load image data.');
        setIsProcessing(false);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setError('Error reading file.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleImageSelect = (file: File) => {
    setError(null);
    processImage(file);
  };

  const generateAiImage = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || isGenerating) {
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.imageB64) {
        throw new Error(data.error || `Generation failed (${response.status}).`);
      }

      const mimeType = typeof data.mimeType === 'string' ? data.mimeType : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${data.imageB64}`;
      const img = new Image();
      img.onload = () => {
        setFocus({ src: dataUrl, alt: 'AI generated artwork' });
        setCompletionPercent(0);
      };
      img.onerror = () => setError('Generated image could not be loaded.');
      img.src = dataUrl;
      setAiPrompt('');
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'AI generation failed.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleArtworkSelect = (artwork: GalleryImage) => {
    setError(null);
    const index = galleryImages.findIndex((item) => item.id === artwork.id);
    if (index >= 0) {
      setCarouselIndex(index);
    }
    setFocus({ src: artwork.full, alt: artwork.alt });
  };

  const startGame = () => {
    setCompletionPercent(0);
    setGameId((id) => id + 1);
    setGameState('playing');
  };

  const beginPuzzle = (src: string, pieces: number) => {
    setImage(src);
    setCompletionPercent(0);
    setGameSettings((settings) => ({
      ...settings,
      difficulty: difficultyFor(pieces),
      pieceCount: pieces,
    }));
    setGameId((id) => id + 1);
    setFocus(null);
    setGameState('playing');
  };

  const handleStartPieces = (pieces: number) => {
    if (!focus) {
      return;
    }

    beginPuzzle(focus.src, pieces);
  };

  const handleHeroStart = (artwork: GalleryImage, pieces: number) => {
    setError(null);
    const index = galleryImages.findIndex((item) => item.id === artwork.id);
    if (index >= 0) {
      setCarouselIndex(index);
    }
    beginPuzzle(artwork.full, pieces);
  };

  const resetGame = () => {
    setGameState('home');
    setImage(null);
    setFocus(null);
    setIsProcessing(false);
    setCompletionPercent(0);
    setError(null);
  };

  const showGameplayHeader = gameState === 'playing' || gameState === 'completed';

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      <header className="relative z-30 shrink-0 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={resetGame}
            className="group flex shrink-0 items-center justify-self-start rounded-xl text-left"
            aria-label="Puzzler home"
          >
            <BrandMark className="h-7 w-auto sm:h-8" />
          </button>

          <div
            className={`min-w-0 justify-self-center transition-opacity duration-300 ${
              gameState === 'home' ? 'invisible opacity-0' : 'opacity-100'
            }`}
          >
            <AudioPlayer />
          </div>

          <div className="flex shrink-0 items-center justify-self-end gap-1 sm:gap-2">
            {showGameplayHeader && (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-panel-2 md:w-32">
                  <div
                    className="h-full bg-accent transition-[width] duration-300 ease-out"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="min-w-[2.5rem] text-right text-xs font-semibold tabular-nums text-muted">
                  {completionPercent}%
                </span>
              </div>
            )}

            {gameState === 'playing' && (
              <button
                type="button"
                onClick={() =>
                  setGameSettings((settings) => ({
                    ...settings,
                    showPreview: !settings.showPreview,
                  }))
                }
                className={`grid h-8 w-8 place-items-center rounded-full transition-colors sm:h-9 sm:w-9 ${
                  gameSettings.showPreview
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:bg-panel-2 hover:text-ink'
                }`}
                title="Toggle preview"
                aria-label="Toggle preview"
                aria-pressed={gameSettings.showPreview}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}

            <ThemeCustomizer config={theme} onChange={setTheme} />

            <button
              type="button"
              onClick={() =>
                setTheme((current) => ({ ...current, isDark: !current.isDark }))
              }
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-panel-2 hover:text-accent sm:h-9 sm:w-9"
              aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme.isDark ? (
                <svg
                  className="h-[18px] w-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
                  <path
                    strokeLinecap="round"
                    strokeWidth="1.8"
                    d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"
                  />
                </svg>
              ) : (
                <svg
                  className="h-[18px] w-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-soft-pulse absolute -top-40 left-1/2 h-[30rem] w-[44rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-24 right-[-8%] h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute inset-0 text-ink opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:26px_26px]" />
        </div>

        {error && (
          <div
            role="alert"
            className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/35 bg-panel px-4 py-2.5 text-sm text-red-600 shadow-xl dark:text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500/70 transition-colors hover:text-red-500"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {gameState === 'home' && (
          <div className="relative h-full overflow-y-auto scrollbar-thin">
            <GalleryHero
              index={carouselIndex}
              onIndexChange={setCarouselIndex}
              onStart={handleHeroStart}
            />
            <HomeSections
              onArtworkSelect={handleArtworkSelect}
              onImageSelect={handleImageSelect}
              aiPrompt={aiPrompt}
              onAiPromptChange={setAiPrompt}
              onGenerateAi={() => void generateAiImage()}
              isGenerating={isGenerating}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {(gameState === 'playing' || gameState === 'completed') && image && (
          <div className="absolute inset-0 bg-canvas">
            <PuzzleCanvas
              key={gameId}
              imageSrc={image}
              pieceCount={gameSettings.pieceCount}
              onComplete={() => {
                setCompletionPercent(100);
                setGameState('completed');
              }}
              onProgressChange={setCompletionPercent}
              showPreview={gameSettings.showPreview}
              accentColor={accentColor(theme.hue, theme.saturation, theme.lightness)}
            />
          </div>
        )}
      </main>

      {gameState === 'completed' && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#0c0a08]/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl animate-rise-in">
            <div className="relative h-36 overflow-hidden bg-panel-2">
              {image && (
                <img
                  src={image}
                  alt="Finished puzzle"
                  className="h-full w-full scale-105 object-cover opacity-80"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/35 to-transparent" />
            </div>

            <div className="relative -mt-9 px-6 pb-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-[0_14px_30px_-10px_color-mix(in_srgb,var(--accent)_85%,transparent)]">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Nicely pieced.</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                You finished the{' '}
                <span className="font-semibold text-ink">
                  {gameSettings.pieceCount}-piece
                </span>{' '}
                puzzle.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={startGame}
                  className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-on-accent transition-all hover:brightness-105 active:scale-[0.99]"
                >
                  Play again
                </button>
                <button
                  type="button"
                  onClick={() => setGameState('playing')}
                  className="w-full rounded-xl border border-line bg-panel-2/40 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-panel-2"
                >
                  Admire the finished puzzle
                </button>
                <button
                  type="button"
                  onClick={resetGame}
                  className="w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
                >
                  Start a new puzzle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {focus && (
        <PuzzleFocus
          src={focus.src}
          alt={focus.alt}
          onClose={() => setFocus(null)}
          onStart={handleStartPieces}
        />
      )}

    </div>
  );
};

export default App;
