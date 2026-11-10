import React, { useEffect, useRef, useState } from 'react';
import {
  clearLocalTelemetry,
  GenerationTelemetry,
  loadTelemetry,
  TELEMETRY_EVENT,
} from '../utils/neurons';

export type ModelKey = 'klein-4b' | 'schnell';

export interface ModelInfo {
  id: ModelKey;
  shortName: string;
  fullName: string;
  cost: number;
  steps: number;
  estCostUsd: string;
}

export const AI_MODELS: Record<ModelKey, ModelInfo> = {
  'klein-4b': {
    id: 'klein-4b',
    shortName: 'Klein 4b',
    fullName: 'FLUX.2 Klein 4B',
    cost: 104,
    steps: 4,
    estCostUsd: '$0.001',
  },
  schnell: {
    id: 'schnell',
    shortName: 'Schnell',
    fullName: 'FLUX.1 Schnell',
    cost: 173,
    steps: 4,
    estCostUsd: '$0.0019',
  },
};

export const DAILY_BUDGET = 10_000;

interface ModelPickerButtonProps {
  selectedModel: ModelKey;
  onModelChange: (model: ModelKey) => void;
}

export const ModelPickerButton: React.FC<ModelPickerButtonProps> = ({
  selectedModel,
  onModelChange,
}) => {
  const [telemetry, setTelemetry] = useState<GenerationTelemetry>(loadTelemetry);
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const [align, setAlign] = useState<'left' | 'right'>('left');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setTelemetry(loadTelemetry());
    };

    window.addEventListener(TELEMETRY_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(TELEMETRY_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleOpenToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Naturally open upward if near the bottom of the viewport
      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }

      // Check horizontal boundary: if button is near right viewport edge, align right
      if (rect.left + 288 > window.innerWidth - 16) {
        setAlign('right');
      } else {
        setAlign('left');
      }
    }
    setIsOpen((prev) => !prev);
  };

  const activeModel = AI_MODELS[selectedModel] ?? AI_MODELS['klein-4b'];
  const remainingBudget = Math.max(0, DAILY_BUDGET - telemetry.totalNeurons);
  const gensLeft = Math.floor(remainingBudget / activeModel.cost);
  const totalGens = Math.floor(DAILY_BUDGET / activeModel.cost);

  return (
    <div className="relative flex-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpenToggle}
        className="group flex h-11 w-full items-center justify-start gap-2 rounded-xl border border-line/80 bg-canvas/50 px-3 sm:px-3.5 transition-colors hover:border-accent/50 focus:outline-none"
        title="Change AI model and view daily quota"
        aria-label={`Model: ${activeModel.shortName}, ${gensLeft} of ${totalGens} generations remaining`}
      >
        <span className="shrink-0 text-xs font-bold tabular-nums text-accent">
          {gensLeft}/{totalGens}
        </span>
        <span className="text-muted/40 select-none text-xs">|</span>
        <span className="truncate text-xs font-medium text-ink transition-colors">
          {activeModel.shortName}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Fullscreen backdrop to dismiss on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Naturally anchored popover */}
          <div
            className={`absolute z-50 w-72 rounded-2xl border border-line/80 bg-panel p-3.5 shadow-2xl backdrop-blur-md transition-all animate-fade-in ${
              placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            } ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {/* Model details */}
            <div className="space-y-1 text-xs">
              <div className="rounded-xl bg-canvas/60 p-2.5 text-[11px] space-y-1.5 text-muted border border-line/40">
                <div className="flex justify-between items-center">
                  <span>Engine:</span>
                  <span className="font-semibold text-ink">{activeModel.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Generations:</span>
                  <span className="font-bold tabular-nums text-accent">
                    {gensLeft}/{totalGens}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Est. per run:</span>
                  <span className="tabular-nums text-ink">{activeModel.estCostUsd}</span>
                </div>
              </div>
            </div>

            {/* Footer: model selector bottom left, Done button right */}
            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-line/60">
              <div
                role="group"
                aria-label="Select AI model"
                className="inline-flex items-center rounded-full border border-line bg-canvas p-0.5"
              >
                {(Object.keys(AI_MODELS) as ModelKey[]).map((key) => {
                  const isSelected = selectedModel === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onModelChange(key)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        isSelected
                          ? 'bg-accent text-on-accent'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {AI_MODELS[key].shortName}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-panel-2 px-3 py-1 text-[11px] font-medium text-ink hover:bg-line transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
