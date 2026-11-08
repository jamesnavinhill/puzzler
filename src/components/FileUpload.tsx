import React, { useState } from 'react';

interface FileUploadProps {
  onImageSelect: (file: File) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageSelect, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div
      className={`group relative flex aspect-[2/3] h-full max-h-[9.75rem] sm:max-h-[10.5rem] w-auto mx-auto flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-dashed p-3 text-center transition-all duration-300 cursor-pointer ${
        isDragging
          ? 'border-accent bg-accent/10 shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_10%,transparent)]'
          : 'border-line/80 bg-canvas/30 hover:border-accent/60 hover:bg-canvas/55'
      } ${className}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        aria-label="Upload an image file"
        title="Choose an image"
      />

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel-2 text-accent shadow-sm transition-transform duration-200 group-hover:scale-105">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v3.5A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5V14"
          />
        </svg>
      </div>

      <div className="space-y-0.5 px-1">
        <p className="text-xs font-semibold leading-tight text-ink">
          {isDragging ? 'Drop it here' : 'Drop photo'}
        </p>
        <p className="text-[11px] leading-tight text-muted">
          or <span className="text-accent underline underline-offset-2">browse</span>
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
