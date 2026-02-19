"use client";
import Link from "next/link";
import { Music2, Github } from "lucide-react";

export function Navbar() {
    return (
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
            <div className="glass-panel px-6 md:px-10 h-16 md:h-20 rounded-[2rem] flex items-center justify-between border-white/5 bg-black/20">
                <Link href="/" className="flex items-center gap-3 group relative transition-transform hover:scale-105">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="Rhythmix Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                        />
                    </div>
                    <span className="font-black text-xl md:text-2xl tracking-tighter text-white uppercase italic">
                        Rhyth<span className="text-primary">mix</span>
                    </span>
                </Link>

                <div className="flex items-center gap-4 md:gap-10">
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/remix" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors relative group">
                            Remix
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                        </Link>
                        <Link href="/generate" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors relative group">
                            Generate
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                        </Link>
                    </div>

                    <button className="px-5 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">
                        Launch App
                    </button>
                </div>
            </div>
        </nav>
    );
}

