import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-500 font-mono font-bold text-lg">V</span>
            </div>
            <h1 className="font-sans font-semibold text-zinc-100 tracking-tight">Veritas AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SYSTEM ONLINE
            </div>
            <button className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-zinc-100 tracking-tight mb-2">
            Deception Analysis Engine
          </h2>
          <p className="text-zinc-400 max-w-2xl">
            Upload audio, video, or chat screenshots to analyze stress levels, micro-expressions, and language patterns. For entertainment purposes only.
          </p>
        </div>
        
        <Dashboard />
      </div>
    </main>
  );
}
