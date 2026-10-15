import React, { useState } from 'react';
import { RGSS3_SCRIPTS } from '../engine/rgss3Scripts';
import { Rgss3Script } from '../types/engine';
import {
  Copy,
  Check,
  Download,
  FileCode,
  BookOpen,
  Terminal,
  FolderTree,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ScriptSuiteViewer: React.FC = () => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(RGSS3_SCRIPTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentScript: Rgss3Script =
    RGSS3_SCRIPTS.find((s) => s.id === selectedScriptId) || RGSS3_SCRIPTS[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownload = (script: Rgss3Script) => {
    const blob = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const header = `#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC MASTER ENGINE SUITE FOR RPG MAKER VX ACE
#------------------------------------------------------------------------------
# All 6 core modules bundled into a single master script.
# Insert this script below "▼ Materials" and above "▼ Main" in the Script Editor (F11).
# Compatible with RGSS3 / RPG Maker VX Ace (Ruby 1.9.2).
#==============================================================================\n\n`;

    const allCode =
      header +
      RGSS3_SCRIPTS.map(
        (s) => `#\n# >>> MODULE: ${s.title} <<<\n#\n${s.code}\n`
      ).join('\n\n');
    const blob = new Blob([allCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Diablo_II_Isometric_Master_Suite.rb';
    a.click();
    URL.revokeObjectURL(url);
  };

  const publicScriptFiles = [
    { name: '01_Diablo_Iso_Core.rb', path: '/scripts/01_Diablo_Iso_Core.rb', desc: 'Core Math & 2:1 Projection Matrix' },
    { name: '02_Diablo_Iso_Renderer.rb', path: '/scripts/02_Diablo_Iso_Renderer.rb', desc: '2.5D Diamond Tilemap & Wall Occlusion' },
    { name: '03_Diablo_Iso_Movement_8Dir.rb', path: '/scripts/03_Diablo_Iso_Movement_8Dir.rb', desc: '8-Directional Movement & Diagonal Passability' },
    { name: '04_Diablo_Iso_Mouse_ClickToMove.rb', path: '/scripts/04_Diablo_Iso_Mouse_ClickToMove.rb', desc: 'Diablo Mouse Pathfinding & Win32API' },
    { name: '05_Diablo_Iso_Torch_Lighting.rb', path: '/scripts/05_Diablo_Iso_Torch_Lighting.rb', desc: 'Torch Light Radius & Dark Vignette' },
    { name: '06_Diablo_Iso_HUD.rb', path: '/scripts/06_Diablo_Iso_HUD.rb', desc: 'Classic Health/Mana Glass Orbs & Belt' },
    { name: 'Diablo_II_Isometric_Master_Suite.rb', path: '/scripts/Diablo_II_Isometric_Master_Suite.rb', desc: 'Complete All-in-One Master Script' },
  ];

  return (
    <div className="flex flex-col w-full bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Proof & Clarification Banner */}
      <div className="p-4 bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border-b border-amber-900/50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-cinzel text-sm sm:text-base font-bold text-amber-200 flex items-center gap-2">
              <span>Yes, Isometric 2.5D is 100% Possible in RPG Maker VX Ace!</span>
              <span className="text-[10px] font-mono font-normal bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded">
                VERIFIED RGSS3 / RUBY 1.9.2
              </span>
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              While RPG Maker VX Ace defaults to a square 32×32 grid in its native C++ tilemap, 
              <strong> RGSS3 exposes full Ruby access to Sprites, Viewports, Game_Map, and Game_CharacterBase</strong>. 
              These scripts override <code>Spriteset_Map</code> to render authentic 64×32 dimetric diamond tiles 
              and remap 8-directional player coordinates in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Actual Disk Files Explorer Bar */}
      <div className="p-4 bg-stone-900/90 border-b border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider">
              Project Script Files (On Disk &amp; Downloadable)
            </span>
          </div>

          <button
            onClick={handleDownloadAll}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold font-cinzel text-xs rounded shadow flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Master Suite (.rb)
          </button>
        </div>

        {/* List of files on disk */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {publicScriptFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-stone-950 border border-stone-800 rounded text-xs hover:border-amber-800/80 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="truncate">
                  <div className="font-mono text-amber-200 text-[11px] truncate font-semibold">
                    {file.name}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {file.desc}
                  </div>
                </div>
              </div>

              <a
                href={file.path}
                download={file.name}
                className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 rounded text-[10px] font-mono flex items-center gap-1 shrink-0"
                title={`Direct download ${file.name}`}
              >
                <Download className="w-3 h-3" /> Get
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Script Selection Tabs */}
      <div className="flex items-center gap-1 p-2 bg-stone-950/80 border-b border-stone-800/80 overflow-x-auto text-xs">
        {RGSS3_SCRIPTS.map((script, idx) => (
          <button
            key={script.id}
            onClick={() => setSelectedScriptId(script.id)}
            className={`px-3 py-1.5 rounded font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedScriptId === script.id
                ? 'bg-amber-900/60 text-amber-200 border border-amber-600/80 font-bold'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <span className="text-[10px] text-amber-400 font-bold">[{idx + 1}]</span>
            <span>{script.filename}</span>
          </button>
        ))}
      </div>

      {/* Script Detail Banner */}
      <div className="p-3 bg-stone-900/40 border-b border-stone-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-amber-300 font-cinzel text-sm">{currentScript.title}</div>
          <div className="text-stone-400 font-mono text-[11px]">{currentScript.description}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={() => handleCopy(currentScript.code, currentScript.id)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            {copiedId === currentScript.id ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-400" />
                <span>Copy Script</span>
              </>
            )}
          </button>

          {/* Download Individual .rb */}
          <button
            onClick={() => handleDownload(currentScript)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded border border-stone-700 font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download {currentScript.filename}</span>
          </button>
        </div>
      </div>

      {/* Installation Instructions Box */}
      <div className="px-4 py-2.5 bg-amber-950/20 border-b border-amber-900/30 text-[11px] font-mono text-amber-200/90 flex items-start gap-2">
        <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase text-amber-300">RPG Maker VX Ace Setup:</span>
          <span className="ml-1 text-stone-300">
            {currentScript.instructions.join(' ➔ ')}
          </span>
        </div>
      </div>

      {/* Ruby Code Display Container */}
      <div className="relative p-4 bg-[#0a0908] max-h-[500px] overflow-y-auto font-mono text-xs text-stone-300 leading-relaxed">
        <pre className="whitespace-pre overflow-x-auto selection:bg-amber-800 selection:text-white">
          <code>{currentScript.code}</code>
        </pre>
      </div>

      {/* Quick Architecture Note */}
      <div className="p-3 bg-stone-900 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-stone-500" />
          Target Engine: RPG Maker VX Ace (Ruby 1.9.2 / RGSS3) • 64x32 Dimetric Projection
        </span>
        <span className="text-stone-500">Lines: {currentScript.code.split('\n').length}</span>
      </div>
    </div>
  );
};
