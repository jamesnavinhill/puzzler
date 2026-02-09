import React from 'react';
import { ThemeConfig } from '../types';

interface ThemeCustomizerProps {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ config, onChange, isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Dark Mode</span>
            <button
              onClick={() => onChange({ ...config, isDark: !config.isDark })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.isDark ? '' : 'bg-slate-300'
              }`}
              style={
                config.isDark
                  ? {
                      backgroundColor: `hsl(${config.hue}, ${config.saturation}%, ${Math.max(35, config.lightness - 10)}%)`,
                    }
                  : undefined
              }
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Accent Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={config.hue}
              onChange={(e) => onChange({ ...config, hue: Number(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background:
                  'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.saturation}
              onChange={(e) => onChange({ ...config, saturation: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500"
            />
          </div>

          <div className="pt-4">
            <button
              className="w-full py-3 rounded-xl text-white font-bold transition-transform active:scale-95 shadow-lg"
              style={{
                backgroundColor: `hsl(${config.hue}, ${config.saturation}%, ${config.lightness}%)`,
                boxShadow: `0 4px 14px 0 hsla(${config.hue}, ${config.saturation}%, ${config.lightness}%, 0.39)`,
              }}
              onClick={onClose}
            >
              Apply Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
