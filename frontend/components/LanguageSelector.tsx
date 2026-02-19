"use client";

import { cn } from "@/lib/utils";
import { Check, Languages } from "lucide-react";

const LANGUAGES = [
    "Tamil", "English", "Malayalam", "Telugu", "Kannada", "Hindi"
];

interface LanguageSelectorProps {
    selectedLanguage: string;
    onSelectLanguage: (lang: string) => void;
}

export function LanguageSelector({ selectedLanguage, onSelectLanguage }: LanguageSelectorProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-rose-500 rounded-full" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Target Language Style</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang}
                        onClick={() => onSelectLanguage(lang)}
                        className={cn(
                            "flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 border relative group overflow-hidden",
                            selectedLanguage === lang
                                ? "bg-primary text-white border-primary shadow-[0_10px_20px_rgba(139,92,246,0.2)]"
                                : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Languages className={cn("w-3.5 h-3.5 transition-colors", selectedLanguage === lang ? "text-white" : "text-gray-500 group-hover:text-primary")} />
                            <span>{lang}</span>
                        </div>
                        {selectedLanguage === lang && (
                            <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center animate-in zoom-in duration-300">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

