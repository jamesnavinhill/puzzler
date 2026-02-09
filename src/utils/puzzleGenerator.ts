import { PuzzlePiece } from '../types';

// Constants for jigsaw shape generation
const TAB_SIZE_RATIO = 0.25; // Size of the tab relative to piece size

export const calculateGridDimensions = (
  imgWidth: number,
  imgHeight: number,
  targetPieceCount: number
) => {
  const ratio = imgWidth / imgHeight;
  const cols = Math.sqrt(targetPieceCount * ratio);
  const rows = targetPieceCount / cols;
  
  return {
    cols: Math.round(cols),
    rows: Math.round(rows),
    pieceWidth: imgWidth / Math.round(cols),
    pieceHeight: imgHeight / Math.round(rows),
  };
};

export const generatePuzzlePieces = (
  rows: number,
  cols: number,
  pieceWidth: number,
  pieceHeight: number
): PuzzlePiece[] => {
  const pieces: PuzzlePiece[] = [];
  const shapes: { top: number; right: number; bottom: number; left: number }[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  // 1. Generate shapes logic (tabs/slots)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shape = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };

      // Top Edge
      if (r === 0) shape.top = 0;
      else shape.top = -shapes[r - 1][c].bottom; // Match the piece above

      // Right Edge
      if (c === cols - 1) shape.right = 0;
      else shape.right = Math.random() > 0.5 ? 1 : -1;

      // Bottom Edge
      if (r === rows - 1) shape.bottom = 0;
      else shape.bottom = Math.random() > 0.5 ? 1 : -1;

      // Left Edge
      if (c === 0) shape.left = 0;
      else shape.left = -shapes[r][c - 1].right; // Match piece to the left

      shapes[r][c] = shape;
    }
  }

  // 2. Create Piece Objects
  let idCounter = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const correctX = c * pieceWidth;
      const correctY = r * pieceHeight;

      // Scatter pieces initially around the board center, but randomly
      const startX = Math.random() * (cols * pieceWidth * 0.8) + (pieceWidth * 0.5);
      const startY = Math.random() * (rows * pieceHeight * 0.8) + (pieceHeight * 0.5);

      pieces.push({
        id: idCounter++,
        row: r,
        col: c,
        correctX,
        correctY,
        currentX: startX,
        currentY: startY,
        width: pieceWidth,
        height: pieceHeight,
        isLocked: false,
        shape: shapes[r][c],
      });
    }
  }

  return pieces;
};

// Draw a single puzzle piece path
export const drawPiecePath = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shape: { top: number; right: number; bottom: number; left: number }
) => {
  const sz = Math.min(width, height);
  const tabHeight = sz * TAB_SIZE_RATIO;
  const neck = tabHeight * 0.8;
  
  ctx.moveTo(0, 0);

  // Top Edge
  if (shape.top === 0) {
    ctx.lineTo(width, 0);
  } else {
    // Draw tab
    const mid = width / 2;
    const sgn = shape.top; // 1 (out) or -1 (in)
    // curve to start of tab
    ctx.lineTo(mid - neck, 0);
    // the tab curve
    ctx.bezierCurveTo(
        mid - neck, -tabHeight * sgn, 
        mid + neck, -tabHeight * sgn, 
        mid + neck, 0
    );
    ctx.lineTo(width, 0);
  }

  // Right Edge
  if (shape.right === 0) {
    ctx.lineTo(width, height);
  } else {
    const mid = height / 2;
    const sgn = shape.right;
    ctx.lineTo(width, mid - neck);
    ctx.bezierCurveTo(
        width + tabHeight * sgn, mid - neck,
        width + tabHeight * sgn, mid + neck,
        width, mid + neck
    );
    ctx.lineTo(width, height);
  }

  // Bottom Edge
  if (shape.bottom === 0) {
    ctx.lineTo(0, height);
  } else {
    const mid = width / 2;
    const sgn = shape.bottom;
    ctx.lineTo(mid + neck, height);
    ctx.bezierCurveTo(
        mid + neck, height + tabHeight * sgn,
        mid - neck, height + tabHeight * sgn,
        mid - neck, height
    );
    ctx.lineTo(0, height);
  }

  // Left Edge
  if (shape.left === 0) {
    ctx.lineTo(0, 0);
  } else {
    const mid = height / 2;
    const sgn = shape.left;
    ctx.lineTo(0, mid + neck);
    ctx.bezierCurveTo(
        -tabHeight * sgn, mid + neck,
        -tabHeight * sgn, mid - neck,
        0, mid - neck
    );
    ctx.lineTo(0, 0);
  }
  
  ctx.closePath();
};