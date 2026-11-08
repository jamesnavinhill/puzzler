export interface GenerationTelemetry {
  date: string;
  totalGenerated: number;
  totalNeurons: number;
  lastRun?: {
    model: string;
    neurons: number;
    timestamp: number;
  };
}

const STORAGE_KEY = 'puzzled.telemetry.v1';
export const TELEMETRY_EVENT = 'puzzled:telemetry-updated';

export const loadTelemetry = (): GenerationTelemetry => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today) {
        return {
          date: today,
          totalGenerated: typeof parsed.totalGenerated === 'number' ? parsed.totalGenerated : 0,
          totalNeurons: typeof parsed.totalNeurons === 'number' ? parsed.totalNeurons : 0,
          lastRun: parsed.lastRun,
        };
      }
      // New day: start fresh daily counter
      return {
        date: today,
        totalGenerated: 0,
        totalNeurons: 0,
      };
    }
  } catch {
    // ignore
  }

  return {
    date: today,
    totalGenerated: 0,
    totalNeurons: 0,
  };
};

export const recordGeneration = (neurons: number, modelName: string): GenerationTelemetry => {
  const current = loadTelemetry();
  const safeNeurons = Math.max(0, Math.round(neurons));

  const updated: GenerationTelemetry = {
    ...current,
    totalGenerated: current.totalGenerated + 1,
    totalNeurons: current.totalNeurons + safeNeurons,
    lastRun: {
      model: modelName,
      neurons: safeNeurons,
      timestamp: Date.now(),
    },
  };

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(TELEMETRY_EVENT, { detail: updated }));
    }
  } catch {
    // ignore in private contexts
  }

  return updated;
};

export const clearLocalTelemetry = (): GenerationTelemetry => {
  const today = new Date().toISOString().slice(0, 10);
  const cleared: GenerationTelemetry = {
    date: today,
    totalGenerated: 0,
    totalNeurons: 0,
  };

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
      window.dispatchEvent(new CustomEvent(TELEMETRY_EVENT, { detail: cleared }));
    }
  } catch {
    // ignore
  }

  return cleared;
};
