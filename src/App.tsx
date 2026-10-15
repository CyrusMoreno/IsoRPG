import React, { useState } from 'react';
import { CharacterClass } from './types/engine';
import { IsometricViewport } from './components/IsometricViewport';
import { ScriptSuiteViewer } from './components/ScriptSuiteViewer';
import { AssetStudio } from './components/AssetStudio';
import { CoordinateSandbox } from './components/CoordinateSandbox';
import { TutorialGuide } from './components/TutorialGuide';
import { soundManager } from './engine/audioSynthesizer';
import {
  Gamepad2,
  FileCode,
  Image,
  Calculator,
  BookOpen,
  Volume2,
  VolumeX,
  Flame,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'scripts' | 'assets' | 'math' | 'guide'>('simulator');
  const [heroClass, setHeroClass] = useState<CharacterClass>('barbarian');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const toggleSound = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    soundManager.setMuted(next);
    if (!next) {
      soundManager.startAmbient();
    }
  };

  return (
    <div className="min-h-screen bg-[#080706] text-[#e0d6c8] flex flex-col font-sans selection:bg-amber-800 selection:text-amber-100">
      {/* Top Gothic Header */}
      <header className="relative border-b-2 border-stone-800 bg-gradient-to-b from-[#14100c] via-[#0f0c09] to-[#0a0806] px-4 py-4 sm:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-900 to-stone-900 border-2 border-amber-600/80 shadow-[0_0_20px_rgba(217,119,6,0.3)] flex items-center justify-center shrink-0">
              <Flame className="w-7 h-7 text-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-amber-200 tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  Diablo II 2.5D Isometric Engine
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-700/60 rounded uppercase font-bold">
                  RGSS3 Suite
                </span>
              </div>
              <p className="text-xs text-stone-400 font-cinzel tracking-wide mt-0.5">
                Authentic Dimetric 2:1 Projection &amp; Complete Ruby Scripts for RPG Maker VX Ace
              </p>
            </div>
          </div>

          {/* Quick Badges & Sound Controller */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" /> 64x32 Dimetric
              </span>
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-400" /> 8-Dir Movement
              </span>
            </div>

            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded border text-xs font-mono flex items-center gap-1.5 transition-all ${
                !isAudioMuted
                  ? 'bg-amber-950/70 border-amber-600/80 text-amber-300 shadow-[0_0_10px_rgba(217,119,6,0.2)]'
                  : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
              }`}
            >
              {!isAudioMuted ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{!isAudioMuted ? 'Gothic Audio ON' : 'Audio Muted'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto text-xs font-cinzel">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-t font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'simulator'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-500 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            2.5D Tech Simulator
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 rounded-t font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'scripts'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-500 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            RGSS3 Ruby Scripts (6)
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-t font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'assets'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-500 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Image className="w-4 h-4 text-amber-400" />
            Diablo Asset Studio
          </button>

          <button
            onClick={() => setActiveTab('math')}
            className={`px-4 py-2 rounded-t font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'math'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-500 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            Projection Math Matrix
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-t font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'guide'
                ? 'bg-stone-900 text-amber-300 border-t-2 border-amber-500 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            VX Ace Setup Guide
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  Interactive simulation running the exact dimetric 2.5D math implemented in the RGSS3 Ruby scripts.
                </span>
              </div>
              <div className="flex items-center gap-3 text-stone-400 font-mono text-[11px]">
                <span>• 8-Way Diagonals</span>
                <span>• Torch Flicker Light</span>
                <span>• Wall Occlusion Alpha Fade</span>
              </div>
            </div>

            <IsometricViewport
              heroClass={heroClass}
              onClassChange={setHeroClass}
            />
          </div>
        )}

        {activeTab === 'scripts' && <ScriptSuiteViewer />}

        {activeTab === 'assets' && <AssetStudio />}

        {activeTab === 'math' && <CoordinateSandbox />}

        {activeTab === 'guide' && <TutorialGuide />}
      </main>

      {/* Gothic Footer */}
      <footer className="border-t border-stone-800 bg-[#0c0a09] py-4 px-6 text-center text-xs font-cinzel text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Diablo II 2.5D Isometric Suite for RPG Maker VX Ace (RGSS3)</span>
          <span className="text-stone-600 font-mono text-[11px]">Dimetric 2:1 Matrix • 64x32 Diamond Grid</span>
        </div>
      </footer>
    </div>
  );
}
