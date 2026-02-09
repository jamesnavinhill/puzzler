import React, { useEffect, useState } from 'react';
import AudioPlayer from './components/AudioPlayer';
import FileUpload from './components/FileUpload';
import PuzzleCanvas from './components/PuzzleCanvas';
import ThemeCustomizer from './components/ThemeCustomizer';
import { GameSettings, ThemeConfig } from './types';

type GameState = 'home' | 'setup' | 'playing' | 'completed';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('home');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    difficulty: 'medium',
    pieceCount: 50,
    showPreview: true,
  });

  const [theme, setTheme] = useState<ThemeConfig>({
    hue: 332,
    saturation: 84,
    lightness: 62,
    isDark: true,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-hue', theme.hue.toString());
    root.style.setProperty('--accent-sat', `${theme.saturation}%`);
    root.style.setProperty('--accent-light', `${theme.lightness}%`);

    if (theme.isDark) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const processImage = (file: File) => {
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
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(optimizedDataUrl);
        setGameState('setup');
        setIsProcessing(false);
      };

      img.onerror = () => {
        alert('Failed to load image data.');
        setIsProcessing(false);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      alert('Error reading file.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleImageSelect = (file: File) => {
    processImage(file);
  };

  const loadDemoImage = () => {
    setIsProcessing(true);
    setCompletionPercent(0);

    const demoImage = new Image();
    demoImage.crossOrigin = 'Anonymous';
    const src =
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';

    demoImage.src = src;
    demoImage.onload = () => {
      setImage(src);
      setGameState('setup');
      setIsProcessing(false);
    };

    demoImage.onerror = () => {
      alert('Failed to load demo image.');
      setIsProcessing(false);
    };
  };

  const updateDifficulty = (difficulty: GameSettings['difficulty']) => {
    const counts = { easy: 25, medium: 100, hard: 250 };
    setGameSettings((prev) => ({
      ...prev,
      difficulty,
      pieceCount: counts[difficulty],
    }));
  };

  const startGame = () => {
    setCompletionPercent(0);
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('home');
    setImage(null);
    setIsProcessing(false);
    setCompletionPercent(0);
  };

  const showGameplayHeader = gameState === 'playing' || gameState === 'completed';

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <header className="px-4 md:px-6 py-3 md:py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={resetGame}>
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[hsla(var(--accent-hue),var(--accent-sat),var(--accent-light),0.4)]">
              P
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-800 dark:text-white hidden sm:block">
              PuzzleMaster
            </h1>
          </div>

          <div className="flex-1 flex justify-center mx-2 md:mx-4 min-w-0">
            {showGameplayHeader && <AudioPlayer />}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {showGameplayHeader && (
              <div className="hidden sm:flex items-center gap-2 w-28 md:w-40">
                <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] transition-[width] duration-300 ease-out"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums min-w-[2.5rem] text-right">
                  {completionPercent}%
                </span>
              </div>
            )}

            {gameState === 'playing' && (
              <button
                onClick={() => setGameSettings((settings) => ({ ...settings, showPreview: !settings.showPreview }))}
                className={`p-2 rounded-full transition-colors ${
                  gameSettings.showPreview
                    ? 'text-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Toggle Preview"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            )}

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] transition-colors"
              title="Appearance"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        {gameState === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-2xl text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
                Piece Together Your{' '}
                <span className="text-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))]">Memories</span>
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Upload a photo, choose your difficulty, and enjoy a relaxing puzzle experience.
              </p>
            </div>

            {isProcessing ? (
              <div className="w-full max-w-2xl mx-auto h-64 border-4 border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] border-slate-200 rounded-full animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Processing Image...</h3>
                <p className="text-slate-400">Optimizing for gameplay</p>
              </div>
            ) : (
              <>
                <FileUpload onImageSelect={handleImageSelect} />

                <div className="mt-6 flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Or try this:</span>
                  <button
                    onClick={loadDemoImage}
                    className="text-sm font-medium text-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] hover:underline underline-offset-4"
                  >
                    Use Demo Landscape Photo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {gameState === 'setup' && image && (
          <div className="absolute inset-0 z-30 overflow-y-auto bg-slate-50 dark:bg-slate-900 scrollbar-thin">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl shadow-xl max-w-4xl w-full flex flex-col md:flex-row gap-6 border border-slate-200 dark:border-slate-700">
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Your Photo</h3>
                  <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner flex-1 min-h-[200px] md:min-h-[300px] flex items-center justify-center group">
                    <img
                      src={image}
                      alt="Puzzle Preview"
                      className="max-w-full max-h-[300px] md:max-h-[400px] object-contain shadow-lg"
                    />
                  </div>
                </div>

                <div className="w-full md:w-80 flex flex-col gap-5 flex-shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Puzzle Settings</h3>

                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Difficulty Level
                    </label>
                    <div className="space-y-2.5">
                      {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                        <div
                          key={difficulty}
                          onClick={() => updateDifficulty(difficulty)}
                          className={`p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between select-none ${
                            gameSettings.difficulty === difficulty
                              ? 'border-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] bg-[hsla(var(--accent-hue),var(--accent-sat),var(--accent-light),0.05)]'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm md:text-base">
                              {difficulty}
                            </p>
                            <p className="text-xs text-slate-500">
                              {difficulty === 'easy' ? '25' : difficulty === 'medium' ? '100' : '250'} Pieces
                            </p>
                          </div>
                          {gameSettings.difficulty === difficulty && (
                            <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-2 flex gap-3">
                    <button
                      onClick={resetGame}
                      className="px-4 py-3 rounded-xl font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={startGame}
                      className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] hover:brightness-110 shadow-lg shadow-[hsla(var(--accent-hue),var(--accent-sat),var(--accent-light),0.3)] transition-all active:scale-95"
                    >
                      Start Puzzle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'completed') && image && (
          <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-900 shadow-inner overflow-hidden">
            <PuzzleCanvas
              imageSrc={image}
              pieceCount={gameSettings.pieceCount}
              onComplete={() => setGameState('completed')}
              onProgressChange={setCompletionPercent}
              showPreview={gameSettings.showPreview}
              accentColor={`hsl(${theme.hue}, ${theme.saturation}%, ${theme.lightness}%)`}
            />
          </div>
        )}
      </main>

      {gameState === 'completed' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 transform transition-all scale-100 border border-white/10">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Puzzle Solved!</h3>
            <p className="text-slate-500 dark:text-slate-300 mb-8 leading-relaxed">
              Fantastic work! You&apos;ve successfully completed the{' '}
              <span className="font-semibold text-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))]">
                {gameSettings.difficulty}
              </span>{' '}
              puzzle.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="w-full px-5 py-3 rounded-xl bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] text-white font-bold hover:brightness-110 transition-colors shadow-lg"
              >
                Admire Puzzle
              </button>
              <button
                onClick={resetGame}
                className="w-full px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Create New Puzzle
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeCustomizer
        config={theme}
        onChange={setTheme}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default App;
