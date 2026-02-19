import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowRight, Music, Mic2, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl text-secondary" />
        </div>

        <div className="container mx-auto text-center relative z-10 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-3 h-3" /> Powered by Rhythmix AI
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 leading-[1.1]">
            Remix the vibe.<br />
            <span className="text-primary italic">Shape the mood.</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-3xl mx-auto font-bold italic animate-in fade-in duration-1000 delay-300">
            Your mood, your music.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/remix"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
            >
              <Music className="w-5 h-5 group-hover:animate-bounce" />
              Start Remixing
            </Link>
            <Link
              href="/generate"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-semibold transition-all hover:bg-white/10 hover:border-white/20"
            >
              <Mic2 className="w-5 h-5" />
              Generate Music
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 border-t border-white/5 bg-white/[0.02]">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 max-w-5xl">
          <div className="glass-panel p-8 rounded-2xl">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-6">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI Stem Separation</h3>
            <p className="text-gray-400 mb-6">
              Split any song into vocals, drums, bass, and other instruments automatically using advanced AI models.
            </p>
            <Link href="/remix" className="text-primary flex items-center gap-1 hover:gap-2 transition-all">
              Try Remix <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="glass-panel p-8 rounded-2xl">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center text-accent mb-6">
              <Mic2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Mood & Language Generation</h3>
            <p className="text-gray-400 mb-6">
              Generate unique tracks in Tamil, English, Hindi, and more based on your desired mood and genre.
            </p>
            <Link href="/generate" className="text-accent flex items-center gap-1 hover:gap-2 transition-all">
              Try Generator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
