'use client';

import { useState, useRef } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';

interface FileUploaderProps {
  accept: string;
  label: string;
  onUpload: (file: File, base64: string) => void;
}

export default function FileUploader({ accept, label, onUpload }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Check file size (limit to 15MB to stay within Gemini's 20MB inline data limit)
    if (selectedFile.size > 15 * 1024 * 1024) {
      alert('File is too large. Please upload a file smaller than 15MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onUpload(selectedFile, e.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div 
      className={`relative w-full h-32 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer
        ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      
      {file ? (
        <div className="flex items-center gap-3 text-zinc-300">
          <FileIcon className="w-6 h-6 text-emerald-500" />
          <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      ) : (
        <>
          <Upload className={`w-6 h-6 ${dragActive ? 'text-emerald-500' : 'text-zinc-500'}`} />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">{label}</p>
            <p className="text-xs text-zinc-500 mt-1">Drag & drop or click to select</p>
          </div>
        </>
      )}
    </div>
  );
}
