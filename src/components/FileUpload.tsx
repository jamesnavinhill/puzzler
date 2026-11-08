import React, { useState } from 'react';

interface FileUploadProps {
  onImageSelect: (file: File) => void;
  compact?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageSelect, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
        compact ? 'h-32' : 'h-64 max-w-2xl'
      } ${
        isDragging
          ? 'border-accent bg-accent/10 shadow-[0_0_0_6px_color-mix(in_srgb,var(--accent)_10%,transparent)]'
          : 'border-line bg-panel/60 hover:border-accent/55 hover:bg-panel/85'
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
        aria-label="Upload an image for your puzzle"
        title="Choose an image"
      />

      {compact ? (
        <div className="pointer-events-none relative z-10 flex h-full items-center gap-3 px-4">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 ${
              isDragging ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v3.5A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5V14"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight text-ink">
              {isDragging ? 'Drop it here' : 'Upload a photo'}
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              {isDragging ? 'We will optimize it for play' : 'Drop or browse'}
            </p>
          </div>
          <svg
            className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ) : (
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <div
            className={`mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 ${
              isDragging ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v3.5A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5V14"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-ink">
            {isDragging ? 'Drop it right here' : 'Drop an image here'}
          </h3>
          <p className="mt-1.5 text-sm text-muted">
            {isDragging ? 'We will optimize it for play' : 'or choose a file from your device'}
          </p>

          <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-on-accent shadow-[0_10px_24px_-10px_color-mix(in_srgb,var(--accent)_70%,transparent)]">
            Choose image
          </span>
          <p className="mt-3 text-[11px] text-muted/80">
            JPG, PNG or WebP · optimized locally to 1600px
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
