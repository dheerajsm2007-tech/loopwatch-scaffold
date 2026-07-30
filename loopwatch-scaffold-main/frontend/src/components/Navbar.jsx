import React from 'react';
import { Activity, ShieldAlert, Cpu, Layers, BarChart3, Users, Zap, Terminal } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Cpu },
    { id: 'how-it-works', label: 'How It Works', icon: Layers },
    { id: 'demo', label: 'Live Trace Demo', icon: Activity, badge: 'LIVE' },
    { id: 'why-not-timeout', label: 'Why Not Timeout?', icon: ShieldAlert },
    { id: 'eval', label: 'Results & Eval', icon: BarChart3 },
    { id: 'about', label: 'About & Team', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090b0e]/90 backdrop-blur-md border-b border-[#21293a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff]/20 to-[#14b8a6]/10 border border-[#00f0ff]/40 flex items-center justify-center group-hover:border-[#00f0ff] transition-all">
              <Activity className="w-5 h-5 text-[#00f0ff] group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg tracking-tight text-white group-hover:text-[#00f0ff] transition-colors">
                  LOOPWATCH
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#8b9bb4] font-mono hidden sm:block">
                In-Process Agent Guardrail
              </p>
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50 ${
                    isActive
                      ? 'bg-[#141a26] text-white border border-[#313d54] shadow-sm'
                      : 'text-[#8b9bb4] hover:text-white hover:bg-[#141a26]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00f0ff]' : 'text-[#8b9bb4]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#00f0ff]/20 text-[#00f0ff] animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Badge & Primary CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/30">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span className="text-xs font-mono text-[#10b981]">GUARD ACTIVE</span>
            </div>

            <button
              onClick={() => setActiveTab('demo')}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#00f0ff] to-[#06b6d4] text-[#090b0e] hover:brightness-110 shadow-lg shadow-[#00f0ff]/20 transition-all focus:ring-2 focus:ring-[#00f0ff]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Launch Demo</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-between border-t border-[#21293a] py-2 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-mono rounded-md ${
                  isActive ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-bold' : 'text-[#8b9bb4]'
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
