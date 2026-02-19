"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Zap, Heart, Cloud, Moon, Ghost, Film, Flame } from "lucide-react";

const MOODS = [
    { name: "Happy", icon: <Sparkles className="w-3 h-3" /> },
    { name: "Sad", icon: <Cloud className="w-3 h-3" /> },
    { name: "Energetic", icon: <Flame className="w-3 h-3" /> },
    { name: "Relaxed", icon: <Heart className="w-3 h-3" /> },
    { name: "Chill", icon: <Moon className="w-3 h-3" /> },
    { name: "Dark", icon: <Ghost className="w-3 h-3" /> },
    { name: "Cinematic", icon: <Film className="w-3 h-3" /> },
    { name: "Epic", icon: <Zap className="w-3 h-3" /> }
];

const GENRES = [
    "Pop", "Rock", "Hip Hop", "Jazz", "Classical", "Electronic",
    "Lo-fi", "Ambient", "Folk", "Reggae"
];

interface MoodSelectorProps {
    selectedMood: string;
    onSelectMood: (mood: string) => void;
    selectedGenre: string;
    onSelectGenre: (genre: string) => void;
}

export function MoodSelector({
    selectedMood,
    onSelectMood,
    selectedGenre,
    onSelectGenre
}: MoodSelectorProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Mood</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.name}
                            onClick={() => onSelectMood(mood.name)}
                            className={cn(
                                "group px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 border",
                                selectedMood === mood.name
                                    ? "bg-primary text-white border-primary shadow-[0_10px_20px_rgba(139,92,246,0.3)] scale-105"
                                    : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5"
                            )}
                        >
                            {mood.icon}
                            {mood.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-secondary rounded-full" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Genre</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                        <button
                            key={genre}
                            onClick={() => onSelectGenre(genre)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center justify-center",
                                selectedGenre === genre
                                    ? "bg-secondary text-white border-secondary shadow-[0_10px_20px_rgba(34,211,238,0.2)] scale-105"
                                    : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5"
                            )}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

