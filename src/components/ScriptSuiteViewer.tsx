import React, { useState } from 'react';
import { RGSS3_SCRIPTS } from '../engine/rgss3Scripts';
import { Rgss3Script } from '../types/engine';
import { Copy, Check, Download, FileCode, BookOpen, Terminal, Sparkles } from 'lucide-react';

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
# Compatible with RGSS3 / RPG Maker VX Ace.
#==============================================================================\n\n`;

    const allCode = header + RGSS3_SCRIPTS.map((s) => `#\n# >>> MODULE: ${s.title} <<<\n#\n${s.code}\n`).join('\n\n');
    const blob = new Blob([allCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Diablo_II_Isometric_Master_Suite.rb';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-stone-900 border-b border-stone-800">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-500" />
            RPG Maker VX Ace (RGSS3) Isometric Ruby Scripts
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Production-grade scripts for dimetric 2.5D projection, 8-directional input, wall occlusion, and mouse pathfinding.
          </p>
        </div>

        {/* Master Download Button */}
        <button
          onClick={handleDownloadAll}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold font-cinzel text-xs rounded shadow flex items-center gap-2 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download All-In-One Master (.rb)
        </button>
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
