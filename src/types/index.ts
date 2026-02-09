export interface PuzzlePiece {
  id: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  row: number;
  col: number;
  width: number;
  height: number;
  isLocked: boolean;
  shape: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  pieceCount: number;
  showPreview: boolean;
}

export interface ThemeConfig {
  hue: number;
  saturation: number;
  lightness: number;
  isDark: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
}
