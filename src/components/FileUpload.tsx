import React, { useState } from 'react';

interface FileUploadProps {
  onImageSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageSelect }) => {
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
      className={`group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-dashed px-3.5 transition-all duration-300 ${
        isDragging
          ? 'border-accent bg-accent/10 shadow-[0_0_0_6px_color-mix(in_srgb,var(--accent)_10%,transparent)]'
          : 'border-line bg-canvas/55 hover:border-accent/55 hover:bg-panel'
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

      <svg
        className={`h-5 w-5 shrink-0 text-accent transition-transform duration-300 ${
          isDragging ? 'scale-110' : 'group-hover:scale-105'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v3.5A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5V14"
        />
      </svg>

      <p className="min-w-0 flex-1 truncate text-sm leading-tight">
        <span className="font-semibold text-ink">
          {isDragging ? 'Drop it here' : 'Upload a photo'}
        </span>
        <span className="ml-2 text-xs text-muted">
          {isDragging ? 'We will optimize it for play' : 'Drop or browse'}
        </span>
      </p>

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
  );
};

export default FileUpload;
