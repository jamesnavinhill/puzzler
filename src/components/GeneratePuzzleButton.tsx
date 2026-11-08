import React from 'react';

interface GeneratePuzzleButtonProps {
  onClick: () => void;
  className?: string;
}

const GeneratePuzzleButton: React.FC<GeneratePuzzleButtonProps> = ({
  onClick,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`generate-puzzle-btn inline-flex w-[var(--control-pill-w)] shrink-0 items-center justify-center rounded-full bg-accent px-2 py-3 text-sm font-bold text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_16px_-6px_rgba(23,15,8,0.5),0_22px_48px_-12px_color-mix(in_srgb,var(--accent)_80%,transparent)] transition-all hover:brightness-105 active:scale-[0.985] cursor-pointer sm:py-3.5 sm:text-base ${
      className ?? ''
    }`}
  >
    Make a Puzzle
  </button>
);

export default GeneratePuzzleButton;
