import React, { useEffect, useRef } from 'react';
import {
  calculateGridDimensions,
  drawPiecePath,
  generatePuzzlePieces,
} from '../utils/puzzleGenerator';

interface PuzzleCutPreviewProps {
  pieceCount: number;
  width: number;
  height: number;
}

const PuzzleCutPreview: React.FC<PuzzleCutPreviewProps> = ({
  pieceCount,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const { rows, cols, pieceWidth, pieceHeight } = calculateGridDimensions(
      width,
      height,
      pieceCount
    );
    const pieces = generatePuzzlePieces(rows, cols, pieceWidth, pieceHeight);

    ctx.lineJoin = 'round';
    pieces.forEach((piece) => {
      ctx.save();
      ctx.translate(piece.correctX, piece.correctY);
      ctx.beginPath();
      drawPiecePath(ctx, pieceWidth, pieceHeight, piece.shape);

      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(10, 8, 6, 0.5)';
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 248, 236, 0.78)';
      ctx.stroke();
      ctx.restore();
    });
  }, [height, pieceCount, width]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
};

export default PuzzleCutPreview;
