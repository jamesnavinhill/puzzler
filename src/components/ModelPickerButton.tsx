import React, { useEffect, useState } from 'react';
import {
  clearLocalTelemetry,
  GenerationTelemetry,
  loadTelemetry,
  TELEMETRY_EVENT,
} from '../utils/neurons';

export type ModelKey = 'klein-4b' | 'schnell';

interface ModelInfo {
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

const DAILY_BUDGET = 10_000;

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

  const activeModel = AI_MODELS[selectedModel] ?? AI_MODELS['klein-4b'];
  const remainingBudget = Math.max(0, DAILY_BUDGET - telemetry.totalNeurons);
  const gensLeft = Math.floor(remainingBudget / activeModel.cost);

  return (
    <div className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-line bg-canvas/55 px-3 transition-colors hover:border-accent/40 focus:outline-none"
        title="Change AI model and view daily quota"
        aria-label={`Model: ${activeModel.shortName}, ${gensLeft} generations remaining`}
      >
        <span className="max-w-[4.25rem] truncate text-[11px] font-medium text-muted transition-colors group-hover:text-ink">
          {activeModel.shortName}
        </span>
        <span className="text-xs font-bold tabular-nums text-ink">
          {gensLeft}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-72 rounded-2xl border border-line bg-panel p-3.5 shadow-xl backdrop-blur-md sm:bottom-auto sm:top-full sm:mt-2">
            {/* Header with two-model group toggle */}
            <div className="flex items-center justify-between pb-2.5 border-b border-line/60">
              <span className="text-xs font-semibold text-ink">Model</span>
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
            </div>

            {/* Model details */}
            <div className="mt-2.5 space-y-1.5 text-xs">
              <div className="rounded-xl bg-canvas/60 p-2.5 text-[11px] space-y-1 text-muted border border-line/40">
                <div className="flex justify-between items-center">
                  <span>Engine:</span>
                  <span className="font-semibold text-ink">{activeModel.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Generations left:</span>
                  <span className="font-bold tabular-nums text-accent">{gensLeft}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Est. per run:</span>
                  <span className="tabular-nums text-ink">{activeModel.estCostUsd}</span>
                </div>
              </div>

              {telemetry.totalGenerated > 0 ? (
                <div className="flex justify-between text-[11px] text-muted px-1 pt-0.5">
                  <span>Used today:</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {telemetry.totalGenerated} made
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-muted px-1 pt-0.5">
                  Daily allowance: {Math.floor(DAILY_BUDGET / activeModel.cost)} runs
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-line/60">
              {telemetry.totalGenerated > 0 ? (
                <button
                  type="button"
                  onClick={() => setTelemetry(clearLocalTelemetry())}
                  className="text-[10px] text-muted hover:text-ink transition-colors"
                >
                  Clear tally
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-panel-2 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-line transition-colors"
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
