"use client";

import { Navbar } from "@/components/Navbar";
import { MoodSelector } from "@/components/MoodSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useState, useEffect } from "react";
import { Wand2, Sparkles, Music, Zap, Palette, Sun, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GeneratePage() {
    const [mood, setMood] = useState("");
    const [genre, setGenre] = useState("");
    const [language, setLanguage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTrack, setGeneratedTrack] = useState<string | null>(null);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [theme, setTheme] = useState<'space' | 'sunset' | 'ocean' | 'cyberpunk'>('space');

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    const checkBackendStatus = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/health`);
            const data = await res.json();
            if (data.status === 'online') {
                setBackendStatus('connected');
            } else {
                setBackendStatus('disconnected');
            }
        } catch (e) {
            setBackendStatus('disconnected');
        }
    };

    useEffect(() => {
        checkBackendStatus();
    }, []);

    const pollTaskStatus = async (taskId: string, onComplete: (result: any) => void) => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/task-status/${taskId}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    onComplete(data);
                    return true;
                } else if (data.status === 'error') {
                    alert("Generation failed: " + data.message);
                    setIsGenerating(false);
                    return true;
                }
                return false;
            } catch (error) {
                console.error("Polling error:", error);
                return false;
            }
        };

        const interval = setInterval(async () => {
            const isDone = await checkStatus();
            if (isDone) clearInterval(interval);
        }, 2000);
    };

    const handleGenerate = async () => {
        if (!mood || !genre || !language) return;

        setIsGenerating(true);
        setGeneratedTrack(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/generate?mood=${encodeURIComponent(mood)}&genre=${encodeURIComponent(genre)}&language=${encodeURIComponent(language)}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.task_id) {
                pollTaskStatus(data.task_id, (result) => {
                    if (result.file) {
                        setGeneratedTrack(`${BACKEND_URL}/api/download/${result.file}`);
                    } else {
                        alert("Generation failed: No file returned");
                    }
                    setIsGenerating(false);
                });
            } else {
                alert("Failed to start generation: " + (data.message || "No task ID received"));
                setIsGenerating(false);
            }
        } catch (error) {
            console.error('Error generating music:', error);
            alert(`Error connecting to backend (${BACKEND_URL}).`);
            setIsGenerating(false);
        }
    };

    const canGenerate = mood && genre && language;

    return (
        <main className="min-h-screen text-white relative transition-all duration-1000">
            <div className="bg-blob" />
            <div className="bg-blob bg-blob-2" />

            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20 max-w-6xl">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" /> AI Composer
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 leading-tight">
                            Remix the vibe. <br />Shape the mood.
                        </h1>
                        <p className="text-primary font-bold italic text-xl mt-2">Your mood, your music.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10">
                                <button onClick={() => setTheme('space')} className={cn("p-2 rounded-xl transition-all", theme === 'space' ? "bg-primary text-white" : "text-gray-500 hover:text-white")}>
                                    <Sparkles className="w-5 h-5" />
                                </button>
                                <button onClick={() => setTheme('sunset')} className={cn("p-2 rounded-xl transition-all", theme === 'sunset' ? "bg-orange-500 text-white" : "text-gray-500 hover:text-white")}>
                                    <Sun className="w-5 h-5" />
                                </button>
                                <button onClick={() => setTheme('ocean')} className={cn("p-2 rounded-xl transition-all", theme === 'ocean' ? "bg-cyan-500 text-white" : "text-gray-500 hover:text-white")}>
                                    <Waves className="w-5 h-5" />
                                </button>
                                <button onClick={() => setTheme('cyberpunk')} className={cn("p-2 rounded-xl transition-all", theme === 'cyberpunk' ? "bg-rose-500 text-white" : "text-gray-500 hover:text-white")}>
                                    <Palette className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 w-fit ml-auto">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                backendStatus === 'connected' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                                    backendStatus === 'disconnected' ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                            )} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                AI Core: {backendStatus}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
                    <div className="space-y-8">
                        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] space-y-12">
                            <MoodSelector
                                selectedMood={mood} onSelectMood={setMood}
                                selectedGenre={genre} onSelectGenre={setGenre}
                            />

                            <div className="h-px bg-white/5" />

                            <LanguageSelector
                                selectedLanguage={language} onSelectLanguage={setLanguage}
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate || isGenerating}
                            className={cn(
                                "w-full py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden group border border-white/20",
                                canGenerate && !isGenerating
                                    ? "bg-primary text-white shadow-[0_20px_60px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                                    : "bg-white/5 text-gray-500 cursor-not-allowed border-white/5"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            {isGenerating ? (
                                <div className="relative flex items-center gap-3">
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    Synthesizing AI Audio...
                                </div>
                            ) : (
                                <div className="relative flex items-center gap-3">
                                    <Wand2 className="w-6 h-6" />
                                    Generate Original Master
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="glass-panel p-10 rounded-[2.5rem] min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/30 transition-colors" />

                        {generatedTrack ? (
                            <div className="w-full space-y-10 animate-in zoom-in-95 duration-700 relative z-10">
                                <div className="w-48 h-48 mx-auto relative cursor-pointer group/vinyl translate-y-4 hover:translate-y-0 transition-transform duration-700">
                                    {/* Vinyl Disk Background */}
                                    <div className="absolute inset-0 bg-black rounded-full shadow-2xl animate-[spin_8s_infinite_linear] border-4 border-white/10 overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,255,255,0.05)_40%,transparent_50%,rgba(255,255,255,0.05)_60%,transparent_70%)]" />
                                    </div>
                                    {/* Disc Sleeve / Center */}
                                    <div className="absolute inset-10 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center p-1 border-4 border-black group-hover/vinyl:scale-110 transition-transform duration-500 shadow-inner">
                                        <div className="w-full h-full bg-black/20 rounded-full flex items-center justify-center">
                                            <Music className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-white tracking-widest uppercase italic">Mastered</h2>
                                    <p className="text-gray-400 font-bold tracking-[0.2em] text-[10px] uppercase">{mood} • {genre} • {language}</p>
                                </div>

                                <div className="max-w-md mx-auto relative z-10 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                                    <MusicPlayer src={generatedTrack} title="AI Mastered Generation" autoPlay />
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-xs space-y-10 relative z-10">
                                <div className="relative">
                                    <div className="w-32 h-32 mx-auto bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 border border-white/5 relative z-10">
                                        <Zap className="w-14 h-14" />
                                    </div>
                                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-20 animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Ready to Create?</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">
                                        Select your vibe and target language to synthesize a unique high-fidelity soundscape.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 justify-center py-4">
                                    <div className="w-2 h-2 rounded-full bg-white/5" />
                                    <div className="w-2 h-2 rounded-full bg-white/10" />
                                    <div className="w-2 h-2 rounded-full bg-white/5" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

