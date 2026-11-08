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
      className={`group relative flex h-36 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
        isDragging
          ? 'border-accent bg-accent/10 text-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_10%,transparent)]'
          : 'border-line/80 bg-canvas/30 text-muted/60 hover:border-accent/60 hover:bg-canvas/50 hover:text-ink'
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

      <span className="text-[11px] font-medium leading-tight text-center px-1 select-none transition-colors">
        {isDragging ? 'Drop here' : 'Drop or browse'}
      </span>
    </div>
  );
};

export default FileUpload;
