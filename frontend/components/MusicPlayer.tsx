"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, SkipBack, SkipForward, Download, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPlayerProps {
    src?: string;
    title?: string;
    autoPlay?: boolean;
}

export function MusicPlayer({ src, title = "Generated Track", autoPlay = false }: MusicPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (src && autoPlay && audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Playback was interrupted or failed:", error);
                    setIsPlaying(false);
                });
            }
        }
    }, [src, autoPlay]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            setProgress((current / duration) * 100);
        }
    };

    return (
        <div className="bg-black/60 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5" />

            <div className="flex items-center gap-4 relative z-10 mb-6">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/20 group-hover:scale-105 transition-transform duration-500">
                    <Music className="w-7 h-7" />
                </div>
                <div className="flex-1 text-left">
                    <h4 className="text-lg font-black text-white tracking-tight leading-none mb-1 uppercase italic">{title}</h4>
                    <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">AI Mastered</span>
                </div>
                {src && (
                    <a
                        href={src}
                        download
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-gray-400 hover:text-white"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                )}
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-center gap-8 py-2">
                    <button className="text-gray-500 hover:text-white transition-colors active:scale-90">
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white text-black hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 group/play"
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                    </button>
                    <button className="text-gray-500 hover:text-white transition-colors active:scale-90">
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <div
                            className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)] relative overflow-hidden"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 shimmer opacity-30" />
                        </div>
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest">
                        <span>Live Preview</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src || undefined}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
        </div>
    );
}

