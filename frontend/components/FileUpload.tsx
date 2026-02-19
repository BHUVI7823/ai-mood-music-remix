"use client";

import { UploadCloud, Music as MusicIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FileUpload({ onFileSelect }: { onFileSelect: (file: File) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [hasFile, setHasFile] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
            setHasFile(true);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
            setHasFile(true);
        }
    };

    return (
        <div
            className={cn(
                "relative group overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 p-10 text-center",
                isDragging
                    ? "border-primary bg-primary/10 scale-[1.02] shadow-[0_0_40px_rgba(139,92,246,0.1)]"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <input
                type="file"
                accept="audio/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileInput}
            />

            <div className="flex flex-col items-center gap-4 relative z-0">
                <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isDragging ? "bg-primary text-white rotate-12 scale-110" : "bg-white/5 text-primary group-hover:rotate-6 group-hover:scale-110"
                )}>
                    {hasFile ? <MusicIcon className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />}
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                        {hasFile ? "File Selected!" : "Drop your song here"}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium">
                        {hasFile ? "Click to change file" : "or click to browse library"}
                    </p>
                </div>

                <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-500 border border-white/5 uppercase tracking-widest">MP3</span>
                    <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-500 border border-white/5 uppercase tracking-widest">WAV</span>
                    <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-500 border border-white/5 uppercase tracking-widest">FLAC</span>
                </div>
            </div>
        </div>
    );
}

