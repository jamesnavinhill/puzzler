import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PuzzlePiece } from '../types';
import { calculateGridDimensions, drawPiecePath, generatePuzzlePieces } from '../utils/puzzleGenerator';

interface PuzzleCanvasProps {
  imageSrc: string;
  pieceCount: number;
  onComplete: () => void;
  onProgressChange: (progressPercent: number) => void;
  showPreview: boolean;
  accentColor: string;
}

const SNAP_THRESHOLD = 30;

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

  const [status, setStatus] = useState<'loading_image' | 'waiting_for_layout' | 'generating' | 'ready' | 'error'>(
    'loading_image'
  );
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

        const { rows, cols, pieceWidth, pieceHeight } = calculateGridDimensions(finalWidth, finalHeight, pieceCount);
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

          if (x < 0 || y < 0 || x > containerW - piece.width || y > containerH - piece.height) {
            x = Math.random() * (containerW - piece.width);
            y = Math.random() * (containerH - piece.height);
          }

          return { ...piece, currentX: x, currentY: y };
        });

        scatteredPieces.sort(() => Math.random() - 0.5);

        setPieces(scatteredPieces);
        setCompletedCount(0);
        setStatus('ready');
      } catch (error) {
        console.error(error);
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

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !loadedImage || pieces.length === 0) {
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const maxCol = Math.max(...pieces.map((piece) => piece.col));
    const maxRow = Math.max(...pieces.map((piece) => piece.row));
    const boardWidth = pieces[0].width * (maxCol + 1);
    const boardHeight = pieces[0].height * (maxRow + 1);

    const boardOffsetX = (containerDimensions.width - boardWidth) / 2;
    const boardOffsetY = (containerDimensions.height - boardHeight) / 2;

    ctx.fillStyle = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    ctx.fillRect(boardOffsetX, boardOffsetY, boardWidth, boardHeight);

    if (showPreview) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.drawImage(loadedImage, boardOffsetX, boardOffsetY, boardWidth, boardHeight);
      ctx.restore();
    }

    ctx.strokeStyle = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
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
        ? 'rgba(255,255,255,0.1)'
        : document.body.classList.contains('dark-mode')
          ? 'rgba(255,255,255,0.4)'
          : 'rgba(0,0,0,0.2)';
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
  }, [accentColor, containerDimensions, draggedPieceId, loadedImage, pieces, showPreview, transform]);

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
      const newScale = Math.min(Math.max(0.25, transform.scale + delta), 4);

      const worldPos = toWorld(x, y);
      const newX = x - worldPos.x * newScale;
      const newY = y - worldPos.y * newScale;

      setTransform({ x: newX, y: newY, scale: newScale });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [transform]);

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
      setDragOffset({ x: worldPos.x - clickedPiece.currentX, y: worldPos.y - clickedPiece.currentY });
    } else {
      setIsPanning(true);
    }
  };

  const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    const { x, y } = getMousePos(event);
    const worldPos = toWorld(x, y);

    if (draggedPieceId !== null) {
      setPieces((prev) =>
        prev.map((piece) => {
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
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
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

    if (Math.hypot(piece.currentX - targetAbsX, piece.currentY - targetAbsY) < SNAP_THRESHOLD) {
      setPieces((prev) => {
        const next = prev.map((current) => {
          if (current.id === draggedPieceId) {
            return {
              ...current,
              currentX: targetAbsX,
              currentY: targetAbsY,
              isLocked: true,
            };
          }

          return current;
        });

        if (next.every((current) => current.isLocked)) {
          onComplete();
        }

        setCompletedCount(next.filter((current) => current.isLocked).length);
        return next;
      });
    }

    setDraggedPieceId(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative touch-none bg-slate-50 dark:bg-slate-900 overflow-hidden cursor-crosshair"
    >
      {status !== 'ready' && status !== 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-20 pointer-events-none">
          <div className="w-10 h-10 border-4 border-t-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] border-slate-200 rounded-full animate-spin mb-4" />
          <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
            {status === 'loading_image' && 'Loading Image...'}
            {status === 'waiting_for_layout' && 'Measuring Canvas...'}
            {status === 'generating' && 'Cutting Pieces...'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-50 dark:bg-slate-900">
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200 shadow-lg text-center">
            <p className="font-bold mb-2">Error</p>
            <p>{errorMessage}</p>
            <button onClick={() => window.location.reload()} className="text-sm underline mt-4 hover:text-red-800">
              Reload App
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
        className="block w-full h-full"
      />
    </div>
  );
};

export default PuzzleCanvas;
