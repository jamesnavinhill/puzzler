import React from 'react';

interface FileUploadProps {
  onImageSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
      // Reset input value to allow re-selecting the same file if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto h-64 border-4 border-dashed rounded-xl border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* 
        THE FIX: 
        The input covers the entire parent div absolutely. 
        Opacity 0 makes it invisible but it captures all clicks directly.
        No JS click handlers required.
      */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
        title="Click to upload an image"
      />
      
      {/* Visual content centered underneath the invisible input */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="mb-4 p-4 rounded-full bg-[hsla(var(--accent-hue),var(--accent-sat),var(--accent-light),0.1)] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>

        <h3 className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-200">
            Upload Your Photo
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
            Click here or drag an image
        </p>

        <div className="px-6 py-2 rounded-full font-semibold text-white bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] shadow-lg">
            Select Image
        </div>
      </div>
    </div>
  );
};

export default FileUpload;