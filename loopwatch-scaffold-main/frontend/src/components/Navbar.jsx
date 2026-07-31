import React from 'react';
import { Activity, ShieldAlert, Cpu, Layers, BarChart3, Users, Zap, CheckCircle2, FolderPlus, Sun, Moon } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, presets = [], onSelectPreset }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Cpu },
    { id: 'how-it-works', label: 'How It Works', icon: Layers },
    { id: 'demo', label: 'LoopGuard IDE', icon: Activity, badge: 'LIVE' },
    { id: 'why-not-timeout', label: 'Why Not Timeout?', icon: ShieldAlert },
    { id: 'eval', label: 'Results & Eval', icon: BarChart3 },
    { id: 'about', label: 'About & Team', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#000000]/95 backdrop-blur-md border-b border-[#21262d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Brand Logo & LoopGuard IDE Pill */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[#3fb950] group-hover:border-[#3fb950] transition-all">
              <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base tracking-tight text-white group-hover:text-[#58a6ff] transition-colors">
                LoopGuard IDE
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all focus:outline-none ${
                    isActive
                      ? 'bg-[#161b22] text-white border border-[#30363d] font-bold shadow-sm'
                      : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#1f6feb]/20 text-[#58a6ff] animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {activeTab === 'demo' && (
              <>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value && onSelectPreset) {
                      onSelectPreset(e.target.value);
                    }
                  }}
                  className="bg-[#0d1117] text-white text-xs px-2 py-1 rounded border border-[#30363d] focus:outline-none focus:border-[#58a6ff] cursor-pointer hidden sm:block max-w-[210px] truncate"
                >
                  <option value="" disabled>— corpus preset —</option>
                  {presets.map((p) => (
                    <option key={p.task_id} value={p.prompt}>
                      {p.category === 'pathological' ? '🔴' : '🟢'} {p.task_id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161b22] text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>New Project</span>
                </button>
              </>
            )}

            <button
              className="p-1.5 rounded text-[#8b949e] hover:text-white transition-colors"
              title="Dark Mode Only"
            >
              <Sun className="w-4 h-4" />
            </button>

            {activeTab !== 'demo' && (
              <button
                onClick={() => setActiveTab('demo')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold bg-[#1f6feb] text-white hover:bg-[#388bfd] shadow-lg shadow-[#1f6feb]/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Launch IDE</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-between border-t border-[#21262d] py-2 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-mono rounded-md ${
                  isActive ? 'bg-[#1f6feb]/20 text-[#58a6ff] font-bold' : 'text-[#8b949e]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
