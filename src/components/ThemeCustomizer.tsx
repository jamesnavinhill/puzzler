import React, { useEffect } from 'react';
import { ThemeConfig } from '../types';
import { accentColor, DEFAULT_THEME } from '../theme';

interface ThemeCustomizerProps {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: 'Golden', hue: 34, saturation: 80, lightness: 64 },
  { label: 'Ember', hue: 18, saturation: 72, lightness: 56 },
  { label: 'Sage', hue: 112, saturation: 26, lightness: 46 },
  { label: 'Sky', hue: 204, saturation: 58, lightness: 56 },
  { label: 'Plum', hue: 318, saturation: 40, lightness: 58 },
];

const sliderThumbClasses =
  '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-panel [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-panel [&::-moz-range-thumb]:bg-ink';

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  config,
  onChange,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const accent = accentColor(config.hue, config.saturation, config.lightness);
  const update = (patch: Partial<ThemeConfig>) => onChange({ ...config, ...patch });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0a08]/55 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto scrollbar-thin rounded-3xl border border-line bg-panel shadow-2xl animate-rise-in"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <h2 id="appearance-title" className="text-xl font-semibold tracking-tight text-ink">
            Appearance
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close appearance"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel-2/35 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-ink">{config.isDark ? 'Warm charcoal' : 'Pale golden light'}</p>
              <p className="mt-0.5 text-xs text-muted">
                {config.isDark ? 'Low-light, muted and warm.' : 'Flat off-white with a soft glow.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => update({ isDark: !config.isDark })}
              role="switch"
              aria-checked={config.isDark}
              aria-label="Toggle dark mode"
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                config.isDark
                  ? 'border-accent/50 bg-accent/25'
                  : 'border-line bg-panel-2'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full shadow-sm transition-transform ${
                  config.isDark
                    ? 'translate-x-6 bg-accent'
                    : 'translate-x-1 bg-panel'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel-2/30 p-4">
            <span
              className="h-12 w-12 shrink-0 rounded-xl shadow-inner ring-1 ring-black/10"
              style={{ backgroundColor: accent }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Accent colour</p>
              <p className="mt-0.5 text-xs text-muted">
                {config.hue}° hue · {config.saturation}% sat · {config.lightness}% light
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange(DEFAULT_THEME)}
              className="shrink-0 text-xs font-semibold text-accent underline-offset-4 hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-sm font-medium text-ink">
                Hue <span className="text-xs font-normal tabular-nums text-muted">{config.hue}°</span>
              </span>
              <input
                type="range"
                min="0"
                max="360"
                value={config.hue}
                onChange={(event) => update({ hue: Number(event.target.value) })}
                aria-label="Accent hue"
                className={`h-2 w-full cursor-pointer appearance-none rounded-full ${sliderThumbClasses}`}
                style={{
                  background:
                    'linear-gradient(to right, #f45b5b, #f4d65b, #7bd47b, #5bd9d4, #6b8ff4, #c76bf4, #f45b8e, #f45b5b)',
                }}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-sm font-medium text-ink">
                Saturation
                <span className="text-xs font-normal tabular-nums text-muted">{config.saturation}%</span>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={config.saturation}
                onChange={(event) => update({ saturation: Number(event.target.value) })}
                aria-label="Accent saturation"
                className={`h-2 w-full cursor-pointer appearance-none rounded-full ${sliderThumbClasses}`}
                style={{
                  background: `linear-gradient(to right, hsl(${config.hue}, 0%, ${config.lightness}%), hsl(${config.hue}, 100%, ${config.lightness}%))`,
                }}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-sm font-medium text-ink">
                Lightness
                <span className="text-xs font-normal tabular-nums text-muted">{config.lightness}%</span>
              </span>
              <input
                type="range"
                min="25"
                max="85"
                value={config.lightness}
                onChange={(event) => update({ lightness: Number(event.target.value) })}
                aria-label="Accent lightness"
                className={`h-2 w-full cursor-pointer appearance-none rounded-full ${sliderThumbClasses}`}
                style={{
                  background: `linear-gradient(to right, hsl(${config.hue}, ${config.saturation}%, 25%), hsl(${config.hue}, ${config.saturation}%, 55%), hsl(${config.hue}, ${config.saturation}%, 85%))`,
                }}
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const presetColour = accentColor(preset.hue, preset.saturation, preset.lightness);
                const active =
                  config.hue === preset.hue &&
                  config.saturation === preset.saturation &&
                  config.lightness === preset.lightness;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      update({
                        hue: preset.hue,
                        saturation: preset.saturation,
                        lightness: preset.lightness,
                      })
                    }
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-accent/60 bg-accent/10 text-ink'
                        : 'border-line bg-panel-2/40 text-muted hover:border-accent/30 hover:text-ink'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: presetColour }}
                    />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-on-accent shadow-[0_12px_28px_-12px_color-mix(in_srgb,var(--accent)_75%,transparent)] transition-all hover:brightness-105 active:scale-[0.99]"
          >
            Apply appearance
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
