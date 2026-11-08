import { ThemeConfig } from './types';

export const THEME_STORAGE_KEY = 'puzzler.theme.v1';

export const DEFAULT_THEME: ThemeConfig = {
  hue: 346,
  saturation: 37,
  lightness: 49,
  isDark: true,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hueToChannel = (p: number, q: number, input: number) => {
  let t = input;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

export const hslToRgb = (hue: number, saturation: number, lightness: number) => {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;

  if (s === 0) {
    const channel = Math.round(l * 255);
    return [channel, channel, channel] as const;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
    Math.round(hueToChannel(p, q, h) * 255),
    Math.round(hueToChannel(p, q, h - 1 / 3) * 255),
  ] as const;
};

/** HSL ↔ HSV, so the picker square can use standard gradient math. */
export const hslToHsv = (
  hue: number,
  saturation: number,
  lightness: number
): { s: number; v: number } => {
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const v = l + s * Math.min(l, 1 - l);
  const sv = v === 0 ? 0 : 2 * (1 - l / v);

  return { s: sv * 100, v: v * 100 };
};

export const hsvToHsl = (
  hue: number,
  saturation: number,
  value: number
): { s: number; l: number } => {
  const s = clamp(saturation, 0, 100) / 100;
  const v = clamp(value, 0, 100) / 100;
  const l = v * (1 - s / 2);
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);

  return { s: sl * 100, l: l * 100 };
};

const relativeLuminance = (hue: number, saturation: number, lightness: number) => {
  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const getAccentContrast = (
  hue: number,
  saturation: number,
  lightness: number
) => (relativeLuminance(hue, saturation, lightness) > 0.42 ? '#241a0f' : '#fffaf1');

export const accentColor = (hue: number, saturation: number, lightness: number) =>
  `hsl(${hue}, ${saturation}%, ${lightness}%)`;

export const normalizeTheme = (value: unknown): ThemeConfig => {
  if (!value || typeof value !== 'object') {
    return DEFAULT_THEME;
  }

  const input = value as Partial<ThemeConfig>;
  const hue = Number(input.hue);
  const saturation = Number(input.saturation);
  const lightness = Number(input.lightness);

  return {
    hue: Number.isFinite(hue) ? clamp(hue, 0, 360) : DEFAULT_THEME.hue,
    saturation: Number.isFinite(saturation)
      ? clamp(saturation, 0, 100)
      : DEFAULT_THEME.saturation,
    lightness: Number.isFinite(lightness)
      ? clamp(lightness, 25, 85)
      : DEFAULT_THEME.lightness,
    isDark: typeof input.isDark === 'boolean' ? input.isDark : DEFAULT_THEME.isDark,
  };
};

export const loadTheme = (): ThemeConfig => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? normalizeTheme(JSON.parse(stored)) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};
