import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ThemeConfig } from '../types';
import { accentColor, hslToRgb } from '../theme';

interface ThemeCustomizerProps {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
}

const PRESETS = [
  { label: 'Golden', hue: 34, saturation: 80, lightness: 64 },
  { label: 'Ember', hue: 18, saturation: 72, lightness: 56 },
  { label: 'Rose', hue: 342, saturation: 58, lightness: 62 },
  { label: 'Plum', hue: 318, saturation: 40, lightness: 58 },
  { label: 'Cobalt', hue: 226, saturation: 62, lightness: 56 },
  { label: 'Sky', hue: 204, saturation: 58, lightness: 56 },
  { label: 'Teal', hue: 176, saturation: 48, lightness: 46 },
  { label: 'Sage', hue: 112, saturation: 26, lightness: 46 },
  { label: 'Olive', hue: 76, saturation: 38, lightness: 44 },
  { label: 'Clay', hue: 8, saturation: 56, lightness: 54 },
];

const MIN_LIGHTNESS = 25;
const MAX_LIGHTNESS = 85;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelId = useId();
  const accent = accentColor(config.hue, config.saturation, config.lightness);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const size = 220;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const pixels = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      const lightness =
        MAX_LIGHTNESS - (y / (size - 1)) * (MAX_LIGHTNESS - MIN_LIGHTNESS);

      for (let x = 0; x < size; x += 1) {
        const saturation = (x / (size - 1)) * 100;
        const [red, green, blue] = hslToRgb(config.hue, saturation, lightness);
        const offset = (y * size + x) * 4;
        pixels.data[offset] = red;
        pixels.data[offset + 1] = green;
        pixels.data[offset + 2] = blue;
        pixels.data[offset + 3] = 255;
      }
    }

    context.putImageData(pixels, 0, 0);
  }, [config.hue, isOpen]);

  const updateFromPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        return;
      }

      const saturation = Math.round(
        clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100)
      );
      const lightness = Math.round(
        clamp(
          MAX_LIGHTNESS -
            ((event.clientY - bounds.top) / bounds.height) *
              (MAX_LIGHTNESS - MIN_LIGHTNESS),
          MIN_LIGHTNESS,
          MAX_LIGHTNESS
        )
      );

      onChange({ ...config, saturation, lightness });
    },
    [config, onChange]
  );

  const handleSquareKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 5 : 1;
    let saturation = config.saturation;
    let lightness = config.lightness;

    if (event.key === 'ArrowLeft') saturation -= step;
    else if (event.key === 'ArrowRight') saturation += step;
    else if (event.key === 'ArrowUp') lightness += step;
    else if (event.key === 'ArrowDown') lightness -= step;
    else return;

    event.preventDefault();
    onChange({
      ...config,
      saturation: clamp(saturation, 0, 100),
      lightness: clamp(lightness, MIN_LIGHTNESS, MAX_LIGHTNESS),
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`grid h-8 w-8 place-items-center rounded-full transition-colors sm:h-9 sm:w-9 ${
          isOpen ? 'bg-panel-2' : 'hover:bg-panel-2'
        }`}
        aria-label="Choose accent colour"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span
          className="h-4 w-4 rounded-full border border-black/15 shadow-sm ring-1 ring-black/10"
          style={{ backgroundColor: accent }}
        />
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Accent colour picker"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(15.5rem,calc(100vw-1rem))] rounded-2xl border border-line bg-panel p-3 shadow-2xl animate-rise-in motion-reduce:animate-none"
        >
          <div
            ref={squareRef}
            role="group"
            tabIndex={0}
            aria-label="Accent colour. Drag to adjust saturation and lightness, or use the arrow keys."
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateFromPointer(event);
              }
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onKeyDown={handleSquareKeyDown}
            className="relative aspect-square w-full touch-none cursor-crosshair overflow-hidden rounded-xl border border-line shadow-inner focus-visible:outline-none"
          >
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_1px_5px_rgba(0,0,0,0.35)]"
              style={{
                left: `${config.saturation}%`,
                top: `${((MAX_LIGHTNESS - config.lightness) / (MAX_LIGHTNESS - MIN_LIGHTNESS)) * 100}%`,
              }}
            />
          </div>

          <input
            type="range"
            min="0"
            max="360"
            value={config.hue}
            onChange={(event) => onChange({ ...config, hue: Number(event.target.value) })}
            aria-label="Accent hue"
            className="hue-range mt-3 h-2.5 w-full cursor-pointer appearance-none rounded-full"
          />

          <div className="my-3 h-px bg-line" />

          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((preset) => {
              const presetColour = accentColor(
                preset.hue,
                preset.saturation,
                preset.lightness
              );
              const active =
                config.hue === preset.hue &&
                config.saturation === preset.saturation &&
                config.lightness === preset.lightness;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      hue: preset.hue,
                      saturation: preset.saturation,
                      lightness: preset.lightness,
                    })
                  }
                  aria-label={`Use ${preset.label} accent`}
                  aria-pressed={active}
                  className={`aspect-square w-full rounded-lg ring-1 ring-black/10 transition-transform hover:scale-105 ${
                    active ? 'ring-2 ring-ink ring-offset-2 ring-offset-panel' : ''
                  }`}
                  style={{ backgroundColor: presetColour }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeCustomizer;
