import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PuzzlePiece } from '../types';
import {
  calculateGridDimensions,
  drawPiecePath,
  generatePuzzlePieces,
} from '../utils/puzzleGenerator';

interface PuzzleCanvasProps {
  imageSrc: string;
  pieceCount: number;
  onComplete: () => void;
  onProgressChange: (progressPercent: number) => void;
  showPreview: boolean;
  accentColor: string;
}

const SNAP_THRESHOLD = 30;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

const PuzzleCanvas: React.FC<PuzzleCanvasProps> = ({
  imageSrc,
  pieceCount,
  onComplete,
  onProgressChange,
  showPreview,
  accentColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [completedCount, setCompletedCount] = useState(0);

  const [status, setStatus] = useState<
    'loading_image' | 'waiting_for_layout' | 'generating' | 'ready' | 'error'
  >('loading_image');
  const [errorMessage, setErrorMessage] = useState('');

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setContainerDimensions({ width, height });
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setStatus('loading_image');
    setPieces([]);
    setCompletedCount(0);
    setTransform({ x: 0, y: 0, scale: 1 });
    onProgressChange(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setLoadedImage(img);
      setStatus('waiting_for_layout');
    };
    img.onerror = () => {
      setStatus('error');
      setErrorMessage('Failed to load image');
    };
  }, [imageSrc, onProgressChange]);

  useEffect(() => {
    if (!loadedImage) {
      return;
    }

    if (containerDimensions.width === 0 || containerDimensions.height === 0) {
      return;
    }

    if (pieces.length > 0) {
      return;
    }

    setStatus('generating');

    const timer = setTimeout(() => {
      try {
        const { width: containerW, height: containerH } = containerDimensions;

        const BOARD_SCALE = 0.65;
        const maxWidth = Math.max(100, containerW * BOARD_SCALE);
        const maxHeight = Math.max(100, containerH * BOARD_SCALE);

        const imgRatio = loadedImage.width / loadedImage.height;
        const containerRatio = maxWidth / maxHeight;

        let finalWidth: number;
        let finalHeight: number;

        if (imgRatio > containerRatio) {
          finalWidth = maxWidth;
          finalHeight = maxWidth / imgRatio;
        } else {
          finalHeight = maxHeight;
          finalWidth = maxHeight * imgRatio;
        }

        const { rows, cols, pieceWidth, pieceHeight } = calculateGridDimensions(
          finalWidth,
          finalHeight,
          pieceCount
        );
        const generatedPieces = generatePuzzlePieces(rows, cols, pieceWidth, pieceHeight);

        const boardWidth = cols * pieceWidth;
        const boardHeight = rows * pieceHeight;
        const boardX = (containerW - boardWidth) / 2;
        const boardY = (containerH - boardHeight) / 2;

        let sideIndex = 0;
        const scatteredPieces = generatedPieces.map((piece) => {
          const side = sideIndex % 4;
          sideIndex += 1;

          const margin = 10;
          let x = 0;
          let y = 0;

          const rand = (min: number, max: number) => Math.random() * (max - min) + min;

          switch (side) {
            case 0:
              x = rand(0, containerW - piece.width);
              y = rand(0, boardY - piece.height - margin);
              break;
            case 1:
              x = rand(boardX + boardWidth + margin, containerW - piece.width);
              y = rand(0, containerH - piece.height);
              break;
            case 2:
              x = rand(0, containerW - piece.width);
              y = rand(boardY + boardHeight + margin, containerH - piece.height);
              break;
            case 3:
              x = rand(0, boardX - piece.width - margin);
              y = rand(0, containerH - piece.height);
              break;
            default:
              break;
          }

          if (
            x < 0 ||
            y < 0 ||
            x > containerW - piece.width ||
            y > containerH - piece.height
          ) {
            x = Math.random() * (containerW - piece.width);
            y = Math.random() * (containerH - piece.height);
          }

          return { ...piece, currentX: x, currentY: y };
        });

        scatteredPieces.sort(() => Math.random() - 0.5);

        setPieces(scatteredPieces);
        setCompletedCount(0);
        setStatus('ready');
      } catch (generationError) {
        console.error(generationError);
        setStatus('error');
        setErrorMessage('Generation failed');
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [containerDimensions, loadedImage, pieceCount, pieces.length]);

  useEffect(() => {
    const progress = pieces.length === 0 ? 0 : Math.round((completedCount / pieces.length) * 100);
    onProgressChange(progress);
  }, [completedCount, onProgressChange, pieces.length]);

  // Dev-only QA hook used by the screenshot capture pass. The DEV guard keeps
  // it out of production builds.
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const handleAutoSolve = () => {
      if (pieces.length === 0) {
        return;
      }

      setPieces((previous) =>
        previous.map((piece) => ({
          ...piece,
          currentX: piece.correctX,
          currentY: piece.correctY,
          isLocked: true,
        }))
      );
      setCompletedCount(pieces.length);
      onProgressChange(100);
      onComplete();
    };

    window.addEventListener('puzzler:autosolve', handleAutoSolve);
    return () => window.removeEventListener('puzzler:autosolve', handleAutoSolve);
  }, [onComplete, onProgressChange, pieces.length]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !loadedImage || pieces.length === 0) {
      return;
    }

    const isDark = document.body.classList.contains('dark-mode');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.imageSmoothingQuality = 'high';

    const maxCol = Math.max(...pieces.map((piece) => piece.col));
    const maxRow = Math.max(...pieces.map((piece) => piece.row));
    const boardWidth = pieces[0].width * (maxCol + 1);
    const boardHeight = pieces[0].height * (maxRow + 1);

    const boardOffsetX = (containerDimensions.width - boardWidth) / 2;
    const boardOffsetY = (containerDimensions.height - boardHeight) / 2;

    ctx.fillStyle = isDark ? 'rgba(255, 244, 228, 0.035)' : 'rgba(37, 30, 22, 0.035)';
    ctx.fillRect(boardOffsetX, boardOffsetY, boardWidth, boardHeight);

    if (showPreview) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(loadedImage, boardOffsetX, boardOffsetY, boardWidth, boardHeight);
      ctx.restore();
    }

    ctx.strokeStyle = isDark ? 'rgba(255, 241, 222, 0.11)' : 'rgba(37, 30, 22, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardOffsetX, boardOffsetY, boardWidth, boardHeight);

    const sortedPieces = [...pieces].sort((a, b) => {
      if (a.id === draggedPieceId) {
        return 1;
      }
      if (b.id === draggedPieceId) {
        return -1;
      }
      if (a.isLocked && !b.isLocked) {
        return -1;
      }
      if (!a.isLocked && b.isLocked) {
        return 1;
      }
      return 0;
    });

    sortedPieces.forEach((piece) => {
      ctx.save();
      const targetX = boardOffsetX + piece.correctX;
      const targetY = boardOffsetY + piece.correctY;
      const drawX = piece.isLocked ? targetX : piece.currentX;
      const drawY = piece.isLocked ? targetY : piece.currentY;

      ctx.translate(drawX, drawY);
      ctx.beginPath();
      drawPiecePath(ctx, piece.width, piece.height, piece.shape);

      ctx.save();
      ctx.clip();
      ctx.drawImage(loadedImage, -piece.correctX, -piece.correctY, boardWidth, boardHeight);
      ctx.restore();

      ctx.strokeStyle = piece.isLocked
        ? 'rgba(255, 255, 255, 0.1)'
        : isDark
          ? 'rgba(255, 243, 226, 0.4)'
          : 'rgba(37, 30, 22, 0.22)';
      ctx.lineWidth = 1 / transform.scale;
      ctx.stroke();

      if (piece.id === draggedPieceId) {
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2 / transform.scale;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    });
  }, [
    accentColor,
    containerDimensions,
    draggedPieceId,
    loadedImage,
    pieces,
    showPreview,
    transform,
  ]);

  useEffect(() => {
    let handle: number;
    const loop = () => {
      render();
      handle = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(handle);
  }, [render]);

  const getMousePos = (event: React.MouseEvent | React.TouchEvent | WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as React.MouseEvent).clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const toWorld = (screenX: number, screenY: number) => ({
    x: (screenX - transform.x) / transform.scale,
    y: (screenY - transform.y) / transform.scale,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { x, y } = getMousePos(event);
      const sensitivity = 0.001;
      const delta = -event.deltaY * sensitivity;
      const newScale = Math.min(Math.max(MIN_SCALE, transform.scale + delta), MAX_SCALE);

      const worldPos = toWorld(x, y);
      const newX = x - worldPos.x * newScale;
      const newY = y - worldPos.y * newScale;

      setTransform({ x: newX, y: newY, scale: newScale });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [transform]);

  const zoomBy = (factor: number) => {
    setTransform((previous) => {
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, previous.scale * factor)
      );

      if (nextScale === previous.scale) {
        return previous;
      }

      const centerX = containerDimensions.width / 2;
      const centerY = containerDimensions.height / 2;
      const worldX = (centerX - previous.x) / previous.scale;
      const worldY = (centerY - previous.y) / previous.scale;

      return {
        x: centerX - worldX * nextScale,
        y: centerY - worldY * nextScale,
        scale: nextScale,
      };
    });
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const handlePointerDown = (event: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getMousePos(event);
    const worldPos = toWorld(x, y);
    setLastMousePos({ x, y });

    const clickedPiece = [...pieces].reverse().find((piece) => {
      if (piece.isLocked) {
        return false;
      }

      const margin = piece.width * 0.1;
      return (
        worldPos.x >= piece.currentX + margin &&
        worldPos.x <= piece.currentX + piece.width - margin &&
        worldPos.y >= piece.currentY + margin &&
        worldPos.y <= piece.currentY + piece.height - margin
      );
    });

    if (clickedPiece) {
      setDraggedPieceId(clickedPiece.id);
      setDragOffset({
        x: worldPos.x - clickedPiece.currentX,
        y: worldPos.y - clickedPiece.currentY,
      });
    } else {
      setIsPanning(true);
    }
  };

  const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getMousePos(event);
    const worldPos = toWorld(x, y);

    if (draggedPieceId !== null) {
      setPieces((previous) =>
        previous.map((piece) => {
          if (piece.id === draggedPieceId) {
            return {
              ...piece,
              currentX: worldPos.x - dragOffset.x,
              currentY: worldPos.y - dragOffset.y,
            };
          }
          return piece;
        })
      );
      return;
    }

    if (isPanning) {
      const dx = x - lastMousePos.x;
      const dy = y - lastMousePos.y;
      setTransform((previous) => ({
        ...previous,
        x: previous.x + dx,
        y: previous.y + dy,
      }));
      setLastMousePos({ x, y });
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);

    if (draggedPieceId === null) {
      return;
    }

    const piece = pieces.find((current) => current.id === draggedPieceId);
    if (!piece) {
      setDraggedPieceId(null);
      return;
    }

    const maxCol = Math.max(...pieces.map((current) => current.col));
    const maxRow = Math.max(...pieces.map((current) => current.row));
    const boardWidth = pieces[0].width * (maxCol + 1);
    const boardHeight = pieces[0].height * (maxRow + 1);
    const boardOffsetX = (containerDimensions.width - boardWidth) / 2;
    const boardOffsetY = (containerDimensions.height - boardHeight) / 2;

    const targetAbsX = boardOffsetX + piece.correctX;
    const targetAbsY = boardOffsetY + piece.correctY;
    const shouldLock =
      Math.hypot(piece.currentX - targetAbsX, piece.currentY - targetAbsY) < SNAP_THRESHOLD;

    if (shouldLock) {
      const nextPieces = pieces.map((current) =>
        current.id === draggedPieceId
          ? {
              ...current,
              currentX: targetAbsX,
              currentY: targetAbsY,
              isLocked: true,
            }
          : current
      );
      const lockedCount = nextPieces.filter((current) => current.isLocked).length;

      setPieces(nextPieces);
      setCompletedCount(lockedCount);

      if (lockedCount === pieces.length) {
        onComplete();
      }
    }

    setDraggedPieceId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-canvas"
    >
      {status !== 'ready' && status !== 'error' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-canvas">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
          <p className="animate-pulse text-sm font-medium text-muted">
            {status === 'loading_image' && 'Loading image…'}
            {status === 'waiting_for_layout' && 'Measuring canvas…'}
            {status === 'generating' && 'Cutting pieces…'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas p-4">
          <div className="rounded-2xl border border-red-500/25 bg-panel px-6 py-5 text-center text-red-600 shadow-xl dark:text-red-300">
            <p className="font-semibold">Could not start this puzzle</p>
            <p className="mt-1 text-sm opacity-80">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 text-sm font-semibold underline underline-offset-4"
            >
              Reload app
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
        className="block h-full w-full cursor-crosshair"
      />

      {status === 'ready' && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-full border border-line bg-panel/90 p-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={() => zoomBy(1.2)}
            aria-label="Zoom in"
            title="Zoom in"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.8)}
            aria-label="Zoom out"
            title="Zoom out"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </button>
          <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset view"
            title="Reset view"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PuzzleCanvas;
