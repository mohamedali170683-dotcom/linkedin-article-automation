'use client';

import Link from 'next/link';
import { Sun, Briefcase, ArrowRight, Sparkles, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Mohamed Ali Mohamed</h1>
          <p className="text-slate-400">VP Marketing / CMO / Head of Marketing &mdash; DACH</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Catchlight */}
          <Link
            href="/guided"
            className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Catchlight</h2>
                <p className="text-xs text-slate-400">Newsletter Engine</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              AI visibility meets attention science. Create weekly Lights for your newsletter subscribers.
            </p>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:gap-3 transition-all">
              Open Editor <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Career Command Center */}
          <Link
            href="/career"
            className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Career Command Center</h2>
                <p className="text-xs text-slate-400">VP Marketing / CMO Agent</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              AI-powered job scanner, content engine, and application tracker for your DACH career campaign.
            </p>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:gap-3 transition-all">
              Open Center <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600">
          Built with Next.js, Claude API, Kit, and ElevenLabs
        </div>
      </div>
    </div>
  );
}
