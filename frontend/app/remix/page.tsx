"use client";

import { Navbar } from "@/components/Navbar";
import { FileUpload } from "@/components/FileUpload";
import { MoodSelector } from "@/components/MoodSelector";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useState, useEffect } from "react";
import { Sliders, Music, Shuffle, Sparkles, Sun, Waves, Zap, Palette, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RemixPage() {
    // Mode toggle: 'single' (stem separation) or 'blend' (mix two tracks)
    const [mode, setMode] = useState<'single' | 'blend'>('single');

    // Single File State
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stemsData, setStemsData] = useState<any>(null);
    const [volumes, setVolumes] = useState({ vocals: 1, drums: 1, bass: 1, other: 1 });

    // Blend Mode State
    const [blendFile1, setBlendFile1] = useState<File | null>(null);
    const [blendFile2, setBlendFile2] = useState<File | null>(null);
    const [blendRatio, setBlendRatio] = useState(0.5);
    const [smartRemix, setSmartRemix] = useState(true);

    // Shared State
    const [mood, setMood] = useState("Happy");
    const [genre, setGenre] = useState("Pop");
    const [isExporting, setIsExporting] = useState(false);
    const [finalMixUrl, setFinalMixUrl] = useState<string | null>(null);
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

    const [fastMode, setFastMode] = useState(false);
    const [turboMode, setTurboMode] = useState(true); // User wants speed, so Turbo is default now
    const [processingStep, setProcessingStep] = useState<string>("");

    const pollTaskStatus = async (taskId: string, onComplete: (result: any) => void) => {
        let attempts = 0;
        const checkStatus = async () => {
            attempts++;
            try {
                const response = await fetch(`${BACKEND_URL}/api/task-status/${taskId}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    onComplete(data.result || data);
                    return true;
                } else if (data.status === 'error') {
                    alert("Processing failed: " + data.message);
                    setIsProcessing(false);
                    setIsExporting(false);
                    return true;
                }

                // Update processing step based on time
                if (attempts < 3) setProcessingStep("Turbo Extracting first 15s...");
                else if (attempts < 8) setProcessingStep("Loading Turbo AI Model...");
                else if (attempts < 15) setProcessingStep("Splitting Turbo Stems...");
                else setProcessingStep("Finishing Turbo Preview...");

                return false;
            } catch (error) {
                console.error("Polling error:", error);
                return false;
            }
        };

        const interval = setInterval(async () => {
            const isDone = await checkStatus();
            if (isDone) clearInterval(interval);
        }, 1500); // Poll faster for Turbo
    };

    const handleSingleFileUpload = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsProcessing(true);
        setFinalMixUrl(null);
        setProcessingStep("Starting Turbo Remix...");

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            // Include turbo_mode in request
            const response = await fetch(`${BACKEND_URL}/api/remix?fast_mode=${fastMode}&turbo_mode=${turboMode}`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();

            if (data.task_id) {
                pollTaskStatus(data.task_id, (result) => {
                    if (result.status === "success") {
                        setStemsData(result);
                        // If it was turbo, we could start the full process here in background
                        // but let's keep it simple for now as requested
                    } else {
                        alert("Separation failed: " + (result.message || "Unknown error"));
                    }
                    setIsProcessing(false);
                });
            } else {
                alert("Failed to start processing.");
                setIsProcessing(false);
            }
        } catch (error) {
            console.error("Error:", error);
            alert(`Error connecting to backend.`);
            setIsProcessing(false);
        }
    };

    const handleExportMix = async () => {
        setIsExporting(true);
        try {
            if (mode === 'single') {
                const response = await fetch(`${BACKEND_URL}/api/mix`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        stems_dir: stemsData.stems_dir,
                        volumes: volumes,
                        mood: mood,
                        genre: genre
                    }),
                });
                const data = await response.json();
                if (data.status === "success") {
                    setFinalMixUrl(`${BACKEND_URL}/api/download/${data.file}`);
                } else {
                    alert("Mixing failed: " + data.message);
                }
                setIsExporting(false);
            } else {
                if (!blendFile1 || !blendFile2) {
                    setIsExporting(false);
                    return;
                }

                if (smartRemix) {
                    const formData = new FormData();
                    formData.append("file1", blendFile1);
                    formData.append("file2", blendFile2);
                    formData.append("mood", mood);
                    formData.append("genre", genre);

                    // Include turbo_mode for fast smart blends
                    const response = await fetch(`${BACKEND_URL}/api/smart-mix?fast_mode=${fastMode}&turbo_mode=${turboMode}`, {
                        method: "POST",
                        body: formData,
                    });
                    const data = await response.json();

                    if (data.task_id) {
                        pollTaskStatus(data.task_id, (result) => {
                            if (result.status === "success" || result.file) {
                                setFinalMixUrl(`${BACKEND_URL}/api/download/${result.file}`);
                            } else {
                                alert("Smart mix failed: " + (result.message || "Unknown error"));
                            }
                            setIsExporting(false);
                        });
                    } else {
                        alert("Failed to start smart remix.");
                        setIsExporting(false);
                    }
                } else {
                    const formData = new FormData();
                    formData.append("file1", blendFile1);
                    formData.append("file2", blendFile2);
                    formData.append("blend_ratio", blendRatio.toString());
                    formData.append("mood", mood);
                    formData.append("genre", genre);

                    const response = await fetch(`${BACKEND_URL}/api/mix-two-files`, {
                        method: "POST",
                        body: formData,
                    });
                    const data = await response.json();
                    if (data.status === "success") {
                        setFinalMixUrl(`${BACKEND_URL}/api/download/${data.file}`);
                    } else {
                        alert("Mixing failed: " + data.message);
                    }
                    setIsExporting(false);
                }
            }
        } catch (error) {
            console.error("Error:", error);
            alert(`Error connecting to backend.`);
            setIsExporting(false);
        }
    };

    return (
        <main className="min-h-screen pb-20 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="bg-blob" />
            <div className="bg-blob-2" />

            <Navbar />

            <div className="container mx-auto px-4 pt-24 max-w-5xl relative z-10">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" /> AI Powered
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 leading-tight">
                            Remix the vibe. <br />Shape the mood.
                        </h1>
                        <p className="text-primary font-bold italic text-xl mt-2">Your mood, your music.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10">
                                <button
                                    onClick={() => setTheme('space')}
                                    className={cn("p-2 rounded-xl transition-all", theme === 'space' ? "bg-primary text-white" : "text-gray-500 hover:text-white")}
                                    title="Space Mode"
                                >
                                    <Sparkles className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTheme('sunset')}
                                    className={cn("p-2 rounded-xl transition-all", theme === 'sunset' ? "bg-orange-500 text-white" : "text-gray-500 hover:text-white")}
                                    title="Sunset Mode"
                                >
                                    <Sun className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTheme('ocean')}
                                    className={cn("p-2 rounded-xl transition-all", theme === 'ocean' ? "bg-cyan-500 text-white" : "text-gray-500 hover:text-white")}
                                    title="Ocean Mode"
                                >
                                    <Waves className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTheme('cyberpunk')}
                                    className={cn("p-2 rounded-xl transition-all", theme === 'cyberpunk' ? "bg-rose-500 text-white" : "text-gray-500 hover:text-white")}
                                    title="Cyberpunk Mode"
                                >
                                    <Zap className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                                <button
                                    onClick={() => { setMode('single'); setFinalMixUrl(null); }}
                                    className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", mode === 'single' ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-gray-400 hover:text-white")}
                                >
                                    Remix
                                </button>
                                <button
                                    onClick={() => { setMode('blend'); setFinalMixUrl(null); }}
                                    className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", mode === 'blend' ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-gray-400 hover:text-white")}
                                >
                                    Blend
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
                                Server: {backendStatus}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid gap-8">
                    {/* Input Phase */}
                    {mode === 'single' ? (
                        !stemsData && (
                            <div className="glass-panel p-8 rounded-2xl space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Processing Mode</h3>
                                        <p className="text-xs text-gray-400">Turbo creates an instant 15s preview for remixing.</p>
                                    </div>
                                    <div className="flex bg-black/20 p-1 rounded-lg">
                                        <button
                                            onClick={() => { setTurboMode(true); setFastMode(false); }}
                                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", turboMode ? "bg-primary text-white" : "text-gray-500 hover:text-gray-300")}
                                        >
                                            TURBO (10s)
                                        </button>
                                        <button
                                            onClick={() => { setTurboMode(false); setFastMode(true); }}
                                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", (!turboMode && fastMode) ? "bg-primary text-white" : "text-gray-500 hover:text-gray-300")}
                                        >
                                            FAST (60s)
                                        </button>
                                        <button
                                            onClick={() => { setTurboMode(false); setFastMode(false); }}
                                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", (!turboMode && !fastMode) ? "bg-primary text-white" : "text-gray-500 hover:text-gray-300")}
                                        >
                                            FULL (6m)
                                        </button>
                                    </div>
                                </div>

                                <FileUpload onFileSelect={handleSingleFileUpload} />

                                {isProcessing && (
                                    <div className="mt-8 p-8 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl space-y-6 animate-in fade-in zoom-in duration-500">
                                        <div className="relative w-24 h-24 mx-auto">
                                            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <div className="absolute inset-4 border-4 border-secondary/20 border-b-transparent rounded-full animate-spin [animation-duration:3s]"></div>
                                            <Music className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black text-white tracking-tight">{processingStep}</h3>
                                            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                                {turboMode
                                                    ? "Turbo AI is extracting the core stems for instant remixing."
                                                    : fastMode
                                                        ? "Processing 1 minute of high-fidelity audio separation."
                                                        : "Deep AI separation for all 6 minutes. This takes some time on CPU."}
                                            </p>
                                            <div className="mt-6 max-w-xs mx-auto bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 p-0.5">
                                                <div className="h-full bg-primary rounded-full shimmer w-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        !finalMixUrl && (
                            <div className="glass-panel p-10 rounded-3xl space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Blending Mode</h3>
                                        <p className="text-xs text-gray-400">Combine the best parts of two tracks into one.</p>
                                    </div>
                                    <div className="flex bg-black/30 p-1 rounded-xl">
                                        <button
                                            onClick={() => { setTurboMode(true); setFastMode(false); }}
                                            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", turboMode ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}>
                                            TURBO (10s)
                                        </button>
                                        <button
                                            onClick={() => { setTurboMode(false); setFastMode(true); }}
                                            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", (!turboMode && fastMode) ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}>
                                            FAST (60s)
                                        </button>
                                        <button
                                            onClick={() => { setTurboMode(false); setFastMode(false); }}
                                            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", (!turboMode && !fastMode) ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}>
                                            FULL (6m)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 items-start">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary italic">1</div>
                                            Vocal / Primary Track
                                        </label>
                                        <FileUpload onFileSelect={setBlendFile1} />
                                        {blendFile1 && (
                                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                                <Music className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] text-gray-300 truncate font-mono">{blendFile1.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] text-secondary italic">2</div>
                                            Beat / Background Track
                                        </label>
                                        <FileUpload onFileSelect={setBlendFile2} />
                                        {blendFile2 && (
                                            <div className="flex items-center gap-2 p-2 bg-secondary/5 rounded-lg border border-secondary/10">
                                                <Music className="w-3 h-3 text-secondary" />
                                                <span className="text-[10px] text-gray-300 truncate font-mono">{blendFile2.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-bold text-white flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-primary" /> Smart Remix
                                            </p>
                                            <p className="text-xs text-gray-400">Deep AI separation to extract vocals from Track 1 and layer over Track 2.</p>
                                        </div>
                                        <button
                                            onClick={() => setSmartRemix(!smartRemix)}
                                            className={cn(
                                                "w-14 h-7 rounded-full relative transition-all duration-300",
                                                smartRemix ? "bg-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-md",
                                                smartRemix ? "right-1" : "left-1"
                                            )} />
                                        </button>
                                    </div>

                                    {!smartRemix && (
                                        <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-gray-400 uppercase">Input Balance</span>
                                                <span className="text-primary">{Math.round((1 - blendRatio) * 100)}% Vocal / {Math.round(blendRatio * 100)}% Beat</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.01" value={blendRatio}
                                                onChange={(e) => setBlendRatio(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    {/* Controls Phase */}
                    {((mode === 'single' && file) || (mode === 'blend' && blendFile1 && blendFile2)) && !finalMixUrl && (
                        <div className="glass-panel p-10 rounded-3xl animate-in fade-in slide-in-from-bottom-12 duration-700">
                            <div className="grid lg:grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                                            {mode === 'single'
                                                ? <><div className="p-2 rounded-lg bg-primary/20"><Sliders className="w-6 h-6 text-primary" /></div> Master Mixer</>
                                                : <><div className="p-2 rounded-lg bg-primary/20"><Shuffle className="w-6 h-6 text-primary" /></div> Blend Settings</>}
                                        </h2>
                                        <button
                                            onClick={() => { setStemsData(null); setFile(null); setBlendFile1(null); setBlendFile2(null); }}
                                            className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1 group"
                                        >
                                            <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" /> Start Over
                                        </button>
                                    </div>

                                    {mode === 'single' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {(['vocals', 'drums', 'bass', 'other'] as const).map((stem) => (
                                                <div key={stem} className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="capitalize text-gray-300 flex items-center gap-2">
                                                            {stem === 'vocals' && <Music className="w-3 h-3 text-primary" />}
                                                            {stem === 'drums' && <Zap className="w-3 h-3 text-orange-400" />}
                                                            {stem === 'bass' && <Sliders className="w-3 h-3 text-cyan-400" />}
                                                            {stem === 'other' && <Sparkles className="w-3 h-3 text-rose-400" />}
                                                            {stem}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-black/40 text-primary">{Math.round(volumes[stem] * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="1.5" step="0.01"
                                                        value={volumes[stem]}
                                                        onChange={(e) => setVolumes({ ...volumes, [stem]: parseFloat(e.target.value) })}
                                                        className="w-full"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-6 rounded-3xl bg-black/20 border border-white/5 space-y-2">
                                        <MoodSelector
                                            selectedMood={mood} onSelectMood={setMood}
                                            selectedGenre={genre} onSelectGenre={setGenre}
                                        />
                                    </div>

                                    {turboMode && stemsData && (
                                        <div className="p-6 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl border border-white/10 space-y-4 animate-in fade-in slide-in-from-left-4">
                                            <div className="flex justify-between items-center text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                        <Zap className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold tracking-tight">Turbo Preview Active</h4>
                                                        <p className="text-[10px] text-gray-400 font-medium font-mono">15s CLIP</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-black border border-primary/20 tracking-widest uppercase">Fast Mode</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Listening to a crystal-clear 15s instant preview. Once you're happy, hit "Process Entire Song" to render all 6 minutes.</p>
                                            <button
                                                onClick={() => { setTurboMode(false); setFastMode(false); handleSingleFileUpload(file!); }}
                                                className="w-full text-xs font-black py-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 uppercase tracking-widest hover:border-primary/50 text-white"
                                            >
                                                Process Entire 6m Song
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-between items-center bg-gradient-to-br from-primary/10 via-white/5 to-transparent p-12 rounded-[2.5rem] border border-white/10 shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-primary/30 transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-3xl rounded-full -ml-32 -mb-32" />

                                    <div className="relative z-10 flex flex-col items-center text-center gap-8 py-4">
                                        <div className="w-28 h-28 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_50px_rgba(139,92,246,0.25)] animate-pulse">
                                            <Music className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="font-black text-4xl text-white tracking-widest uppercase">Export</h3>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs">
                                                Finalizing with <span className="text-primary font-bold">{mood}</span> mood & <span className="text-secondary font-bold">{genre}</span> genre DNA.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-4 relative z-10 mt-12">
                                        <button
                                            onClick={handleExportMix}
                                            disabled={isExporting || (mode === 'blend' && (!blendFile1 || !blendFile2))}
                                            className="w-full bg-primary text-white py-6 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_60px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden border border-white/20"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                            <div className="relative flex items-center justify-center gap-3">
                                                {isExporting
                                                    ? <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> Mixing DNA...</>
                                                    : <><Download className="w-6 h-6" /> Export Master</>}
                                            </div>
                                        </button>

                                        {isProcessing && (
                                            <div className="flex items-center gap-2 justify-center py-2 animate-pulse">
                                                <div className="w-1 h-1 bg-primary rounded-full" />
                                                <div className="w-1 h-1 bg-primary rounded-full [animation-delay:0.2s]" />
                                                <div className="w-1 h-1 bg-primary rounded-full [animation-delay:0.4s]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Result Phase */}
                    {finalMixUrl && (
                        <div className="glass-panel p-12 rounded-[3rem] text-center space-y-8 animate-in zoom-in-95 duration-700 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />

                            <div className="relative">
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

                                <div className="mt-12 space-y-2 relative z-10">
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Remix Ready</h2>
                                    <p className="text-gray-400 font-bold tracking-widest text-[10px] uppercase">DNA: {mood} {genre}</p>
                                </div>
                            </div>

                            <div className="max-w-md mx-auto relative z-10 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                                <MusicPlayer src={finalMixUrl} title="AI Mastered Remix" autoPlay />
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <button
                                    onClick={() => { setFinalMixUrl(null); setStemsData(null); setFile(null); setBlendFile1(null); setBlendFile2(null); }}
                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all border border-white/10 hover:border-primary/50 text-xs"
                                >
                                    Start New Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

