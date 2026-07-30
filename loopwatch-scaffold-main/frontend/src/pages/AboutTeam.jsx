import React from 'react';
import { Users, Award, Shield, Terminal, CheckCircle2, Clock, Github, ExternalLink } from 'lucide-react';
import { teamMembers, hackathonContext, projectMilestones } from '../data/teamData';

export default function AboutTeam() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 font-mono text-xs text-[#00f0ff]">
          <Award className="w-4 h-4" />
          <span>{hackathonContext.event} — {hackathonContext.organizer}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
          About Loopwatch & The Team
        </h1>
        <p className="text-base text-[#8b9bb4] leading-relaxed">
          {hackathonContext.tagline} Built for {hackathonContext.track}.
        </p>
      </div>

      {/* Hackathon Context Card */}
      <div className="p-8 rounded-2xl bg-[#0e121a] border border-[#21293a] grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        
        <div className="space-y-1 border-r border-[#21293a] pr-4">
          <div className="text-[#8b9bb4] uppercase text-[10px]">Hackathon Event</div>
          <div className="text-lg font-bold text-white">{hackathonContext.event}</div>
          <div className="text-[#00f0ff]">{hackathonContext.organizer}</div>
        </div>

        <div className="space-y-1 border-r border-[#21293a] pr-4">
          <div className="text-[#8b9bb4] uppercase text-[10px]">Competition Track</div>
          <div className="text-lg font-bold text-white">Track 05</div>
          <div className="text-[#10b981]">AI Safety & Observability</div>
        </div>

        <div className="space-y-1">
          <div className="text-[#8b9bb4] uppercase text-[10px]">Project Scope</div>
          <div className="text-lg font-bold text-white">In-Process Guard</div>
          <div className="text-[#ff9900]">Zero Extra LLM Overhead</div>
        </div>

      </div>

      {/* Team Roster Grid */}
      <section className="space-y-8">
        <h2 className="text-2xl font-mono font-bold text-white text-center">
          Core Engineering Team
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-[#0e121a] border border-[#21293a] space-y-4 hover:border-[#00f0ff]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center font-mono text-lg font-bold text-[#00f0ff]">
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-mono font-bold text-lg text-white">{member.name}</h3>
                  <div className="text-xs font-mono text-[#00f0ff] mt-0.5">{member.role}</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#21293a] pt-4 font-mono text-xs text-[#8b9bb4]">
                <div className="text-[10px] uppercase text-white font-semibold">Core Responsibilities:</div>
                <ul className="space-y-1.5 text-[11px]">
                  {member.responsibilities.map((resp, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hackathon Timeline Milestones */}
      <section className="p-8 rounded-2xl bg-[#0e121a] border border-[#21293a] space-y-6 font-mono text-xs">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider border-b border-[#21293a] pb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#00f0ff]" />
          <span>Project Checkpoints & Execution Roadmap</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {projectMilestones.map((m, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#090b0e] border border-[#21293a] space-y-2">
              <div className="text-[#00f0ff] font-bold text-sm">{m.hour}</div>
              <div className="text-white font-semibold text-xs">{m.title}</div>
              <div className="text-[11px] text-[#8b9bb4] font-sans leading-relaxed">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
